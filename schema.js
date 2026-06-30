const Joi = require("joi");

const categoryOptions = ['trending', 'rooms', 'iconic-cities', 'farms', 'arctic', 'mountains', 'castles', 'amazing-pools', 'camping'];

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid(...categoryOptions).required(),
        totalRooms: Joi.number().integer().min(1).max(50).optional(),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});

module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
        rooms: Joi.number().integer().min(1).max(5).required(),
    }).required(),
});