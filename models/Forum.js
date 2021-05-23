const mongoose = require('mongoose');

const { Schema } = mongoose;

const forumSchema = new Schema({
	name: String,
});

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;
