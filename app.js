require('dotenv').config();
var createError = require('http-errors');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const favicon = require('serve-favicon');
const compression = require('compression');
const helmet = require('helmet');

var indexRouter = require('./routes/index');

//  For sessions

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

//  For flash messages
const flash = require('connect-flash');

//  For passport.js:
const User = require('./models/user');
const passport =  require('passport');

var app = express();

// for security / helmet

app.use(helmet());

// compress responses

app.use(compression());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//  Configure passport middleware 
// Must be in this order
app.use(session({

  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());

//  Flash messages
app.use(flash());



passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Our own middleware

app.use( (req, res, next) => {
  // console.log(req.user);
  res.locals.user = req.user;
  res.locals.url = req.path;
  res.locals.flash = req.flash();
  next();

});

// set up mongoose connection
mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (error) => console.error(error.message) );

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
