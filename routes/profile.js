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

router.use(function(req, res, next) {

    var u = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });

    res.locals.add({
        url: u
    });

    next();
});

router.get('/', function(req, res) {

    var user = new User();


    user = {
        local: {
            username: 'benstuijts',
            password: 'ben123'
        },

        meta: {
            firstname: 'Ben',
            lastname: 'Stuijts',
            avatar: 'default',
            age: 40,
            gender: 0,
            website: 'http://mentorpower.nl',
            tags: ['mentor', 'hockey', 'management', 'webdesign']
        },
        articles: {
            favorite: [
                { title: 'first great article', slug: 'first-article', id: 0},
                { title: 'Second great article', slug: 'second-article', id: 1},
                { title: 'About something great', slug: 'about', id:2}
            ],
            liked: [2, 3]
        },

    };

    res.render('profile', {
        user: user
    });
});

router.get('/search', function(req, res) {
    var tag = req.query.tag;
    res.send(tag);
});

router.get('/article/remove', function(req, res){
    var _id = req.query.id;
    res.send('Deleting article with id of ' + _id + ' from favorites of the user.');
});

module.exports = router;