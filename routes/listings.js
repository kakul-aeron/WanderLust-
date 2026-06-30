const express = require("express");
const Listing = require('../models/listing.js');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const {listingSchema} = require("../schema.js");
const {isLoggedIn , isOwner , isAuthor , validateListing} = require("../middleware.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage});

const listingController = require("../controllers/listing.js");
const {releaseExpiredBookings} = require("../middleware.js");

router.route("/")
 .get(wrapAsync(listingController.index))
 .post(isAuthor, upload.single('listing[image]') ,validateListing,wrapAsync(listingController.createListing));
 
router.get("/new",isAuthor, listingController.renderNewForm);

router.route("/:id")
 .get(releaseExpiredBookings, wrapAsync(listingController.showListing))
 .put(isLoggedIn , isOwner, upload.single('listing[image]'),validateListing ,wrapAsync(listingController.updateListing))
 .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;