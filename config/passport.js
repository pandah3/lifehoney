/* Passport - User Management*/

//importing passport but not using 2 diff instances in here & app.js
var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

//store user into the session by their user id
passport.serializeUser(function(user, done) {
  done(null, user.id); //done, proceed
});

//find user's id to retrieve & utilize user's info
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  })
});


//Middleware

//Sign up - creating a new user
passport.use('local.signup', new LocalStrategy({
  //1st argument is configuration
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true //allowing us to use req
}, function(req, email, password, done) {
  //validating that the email field is not empty & it's an email addy
  req.checkBody('email', 'Invalid email').notEmpty().isEmail(); //checkBody is from express validator
  req.checkBody('password', 'Invalid password').notEmpty().isLength({min:4}); //password field must be > 4
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }
  User.findOne({'email': email}, function(err, user) {
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null, false, {message: 'Email is already in use.'}); //(error, object, {req.flash})
    }
    var newUser = new User();
    newUser.email = email;
    newUser.password = newUser.encryptPassword(password);
    newUser.save(function(err, result) {
      if (err) {
        return done(err);
      }
      return done(null, newUser);
    })
  });
}));

//Log in
passport.use('local.login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done) {
  req.checkBody('email', 'Invalid email').notEmpty().isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }
  User.findOne({'email': email}, function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, {message: 'That user does not exist.'}); //done(error, object, {req.flash})
    }
    if (!user.validPassword(password)) {
      return done(null, false, {message: 'Incorrect password.'});
    }
    return done(null, user);
  });
}));
