const jwt = require('jsonwebtoken');

const tokenChecker = function(req, res, next) {
    // Initialize token variable
    let token = null;
    
    // Extract token from different sources
    if (req.headers && req.headers.authorization) {
        // Check for Bearer token in authorization header
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            token = authHeader; // In case the 'Bearer ' prefix is not used
        }
    } else if (req.headers && req.headers['x-access-token']) {
        // Check for token in x-access-token header
        token = req.headers['x-access-token'];
    } else if (req.query && req.query.token) {
        // Check for token in URL query parameter
        token = req.query.token;
    } else if (req.body && req.body.token) {
        // Check for token in request body
        token = req.body.token;
    }
    
    // If no token found, return error
    if (!token) {
        return res.status(401).json({error: 'Authentication token required', errorCode: 'TOKEN_REQUIRED'});
    }
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        if (err) {
            return res.status(403).json({error: 'Invalid or expired token', errorCode: 'INVALID_TOKEN'});
        } else {
            // Token is valid, save user info to request for use in other routes
            req.loggedUser = decoded;
            next();
        }
    });
};

module.exports = tokenChecker;