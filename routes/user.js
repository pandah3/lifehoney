var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var async = require('async');
var csrf = require('csurf');
var passport = require('passport');

var Order = require('../models/order');
var Cart = require('../models/cart');

var csrfProtection = csrf();
//all the routes used by router is protected by csrf
router.use(csrfProtection);

/* GET users listing. */

//PROFILE ROUTES
router.get('/profile', isLoggedIn, function(req, res, next) {
  Order.find({user: req.user}, function(err, orders) {
    if (err) {
      return res.write('Sorry, there were no orders found');
    }
    var cart;
    orders.forEach(function(order) {
      cart = new Cart(order.cart);
      order.items = cart.generateArray();
    });
    res.render('user/profile', { order: orders });
  });
});

//LOGOUT Routes
router.get('/logout', isLoggedIn, function(req, res, next) {
  req.logout();
  res.redirect('/');
});

//**ALL ROUTES BELOW THIS WILL BE AFFECTED BY NOTLOGGEDIN FUNCTION

router.use('/', notLoggedIn, function(req, res, next) {
  next();
});

router.get('/signup', function(req, res, next) {
  var message = req.flash('error');
  res.render('user/signup', {csrfToken: req.csrfToken(), messages: message, hasErrors: message.length > 0});
});

//local signup is from passport.js (in passport.use)
router.post('/signup', passport.authenticate('local.signup', {
  failureRedirect: '/user/signup',
  failureFlash: true
}), function(req, res, next) { //if user is signed up, run this
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl; //retrieve old url
    req.session.oldUrl = null; //clear it
    res.redirect(oldUrl);
  } else {
    res.redirect('/user/profile');
  }
});

//LOGIN Routes
router.get('/login', function(req, res, next) {
  var message = req.flash('error');
  res.render('user/login', {csrfToken: req.csrfToken(), messages: message, hasErrors: message.length > 0});
});

router.post('/login', passport.authenticate('local.login', {
  //if user is not logged in, run this
  failureRedirect: '/user/login',
  failureFlash: true
}), function(req, res, next) { //if user is logged in, run this
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl; //retrieve old url
    req.session.oldUrl = null; //clear it
    res.redirect(oldUrl);
  } else {
    res.redirect('/user/profile');
  }
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
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
