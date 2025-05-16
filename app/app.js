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
const checkrole = require('./rolechecker');
const events = require('./events');
const admin = require('./admin');
const publicRouter = require('./public'); 

app.use('/api/v1/auth/login', authentication);
app.use('/api/v1/stream/view', express.static(process.env.STREAM_OUTPUT_DIR || './streams'));

app.use('/api/v1/public', publicRouter);

app.use('/api/v1/auth/changepass', tokenChecker, changepass)
app.use('/api/v1/events', [tokenChecker, checkrole(['dipendentecomunale', 'sorvegliante'])], events);
app.use('/api/v1/admin', [tokenChecker, checkrole('amministratore')], admin);
app.use('/api/v1/stream', [tokenChecker, checkrole(['dipendentecomunale', 'sorvegliante'])], streamRouter);

app.use('*splat', express.static(process.env.FRONTEND_DIR));

module.exports = app;