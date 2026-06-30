const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

const userController = require("../controllers/user.js");

router.route("/signup")
 .get(userController.renderSignupForm)
 .post(wrapAsync (userController.signup));

router.route("/login")
 .get(userController.loginRender)
 .post(saveRedirectUrl ,passport.authenticate("local" , {failureRedirect: "/login", failureFlash: true}) , userController.login);

router.get("/logout", userController.logout);

router.get("/account", isLoggedIn, wrapAsync(userController.account));

module.exports = router;