import { jwtDecode } from 'jwt-decode'; // Using jwt-decode which is browser-compatible

export function decodeJWT(token) {
    try {
        const decoded = jwtDecode(token);
        return decoded;
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

// Get the user's role from the JWT token
export function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decodedToken = decodeJWT(token);
  return decodedToken?.role || null;
}

// Check if the user has a specific role
export function hasRole(role) {
  const userRole = getUserRole();
  return userRole === role;
}

// Check if the user is an administrator
export function isAdmin() {
  return hasRole('amministratore');
}

// Check if the user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Optional: Check if token is expired
  try {
    const decodedToken = decodeJWT(token);
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      // Token is expired, remove it
      localStorage.removeItem('token');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Get authentication token
export function getToken() {
  return localStorage.getItem('token');
}
