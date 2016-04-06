const express       = require("express");
const router        = express.Router();
const bodyParser    = require('body-parser');
const session       = require('express-session');
const mongoose      = require('mongoose');
const url           = require('url');
const Article       = require('../models/Article');

/* Middleware */
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 

router.use(function (req, res, next) {

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


/* Development only */
router.get('/layout/:number', function(req, res){
    var number = req.params.number;
    res.render('layouts', {
        navigation: require('../config/navigation'),
        number: number
    });
});

router.get('/', function(req, res){
    res.render('landingspage', {
        navigation: require('../config/navigation')
    });
});

router.get('*', function(req, res) {
    Article._read({ slug: req.url.substr(1)})
    .then(function(article){
        if(article.length == 0 ) {
            res.send('not found');
        } else {
            res.render('article', {
                navigation: require('../config/navigation'),
                article: article[0],
            });    
        }
    })
    .catch(function(error){
        res.send('ERROR: ' + error);
    });
});

module.exports = router;
