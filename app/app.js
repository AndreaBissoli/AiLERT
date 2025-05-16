const express = require('express');
const app = express();
const cors = require('cors')


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())


app.use('/', express.static(process.env.FRONTEND_DIR))

const authentication = require('./authentication');
const changepass = require('./changepass');
const tokenChecker = require('./tokenchecker');
const checkrole = require('./rolechecker');
const events = require('./events');
const admin = require('./admin');


app.use('/api/v1/auth/login', authentication);


app.use(tokenChecker);
// this middleware is used to check the token for all the routes below
app.use('/api/v1/auth/changepass', changepass)

app.use('/api/v1/events', checkrole(['dipendentecomunale', 'sorvegliante']), events);

app.use('/api/v1/admin', checkrole('amministratore'), admin);

module.exports = app;