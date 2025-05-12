const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('', async function(req, res) {

	var user = {
        email: req.body.email,
        password: req.body.password,
        id: 1234
    };

    // find the user in the local db
    
    // local user not found

    // check if password matches
	
	// if user is found or created create a token
	var payload = {
		email: user.email,
		id: user.id
		// other data encrypted in the token	
	}
	var options = {
		expiresIn: 86400 // expires in 24 hours
	}
	var token = jwt.sign(payload, process.env.JWT_SECRET, options);

    console.log(user);
    console.log(token);
	res.json({
		success: true,
		token: token,
	});

});



module.exports = router;