/* Product Page - Add new products here */
//1 seeder per model

require('dotenv').config();

//dont need to specify product.js b/c within same js files
var Product = require('../models/product')
//manually connecting to mongoose
var mongoose = require('mongoose');

mongoose.connect('mongodb://<username>:<password>@ds145072.mlab.com:45072/lifehoney');

// mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney

var products = [
  new Product({
  imagePath: 'images/propolis.png',
  title: 'Propolis Tincture',
  description: 'testing',
  category: 'propolis',
  price: 12
  }),
  new Product({
  imagePath: 'images/salt.jpg',
  title: 'Salt',
  description: 'testing',
  category: 'salt',
  price: 12
  }),
  new Product({
  imagePath: 'images/propolis2.png',
  title: 'Raw Propolis',
  description: 'testing',
  category: 'propolis',
  price: 12
  }),
  new Product({
  imagePath: 'images/dentalsalt.jpg',
  title: 'Dental Salt',
  description: 'testing',
  category: 'salt',
  price: 12
  }),
  new Product({
  imagePath: 'images/honey.jpg',
  title: '100% Pure Honey',
  description: 'testing',
  category: 'honey',
  price: 12
  }),
  new Product({
  imagePath: 'images/honey1.jpg',
  title: 'Honey',
  description: 'testing',
  category: 'honey',
  price: 12
  }),
  new Product({
  imagePath: 'images/powder.png',
  title: 'Mistletoe Powder',
  description: 'testing',
  category: 'mistletoe',
  price: 12
  }),
  new Product({
  imagePath: 'images/pills.png',
  title: 'Mistletoe Pills',
  description: 'testing',
  category: 'mistletoe',
  price: 12
  }),
  new Product({
  imagePath: 'images/sugar.jpg',
  title: 'Sugar',
  description: 'testing',
  category: 'salt',
  price: 12
  })
];

//store all products in database
var done = 0;
for (var i = 0; i < products.length; i++) {
  products[i].save(function(err, result) { //save method w mongoose allows you to save model to database
    done++;
    if (done === products.length) {
      exit();
    }
  });
}

//can't disconnect outside of for loop b/c mongoose will most likely disconnect before
//the for loop is run (b/c saving is asynchronous)
function exit() {
  mongoose.disconnect();
}
