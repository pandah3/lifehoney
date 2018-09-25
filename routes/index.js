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
  var languageCode = req.params.language;
  // languageCode is undefined when there isn't a value being passed in, in the header so we set it
  // to 'ko' for english so that korean is our default language.
  if (languageCode === undefined) {
    languageCode = 'ko'
  }

  var locals = {
    languageCode: languageCode
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

router.get('/shopping-cart/', function(req, res, next) {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

module.exports = router;

    // res.render('index', {language: result});
  // rendering index.hbs & title in head of layout.hbs (for tab title)
  // res.render('index', { title: 'LIFE HONEY' });

// res.render('index', {title: 'Life Honey', products: productChunks});
// });


// function(err, docs) {
//   var productChunks = [];
//   var chunkSize = 3;
//   //increment for loop not by 1, but by each chunk size
//   for (var i = 0; i < docs.length; i += chunkSize) {
//     //if i = 0, then slice after every 3rd element (0 + 3)
//     productChunks.push(docs.slice(i, i + chunkSize));
//   }
//   locals.products = productChunks;
//   console.log('this should be products' + productChunks);
//   callback();
// })
