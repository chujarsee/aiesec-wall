const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const {
	renderPostEditPage,
	editPost,
	renderCommentEditPage,
	editComment,
} = require('../controller/forumController.js');

router.get('/post/:postId', renderPostEditPage);

router.post('/post/:postId', upload.none(), editPost);

router.get('/comment/:commentId', renderCommentEditPage);

router.post('/comment/:commentId', upload.none(), editComment);

module.exports = router;
