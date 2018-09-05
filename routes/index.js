var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
//this will configure the .env fil
require('dotenv').config();

var db
MongoClient.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', (err, database) => {
  if (err) return console.log(err)
  db = database.db('lifehoney')
});

/* GET home page. */
// the :language*? allows for a value to be assinged to language. the : followed by any word allows
// for data being passed through the header to be retrieved by using req.params.CORRESPONDINGWORD.
router.get('/:language*?', function(req, res, next) {
  var languageCode = req.params.language;
  // languageCode is undefined when there isn't a value being passed in, in the header so we set it
  // to 'en' for english so that english is our default language.
  if (languageCode === undefined) {
    languageCode = 'ko'
  }
  db.collection('languages').find({'languageCode': languageCode}).toArray(function (err, result) {
    if (err) return console.log(err);
    console.log(result);
    res.render('index', {language: result});
  })
  // rendering index.hbs & title in head of layout.hbs (for tab title)
  // res.render('index', { title: 'LIFE HONEY' });
});

module.exports = router;
