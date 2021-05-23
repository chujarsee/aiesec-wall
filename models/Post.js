const mongoose = require('mongoose');

const { Schema } = mongoose;

const requiredString = { type: String, required: true };

const postSchema = new Schema({
	createdBy: requiredString,
	forumId: requiredString,
	title: requiredString,
	content: requiredString,
	image: { data: Buffer, filename: String, contentType: String },
	reactions: [{ createdBy: String }],

	comments: [
		{
			_id: String,
			createdBy: String,
			content: String,
			date: Date,
			reactions: [{ createdBy: String }],
		},
	],
	date: { type: Date, required: true },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
