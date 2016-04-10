const mongoose    = require('mongoose');

var Comment = mongoose.Schema({
    author_id: mongoose.Schema.Types.ObjectId,
    body: String,
    status: { type: Number, default: 0 },
    like : Array
    
}, {timestamps: true});

var articleSchema = mongoose.Schema({
    
    title: String,
    subtitle: String,
    slug: String,
    tags: String,
    author: String,
    image: String,
    body: String,
    backgroundColor: { type: String, default: "BurlyWood"},
    views: {type: Number, default: 0},
    published: {type: Boolean, default: false},
    
    comments  : [Comment],
    
    settings: mongoose.Schema.Types.Mixed,
    _statics: mongoose.Schema.Types.Mixed
    
},
{
    timestamps: true
});

articleSchema.statics = require('../modules/mongoose-statics');

articleSchema.statics.getDescription = function(body) {
    var response = body.replace(/<(?:.|\n)*?>/gm, '');
    return response.substr(0,150);  
};

articleSchema.statics.getSnippit = function(body, words) {
    var response = body.replace(/<(?:.|\n)*?>/gm, '');
    return trimByWord(response, words); 
};

articleSchema.statics.publish = function(_id, cb) {
    this.findOne({_id: _id}, {}, function(error, article){
        if(error) { 
            return cb(error); 
        } else {
            article.published = true;
            article.save();
            cb(false);
        }
    });
};

articleSchema.statics.mute = function(_id, cb) {
    this.findOne({_id: _id}, {}, function(error, article){
        if(error) { 
            return cb(error); 
        } else {
            article.published = false;
            article.save();
            cb(false);
        }
    });
};

articleSchema.statics.delete = function(_id, cb) {
    this.remove({_id: _id}, function(error){
        if(error) {
            cb(true);
        } else {
            cb(false);
        }      
    });
};

module.exports = mongoose.model('Article', articleSchema);

/* Utility functions */

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function trimByWord(sentence, words) {
    var result = sentence;
    var resultArray = result.split(" ");
    if(resultArray.length > words){
        resultArray = resultArray.slice(0, words);
        result = resultArray.join(" ") + "...";
    }
    return result;
}

