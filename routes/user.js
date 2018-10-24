/* CSRF/Passport */

var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var async = require('async');
var csrf = require('csurf');
var passport = require('passport');

var Cart = require('../models/cart');
var Order = require('../models/order');

var csrfProtection = csrf();
router.use(csrfProtection); //all the routes below used by router is protected by csrf


/* GET User Profile */
router.get('/profile', isLoggedIn, function(req, res, next) {
  //Show user's orders if there are any
  Order.find({user: req.user}, function(err, orders) {
    if (err) {
      return res.write('Sorry, there were no orders found');
    }
    var cart;
    orders.forEach(function(order) { //looping through all orders of specific user
      cart = new Cart(order.cart); //using the cart model to then list the orders like the cart
      order.items = cart.generateArray();
    });
    res.render('user/profile', { order: orders });
  });
});

/* GET Logout */
router.get('/logout', isLoggedIn, function(req, res, next) {
  req.logout();
  res.redirect('/');
});

/** ALL ROUTES BELOW THIS WILL BE AFFECTED BY NOTLOGGEDIN FUNCTION **/

router.use('/', notLoggedIn, function(req, res, next) {
  next();
});

/* GET User Sign Up */
router.get('/signup', function(req, res, next) {
  var message = req.flash('error');
  res.render('user/signup', {csrfToken: req.csrfToken(), messages: message, hasErrors: message.length > 0});
});

/* POST User Sign Up */
router.post('/signup', passport.authenticate('local.signup', { //local signup is from passport.js, line 24
  failureRedirect: '/user/signup',
  failureFlash: true
}), function(req, res, next) { //if user is already signed up, run this function
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl; //retrieve old url (var value doesn't change even if you clear the oldurl in the next line)
    req.session.oldUrl = null; //clear it
    res.redirect(oldUrl);
  } else {
    res.redirect('/user/profile');
  }
});

/* GET User Login */
router.get('/login', function(req, res, next) {
  var message = req.flash('error');
  res.render('user/login', {csrfToken: req.csrfToken(), messages: message, hasErrors: message.length > 0});
});

/* POST User Login */
router.post('/login', passport.authenticate('local.login', { //local.login refers to the strategy passport is using; must match passport.js, line 61
  //if user doesn't get logged in (b/c of an error), run this
  failureRedirect: '/user/login',
  failureFlash: true
}), function(req, res, next) { //if user is successfully logged in, run this
  if (req.session.oldUrl) { //if user had an oldurl (ie- they were on the checkout page)
    var oldUrl = req.session.oldUrl; //then retrieve old url
    req.session.oldUrl = null; //clear it
    res.redirect(oldUrl); //then send them back to the oldurl
  } else {
    res.redirect('/user/profile');
  }
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) { //passport function
    return next();
  }
  res.redirect('/');
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}
