// Mongo
const fs = require('fs');
const mongoose = require('mongoose');
const Post = require('../models/Post.js');
const Forum = require('../models/Forum.js');
const User = require('../models/User.js');

const getPostsWithUserName = async (req, posts) => {
	return await Promise.all(
		posts.map(async (post) => {
			const user = await User.findOne({ _id: post.createdBy }).lean();
			const comments = await Promise.all(
				post.comments.map(async (comment) => {
					const commenter = await User.findOne({ _id: comment.createdBy });
					const commentData = await {
						...comment,
						username: commenter.username,
						profilePicture: commenter.profilePicture,
						numberOfHearts: Number(comment.reactions.length),
					};

					if (req.user) {
						const isLiked = comment.reactions.filter(
							(reaction) => reaction.createdBy == req.user._id,
						).length;

						return await {
							...commentData,
							isOwned: req.user._id == comment.createdBy,
							isLiked: Boolean(isLiked),
							numberOfHearts: Number(comment.reactions.length),
						};
					}

					return await commentData;
				}),
			);

			const postWithComment = {
				...post,
				username: user.username,
				profilePicture: user.profilePicture,
				comments: comments,
				numberOfHearts: Number(post.reactions.length),
			};

			if (req.user) {
				const isLiked = await Post.find({
					$and: [{ _id: postWithComment._id }, { 'reactions.createdBy': req.user._id }],
				});

				return {
					...postWithComment,
					isOwned: req.user._id == post.createdBy,
					isLiked: Boolean(isLiked.length),
				};
			}
			return postWithComment;
		}),
	);
};

const renderForumByForumName = async (req, res) => {
	const { forumName } = req.params;

	try {
		const forumId = await Forum.findOne({ name: forumName });
		const posts = await Post.find({ forumId: forumId._id }).sort({ date: -1 }).lean();

		const postWithUsernames = await getPostsWithUserName(req, posts);

		return res.render('forum', {
			posts: postWithUsernames,
			forumName: forumId.name,
			isLogged: req.user !== undefined,
		});
	} catch (error) {
		console.log(error);
		res.render('500', { error: error });
	}
};

const postByForumName = async (req, res) => {
	const { forumName } = req.params;

	if (req.user === undefined) return res.redirect('/user/login');

	try {
		const forum = await Forum.findOne({ name: forumName });

		const { content } = req.body;
		const query = new Post({
			createdBy: req.user._id,
			forumId: forum._id,
			content: content,
			date: new Date(),
		});

		await query.save();
		return res.redirect(`/f/${forumName}`);
	} catch (error) {
		res.render('500');
	}
};

const searchPosts = async (req, res) => {
	const { search: searchItem } = req.query;

	try {
		const posts = await Post.find({
			$or: [
				{ title: { $regex: new RegExp(`\\b(${searchItem})\\b`), $options: 'i' } },
				{ content: { $regex: new RegExp(`\\b(${searchItem})\\b`), $options: 'i' } },
			],
		})
			.sort({ date: -1 })
			.lean();

		const postWithUsernames = await getPostsWithUserName(req, posts);

		return res.render('forum', {
			posts: postWithUsernames,
			forumName: 'Search',
			isLogged: req.user !== undefined,
			isSearch: true,
		});
	} catch (error) {
		res.render('500');
	}
};

const insertCommentByPostId = async (req, res) => {
	const { postId } = req.params;

	if (req.user === undefined) return res.redirect('/login');

	const { content } = req.body;
	const comment = {
		_id: mongoose.Types.ObjectId(),
		createdBy: req.user._id,
		content: content,
		date: new Date(),
	};

	try {
		await Post.findOneAndUpdate({ _id: postId }, { $push: { comments: comment } });
	} catch (error) {
		res.render('500');
	}

	return res.redirect('back');
};

const insertReactionInComment = async (req, res) => {
	const { commentId } = req.params;

	const reaction = {
		createdBy: req.user._id,
	};

	try {
		await Post.findOneAndUpdate(
			{ 'comments._id': commentId },
			{
				$push: { 'comments.$.reactions': reaction },
			},
		);

		res.redirect('/');
	} catch (error) {
		res.render('500');
	}
};

const renderPostEditPage = async (req, res) => {
	const { postId } = req.params;

	const post = await Post.findOne({ _id: postId }).lean();
	const { username } = await User.findOne({ _id: post.createdBy });

	const postData = {
		...post,
		username: username,
	};

	res.render('edit', { post: postData });
};

const editPost = async (req, res) => {
	const { postId } = req.params;
	const { title, content } = req.body;

	try {
		await Post.findByIdAndUpdate(
			{ _id: postId },
			{ $set: { title: title, content: content } },
		);

		res.redirect('/');
	} catch (error) {
		res.render('500');
	}
};

const renderCommentEditPage = async (req, res) => {
	const { commentId } = req.params;

	const { comments } = await Post.findOne({ 'comments._id': commentId }).lean();
	const comment = comments.filter((element) => element._id == commentId);
	res.render('edit', { comment: comment[0] });
};

const editComment = async (req, res) => {
	const { commentId } = req.params;
	const { content } = req.body;

	await Post.findOneAndUpdate(
		{ 'comments._id': commentId },
		{ $set: { 'comments.$.content': content } },
	);

	res.redirect('/');
};

const insertPost = async (req, res) => {
	const { forumName } = req.params;

	if (req.user === undefined) return res.redirect('/user/login');

	try {
		const forum = await Forum.findOne({ name: forumName });

		const { title, content } = req.body;

		if (req.file) {
			const image = {
				data: fs.readFileSync(req.file.path).toString('base64'),
				filename: req.file.originalname,
				contentType: req.file.mimetype,
			};

			const query = new Post({
				createdBy: req.user._id,
				forumId: forum._id,
				title: title,
				image: image,
				content: content,
				date: new Date(),
			});

			// Delete file in the uploads folder
			fs.unlink(req.file.path, (error) => {
				if (error) return res.render('/');
			});

			await query.save();
		} else {
			const query = new Post({
				createdBy: req.user._id,
				forumId: forum._id,
				title: title,
				content: content,
				date: new Date(),
			});

			await query.save();
		}

		// return res.redirect(`/f/${forumName}`);
		return res.redirect('back');
	} catch (error) {
		res.render('500', { error: error });
	}
};

const insertReactionInPost = async (req, res) => {
	const { postId } = req.params;

	const reaction = {
		createdBy: req.user._id,
	};

	try {
		await Post.findOneAndUpdate({ _id: postId }, { $push: { reactions: reaction } });

		res.redirect('back');
	} catch (error) {
		res.render('500');
	}
};

const deleteReactionInPost = async (req, res) => {
	const { postId } = req.params;

	try {
		await Post.findOneAndUpdate(
			{ _id: postId },
			{ $pull: { reactions: { createdBy: req.user._id } } },
		);

		res.redirect('back');
	} catch (error) {
		res.render('500');
	}
};

const deleteReactionInComment = async (req, res) => {
	const { commentId } = req.params;

	try {
		await Post.findOneAndUpdate(
			{ 'comments._id': commentId },
			{ $pull: { 'comments.$.reactions': { createdBy: req.user._id } } },
		);

		res.redirect('back');
	} catch (error) {
		res.render('500');
	}
};

const deletePost = async (req, res) => {
	const { postId } = req.params;

	try {
		await Post.deleteOne({ _id: postId });

		res.redirect('back');
	} catch (error) {
		res.render('500');
	}
};

const deleteComment = async (req, res) => {
	const { commentId } = req.params;

	try {
		await Post.findOneAndUpdate(
			{ 'comments._id': commentId },
			{ $pull: { comments: { _id: commentId } } },
		);

		res.redirect('back');
	} catch (error) {
		res.render('500');
	}
};

module.exports = {
	renderForumByForumName,
	postByForumName,
	searchPosts,
	insertCommentByPostId,
	insertReactionInComment,
	renderPostEditPage,
	editPost,
	renderCommentEditPage,
	editComment,
	insertPost,
	insertReactionInPost,
	deleteReactionInPost,
	deleteReactionInComment,
	deletePost,
	deleteComment,
};
