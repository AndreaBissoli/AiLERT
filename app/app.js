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

app.use('/api/v1/auth/login', authentication);

module.exports = app;