require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8"]);
const app = express();
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const Review = require("./models/reviews.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Groq = require("groq-sdk");

const listings = require("./routes/listings.js");
const reviews = require("./routes/reviews.js");
const bookings = require("./routes/bookings.js");
const user = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("✅ Connected to Database successfully");
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err.message);
    if (dbUrl.includes("mongodb.net")) {
      console.log(
        "Hint: This might be a DNS or IP whitelist issue with MongoDB Atlas."
      );
      console.log(
        "Try checking your Atlas Network Access or switching your DNS to 8.8.8.8"
      );
    }
  });

async function main() {
  await mongoose.connect(dbUrl);
  await ensureLegacyPhones();
}

async function ensureLegacyPhones() {
  try {
    const criteria = {
      $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }],
    };
    const update = { $set: { phone: "0000000000" } };
    const result = await User.updateMany(criteria, update);
    if (result.modifiedCount) {
      console.log(
        `👥  Backfilled phone numbers for ${result.modifiedCount} legacy users`
      );
    }
  } catch (error) {
    console.warn(
      "⚠️  Could not backfill legacy user phone numbers:",
      error.message
    );
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 3600,
  autoRemove: "native",
  ttl: 60 * 60,
});

store.on("error", function (e) {
  console.log("Session store error", e);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 60 * 60 * 1000,
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings/:id/bookings", bookings);
app.use("/listings/:id/reviews", reviews);
app.use("/listings", listings);
app.use("/", user);
app.post("/api/refresh-cache", (req, res) => {
  clearListingsCache();
  res.json({
    message:
      "Cache cleared successfully. Next chat request will fetch fresh listings.",
  });
});
app.get("/api/debug-listings", async (req, res) => {
  try {
    const data = await getFormattedListingsForChatbot();
    res.json({
      timestamp: new Date().toISOString(),
      cacheTimestamp: listingsCache.timestamp
        ? new Date(listingsCache.timestamp).toISOString()
        : null,
      data: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL_CANDIDATES = [
  "llama-3.1-8b-instant",
  "llama-3.2-3b-preview",
  "llama-3.1-70b-versatile",
  "llama-3.3-70b-versatile",
];

const MEMORY_CONFIG = {
  MAX_MESSAGES: 20,
  MAX_TOKENS_ESTIMATE: 3000,
  SUMMARY_TRIGGER: 16,
  CHARS_PER_TOKEN: 4,
};

function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / MEMORY_CONFIG.CHARS_PER_TOKEN);
}

function calculateHistoryTokens(history) {
  if (!Array.isArray(history)) return 0;
  return history.reduce((total, msg) => {
    return total + estimateTokens(msg.content || "");
  }, 0);
}

async function summarizeConversation(history) {
  if (!history || history.length < 4) return null;

  try {
    const toSummarize = history.slice(0, Math.floor(history.length / 2));
    const conversationText = toSummarize
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    const summaryMessages = [
      {
        role: "system",
        content:
          "Summarize the following conversation concisely, capturing key points, user preferences, and any important context. Keep it under 150 words.",
      },
      {
        role: "user",
        content: conversationText,
      },
    ];

    const completion = await createGroqChatCompletion(summaryMessages);
    const summary = completion?.choices?.[0]?.message?.content || "";

    console.log(
      "📝 Created conversation summary:",
      summary.substring(0, 100) + "..."
    );
    return summary;
  } catch (error) {
    console.error("Error creating summary:", error.message);
    return null;
  }
}

function manageConversationMemory(session) {
  if (!session.chatHistory) {
    session.chatHistory = [];
    session.conversationSummary = null;
    return;
  }

  const historyLength = session.chatHistory.length;
  const tokenCount = calculateHistoryTokens(session.chatHistory);

  console.log(`💬 Memory: ${historyLength} messages, ~${tokenCount} tokens`);

  if (historyLength > MEMORY_CONFIG.MAX_MESSAGES) {
    const excess = historyLength - MEMORY_CONFIG.MAX_MESSAGES;
    session.chatHistory = session.chatHistory.slice(excess);
    console.log(`✂️ Trimmed ${excess} old messages (sliding window)`);
  }

  if (tokenCount > MEMORY_CONFIG.MAX_TOKENS_ESTIMATE) {
    session.chatHistory = session.chatHistory.slice(-12);
    console.log("✂️ Applied aggressive token-based trimming");
  }
}

function getConversationContext(session) {
  const context = [];

  if (session.conversationSummary) {
    context.push({
      role: "system",
      content: `Previous conversation summary: ${session.conversationSummary}`,
    });
  }

  if (session.chatHistory && session.chatHistory.length > 0) {
    context.push(...session.chatHistory);
  }

  return context;
}

let listingsCache = {
  data: null,
  timestamp: null,
  ttl: 2 * 60 * 1000,
};

function clearListingsCache() {
  listingsCache.data = null;
  listingsCache.timestamp = null;
  console.log(
    "🗂️ Listings cache cleared - next chat request will fetch fresh data"
  );
}

global.clearListingsCache = clearListingsCache;

const categoryDisplayMap = {
  trending: "Trending",
  rooms: "Rooms",
  room: "Rooms",
  "iconic-cities": "Iconic Cities",
  farms: "Farms",
  arctic: "Arctic",
  mountains: "Mountains",
  castles: "Castles",
  "amazing-pools": "Pools",
  pools: "Pools",
  camping: "Camps",
  camps: "Camps",
  default: "Others",
};

async function getFormattedListingsForChatbot() {
  const now = Date.now();

  if (
    listingsCache.data &&
    listingsCache.timestamp &&
    now - listingsCache.timestamp < listingsCache.ttl
  ) {
    console.log("📦 Using cached listings data");
    return listingsCache.data;
  }

  try {
    console.log("🔍 Fetching fresh listings from MongoDB...");

    const totalCount = await Listing.countDocuments();
    console.log(`📊 Total listings in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log("⚠️  No listings found in database");
      const fallbackData = `These are the hotels available in the format: hotel_name, category, city_name, price, average_rating
Sample Hotel Delhi, Rooms, Delhi, ₹3000, 4.0
Sample Resort Goa, Pools, Goa, ₹5000, 3.8
Sample Mountain Retreat, Mountains, Manali, ₹4500, 4.2`;

      listingsCache.data = fallbackData;
      listingsCache.timestamp = now;
      return fallbackData;
    }

    const listings = await Listing.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviewData",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviewData" }, 0] },
              then: { $round: [{ $avg: "$reviewData.rating" }, 1] },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          location: 1,
          country: 1,
          price: 1,
          averageRating: 1,
        },
      },
      { $limit: 100 },
    ]);

    console.log(`📊 Aggregation returned ${listings.length} listings`);
    if (listings.length > 0) {
      console.log(`📊 Sample listing: ${JSON.stringify(listings[0])}`);

      const toyTrain = listings.find((l) =>
        l.title?.toLowerCase().includes("toy train")
      );
      const saiDham = listings.find((l) =>
        l.title?.toLowerCase().includes("sai dham")
      );
      const pearlChamber = listings.find((l) =>
        l.title?.toLowerCase().includes("pearl chamber")
      );

      console.log(`🔍 Found Toy Train Room: ${toyTrain ? "YES" : "NO"}`);
      console.log(`🔍 Found Sai Dham Room: ${saiDham ? "YES" : "NO"}`);
      console.log(`🔍 Found Pearl Chamber: ${pearlChamber ? "YES" : "NO"}`);

      if (toyTrain) console.log(`   -> ${JSON.stringify(toyTrain)}`);
      if (saiDham) console.log(`   -> ${JSON.stringify(saiDham)}`);
      if (pearlChamber) console.log(`   -> ${JSON.stringify(pearlChamber)}`);
    }

    const formattedData = listings
      .map((listing) => {
        const displayCategory =
          categoryDisplayMap[listing.category?.toLowerCase()] ||
          categoryDisplayMap[listing.category] ||
          listing.category ||
          "Others";

        const title = listing.title || "Unnamed Property";
        const location =
          listing.location || listing.country || "Unknown Location";
        const price = listing.price || 0;
        const rating = listing.averageRating || 0;

        return `${title}, ${displayCategory}, ${location}, ₹${price}, ${rating}`;
      })
      .join("\n");

    const hotelDataString = `These are the hotels available in the format: hotel_name, category, city_name, price, average_rating\n${formattedData}`;

    console.log(`📊 Chatbot data updated: ${listings.length} listings found`);
    console.log(
      `📊 First 3 listings: ${formattedData
        .split("\n")
        .slice(0, 3)
        .join(" | ")}`
    );

    listingsCache.data = hotelDataString;
    listingsCache.timestamp = now;

    return hotelDataString;
  } catch (error) {
    console.error("Error fetching listings for chatbot:", error.message);

    const fallbackData = `These are the hotels available in the format: hotel_name, category, city_name, price, average_rating
Sample Hotel Delhi, Rooms, Delhi, ₹3000, 4.0
Sample Resort Goa, Pools, Goa, ₹5000, 3.8
Sample Mountain Retreat, Mountains, Manali, ₹4500, 4.2`;

    listingsCache.data = fallbackData;
    listingsCache.timestamp = now;

    return fallbackData;
  }
}

async function createGroqChatCompletion(messages) {
  let lastError;
  for (const model of GROQ_MODEL_CANDIDATES) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.7,
        max_completion_tokens: 512,
        stream: false,
        messages,
      });
      return completion;
    } catch (err) {
      const code = err?.response?.data?.error?.code || err?.code;
      if (
        code === "model_permission_blocked_project" ||
        code === "not_found" ||
        err?.status === 403
      ) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("No available Groq model");
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, clearHistory } = req.body || {};

    if (clearHistory === true) {
      req.session.chatHistory = [];
      req.session.conversationSummary = null;
      req.session.messageCount = 0;
      return res.json({
        reply: "Conversation history cleared. How can I help you today?",
        historyCleared: true,
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "'message' is required" });
    }

    if (!req.session.chatHistory) {
      req.session.chatHistory = [];
      req.session.conversationSummary = null;
      req.session.messageCount = 0;
    }

    const hotelData = await getFormattedListingsForChatbot();

    if (
      req.session.chatHistory.length >= MEMORY_CONFIG.SUMMARY_TRIGGER &&
      !req.session.conversationSummary
    ) {
      console.log("🔄 Creating conversation summary...");
      req.session.conversationSummary = await summarizeConversation(
        req.session.chatHistory
      );

      if (req.session.conversationSummary) {
        const keep = 8;
        req.session.chatHistory = req.session.chatHistory.slice(-keep);
        console.log(`✂️ Summarized and trimmed to ${keep} recent messages`);
      }
    }

    const conversationContext = getConversationContext(req.session);

    const messages = [
      {
        role: "system",
        content: `You are the Wanderlust travel assistant. You help users find and book accommodations from our available listings. All synonyms of hotels should be considered as hotels.

${hotelData}

When users ask about hotels, listings, categories, cities, prices, or recommendations, use the above data to provide accurate information. You can recommend hotels based on category, city, price range, or rating. Do not just copy paste the data, use your own words to answer the question.

If a previous conversation summary is provided, use it to maintain context about user preferences and previous discussions.

Respond in formal plain text only (no markdown, no asterisks, no bullets, no headings, no emojis). Be concise and friendly. Limit the answer to 5 to 7 short lines. Focus on answering the user's question accurately using the available listing data.`,
      },
      ...conversationContext,
      { role: "user", content: message },
    ];

    const totalTokens = estimateTokens(JSON.stringify(messages));
    console.log(
      `📤 Sending to AI: ${messages.length} messages, ~${totalTokens} tokens`
    );

    const completion = await createGroqChatCompletion(messages);

    let reply = completion?.choices?.[0]?.message?.content || "";

    reply = sanitizeAndFormatReply(reply);

    req.session.chatHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    req.session.messageCount = (req.session.messageCount || 0) + 1;

    manageConversationMemory(req.session);

    return res.json({
      reply,
      debug: {
        messagesInMemory: req.session.chatHistory.length,
        hasSummary: !!req.session.conversationSummary,
        totalExchanges: req.session.messageCount,
      },
    });
  } catch (err) {
    console.error(
      "/api/chat error:",
      err?.response?.data || err?.message || err
    );
    const friendly =
      err?.response?.data?.error?.message || "Failed to get AI response";
    return res.status(500).json({ error: friendly });
  }
});

function sanitizeAndFormatReply(text) {
  if (!text || typeof text !== "string") return "";
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  text = text.replace(/\*\*|\*|__|_|`/g, "");
  text = text.replace(/^\s*([\-•\u2022]|\d+\.)\s+/gm, "");
  text = text
    .replace(/[\t\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 7);
  let formatted = sentences.join("\n");
  if (!formatted) formatted = text;
  const lines = formatted.split(/\n+/).slice(0, 7);
  return lines.join("\n");
}

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`🚀 Server is listening to port ${process.env.PORT || 8080}`);
});
