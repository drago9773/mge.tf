const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");


const app = express();
app.use(express.json());
// Configuring body parser middleware

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.render('index');
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
	console.log(`Service endpoint = http://localhost:${PORT}`);
});
