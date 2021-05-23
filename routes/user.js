const express = require('express');
const passport = require('passport');

const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const router = express.Router();

const {
	renderLoginPage,
	logoutUser,
	renderSettings,
	changeUserProfilePicture,
	changeUserPassword,
	renderSignupPage,
	signupUser,
} = require('../controller/userController.js');

router.get('/login', renderLoginPage);

// Auth based on the Request Body
router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/user/login',
		failureMessage: 'incorrect credentials',
	}),
);

router.get('/logout', logoutUser);

router.get('/settings', renderSettings);

router.post('/profilePicture', upload.single('image'), changeUserProfilePicture);

router.post('/changePassword', upload.none(), changeUserPassword);

router.get('/signup', renderSignupPage);

router.post('/signup', signupUser);

module.exports = router;
