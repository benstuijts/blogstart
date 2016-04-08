const User = require('../models/User');

module.exports = function(router, passport){
    
	//localhost:8080/auth/
	router.get('/', function(req, res){
		res.render('index.ejs');
	});
	
	//localhost:8080/auth/login
	router.get('/login', function(req, res){
		res.render('login.ejs');
	});
	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));
	
	/* Development Only */
	router.get('/allusers', function(req, res) {
		User.find({}, function(err, users){
			if(err) throw err;
			res.send(users);
		});
	});
	/* END Development Only */
	
	
	//localhost:8080/auth/signup
	router.get('/signup', function(req, res){
		res.render('auth/signup.ejs', { message: req.flash('signupMessage') });
	});
	
	var check = function(req, res, next) {
		console.log('POST ON /AUTH/SIGNUP! ');
		next();
	};
	
	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: './authenticate',
		failureRedirect: './signup',
		failureFlash: true
	}));
	
	router.get('/authenticate', function(req, res){
		var username = req.query.username;
		var activationcode = req.query.activationcode;
		res.render('auth/authenticate.ejs', { username: username, activationcode: activationcode });
	});
	
	router.post('/authenticate', function(req, res){
		var username = req.body.username;
		var activationKey = req.body.activationKey;
		
		User.findOne({ 
			'local.activationKey': activationKey
		}, function(err, user){
			if(err) {
				
			} else {
				res.render('auth/first-login', { username: user.local.username, password: user.local.password});
			}
		});
		
		
	});
	
	router.get('/privacy-policy', function(req, res){
		res.render('auth/privacy-policy');
	});
	router.get('/terms-of-service', function(req, res){
		res.render('auth/terms');
	});

	// router.get('/profile', isLoggedIn, function(req, res){
	// 	res.render('profile.ejs', { user: req.user });
	// });
	
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

	router.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	})
};