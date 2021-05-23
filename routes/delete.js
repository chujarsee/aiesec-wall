const express = require('express');
const router = express.Router();

const { deletePost, deleteComment } = require('../controller/forumController.js');

router.post('/post/:postId', deletePost);

router.post('/comment/:commentId', deleteComment);

module.exports = router;
