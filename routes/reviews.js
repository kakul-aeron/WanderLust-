const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const Review = require("../models/reviews.js");
const Listing = require('../models/listing.js');
const {listingSchema,reviewSchema} = require("../schema.js");
const {isLoggedIn , isReviewAuthor , validateReview, ensureBookedUser} = require("../middleware.js");

const reviewControllers = require("../controllers/reviews.js");

router.post("/", isLoggedIn , ensureBookedUser, validateReview , wrapAsync(reviewControllers.createReview));
  
router.delete("/:reviewId", isLoggedIn,isReviewAuthor ,wrapAsync(reviewControllers.deleteReview));

module.exports = router;