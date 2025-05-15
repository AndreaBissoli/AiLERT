const express = require('express');
const app = express();
const cors = require('cors')


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())


app.use('/', express.static(process.env.FRONTEND_DIR))

const authentication = require('./authentication');
const changepass = require('./changepass');
const streamRouter = require('./streamrouter');
const tokenChecker = require('./tokenchecker');

const events = require('./events');


app.use('/api/v1/auth/login', authentication);
app.use('/api/v1/stream/view', express.static(process.env.STREAM_OUTPUT_DIR || './streams'));


app.use(tokenChecker);
// this middleware is used to check the token for all the routes below
app.use('/api/v1/auth/changepass', changepass)

app.use('/api/v1/events', events);

app.use('/api/v1/stream', streamRouter);

module.exports = app;