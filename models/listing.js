const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");
const Booking = require("./booking.js");
const User = require("./user.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,

    image: {
        url: String,
        filename: String,
    },

    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: ['trending', 'rooms', 'iconic-cities', 'farms', 'arctic', 'mountains', 'castles', 'amazing-pools', 'camping'],
        required: true,
        default: 'rooms'
    },
    totalRooms: {
        type: Number,
        min: 0,
        default: 5,
    },
    availableRooms: {
        type: Number,
        min: 0,
        default: 5,
    },
    bookedUsers: {
        type: [String],
        default: [],
    },
    bookings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Booking",
        }
    ],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Reviews",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

listingSchema.pre("save", function(next){
    if(this.isNew){
        if(typeof this.totalRooms === "undefined" || this.totalRooms === null){
            this.totalRooms = 5;
        }
        if(typeof this.availableRooms === "undefined" || this.availableRooms === null){
            this.availableRooms = this.totalRooms;
        }
    }
    next();
});

listingSchema.post("findOneAndDelete", async(listing)=>{
   if(listing){ 
    await Review.deleteMany({_id : {$in: listing.reviews}});
    await Booking.deleteMany({ listing: listing._id });
   }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;