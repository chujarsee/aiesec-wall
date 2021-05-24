const fs = require('fs');

const User = require('../models/User.js');

const renderSignupPage = async (req, res) => {
	res.render('signup');
};

const signupUser = async (req, res) => {
	const { email, password, username } = req.body;

	const user = new User({ username: username, email: email });

	User.register(user, password, (error) => {
		if (error) res.render('500');
		else res.redirect('/');
	});
};

const renderLoginPage = async (req, res) => {
	if (req.user !== undefined) return res.redirect('/');

	if (req.session.messages) {
		return res.render('login', {
			isWrongCredentials: req.session.messages['0'] == 'incorrect credentials',
		});
	}

	res.render('login');
};

const logoutUser = async (req, res) => {
	req.logout();
	res.redirect('back');
};

const renderSettings = async (req, res) => {
	if (req.user === undefined) return res.redirect('/login');

	const user = await User.findOne({ _id: req.user._id }).lean();

	res.render('settings', { user: user });
};

const changeUserProfilePicture = async (req, res) => {
	if (req.user === undefined) return res.redirect('/login');

	const image = {
		data: fs.readFileSync(req.file.path).toString('base64'),
		filename: req.file.originalname,
		contentType: req.file.mimetype,
	};

	try {
		await User.findOneAndUpdate(
			{ _id: req.user._id },
			{ $set: { profilePicture: image } },
		);

		res.redirect('/');
	} catch (error) {
		res.render('500');
	}
};

const changeUserPassword = async (req, res) => {
	if (req.user === undefined) return res.redirect('/login');

	const { oldPassword, newPassword, confirmPassword } = req.body;

	const user = await User.findOne({ _id: req.user._id }).lean();

	if (newPassword !== confirmPassword)
		return res.render('settings', { isNewPasswordNotSame: true, user: user });

	req.user.changePassword(oldPassword, newPassword, (error) => {
		if (error) return res.render('settings', { isOldPasswordWrong: true, user: user });

		res.redirect('/');
	});
};

module.exports = {
	renderLoginPage,
	logoutUser,
	renderSettings,
	changeUserPassword,
	changeUserProfilePicture,
	renderSignupPage,
	signupUser,
};
