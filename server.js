'use strict';

const arg = process.argv.slice(2);
const app_config;
process.argv.forEach(function(value){
  var key = value.split(":")[0],
      val = value.split(":")[1];
app_config[key] = val;
});

const http = require("http");
const express = require("express");
const app           = express();
const config  = require("./config/init");

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

/* Middleware */
const config = function(req,res, next) {
  let c = config[app_config['mode']];
  res.locals = {
    c,
  }
  console.log(c);
  console.log(res.locals);
}

app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/routes'));

app.listen(8080, function () {
  console.log('Blog listening on port 8080 in ' + config['mode'] + ' mode.');
});
