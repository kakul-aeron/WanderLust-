const twilio = require("twilio");

const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER
} = process.env;

let smsClient = null;

const initSmsClient = () => {
    if (smsClient) return smsClient;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        console.warn("📱  SMS client not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to enable texts.");
        return null;
    }

    smsClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return smsClient;
};

const normalizePhone = (value) => {
    if (!value) return null;
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 10) return null;
    if (digitsOnly.length === 10) {
        return `+91${digitsOnly}`;
    }
    if (!digitsOnly.startsWith("+")) {
        return `+${digitsOnly}`;
    }
    return digitsOnly;
};

const sendWelcomeSms = async ({ to, username }) => {
    const client = initSmsClient();
    const formatted = normalizePhone(to);

    if (!client || !formatted) {
        if (!client) {
            console.warn("📱  SMS client unavailable; skipping welcome SMS.");
        } else {
            console.warn(`📱  Invalid phone number provided for SMS: ${to}`);
        }
        return false;
    }

    const safeUsername = username || "traveler";
    const body = `Hi ${safeUsername}, thanks for signing up for Wanderlust! Let us know when you're ready for your next getaway.`;

    try {
        await client.messages.create({
            body,
            from: TWILIO_FROM_NUMBER,
            to: formatted,
        });
        console.log(`📱  Welcome SMS sent to ${formatted}`);
        return true;
    } catch (error) {
        console.error("📱  Failed to send welcome SMS:", error.message);
        return false;
    }
};

module.exports = {
    sendWelcomeSms,
};
