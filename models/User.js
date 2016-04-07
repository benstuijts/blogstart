const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
var userSchema  = mongoose.Schema({
 
    local: {
        username: String,
        password: String,    
    },
    
    facebook: {
		id: String,
		token: String,
		email: String,
		name: String
	},
	
	google: {
		id: String,
		token: String,
		email: String,
		name: String
	},
    
    meta: {
        firstname: { type: String, default: ""},
        lastname: { type: String, default: ""},
        avatar: { type: String, default: "default"},
        age: Number,
        gender: Number,
        website: String,
        tags: Array,
    },
    
    articles: {
        favorite: Array,
        liked: Array,
    },
    
},
{
    timestamps: true
});

userSchema.statics = require('../modules/mongoose-statics');

userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
};

userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.getFullName = function() {
    return this.meta.firstname + " " + this.meta.lastname;
};

userSchema.methods.getUsernameOrFullName = function() {
    if(this.getFullName!="") {
        return this.getFullName();
    } else {
        return this.local.username;
    }
};

module.exports = mongoose.model('User', userSchema);

/* Utility functions */

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
function randomString(r){for(var n="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",a=0;r>a;a++)n+=t.charAt(Math.floor(Math.random()*t.length));return n};
