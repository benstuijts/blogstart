const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const url = require('url');
const Article = require('../models/Article');
const User = require('../models/User');

/* Middleware */
router.use(bodyParser.json()); // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

function handleMessage(req) {
    return {
        "success"   : req.flash("success"),
        "info"      : req.flash("info") || req.flash("message"),
        "warning"   : req.flash("warning"),
        "error"     : req.flash("error"),
        "message"   : req.flash("message")
    };
}

router.use(function(req, res, next) {

    var u = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });

    res.locals.add({
        url: u,
        isAuthenticated:  req.isAuthenticated()
    });

    next();
});

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}

router.get('/', isAuthenticated, function(req, res) {
    
    var user = req.user;

    res.render('profile', {
        user: user,
        message: handleMessage(req)
    });
});

router.get('/search', isAuthenticated, function(req, res) {
    var tag = req.query.tag;
    res.send(tag);
});

router.get('/article/remove', isAuthenticated, function(req, res){
    var _id = req.query.id;
    res.send('Deleting article with id of ' + _id + ' from favorites of the user.');
});
router.get('/article/dislike', function(req, res) {
    var indexOfArticle = req.user.articles.liked.map(function(x) {return x.id; }).indexOf(req.query.id);
    req.user.articles.liked.splice(indexOfArticle, 1);
    req.user.save(function(error){
        if(error) {
            req.flash('error', 'There was an error: ' + error);
        } else {
            req.flash('success', 'Like was removed.');
        }
        res.redirect('./');
    });
    
});

router.post('/save', isAuthenticated, function(req, res){
    res.send(req.body);
});

module.exports = router;