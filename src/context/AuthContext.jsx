import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { ROLES } from '../utils/roleConfig';

const ENABLED_ROLES = [ROLES.SMD, ROLES.CEO, ROLES.BDO];

const ROLE_MAPPINGS = {
  admin: ROLES.SMD,
  vdo: ROLES.VDO,
  bdo: ROLES.BDO,
  ceo: ROLES.CEO,
  worker: ROLES.SUPERVISOR
};

const clearStoredAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('rememberMe');
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and user data
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedToken && storedUser && storedRole) {
      if (ENABLED_ROLES.includes(storedRole)) {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      } else {
        clearStoredAuth();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      // Call login API
      const loginResponse = await authAPI.login({ username, password });
      const { access_token } = loginResponse.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Call /auth/me to get user details
      const meResponse = await authAPI.getMe();
      const userData = meResponse.data;
      
      // Map backend roles to internal roles
      const backendRole = (userData.role || '').toLowerCase();
      const mappedRole = ROLE_MAPPINGS[backendRole];

      if (!mappedRole) {
        clearStoredAuth();
        throw new Error('Access denied. Your role is not recognized.');
      }

      if (!ENABLED_ROLES.includes(mappedRole)) {
        clearStoredAuth();
        throw new Error('Access denied. Dashboards for your role are not available yet.');
      }
      
      // Store user data
      setUser(userData);
      setRole(mappedRole);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', mappedRole);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      return { success: true, role: mappedRole };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.detail || error.response.data?.message || 'Login failed';
        clearStoredAuth();
        throw new Error(message);
      } else if (error.request) {
        // Network error
        clearStoredAuth();
        throw new Error('Network error. Please check your connection.');
      } else {
        // Other error
        clearStoredAuth();
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    clearStoredAuth();
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

