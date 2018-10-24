/* User account model */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

//Define user schema, passing in as js object
//add method to user schema => user model to hash(encrypt) the password
//add method to validate this hashed password
var userSchema = new Schema ({
  email: {type: String, required: true},
  password: {type: String, required: true}
});



//Sign up

// Creating an encrypted password & then returning it
//return hashed password using bcrypt then synchronous hashing with hashSync,
//passing the password, then generating the salt & passing 5 rounds of salt creation
userSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

//Sign-in
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
