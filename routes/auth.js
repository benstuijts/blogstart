const User 			= require('../models/User');
const bodyParser 	= require('body-parser');

module.exports = function(router, passport){
    
    /* Middleware */
	router.use(bodyParser.json()); // to support JSON-encoded bodies
	router.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	    extended: true
	}));

	router.use(function(req, res, next) {
    res.locals.add({
        isAuthenticated: req.isAuthenticated(),
        breadcrumbs: null,
    });

    next();
});

function handleMessage(req) {
    return {
        "success"   : req.flash("success"),
        "info"      : req.flash("info") || req.flash("message"),
        "warning"   : req.flash("warning"),
        "error"     : req.flash("error"),
        "message"   : req.flash("message")
    };
}

	/* Development Only */
	router.get('/allusers', function(req, res) {
		User.find({}, function(err, users){
			if(err) throw err;
			res.send('<h1>Users ('+users.length+')</h1><pre>' + users + '</pre>');
		});
	});
	router.get('/delusers', function(req, res) {
		User.remove({}, function(err){
			if(err) throw err;
			res.send('all users deleted. <a href="./allusers">Check all users</a>');
		});
	});
	/* END Development Only */
	
	
	//localhost:8080/auth/signup
	router.get('/signup', function(req, res){
		
		res.render('auth/signup.ejs', { 
			message: handleMessage(req) 
		});
	});

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/profile',
		failureRedirect: '/',
		failureFlash: true
	}));
	
	router.post('/signup', passport.authenticate('signup', {
    	successRedirect: '/profile',
    	failureRedirect: './signup',
    	failureFlash : true 
  	}));
	
	router.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	})

	router.get('/authenticate', function(req, res){
		var username 		= req.query.username;
		var activationKey 	= req.query.activationKey;
		res.render('auth/authenticate.ejs', { username: username, activationKey: activationKey, message: handleMessage(req) });
	});
	
	router.post('/authenticate', function(req, res){
		var username = req.body.username;
		var activationKey = req.body.activationKey;
		
		User.findOne({ 
			'local.activationKey': activationKey
		}, function(err, user){
			if(err) {
				
			} else {
				res.render('auth/first-login', { username: user.local.username, password: user.local.password, message: handleMessage(req)});
			}
		});
		
		
	});
	
	router.get('/privacy-policy', function(req, res){
		res.render('auth/privacy-policy');
	});
	router.get('/terms-of-service', function(req, res){
		res.render('auth/terms');
	});

	
	router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));

	router.get('/facebook/callback', 
	  passport.authenticate('facebook', { successRedirect: '/profile',
	                                      failureRedirect: '/' }));

	router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

	router.get('/google/callback', 
	  passport.authenticate('google', { successRedirect: '/profile',
	                                      failureRedirect: '/' }));

	router.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }), function(req, res){
		console.log("account" + req.account);
	});
	router.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

	router.get('/connect/local', function(req, res){
		res.render('connect-local.ejs');
	});

	router.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/connect/local',
		failureFlash: true
	}));

	router.get('/unlink/facebook', function(req, res){
		var user = req.user;

		user.facebook.token = null;

		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
	});

	router.get('/unlink/local', function(req, res){
		var user = req.user;

		user.local.username = null;
		user.local.password = null;

		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		});

	});

	router.get('/unlink/google', function(req, res){
		var user = req.user;
		user.google.token = null;

		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		});
	});


};