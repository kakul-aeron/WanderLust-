const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: "0000000000",
        trim: true,
    }
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",userSchema);