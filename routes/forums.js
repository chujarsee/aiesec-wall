const express = require('express');
const router = express.Router();

const {
	renderForumByForumName,
	searchPosts,
	postByForumName,
} = require('../controller/forumController.js');

router.get('/:forumName', renderForumByForumName);

router.get('/contain/search', searchPosts);

router.post('/:forumName', postByForumName);

module.exports = router;
