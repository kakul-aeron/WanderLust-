const Listing = require("../models/listing");
const Booking = require("../models/booking");

const nowUtc = () => new Date();

const normalizeDate = (value) => {
    if (!value) return null;
    const normalized = new Date(value);
    if (Number.isNaN(normalized.getTime())) {
        return null;
    }
    return normalized;
};

const isBookingActive = (booking, now = nowUtc()) => {
    if (!booking || booking.status !== "confirmed") return false;
    const checkout = normalizeDate(booking.endDate);
    if (!checkout) return false;
    return checkout > now;
};

const shouldCompleteBooking = (booking, now = nowUtc()) => {
    if (!booking || booking.status !== "confirmed") return false;
    const checkout = normalizeDate(booking.endDate);
    if (!checkout) return false;
    return checkout <= now;
};

const updateListingAvailability = async (listingId) => {
    if (!listingId) return null;
    const listing = await Listing.findById(listingId).populate("bookings");
    if (!listing) return null;

    const now = nowUtc();
    let confirmedRooms = 0;

    for (const booking of listing.bookings || []) {
        if (isBookingActive(booking, now)) {
            confirmedRooms += booking.rooms;
        } else if (shouldCompleteBooking(booking, now)) {
            booking.status = "completed";
            await booking.save();
        }
    }

    listing.availableRooms = Math.max(0, listing.totalRooms - confirmedRooms);
    await listing.save();
    return listing;
};

const completeExpiredBookings = async ({ listingId, userId } = {}) => {
    const now = nowUtc();
    const query = {
        status: "confirmed",
    };

    if (listingId) {
        query.listing = listingId;
    }

    if (userId) {
        query.user = userId;
    }

    const candidateBookings = await Booking.find(query);
    const expiredBookings = candidateBookings.filter((booking) => shouldCompleteBooking(booking, now));
    if (!expiredBookings.length) {
        return 0;
    }

    const listingIds = new Set();

    for (const booking of expiredBookings) {
        booking.status = "completed";
        await booking.save();
        if (booking.listing) {
            listingIds.add(booking.listing.toString());
        }
    }

    await Promise.all(
        Array.from(listingIds, (id) => updateListingAvailability(id))
    );

    return expiredBookings.length;
};

module.exports = {
    updateListingAvailability,
    completeExpiredBookings,
    isBookingActive,
};
