const express = require('express');
const app = express();
const cors = require('cors')


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())


app.get('/', (req, res) => {
  res.send('Hello World!');
});

const authentication = require('./authentication');
const changepass = require('./changepass');
const tokenChecker = require('./tokenchecker');

app.use('/api/v1/auth/login', authentication);


app.use(tokenChecker);
// this middleware is used to check the token for all the routes below
app.use('/api/v1/auth/changepass', changepass)

module.exports = app;