const mongoose    = require('mongoose');

var imageSchema = mongoose.Schema({
    
    filename: String,
    substriction: String,
    alt: String,
    title: String,
    extension: String

},
{
    timestamps: true
});

imageSchema.statics = require('../modules/mongoose-statics');


imageSchema.methods.test = function() {
    return('resting Image Method');
};

module.exports = mongoose.model('Image', imageSchema);

/* Utility functions */

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}