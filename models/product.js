//Storing all mongoose models in the models directory
//mongoose uses schemas, which are like blueprints that help define the data for the models
//schemas are blueprints for each new entry into the database; models are based on schemas
//models interact with the data, not the schemas

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//pass JS object defining/describing that schema
var schema = new Schema({
  imagePath: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String, required: true},
  price: {type: Number, required: true}
});

//'product' is name of model
module.exports = mongoose.model('Product', schema);
