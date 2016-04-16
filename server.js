'use strict';

var config = [];
process.argv.slice(2).forEach(function(value) {
  var key = value.split(":")[0];
  var val = value.split(":")[1];
  config[key] = val;
});
/* Dependencies */
const http      = require("http");
const express   = require("express");
const app       = express();
const passport  = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const themes = require('./config/themes');

/* Configuration */
app.use(session({secret: 'anystringoftext',
				 saveUninitialized: true,
				 resave: true
}));				
const navigation = require('./config/navigation');
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

/* Middleware */
const configuration = function(req,res, next) {
  
  

  res.locals = require("./config/init")[config['mode']];
  res.locals['add'] = function(obj) {
    for(var key in obj) {
      this[key] = obj[key];
    }
  };
  res.locals['navigation'] = navigation,
  res.locals['theme'] = false;
  //res.locals['theme'] = (config['mode'] == 'development') ? themes[req.query.theme] : "yeti";
  next();
};

var auth = express.Router();
require('./routes/auth.js')(auth, passport);
app.use('/auth', configuration,auth);

app.use('/admin', configuration, require('./routes/admin'));
app.use('/profile', configuration, require('./routes/profile'));
app.use('/'     , configuration, require('./routes/routes'));

app.listen(8080, function () {
  console.log('Blog listening on port 8080 in ' + config['mode'] + ' mode.');
});

function randomString(r){for(var n="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",a=0;r>a;a++)n+=t.charAt(Math.floor(Math.random()*t.length));return n}
