const Listing = require("./models/listing");
const Review = require("./models/reviews");
const Booking = require("./models/booking");
const ExpressError = require("./utils/ExpressError");
const {listingSchema,reviewSchema,bookingSchema} = require("./schema");

module.exports.validateListing = (req,res,next) =>{
  let {error} = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  }else{
    next();
  }
};

module.exports.validateReview = (req,res,next) =>{
  let {error} = reviewSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError("404", errMsg);
  }else{
    next();
  }
};

module.exports.validateBooking = (req,res,next) =>{
  let {error} = bookingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }else{
    next();
  }
};

module.exports.isLoggedIn = (req,res,next) =>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in to create listing");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};  

module.exports.isOwner = async (req,res,next) => {
    let {id} = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner._id.equals(res.locals.currUser._id)){
    req.flash("error" , "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.isReviewAuthor = async (req,res,next) => {
    let {id, reviewId} = req.params;
  let review  = await Review.findById(reviewId);
  if(!review.author.equals(res.locals.currUser._id)){
    req.flash("error" , "You are not the owner of this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.ensureBookedUser = async (req,res,next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error","Listing not found");
    return res.redirect("/listings");
  }
  const bookedUsers = listing.bookedUsers || [];
  if(!bookedUsers.includes(req.user.username)){
    req.flash("error","Only guests who booked can review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.releaseExpiredBookings = async (req,res,next) => {
  const now = new Date();
  const expired = await Booking.find({ status: "confirmed", endDate: { $lt: now }});
  for(const booking of expired){
    booking.status = "completed";
    await booking.save();
    const listing = await Listing.findByIdAndUpdate(booking.listing, {
      $inc: { availableRooms: booking.rooms }
    }, { new: true });
    if(listing && listing.availableRooms > listing.totalRooms){
      listing.availableRooms = listing.totalRooms;
      await listing.save();
    }
  }
  next();
};

module.exports.isAuthor = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to add listings");
    return res.redirect("/login");
  }
  
  if (req.user.username !== 'author') {
    req.flash("error", "You don't have permission to add listings");
    return res.redirect("/listings");
  }
  
  next();
};