var express = require('express');
var router = express.Router(); //included in npm
var MongoClient = require('mongodb').MongoClient; //connect to database (mLab)
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID; //find by object id
require('dotenv').config(); //configure the .env fil
var async = require('async'); //access multiple collections through 1 crud method

var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');

var db
MongoClient.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true }, (err, database) => {
  if (err) return console.log(err)
  db = database.db('lifehoney')
});

// mongoose.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true });

/* GET home page */
// the :language*? allows for a value to be assigned to language. the : followed by any word allows
// for data being passed through the header to be retrieved by using req.params.CORRESPONDINGWORD
router.get('/:language?', function(req, res, next) {
  var successMsg = req.flash('success')[0];
  var languageCode = req.params.language;
  // languageCode is undefined when there isn't a value being passed in the header so we set it
  // to 'ko' so that korean is our default language.
  if (languageCode === undefined) {
    languageCode = 'ko'
  }

  var locals = { //data that's passed along to the index.hbs when running async
    languageCode: languageCode,
    successMsg: successMsg,
    noMessage: !successMsg
  };

  var task = [ //async task
    function(callback) {
      db.collection('languages').find({'languageCode': languageCode}).toArray(function (err, result) {
        if (err) return console.log(err);
        // console.log(result);
        locals.language = result; //adding to the locals object to pass to index.hbs
        callback();
      });
    },
    function(callback) {
      db.collection('products').find().toArray(function(err, result) {
        if (err) return console.log(err);
        // console.log(result);
        locals.products = result; //adding to the locals object to pass to index.hbs
        callback();
      });
    }
  ];

  async.parallel(task, function(err) {
    if (err) return next();
    res.render('index', locals) //render index.hbs
    })
  });

/* GET Products (Shop & Categories)*/
router.get('/shop/:category?', function(req, res, next) {
  var category = req.params.category;

  if (category === 'all') {
    db.collection('products').find().toArray(function(err, result) {
      if (err) return console.log(err);
      res.render('shop/shop-all', {allproducts: result});
    });
  } else {
    //'category' refers to mlab; category (no quotes) refers to the variable
    db.collection('products').find({'category': category}).toArray(function(err, result) {
      if (err) return console.log(err);
      res.render('shop/categories', {categories: result, categoryTitle: category});
    });
  }
});


/* GET Add to Cart */
router.get('/add-to-cart/:id', function(req, res, next) {
  var productId = req.params.id;
  console.log(productId);
  //passing in old cart if you have one
  //ternary expression: if an old cart exists, pass the old cart, if not, pass an empty object
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  db.collection('products').findOne({'_id': ObjectId(req.params.id)}, function(err, product) {
    if (err) {
      return res.redirect('/');
      console.log(err);
    }
    console.log(product._id);
    cart.add(product, product._id); //.add is a function in cart.js
    req.session.cart = cart;
    console.log(req.session.cart);
    // res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'); //cache clearing headers
    res.redirect('back'); //back = req.get('Referrer');
  });
});


/* GET Shopping Cart - display shopping cart */
router.get('/shopping/cart/', function(req, res, next) {
  //if there's nothing in cart, render "no items in cart" from shopping-cart.hbs
  if (!req.session.cart) {
    //going into views directory, then shop directory, then shopping-cart.hbs
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  //generateArray is from cart.js
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});


/* GET Reduce- Reduce Qty of Items in Cart */
router.get('/reduce/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping/cart/');
});

/* GET Remove- Remove Item(s) in Cart */
router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping/cart/');
});


/* Checkout Routes */
  /* GET Checkout */
router.get('/cart/checkout', isLoggedIn, function(req, res, next) { //isLoggedIn is @ bottom of this page
  if (!req.session.cart) {
    return res.redirect('/shopping/cart');
  }
  var cart = new Cart(req.session.cart);
  //overriding error message from stripe and creating our own error message
  var errMsg = req.flash('error')[0];
  //views > shop > checkout.hbs | errorMsg- from checkout.hbs; errMsg is the variable
  res.render('shop/checkout', {total: cart.totalPrice, errorMsg: errMsg, noError: !errMsg});
});

  /* POST Checkout */
router.post('/cart/checkout', isLoggedIn, function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping/cart');
  }

  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

  stripe.charges.create({
    // amount is shown in cents (so 2000 = $20)
    amount: cart.totalPrice * 100,
    currency: "usd",
    source: req.body.stripeToken, // obtained with checkout.js
    description: "Test Charge"
  }, function(err, charge) {

  // asynchronously called (function called when done)
    if (err) {
      req.flash('error', err.message); //err.message is a stripe function
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
  if (req.isAuthenticated()) { //isAuthenticated is a passport function
    return next();
  }
  //in case they are not logged in
  req.session.oldUrl = req.url; //stores current url then redirects you back there after you login/signup
  res.redirect('/user/login');
}
