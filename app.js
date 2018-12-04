var express = require('express');
var path = require('path'); //pre-installed
var favicon = require('serve-favicon'); //pre-installed
var logger = require('morgan'); //pre-installed
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

var index = require('./routes/index');
var user = require('./routes/user');

var app = express();

mongoose.connect('mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ds145072.mlab.com:45072/lifehoney', { useNewUrlParser: true });
require('./config/passport');

//View engine setup
  //using express-handlebars package; expressHbs() executes the package, object inside configures the template engine
  //default layout will search for layout.hbs; extname is to keep all extensions .hbs, not .handlebars (which is the default ext name for this package)
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
// change 'hbs' to '.hbs' to refer to new engine
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
  //use existing mongoose connection to store
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  //ouput in ms: 180 min x 60 sec x 1000 milliseconds
  cookie: { maxAge: 1440 * 60 * 1000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
  res.locals.login = req.isAuthenticated(); //req.locals - global varable; login referenced in header.hbs
  res.locals.session = req.session;
  next();
});

app.use('/', index);
app.use('/user', user);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

const server = app.listen(process.env.PORT || 8080, function() {
  console.log('listening on 3000')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
