import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: load user from localStorage, then verify token is still valid.
  // This catches the case where the in-memory MongoDB restarted and the JWT
  // references a user that no longer exists.
  useEffect(() => {
    const validateSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        // Optimistically set user so the UI loads immediately
        setUser(parsed);

        // Validate token with server in background
        await api.get('/auth/me');
        // Token is valid — keep user state as-is
      } catch (err) {
        // 401 = token invalid or user gone (e.g. in-memory DB restart)
        if (err?.response?.status === 401) {
          console.warn('Session expired or invalid — clearing local auth state.');
          localStorage.removeItem('user');
          setUser(null);
        }
        // Other errors (network down, etc.) — keep user state to allow offline access
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response.data;
  };

  const login = async (userData) => {
    const response = await api.post('/auth/login', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
