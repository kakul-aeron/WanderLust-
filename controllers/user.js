const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const { completeExpiredBookings, isBookingActive } = require("../utils/bookingStatus");
const { sendWelcomeSms } = require("../utils/sms");

module.exports.renderSignupForm = (req,res)=>{
    res.render("user/signup");
};

const sanitizePhone = (value) => {
    if (!value) return "0000000000";
    const digits = String(value).replace(/[^0-9]/g, "");
    if (digits.length >= 10) {
        return digits.slice(-10);
    }
    return digits.padStart(10, "0");
};

module.exports.signup = async (req,res,next)=>{
    try{
        let {username, email, password, phone} = req.body;
        const normalizedPhone = sanitizePhone(phone);
        const newUser = new User({email,username, phone: normalizedPhone});
        const registeredUser = await User.register(newUser,password);
        req.login(registeredUser,(err) =>{
            if(err){
                return next(err);
            }
            req.flash("success","user registered");
            res.redirect("/listings");
        });
        await sendWelcomeSms({ to: normalizedPhone, username });
    } catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
};

module.exports.loginRender = (req,res)=>{
    res.render("user/login");
};

module.exports.login = async (req,res)=>{
    req.flash("success", "Welcome back to WanderLust");
    res.redirect(res.locals.redirectUrl || "/listings");   
};

module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out");
        res.redirect("/listings");
    });
};

module.exports.account = async (req, res) => {
    await completeExpiredBookings({ userId: req.user._id });
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ startDate: 1 });

    const now = new Date();
    const upcomingBookings = [];
    const pastBookings = [];

    bookings.forEach((booking) => {
        const isUpcoming = isBookingActive(booking, now);
        if (isUpcoming) {
            upcomingBookings.push(booking);
        } else {
            pastBookings.push(booking);
        }
    });

    pastBookings.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    res.render("user/account", {
        userProfile: req.user,
        upcomingBookings,
        pastBookings,
    });
};
