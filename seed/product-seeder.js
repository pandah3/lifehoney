//1 seeder per model

//dont need to specify product.js b/c within same js files
var Product = require('../models/product');

//manually connecting to mongoose
var mongoose = require('mongoose');

mongoose.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney');

var products = [
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  }),
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  }),
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  }),
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  }),
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  }),
  new Product({
    imagePath: '',
    title: 'Propolis',
    description: 'testing',
    price: 12
  })
];

//store all products in database
//save method w mongoose allows you to save model to database
//mongoose creates new collection, then saves new document/entry

//- can't disconnect outside of for loop b/c mongoose will most likely disconnect before the for loop is run b/c
//saving is asynchronous
//- can't disconnect within a function within save b/c then it will disconnect every time the loop runs

var done = 0;
for (var i = 0; i < products.length; i++) {
  products[i].save(function(err, result) {
    done++;
    console.log(done);
    if (done === products.length) {
      exit();
    }
  });
}

function exit() {
  mongoose.disconnect();
}
