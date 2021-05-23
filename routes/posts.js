const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const {
	insertPost,
	insertReactionInPost,
	deleteReactionInPost,
} = require('../controller/forumController.js');

router.post('/:forumName', upload.single('image'), insertPost);

router.post('/insert/reaction/:postId', insertReactionInPost);

router.post('/delete/reaction/:postId', deleteReactionInPost);

module.exports = router;
