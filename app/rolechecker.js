const checkRole = (requiredRoles) => {
  return (req, res, next) => {

    // Convert required roles to array if it's a single string
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has any of the required roles
    const hasRequiredRole = roles.some(role => req.loggedUser.role === role);
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Unauthorized role', errorCode: 'UNAUTHORIZED_ROLE' });
    }
    next();
  };
};

module.exports = checkRole