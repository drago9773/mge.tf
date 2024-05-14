const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const SteamAuth = require("node-steam-openid");
const session = require('express-session');



const app = express();
app.use(express.json());
// Configuring body parser middleware

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
	secret: 'your-secret-key', // Replace with a secure secret key
	resave: false,
	saveUninitialized: true
}));

app.get('/', (req, res) => {
	res.render('index', { req: req });
});

const API_KEY = '2C7E4CDF46C4D4FB5875A8E6E040BFC0';

const steam = new SteamAuth({
	realm: 'http://localhost:3005/',
	returnUrl: 'http://localhost:3005/verify',
	apiKey: API_KEY,
});

app.get('/init-openid', async (req, res) => {
	const redirectUrl = await steam.getRedirectUrl();
	return res.redirect(redirectUrl);
});

app.get('/verify', async (req, res) => {
	try {
		const user = await steam.authenticate(req);
		req.session.user = user;
	} catch {
	}
	return res.redirect('/');
});
app.get('/dashboard', (req, res) => {
	res.render('dashboard', { session: req.session });
});

app.get('/logout', (req, res) => {
	res.session = null;
	return res.redirect('/');
});
const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
	console.log(`Service endpoint = http://localhost:${PORT}`);
});
