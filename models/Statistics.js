const mongoose    = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');

var statisticsSchema = mongoose.Schema({
    
    visitors: Number,
    members: [User],
    articles: [Article],
    views: Number,
    likes: Number,
    comments: Number

},
{
    timestamps: true
});

statisticsSchema.statics = require('../modules/mongoose-statics');

module.exports = mongoose.model('Statistics', statisticsSchema);