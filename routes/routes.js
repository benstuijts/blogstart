'use strict';
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

    const u = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });

    res.locals.add({
        url: u,
        isAuthenticated: req.isAuthenticated()
    });

    next();
});


/* Development only */
router.get('/layout/:number', function(req, res) {
    var number = req.params.number;
    res.render('layouts', {
        navigation: require('../config/navigation'),
        number: number
    });
});

router.get('/', function(req, res) {
    res.render('landingspage', {
        navigation: require('../config/navigation'),
        message: handleMessage(req)
    });
});

router.get('/article/like', function(req, res) {
    if(req.user) {
        const article_id = req.query.article_id;
        const cb = '/' + req.query.cb;
        
        req.user.articles.liked.push({
            id: article_id,
            title: req.query.title,
            slug: req.query.cb
        });
        req.user.save(function(error){
            if(error) {
                
            }
            res.redirect(cb);
        });
    }
});

router.get('/comment/like', function(req, res){
    console.log('like comment');
    if(req.user) {
        const article_id = req.query.article_id;
        const comment_id = req.query.comment_id;
        const cb = '/' + req.query.cb;
        
        console.log(cb);
        
        Article.findById(article_id, function(error, article){
            console.log(article._id, article.title);
            
            let comment = article.comments.id(comment_id);
            
            console.log(comment);
            
            comment.like.push(req.user._id);
            article.save(function(error){
                if(error) {
                    console.log(error);
                }
                res.redirect(cb);
            })
            
        });
        
        
    }
});

router.post('/comment', function(req, res){
    const comment = {
        author_id: req.user._id,
        body: req.body.comment_body
    };
    if(req.user) {
        Article._read({ _id: req.body.article_id})
        .then(function(articles){
            articles[0].comments.push(comment);
            articles[0].save(function(error){
                if(error) {
                    req.flash('error', 'Error: ' + error);
                } else {
                    req.flash('success', 'Thanks for your comment!');
                }
            });
        })
        .catch()
    }

});



router.get('*', function(req, res) {
    Article._read({
            slug: req.url.substr(1)
        })
        .then(function(article) {
            if (article.length == 0) {
                res.send('not found');
            }
            else {
                res.render('article', {
                    navigation: require('../config/navigation'),
                    message: req.flash('message'),
                    article: article[0],
                });
            }
        })
        .catch(function(error) {
            res.send('ERROR: ' + error);
        });
});

module.exports = router;
