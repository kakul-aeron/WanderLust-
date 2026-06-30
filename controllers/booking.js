const Listing = require("../models/listing");
const Booking = require("../models/booking");
const User = require("../models/user");
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require("../utils/mailer");
const { updateListingAvailability, completeExpiredBookings } = require("../utils/bookingStatus");

const TAX_MULTIPLIER = 1.18;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateTotalCost = (startDate, endDate, rooms, nightlyRate) => {
    if (!startDate || !endDate || !rooms || !nightlyRate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const rawDays = Math.ceil((end - start) / MS_PER_DAY);
    const nights = Math.max(rawDays, 1);
    const taxedRate = nightlyRate * TAX_MULTIPLIER;
    const total = nights * taxedRate * rooms;
    return Number(total.toFixed(2));
};

module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, rooms } = req.body.booking;
    const roomsRequested = Number(rooms);

    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (new Date(startDate) >= new Date(endDate)) {
        req.flash("error", "Check-out date must be after check-in date");
        return res.redirect(`/listings/${id}`);
    }

    await completeExpiredBookings({ listingId: id });
    await updateListingAvailability(id);
    listing = await Listing.findById(id);

    if (roomsRequested > listing.availableRooms) {
        req.flash("error", "Not enough rooms available for the selected dates");
        return res.redirect(`/listings/${id}`);
    }

    const booking = new Booking({
        listing: id,
        user: req.user._id,
        username: req.user.username,
        rooms: roomsRequested,
        startDate,
        endDate,
        totalCost: calculateTotalCost(startDate, endDate, roomsRequested, listing.price),
    });

    await booking.save();
    listing.bookings.push(booking._id);
    listing.availableRooms = Math.max(0, listing.availableRooms - roomsRequested);
    listing.bookedUsers = listing.bookedUsers || [];
    if (!listing.bookedUsers.includes(req.user.username)) {
        listing.bookedUsers.push(req.user.username);
    }
    await listing.save();

    await sendBookingConfirmationEmail({ user: req.user, listing, booking });

    req.flash("success", "Booking confirmed");
    res.redirect(`/listings/${id}`);
};

module.exports.cancelBooking = async (req, res) => {
    const { id, bookingId } = req.params;
    await completeExpiredBookings({ listingId: id });
    const booking = await Booking.findById(bookingId).populate("listing").populate("user");

    const bookingUserId = booking?.user?._id || booking?.user;
    if (!booking || !bookingUserId || bookingUserId.toString() !== req.user._id.toString()) {
        req.flash("error", "Booking not found or unauthorized");
        return res.redirect(`/listings/${id}`);
    }

    booking.status = "cancelled";
    await booking.save();

    await updateListingAvailability(id);

    const listingDoc = booking.listing?._id ? booking.listing : await Listing.findById(id);
    const userDoc = booking.user?.email ? booking.user : await User.findById(bookingUserId);
    await sendBookingCancellationEmail({ user: userDoc, listing: listingDoc, booking });

    req.flash("success", "Booking cancelled");
    res.redirect(`/listings/${id}`);
};

module.exports.listUserBookings = async (req, res) => {
    await completeExpiredBookings({ userId: req.user._id });
    const bookings = await Booking.find({ user: req.user._id }).populate("listing");
    res.render("bookings/index", { bookings });
};
