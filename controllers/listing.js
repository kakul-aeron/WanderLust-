const Listing = require("../models/listing");
const { completeExpiredBookings, updateListingAvailability, isBookingActive } = require("../utils/bookingStatus");

module.exports.index = async (req,res) =>{
    const { category, search } = req.query;
    let filter = {};
    
    if (category) {
        filter.category = category;
    }
    
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ];
    }
    
    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs" , {allListings, selectedCategory: category, searchQuery: search});
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req , res) =>{
    let {id} = req.params;
    await completeExpiredBookings({ listingId: id });
    await updateListingAvailability(id);
    const listing = await Listing.findById(id)
            .populate({path: "reviews" , populate: {path : "author"}})
            .populate({path: "bookings", populate: {path: "user"}})
            .populate("owner");
    if(!listing){
      req.flash("error","Listing you requested for does not exist");
      res.redirect("/listings");
    }
        let needsSave = false;
        if (listing.totalRooms == null) {
            listing.totalRooms = 5;
            needsSave = true;
        }
        if (listing.availableRooms == null) {
            listing.availableRooms = listing.totalRooms;
            needsSave = true;
        }
        if (needsSave) {
            await listing.save();
        }
        const bookingDocs = Array.isArray(listing.bookings) ? listing.bookings : [];
        const now = new Date();
        const activeBookings = bookingDocs.filter((booking) => isBookingActive(booking, now));
        const canReview = req.user ? listing.bookedUsers.includes(req.user.username) : false;
        const userBookings = req.user ? activeBookings.filter((booking) => booking.user && booking.user._id.equals(req.user._id)) : [];
        res.render("listings/show.ejs", {listing, activeBookings, canReview, userBookings});
};

module.exports.createListing = async (req,res)=>{
    let url = req.file.path;
    let filename = req.file.filename;

    const totalRooms = Number(req.body.listing.totalRooms) || 5;
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url,filename};
    newListing.totalRooms = totalRooms;
    newListing.availableRooms = totalRooms;
    await newListing.save();
    
    if (typeof global.clearListingsCache === 'function') {
        global.clearListingsCache();
    }
    
    req.flash("success","New Listing Created");
    res.redirect("/listings");
};

module.exports.editListing = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Listing you requested for does not exist");
      res.redirect("/listings");
    }
    res.render("listings/edit.ejs",{listing})
};

module.exports.updateListing = async(req , res)=>{
        let {id} = req.params;
        let listing = await Listing.findById(id);
        if(!listing){
            req.flash("error","Listing you requested for does not exist");
            return res.redirect("/listings");
        }
        const originalTotal = listing.totalRooms;
        listing.set(req.body.listing);
        if(req.body.listing && req.body.listing.totalRooms){
            const updatedTotal = Math.max(1, Number(req.body.listing.totalRooms));
            const delta = updatedTotal - originalTotal;
            listing.totalRooms = updatedTotal;
            listing.availableRooms = Math.min(updatedTotal, Math.max(0, listing.availableRooms + delta));
        }
    
    if(typeof req.file !== "undefined") { 
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
    }

    await listing.save();
    
    if (typeof global.clearListingsCache === 'function') {
        global.clearListingsCache();
    }
        
    req.flash("success"," Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    
    if (typeof global.clearListingsCache === 'function') {
        global.clearListingsCache();
    }
    
    req.flash("success"," Listing Deleted");
    res.redirect("/listings");
};