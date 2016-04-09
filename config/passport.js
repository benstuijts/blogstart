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
    	/* Validate input */
    	if(password.length < 2) {
    		return done(null, false, req.flash('warning', 'Password length minimum of 8 characters.'));
    	}
    	
    	
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
        			return done(null, false, req.flash('error','Sending email with activation key failed.'));
        		}
        		
        		newUser.save(function(err){
        			if(err) {
        				return(null, false, req.flash('error', 'DB ERROR: ' + err));
        			}
        			return done(null, newUser, req.flash('success', 'Hurray! Account created!'));
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
  				return done(err, false, req.flash('error', 'ERROR: ' + err));	
  			}
  			if(!user) {
  				return done(null, false, req.flash('warning', 'No user found.'));
  			}
  			if(!user.validPassword(password)) {
  				return done(null, false, req.flash('warning', 'Invalid Password'));
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
		html: '<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><!--[if gte mso 15]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--><meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"><title>*|MC:SUBJECT|*</title> <style type="text/css">p{margin:10px 0;padding:0;}table{border-collapse:collapse;}h1,h2,h3,h4,h5,h6{display:block;margin:0;padding:0;}img,a img{border:0;height:auto;outline:none;text-decoration:none;}body,#bodyTable,#bodyCell{height:100%;margin:0;padding:0;width:100%;}#outlook a{padding:0;}img{-ms-interpolation-mode:bicubic;}table{mso-table-lspace:0pt;mso-table-rspace:0pt;}.ReadMsgBody{width:100%;}.ExternalClass{width:100%;}p,a,li,td,blockquote{mso-line-height-rule:exactly;}a[href^=tel],a[href^=sms]{color:inherit;cursor:default;text-decoration:none;}p,a,li,td,body,table,blockquote{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%;}a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important;}#bodyCell{padding:10px;}.templateContainer{max-width:600px !important;}a.mcnButton{display:block;}.mcnImage{vertical-align:bottom;}.mcnTextContent{word-break:break-word;}.mcnTextContent img{height:auto !important;}.mcnDividerBlock{table-layout:fixed !important;}body,#bodyTable{/*@editable*/background-color:#FAFAFA;}#bodyCell{/*@editable*/border-top:0;}.templateContainer{/*@editable*/border:0;}h1{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:26px;/*@editable*/font-style:normal;/*@editable*/font-weight:bold;/*@editable*/line-height:125%;/*@editable*/letter-spacing:normal;/*@editable*/text-align:left;}h2{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:22px;/*@editable*/font-style:normal;/*@editable*/font-weight:bold;/*@editable*/line-height:125%;/*@editable*/letter-spacing:normal;/*@editable*/text-align:left;}h3{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:20px;/*@editable*/font-style:normal;/*@editable*/font-weight:bold;/*@editable*/line-height:125%;/*@editable*/letter-spacing:normal;/*@editable*/text-align:left;}h4{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:18px;/*@editable*/font-style:normal;/*@editable*/font-weight:bold;/*@editable*/line-height:125%;/*@editable*/letter-spacing:normal;/*@editable*/text-align:left;}#templatePreheader{/*@editable*/background-color:#FAFAFA;/*@editable*/border-top:0;/*@editable*/border-bottom:0;/*@editable*/padding-top:9px;/*@editable*/padding-bottom:9px;}#templatePreheader .mcnTextContent,#templatePreheader .mcnTextContent p{/*@editable*/color:#656565;/*@editable*/font-family:Helvetica;/*@editable*/font-size:12px;/*@editable*/line-height:150%;/*@editable*/text-align:left;}#templatePreheader .mcnTextContent a,#templatePreheader .mcnTextContent p a{/*@editable*/color:#656565;/*@editable*/font-weight:normal;/*@editable*/text-decoration:underline;#templateHeader{/*@editable*/background-color:#FFFFFF;/*@editable*/border-top:0;/*@editable*/border-bottom:0;/*@editable*/padding-top:9px;/*@editable*/padding-bottom:0;}#templateHeader .mcnTextContent,#templateHeader .mcnTextContent p{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:16px;/*@editable*/line-height:150%;/*@editable*/text-align:left;}#templateHeader .mcnTextContent a,#templateHeader .mcnTextContent p a{/*@editable*/color:#2BAADF;/*@editable*/font-weight:normal;/*@editable*/text-decoration:underline;}#templateBody{/*@editable*/background-color:#FFFFFF;/*@editable*/border-top:0;/*@editable*/border-bottom:2px solid #EAEAEA;/*@editable*/padding-top:0;/*@editable*/padding-bottom:9px;}#templateBody .mcnTextContent,#templateBody .mcnTextContent p{/*@editable*/color:#202020;/*@editable*/font-family:Helvetica;/*@editable*/font-size:16px;/*@editable*/line-height:150%;/*@editable*/text-align:left;}#templateBody .mcnTextContent a,#templateBody .mcnTextContent p a{/*@editable*/color:#2BAADF;/*@editable*/font-weight:normal;/*@editable*/text-decoration:underline;}#templateFooter{/*@editable*/background-color:#FAFAFA;/*@editable*/border-top:0;/*@editable*/border-bottom:0;/*@editable*/padding-top:9px;/*@editable*/padding-bottom:9px;}#templateFooter .mcnTextContent,#templateFooter .mcnTextContent p{/*@editable*/color:#656565;/*@editable*/font-family:Helvetica;/*@editable*/font-size:12px;/*@editable*/line-height:150%;/*@editable*/text-align:center;}#templateFooter .mcnTextContent a,#templateFooter .mcnTextContent p a{/*@editable*/color:#656565;/*@editable*/font-weight:normal;/*@editable*/text-decoration:underline;}@media only screen and (min-width:768px){.templateContainer{width:600px !important;}}@media only screen and (max-width: 480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important;}}@media only screen and (max-width: 480px){body{width:100% !important;min-width:100% !important;}}@media only screen and (max-width: 480px){#bodyCell{padding-top:10px !important;}}@media only screen and (max-width: 480px){.mcnImage{width:100% !important;}}@media only screen and (max-width: 480px){.mcnCaptionTopContent,.mcnCaptionBottomContent,.mcnTextContentContainer,.mcnBoxedTextContentContainer,.mcnImageGroupContentContainer,.mcnCaptionLeftTextContentContainer,.mcnCaptionRightTextContentContainer,.mcnCaptionLeftImageContentContainer,.mcnCaptionRightImageContentContainer,.mcnImageCardLeftTextContentContainer,.mcnImageCardRightTextContentContainer{max-width:100% !important;width:100% !important;}}@media only screen and (max-width: 480px){.mcnBoxedTextContentContainer{min-width:100% !important;}}@media only screen and (max-width: 480px){.mcnImageGroupContent{padding:9px !important;}}@media only screen and (max-width: 480px){.mcnCaptionLeftContentOuter .mcnTextContent,.mcnCaptionRightContentOuter .mcnTextContent{padding-top:9px !important;}}@media only screen and (max-width: 480px){.mcnImageCardTopImageContent,.mcnCaptionBlockInner .mcnCaptionTopContent:last-child .mcnTextContent{padding-top:18px !important;}}@media only screen and (max-width: 480px){.mcnImageCardBottomImageContent{padding-bottom:9px !important;}}@media only screen and (max-width: 480px){.mcnImageGroupBlockInner{padding-top:0 !important;padding-bottom:0 !important;}}@media only screen and (max-width: 480px){.mcnImageGroupBlockOuter{padding-top:9px !important;padding-bottom:9px !important;}}@media only screen and (max-width: 480px){.mcnTextContent,.mcnBoxedTextContentColumn{padding-right:18px !important;padding-left:18px !important;}}@media only screen and (max-width: 480px){.mcnImageCardLeftImageContent,.mcnImageCardRightImageContent{padding-right:18px !important;padding-bottom:0 !important;padding-left:18px !important;}}@media only screen and (max-width: 480px){.mcpreview-image-uploader{display:none !important;width:100% !important;}}@media only screen and (max-width: 480px){h1{/*@editable*/font-size:22px !important;/*@editable*/line-height:125% !important;}}@media only screen and (max-width: 480px){h2{/*@editable*/font-size:20px !important;/*@editable*/line-height:125% !important;}}@media only screen and (max-width: 480px){h3{/*@editable*/font-size:18px !important;/*@editable*/line-height:125% !important;}}@media only screen and (max-width: 480px){h4{/*@editable*/font-size:16px !important;/*@editable*/line-height:150% !important;}}@media only screen and (max-width: 480px){.mcnBoxedTextContentContainer .mcnTextContent,.mcnBoxedTextContentContainer .mcnTextContent p{/*@editable*/font-size:14px !important;/*@editable*/line-height:150% !important;}}@media only screen and (max-width: 480px){#templatePreheader{/*@editable*/display:block !important;}}@media only screen and (max-width: 480px){#templatePreheader .mcnTextContent,#templatePreheader .mcnTextContent p{/*@editable*/font-size:14px !important;/*@editable*/line-height:150% !important;}}@media only screen and (max-width: 480px){#templateHeader .mcnTextContent,#templateHeader .mcnTextContent p{/*@editable*/font-size:16px !important;/*@editable*/line-height:150% !important;}}@media only screen and (max-width: 480px){#templateBody .mcnTextContent,#templateBody .mcnTextContent p{/*@editable*/font-size:16px !important;/*@editable*/line-height:150% !important;}}@media only screen and (max-width: 480px){#templateFooter .mcnTextContent,#templateFooter .mcnTextContent p{/*@editable*/font-size:14px !important;/*@editable*/line-height:150% !important;}}</style></head> <body> <center> <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable"> <tr> <td align="center" valign="top" id="bodyCell"><!--[if gte mso 9]><table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;"><tr><td align="center" valign="top" width="600" style="width:600px;"><![endif]--> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateContainer"> <tr> <td valign="top" id="templatePreheader"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner"> <table align="left" border="0" cellpadding="0" cellspacing="0" width="366" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:9px; padding-left:18px; padding-bottom:9px; padding-right:0;"> Activeer jouw account op HockeyTips.eu </td></tr></tbody></table> <table align="right" border="0" cellpadding="0" cellspacing="0" width="197" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:9px; padding-right:18px; padding-bottom:9px; padding-left:18px;"> <a href="*|ARCHIVE|*" target="_blank">View this email in your browser</a> </td></tr></tbody></table> </td></tr></tbody></table></td></tr><tr> <td valign="top" id="templateHeader"></td></tr><tr> <td valign="top" id="templateBody"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner"> <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:9px; padding-right: 18px; padding-bottom: 9px; padding-left: 18px;"> <h1>Welkom op Blogstart</h1><p>Uw account is aangemaakt, deze moet alleen nog&nbsp;geactiveerd worden.<br><br>Dit doet u door op de volgende link te klikken...<br>&nbsp;</p></td></tr></tbody></table> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnButtonBlock" style="min-width:100%;"> <tbody class="mcnButtonBlockOuter"> <tr> <td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" valign="top" align="center" class="mcnButtonBlockInner"> <table border="0" cellpadding="0" cellspacing="0" class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 3px;background-color: #006400;"> <tbody> <tr> <td align="center" valign="middle" class="mcnButtonContent" style="font-family: Arial; font-size: 16px; padding: 15px;"> <a class="mcnButton " title="Activeer mijn account" href="'+activationUrl+'" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Activeer mijn account</a> </td></tr></tbody> </table> </td></tr></tbody></table></td></tr><tr> <td valign="top" id="templateFooter"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowBlock" style="min-width:100%;"> <tbody class="mcnFollowBlockOuter"> <tr> <td align="center" valign="top" style="padding:9px" class="mcnFollowBlockInner"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentContainer" style="min-width:100%;"> <tbody><tr> <td align="center" style="padding-left:9px;padding-right:9px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnFollowContent"> <tbody><tr> <td align="center" valign="top" style="padding-top:9px; padding-right:9px; padding-left:9px;"> <table align="center" border="0" cellpadding="0" cellspacing="0"> <tbody><tr> <td align="center" valign="top"><!--[if mso]> <table align="center" border="0" cellspacing="0" cellpadding="0"> <tr><![endif]--><!--[if mso]> <td align="center" valign="top"><![endif]--> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline;"> <tbody><tr> <td valign="top" style="padding-right:10px; padding-bottom:9px;" class="mcnFollowContentItemContainer"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentItem"> <tbody><tr> <td align="left" valign="middle" style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" width=""> <tbody><tr> <td align="center" valign="middle" width="24" class="mcnFollowIconContent"> <a href="http://www.twitter.com/" target="_blank"><img src="http://cdn-images.mailchimp.com/icons/social-block-v2/color-twitter-48.png" style="display:block;" height="24" width="24" class=""></a> </td></tr></tbody></table> </td></tr></tbody></table> </td></tr></tbody></table><!--[if mso]> </td><![endif]--><!--[if mso]> <td align="center" valign="top"><![endif]--> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline;"> <tbody><tr> <td valign="top" style="padding-right:10px; padding-bottom:9px;" class="mcnFollowContentItemContainer"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentItem"> <tbody><tr> <td align="left" valign="middle" style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" width=""> <tbody><tr> <td align="center" valign="middle" width="24" class="mcnFollowIconContent"> <a href="http://www.facebook.com" target="_blank"><img src="http://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-48.png" style="display:block;" height="24" width="24" class=""></a> </td></tr></tbody></table> </td></tr></tbody></table> </td></tr></tbody></table><!--[if mso]> </td><![endif]--><!--[if mso]> <td align="center" valign="top"><![endif]--> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline;"> <tbody><tr> <td valign="top" style="padding-right:0; padding-bottom:9px;" class="mcnFollowContentItemContainer"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentItem"> <tbody><tr> <td align="left" valign="middle" style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" width=""> <tbody><tr> <td align="center" valign="middle" width="24" class="mcnFollowIconContent"> <a href="http://www.hockeytips.eu" target="_blank"><img src="http://cdn-images.mailchimp.com/icons/social-block-v2/color-link-48.png" style="display:block;" height="24" width="24" class=""></a> </td></tr></tbody></table> </td></tr></tbody></table> </td></tr></tbody></table><!--[if mso]> </td><![endif]--><!--[if mso]> </tr></table><![endif]--> </td></tr></tbody></table> </td></tr></tbody></table> </td></tr></tbody></table> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnDividerBlock" style="min-width:100%;"> <tbody class="mcnDividerBlockOuter"> <tr> <td class="mcnDividerBlockInner" style="min-width: 100%; padding: 10px 18px 25px;"> <table class="mcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;border-top-width: 2px;border-top-style: solid;border-top-color: #EEEEEE;"> <tbody><tr> <td> <span></span> </td></tr></tbody></table><!-- <td class="mcnDividerBlockInner" style="padding: 18px;"> <hr class="mcnDividerContent" style="border-bottom-color:none; border-left-color:none; border-right-color:none; border-bottom-width:0; border-left-width:0; border-right-width:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0;"/>--> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner"> <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:9px; padding-right: 18px; padding-bottom: 9px; padding-left: 18px;"> <em>Copyright © 2016 Blogstart, All rights reserved.</em> </td></tr></tbody></table> </td></tr></tbody></table></td></tr></table><!--[if gte mso 9]></td></tr></table><![endif]--> </td></tr></table> </center> </body></html>'
    };
    
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