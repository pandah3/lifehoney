var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var async = require('async');
var csrf = require('csurf');
var passport = require('passport');

var csrfProtection = csrf();
//all the routes used by router is protected by csrf
router.use(csrfProtection);

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

//Profile
router.get('/profile', isLoggedIn, function(req, res, next) {
  res.render('user/profile');
});

//Logout
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
  successRedirect: '/user/profile',
  failureRedirect: '/user/signup',
  failureFlash: true
}));

//Login
router.get('/login', function(req, res, next) {
  var message = req.flash('error');
  res.render('user/login', {csrfToken: req.csrfToken(), messages: message, hasErrors: message.length > 0});
});

router.post('/login', passport.authenticate('local.login', {
  successRedirect: '/user/profile',
  failureRedirect: '/user/login',
  failureFlash: true
}));

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
