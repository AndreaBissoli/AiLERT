const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const User = require('./models/user');

router.post('', async function(req, res) {

    email = req.body.email;
    password = req.body.password;

	var user = {
    };

    // find the user in the local db
    user = await User.findOne({ email: email });
    
    
    // local user not found
    if (!user) {
        // wrong authentication
        return res.status(401).json({
            error: 'Invalid email',
            errorCode: 'INVALID_EMAIL'
        });
    }

    // check if password matches
    const match = await bcrypt.compare(password, user.hash);
    if (!match) {
        // password does not match
        return res.status(401).json({
            error: 'Invalid password',
            errorCode: 'INVALID_PASSWORD'
        });
    }
	
	// if user is found or created create a token
	var payload = {
		email: user.email,
		id: user._id
	}
	var options = {
		expiresIn: 86400 // expires in 24 hours
	}
	var token = await jwt.sign(payload, process.env.JWT_SECRET, options);

	res.json({
		success: true,
		token: token,
	});

});



module.exports = router;