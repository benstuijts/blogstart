var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var User                = require('../models/User');
//var configAuth          = require('./auth');
var Mailgun 			= require('mailgun-js');
const init      		= require("./init");

var config = [];
process.argv.slice(2).forEach(function(value) {
  var key = value.split(":")[0];
  var val = value.split(":")[1];
  config[key] = val;
});

module.exports = function(passport) {


	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});


	passport.use('local-signup', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done){
		process.nextTick(function(){
			User.findOne({'local.username': username}, function(err, user){
				if(err) {
					console.log('ERROR: ' + err);
					return done(err);
				}
					
				if(user){
					return done(null, false, req.flash('signupMessage', 'That email already taken'));
				} 
				if(!req.user) {
					var newUser = new User();
					var email = 'b.stuijts@upcmail.nl';
					newUser.local.username = username;
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					newUser.save(function(err){
						if(err)
							throw err;
						/* Send Activation Email */
						sendActivationEmail(newUser, function(err) {
							if(err) return done(err);
							return done(null, newUser);
						});
						
						
					})
				} else {
					var user = req.user;
					user.local.username = username;
					user.local.password = user.generateHash(password);

					user.save(function(err){
						if(err)
							throw err;
						return done(null, user);
					})
				}
			})

		});
	}));

	passport.use('local-login', new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, done){
			process.nextTick(function(){
				User.findOne({ 'local.username': username}, function(err, user){
					if(err)
						return done(err);
					if(!user)
						return done(null, false);
					if(!user.validPassword(password)){
						return done(null, false);
					}
					return done(null, user);

				});
			});
		}
	));


	passport.use(new FacebookStrategy({
	    clientID: init[config['mode']].facebookAuth.clientID,
	    clientSecret: init[config['mode']].facebookAuth.clientSecret,
	    callbackURL: init[config['mode']].facebookAuth.callbackURL,
	    passReqToCallback: true
	  },
	  function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
	    		//user is not logged in yet
	    		if(!req.user){
					User.findOne({'facebook.id': profile.id}, function(err, user){
		    			if(err)
		    				return done(err);
		    			if(user){
		    				if(!user.facebook.token){
		    					user.facebook.token = accessToken;
		    					user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
		    					newUser.local.username = profile.name.givenName + ' ' + profile.name.familyName;
		    					user.facebook.email = profile.emails[0].value;
		    					user.save(function(err){
		    						if(err)
		    							throw err;
		    					});

		    				}
		    				return done(null, user);
		    			}
		    			else {
		    				var newUser = new User();
		    				newUser.facebook.id = profile.id;
		    				newUser.facebook.token = accessToken;
		    				newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
		    				newUser.local.username = profile.name.givenName + ' ' + profile.name.familyName;
		    				newUser.facebook.email = profile.emails[0].value;

		    				newUser.save(function(err){
		    					if(err)
		    						throw err;
		    					return done(null, newUser);
		    				})
		    			}
		    		});
	    		}

	    		//user is logged in already, and needs to be merged
	    		else {
	    			var user = req.user;
	    			user.facebook.id = profile.id;
	    			user.facebook.token = accessToken;
	    			user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
	    			user.local.username = profile.name.givenName + ' ' + profile.name.familyName;
	    			user.facebook.email = profile.emails[0].value;

	    			user.save(function(err){
	    				if(err)
	    					throw err
	    				return done(null, user);
	    			})
	    		}
	    		
	    	});
	    }

	));

	passport.use(new GoogleStrategy({
	    clientID: init[config['mode']].googleAuth.clientID,
	    clientSecret: init[config['mode']].googleAuth.clientSecret,
	    callbackURL: init[config['mode']].googleAuth.callbackURL,
	    passReqToCallback: true
	  },
	  function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){

	    		if(!req.user){
	    			User.findOne({'google.id': profile.id}, function(err, user){
		    			if(err)
		    				return done(err);
		    			if(user){
		    				if(!user.google.token){
		    					user.google.token = accessToken;
		    					user.google.name = profile.displayName;
		    					user.local.username = profile.displayName;
		    					user.google.email = profile.emails[0].value;
		    					user.save(function(err){
		    						if(err)
		    							throw err;
		    					});
		    				}
		    				return done(null, user);
		    			}
		    			else {
		    				var newUser = new User();
		    				newUser.google.id = profile.id;
		    				newUser.google.token = accessToken;
		    				newUser.google.name = profile.displayName;
		    				newUser.local.username = profile.displayName;
		    				newUser.google.email = profile.emails[0].value;

		    				newUser.save(function(err){
		    					if(err)
		    						throw err;
		    					return done(null, newUser);
		    				})
		    			}
		    		});
	    		} else {
	    			var user = req.user;
	    			user.google.id = profile.id;
					user.google.token = accessToken;
					user.google.name = profile.displayName;
					user.local.username = profile.displayName;
					user.google.email = profile.emails[0].value;

					user.save(function(err){
						if(err)
							throw err;
						return done(null, user);
					});
	    		}
	    		
	    	});
	    }

	));


	


};

function sendActivationEmail(user, cb) {
	var mailgun = new Mailgun({apiKey: init[config['mode']].email.api_key, domain: init[config['mode']].email.domain});
	var activationUrl = init[config['mode']].baseUrl+'auth/authenticate?activationKey='+user.local.activationKey+'&username='+user.local.username;
	var data = {
		from: init[config['mode']].email.from_who,
		to: user.local.email,
		subject: 'Activate your account',
		html: 'Hello, please activate your account by clicking this <a href="' + activationUrl +'">link</a>, or copy this URL in your browser: ' + activationUrl
    };
    mailgun.messages().send(data, function (err, body) {
        if (err) {
            cb(true);
        }
        else {
            cb(false);
        }
    });
}