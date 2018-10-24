/* Order Checkout Model */

//Mongoose model

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//pass JS object defining/describing that schema
var schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'}, //store an id for the user, but behind the scenes,
  // that id is actually connected to the user collection in the user model (in user.js)
  cart: {type: Object, required: true},
  addressStreet: {type: String, required: true},
  addressCity: {type: String, required: true},
  addressState: {type: String, required: true},
  addressZipcode: {type: String, required: true},
  name: {type: String, required: true},
  paymentId: {type: String, required: true}
});

//'product' is name of model
module.exports = mongoose.model('Order', schema);
