var express = require('express');
var router = express.Router(); //included in npm
var MongoClient = require('mongodb').MongoClient; //connect to database (mLab)
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID; //find by object id
require('dotenv').config(); //configure the .env fil
var async = require('async'); //access multiple collections through 1 crud method
var uuid = require('uuid');

var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');

var db
MongoClient.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true }, (err, database) => {
  if (err) return console.log(err)
  db = database.db('lifehoney')
});

// mongoose.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true });

/* GET Homepage */
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
      db.collection('languages').find({'languageCode': languageCode, 'page': 'index'}).toArray(function (err, result) {
        if (err) return console.log(err);
        // console.log(result);
        locals.language = result; //adding to the locals object to pass to index.hbs
        callback();
      });
    },
    function(callback) {
      db.collection('products').find().toArray(function(err, result) {
        if (err) return console.log(err);
        selectTitle(result, languageCode); //refer to selectTitle function at bottom of page
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

/* GET Products (Shop All Page & Categories Page)*/
router.get('/shop/:category?/:language?', function(req, res, next) {
  var languageCode = req.params.language;
  var category = req.params.category;

  if (languageCode === undefined) {
    languageCode = 'ko';
  };

  var locals = {
    languageCode: languageCode //key name can be anything; value is en or ko
  }

  var task = [
    function(callback) {
      db.collection('languages').find({'languageCode': languageCode, 'page': 'shop-all'}).toArray(function(err, result) {
        if (err) return console.log(err);
        locals.language = result; //result is all translated words in languages collection
        locals.categoryTitle = result[0][category];
        callback();
      })
    },
    function(callback) {
      //Shop All
      if (category === 'all') {
        db.collection('products').find().toArray(function(err, result) {
          if (err) return console.log(err);
          selectTitle(result, languageCode);
          locals.allproducts = result;
          callback();
        });
      //Category
      } else {
       //'category' refers to mlab; category (no quotes) refers to the variable
       db.collection('products').find({'category': category}).toArray(function(err, result) {
         if (err) return console.log(err);
         selectTitle(result, languageCode);
         locals.categories = result;
        //  locals.categoryTitle = category;
         callback();
       });
     }
    }
  ];

  async.parallel(task, function(err) {
    if (err) return next();

    if (category === 'all') {
      res.render('shop/shop-all', locals);
    } else {
      res.render('shop/categories', locals);
    }
  });
});

/* GET Single Product Page */
router.get('/product/:id/:language?', function(req, res, next) {
  var languageCode = req.params.language;

  if (languageCode === undefined) {
    languageCode = 'ko';
  }

  var locals = {
    languageCode: languageCode
  }

  var task = [
    function(callback) {
      db.collection('languages').find({'languageCode': languageCode, 'page': 'single-product'}).toArray(function(err, result) {
        if (err) return console.log(err);
        console.log(result);
        locals.language = result;
        callback();
      })
    },
    function(callback) {
      db.collection('products').find({'_id': ObjectId(req.params.id)}).toArray(function(err, result) { //can't use findOne & toArray together
        if (err) return console.log(err);
        selectTitle(result, languageCode);
        locals.product = result;
        callback();
      });
    }
  ];

  async.parallel(task, function(err) {
    if (err) return next();
    console.log(locals);
    res.render('shop/product-page', locals);
  });
});

/* GET Add to Cart */
router.post('/add-to-cart/:id', function(req, res, next) {
  console.log("...................");
  console.log(req.body.size);
  console.log(req.body.qty);
  console.log("...................");
  var quantityOptions = Number(req.body.qty);
  console.log(quantityOptions);
  //passing in old cart if you have one
  //ternary expression: if an old cart exists, pass the old cart, if not, pass an empty object
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  db.collection('products').findOne({'_id': ObjectId(req.params.id)}, function(err, product) {
    if (err) {
      return res.redirect('/');
      console.log(err);
    }
    var productId = product._id + '-' + req.body.size;
    console.log(productId);
    cart.add(product, productId, quantityOptions, req.body.size); //.add is a function in cart.js
    req.session.cart = cart;
    console.log(cart);
    // res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'); //cache clearing headers
    res.redirect('back'); //back = req.get('Referrer');
  });
});

router.get('/add-one-cart/:otherId', (req, res, next) => {
  var productId = req.params.otherId;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.add(null, productId, 1);
  req.session.cart = cart;
  res.redirect('back')
});

/* GET Shopping Cart - display shopping cart */
router.get('/shopping/cart/:language?', function(req, res, next) {
  var languageCode = req.params.language;
  if (languageCode === undefined) {
    languageCode = 'ko';
  }
  var data = {
    languageCode: languageCode
  };

  //if there's nothing in cart, render "no items in cart" from shopping-cart.hbs
  if (!req.session.cart) {
    //going into views directory, then shop directory, then shopping-cart.hbs
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  selectTitleCart(cart.items, languageCode);

  data.products = cart.generateArray();
  data.totalPrice = cart.totalPrice;

  db.collection('languages').find({'languageCode': languageCode, 'page': 'shopping-cart'}).toArray(function(err, result) {
    if (err) return console.log(err);
    data.language = result;
    res.render('shop/shopping-cart', data)
  });
});


/* GET Reduce- Reduce Qty of Items in Cart */
router.get('/reduce/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('back');
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
      orderNumber: uuid.v4(),
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

/* For item titles in Shop All, Categories, & Single Product Pages */
//loop through products, go inside title of a specific product, go inside lang obj & retrieve
function selectTitle(value, lang) {
  for(var i in value) { //result = entire array of all products
    var title = value[i].title[lang]; //get title of current product i is on
    value[i].title = title;
  //     for(var j in arr){
  //       if (j === lang){ //languageCode is in another object within title
  //         value[i].title = arr[j]; //equal title to lang value
  //       }
  //     }
  }
};

/* For item titles in the Shopping Cart & Orders pages */
function selectTitleCart(value, lang) {
  for (var i in value) {
    var title = value[i].item.title[lang];
    value[i].item.tempTitle = title;
  }
};
