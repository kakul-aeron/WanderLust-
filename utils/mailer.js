const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const {
    MAIL_HOST,
    MAIL_PORT,
    MAIL_USER,
    MAIL_PASS,
    MAIL_FROM,
    SENDGRID_API_KEY
} = process.env;

let transporter = null;
let useSendGrid = false;

const requiredVarNames = ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS"];

const findMissingMailerVars = () => {
    const map = {
        MAIL_HOST,
        MAIL_PORT,
        MAIL_USER,
        MAIL_PASS,
    };
    return Object.entries(map)
        .filter(([, value]) => !value)
        .map(([key]) => key);
};

const initTransporter = () => {
    if (transporter || useSendGrid) return transporter;

    // Try SendGrid first (works on Render since it uses HTTP, not SMTP)
    if (SENDGRID_API_KEY) {
        try {
            sgMail.setApiKey(SENDGRID_API_KEY);
            useSendGrid = true;
            console.log(`✉️  Mailer configured: SendGrid API (${MAIL_FROM || MAIL_USER})`);
            return null; // No transporter needed for SendGrid
        } catch (error) {
            console.warn(`✉️  SendGrid setup failed: ${error.message}. Falling back to SMTP...`);
        }
    }

    // Fall back to SMTP (for localhost)
    const missing = findMissingMailerVars();
    if (missing.length) {
        console.warn(`✉️  Mailer not fully configured. Skipping email sends until MAIL_* env vars are set. Missing: ${missing.join(", ")}`);
        return null;
    }

    const port = Number(MAIL_PORT) || 587;

    transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port,
        secure: port === 465,
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS
        }
    });

    console.log(`✉️  Mailer configured: ${MAIL_USER} via ${MAIL_HOST}:${port} (secure: ${port === 465})`);

    return transporter;
};

const formatCurrency = (amount) => {
    const safeAmount = typeof amount === "number" ? amount : Number(amount) || 0;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(safeAmount);
};

const formatDate = (date) => {
    if (!date) return "Unknown date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

const getBookingDetails = ({ user, listing, booking }) => {
    const guestName = user?.username || user?.email || "Guest";
    const hotelName = listing?.title || "your stay";
    const rooms = booking?.rooms || 1;
    const checkIn = formatDate(booking?.startDate);
    const checkOut = formatDate(booking?.endDate);
    const total = formatCurrency(booking?.totalCost);
    return { guestName, hotelName, rooms, checkIn, checkOut, total };
};

const buildConfirmationBody = ({ guestName, hotelName, rooms, checkIn, checkOut, total }) => {
    const text =
        `Hi ${guestName},\n\nYour booking is confirmed!\n\nListing: ${hotelName}\nRooms: ${rooms}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nTotal (incl. tax): ${total}\n\nWe look forward to hosting you.\n\nTeam WanderLust`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color:#0b5ed7;">Booking Confirmed</h2>
            <p>Hi <strong>${guestName}</strong>,</p>
            <p>Your booking for <strong>${hotelName}</strong> is confirmed.</p>
            <ul style="padding-left: 16px;">
                <li><strong>Rooms:</strong> ${rooms}</li>
                <li><strong>Check-in:</strong> ${checkIn}</li>
                <li><strong>Check-out:</strong> ${checkOut}</li>
                <li><strong>Total (incl. tax):</strong> ${total}</li>
            </ul>
            <p>We look forward to hosting you.<br/>Team WanderLust</p>
        </div>`;

    return { text, html };
};

const buildCancellationBody = ({ guestName, hotelName, rooms, checkIn, checkOut, total }) => {
    const text =
        `Hi ${guestName},\n\nYour booking for ${hotelName} has been cancelled.\n\nRefund amount: ${total}\nRooms: ${rooms}\nOriginal stay: ${checkIn} to ${checkOut}\n\nYour payment will be credited back to your original method within 3-5 business days.\n\nWe hope to welcome you again.\n\nTeam WanderLust`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color:#dc3545;">Booking Cancelled</h2>
            <p>Hi <strong>${guestName}</strong>,</p>
            <p>Your booking for <strong>${hotelName}</strong> has been cancelled.</p>
            <ul style="padding-left: 16px;">
                <li><strong>Refund amount:</strong> ${total}</li>
                <li><strong>Rooms:</strong> ${rooms}</li>
                <li><strong>Original stay:</strong> ${checkIn} to ${checkOut}</li>
            </ul>
            <p>The amount will be credited back to your original payment method within 3-5 business days.</p>
            <p>We hope to welcome you again.<br/>Team WanderLust</p>
        </div>`;

    return { text, html };
};

const sendEmail = async ({ to, subject, text, html }) => {
    initTransporter();

    // Use SendGrid if configured
    if (useSendGrid && SENDGRID_API_KEY) {
        try {
            await sgMail.send({
                to,
                from: MAIL_FROM || MAIL_USER,
                subject,
                text,
                html
            });
            return true;
        } catch (error) {
            console.error(`✉️  SendGrid error:`, error.message);
            if (error.response?.body) {
                console.error(`✉️  SendGrid response:`, JSON.stringify(error.response.body, null, 2));
            }
            throw error;
        }
    }

    // Use SMTP if SendGrid not available
    if (!transporter) {
        console.warn("✉️  No email transporter available");
        return false;
    }

    try {
        await transporter.sendMail({
            from: MAIL_FROM || MAIL_USER,
            to,
            subject,
            text,
            html
        });
        return true;
    } catch (error) {
        console.error(`✉️  SMTP error:`, error.message);
        console.error(`✉️  Error code:`, error.code);
        throw error;
    }
};

const sendBookingConfirmationEmail = async ({ user, listing, booking }) => {
    if (!user?.email) {
        console.warn("✉️  Skipping booking email - user email missing");
        return false;
    }

    const details = getBookingDetails({ user, listing, booking });
    const { text, html } = buildConfirmationBody(details);

    try {
        await sendEmail({
            to: user.email,
            subject: "Booking confirmed",
            text,
            html
        });
        console.log(`✉️  Booking confirmation email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error(`✉️  Failed to send booking email:`, error.message);
        return false;
    }
};

const sendBookingCancellationEmail = async ({ user, listing, booking }) => {
    if (!user?.email) {
        console.warn("✉️  Skipping cancellation email - user email missing");
        return false;
    }

    const details = getBookingDetails({ user, listing, booking });
    const { text, html } = buildCancellationBody(details);

    try {
        await sendEmail({
            to: user.email,
            subject: "Booking cancelled",
            text,
            html
        });
        console.log(`✉️  Booking cancellation email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error(`✉️  Failed to send cancellation email:`, error.message);
        return false;
    }
};

module.exports = {
    sendBookingConfirmationEmail,
    sendBookingCancellationEmail
};
