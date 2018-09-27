var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
//this will configure the .env fil
require('dotenv').config();
var async = require('async');

var Cart = require('../models/cart');
var Product = require('../models/product');
var Order =require('../models/order');

var db
MongoClient.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true }, (err, database) => {
  if (err) return console.log(err)
  db = database.db('lifehoney')
});

// mongoose.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true });


/* GET home page. */
// the :language*? allows for a value to be assinged to language. the : followed by any word allows
// for data being passed through the header to be retrieved by using req.params.CORRESPONDINGWORD.
router.get('/:language?', function(req, res, next) {
  var successMsg = req.flash('success')[0];
  var languageCode = req.params.language;
  // languageCode is undefined when there isn't a value being passed in, in the header so we set it
  // to 'ko' for english so that korean is our default language.
  if (languageCode === undefined) {
    languageCode = 'ko'
  }

  var locals = {
    languageCode: languageCode,
    successMsg: successMsg,
    noMessage: !successMsg
  };

  var task = [
    function(callback) {
      db.collection('languages').find({'languageCode': languageCode}).toArray(function (err, result) {
        if (err) return console.log(err);
        // console.log(result);
        locals.language = result;
        callback();
      });
    },
    function(callback) {
      db.collection('products').find().toArray(function (err, result) {
        if (err) return console.log(err);
        // console.log(result);
        locals.products = result;
        callback();
      });
    }
  ];

  async.parallel(task, function(err) {
    if (err) return next();
    res.render('index', locals)
    })
  });

router.get('/add-to-cart/:id', function(req, res, next) {
  var productId = req.params.id;
  //passing in old cart if you have one
  //ternary expression: if the old cart does exist, pass the old cart, if not, pass an empty old cart object
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  db.collection('products').findOne({'_id': ObjectId(req.params.id)}, function(err, product) {
    if (err) {
      return res.redirect('/');
      console.log(err);
    }
    console.log(product._id);
    cart.add(product, product._id);
    req.session.cart = cart;
    console.log(req.session.cart);
    res.redirect('/')
  });
});

//Shopping Cart Routes
router.get('/shopping/cart/', function(req, res, next) {
  if (!req.session.cart) {
    //going into views directory, then shop directory, then shopping-cart.hbs
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  //going into views directory, then shop directory, then shopping-cart.hbs
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

//Checkout Routes
router.get('/cart/checkout', isLoggedIn, function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping/cart');
  }
  var cart = new Cart(req.session.cart);
  //overriding error message from stripe and creating our own error message
  var errMsg = req.flash('error')[0];
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/cart/checkout', isLoggedIn, function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping/cart');
  }

  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")("sk_test_lSh6kkhoUKBL6E7YjkPtiye2");

  stripe.charges.create({
    // amount is shown in cents (so 2000 = $20)
    amount: cart.totalPrice * 100,
    currency: "usd",
    source: req.body.stripeToken, // obtained with Stripe.js
    description: "Test Charge"
  }, function(err, charge) {

  // asynchronously called (function called when done)
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/cart/checkout');
    }

    //saving order to database
    var order = new Order ({
      user: req.user,
      cart: cart,
      addressStreet: req.body.addressStreet,
      addressCity: req.body.addressCity,
      addressState: req.body.addressState,
      addressZipcode: req.body.addressZipcode,
      name: req.body.name,
      paymentId: charge.id
    });
    order.save(function(err, result) {
      if (err) {
        throw err;
      }
      //if checkout/verification successful, flash this message
      req.flash('success', "Thank you for your purchase!");
      req.session.cart = null;
      res.redirect('/');
    });
  });
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  //in case they are not logged in
  req.session.oldUrl = req.url;
  res.redirect('/user/login');
}
