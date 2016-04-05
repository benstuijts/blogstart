const express       = require("express");
const router        = express.Router();
const bodyParser    = require('body-parser');
const session       = require('express-session');
const mongoose      = require('mongoose');

/* Middleware */
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 



router.get('/', function(req, res){
    res.render('landingspage', {
        navigation: require('../config/navigation')
    });
});

module.exports = router;
