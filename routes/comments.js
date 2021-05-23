const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const {
	insertCommentByPostId,
	insertReactionInComment,
	deleteReactionInComment,
} = require('../controller/forumController.js');

router.post('/:postId', upload.none(), insertCommentByPostId);

router.post('/insert/reaction/:commentId', insertReactionInComment);

router.post('/delete/reaction/:commentId', deleteReactionInComment);

module.exports = router;
