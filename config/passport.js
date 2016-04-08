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


	/* http://passportjs.org/docs */

	/* http://code.tutsplus.com/tutorials/authenticating-nodejs-applications-with-passport--cms-21619 */

passport.use('signup', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    const findOrCreateUser = function(){
      // find a user in Mongo with provided username
      User.findOne({'local.username':username},function(err, user) {
        // In case of any error return
        if (err){
          console.log('Error in SignUp: '+err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false, 
             req.flash('message','User Already Exists'));
        } else {
       		var newUser = new User();
        		newUser.local.username 	= username;
          		newUser.local.password 	= newUser.generateHash(password);
          		newUser.local.email 	= req.body.email;
        	
        	sendActivationEmail(newUser, function(err) {
        		
        		if(err) {
        			return done(null, false, req.flash('message',{type: 'warning', body: "Sendind email with activation key failed."}));
        		}
        		
        		newUser.save(function(err){
        			if(err) {
        				return(null, false, req.flash('message', { type: 'warning', body: 'DB ERROR: ' + err}));
        			}
        			return done(null, newUser, req.flash('message', { type: 'success', body: 'Hurray! Account created!'}));
        		});
        		
        		
        	});

        }
      });
    };
     
    // Delay the execution of findOrCreateUser and execute 
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  })
);

passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
  	const findUser = function(){
  		User.findOne({'local.username': username} , function(err, user){
  			if(err) {
  				return done(err, false, req.flash('message', 'ERROR: ' + err));	
  			}
  			if(!user) {
  				return done(null, false, req.flash('message', 'No user found.'));
  			}
  			if(!user.validPassword(password)) {
  				return done(null, false, req.flash('message', 'Invalid Password'));
  			} else {
  				return done(null, user);
  			}
  		});
  	};
    process.nextTick(findUser);
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
		subject: 'Hello from Mailgun',
      	html: 'Hello, This is not a plain-text email, I wanted to test some spicy Mailgun sauce in NodeJS! <a href="http://0.0.0.0:3030/validate?' + activationUrl + '">Click here to add your email address to a mailing list</a>'
    }
    
    console.log('sending email, with URL: ' + activationUrl);
    
    mailgun.messages().send(data, function (err, body) {
        if (err) {
            cb(true);
        }
        else {
            cb(false);
        }
    });
}