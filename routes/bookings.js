const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, validateBooking } = require("../middleware");
const bookingController = require("../controllers/booking");

router.post("/", isLoggedIn, validateBooking, wrapAsync(bookingController.createBooking));
router.delete("/:bookingId", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
