import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  let logoutTimer = null;

  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const setLogoutTimer = (token) => {
    const payload = decodeToken(token);
    if (payload && payload.exp) {
      const expiryTime = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = expiryTime - now;
      if (timeLeft > 0) {
        logoutTimer = setTimeout(() => {
          logout();
        }, timeLeft);
      } else {
        logout();
      }
    }
  };

  useEffect(() => {
    // Load user from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email }); // Debug log
      
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('Login response:', response); // Debug log
      
      const { data } = response.data;

      if (!data || !data.token) {
        throw new Error('Invalid response format from server');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      setToken(data.token);
      setUser(data);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error); // Debug log
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const selectOrganisation = async (orgId) => {
    try {
      const response = await apiClient.put(`/auth/select-organisation/${orgId}`);
      const { data } = response.data;

      if (!data || !data.token) {
        throw new Error('Invalid response format from server');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      setToken(data.token);
      setUser(data);
      
      return { success: true };
    } catch (error) {
      console.error('Select organisation error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to switch organisation' 
      };
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    selectOrganisation,
    isAuthenticated: !!token,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block">
            <svg className="w-16 h-16 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};