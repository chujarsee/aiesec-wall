// Dependencies
const express = require('express');
const handlebars = require('express-handlebars');
const session = require('express-session');
const mongoose = require('mongoose');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

require('dotenv').config();
const { PORT, MONGO_URI } = process.env;

const forum = require('./routes/forums.js');
const user = require('./routes/user.js');
const posts = require('./routes/posts.js');
const comments = require('./routes/comments.js');
const edit = require('./routes/edit.js');
const deleteRoute = require('./routes/delete.js');

// Mongoose - DB
mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('CONNECTED!');
});

// Express
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: process.env.SECRET, saveUninitialized: false, resave: true }));

// Handlebars
app.set('view engine', 'hbs');
app.engine(
	'hbs',
	handlebars({
		layoutsDir: `${__dirname}/views/layouts`,
		partialsDir: `${__dirname}/views/partials`,
		extname: 'hbs',
		defaultLayout: 'index',
	}),
);

// Passport
const User = require('./models/User.js');
passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.get('/', (req, res) => {
	res.render('home', { isLogged: req.user !== undefined });
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.use('/f', forum);
app.use('/user', user);
app.use('/posts', posts);
app.use('/comments', comments);
app.use('/edit', edit);
app.use('/delete', deleteRoute);

app.get('*', (req, res) => {
	res.render('404');
});

app.listen(PORT, () => {
	console.log(`Listening in port http://localhost:${PORT}`);
});
