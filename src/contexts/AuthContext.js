import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = () => {
      // Obtener tokens del localStorage
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');

      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setIsAuthenticated(true);
        
        // Inicializar conexión Socket.io
        initializeSocket(storedAccessToken);
      }
      
      setLoading(false);
    };

    checkAuth();
    
    // Verificar tokens en la URL (después de redirección OAuth)
    const queryParams = new URLSearchParams(window.location.search);
    const urlAccessToken = queryParams.get('access_token');
    const urlRefreshToken = queryParams.get('refresh_token');
    
    if (urlAccessToken) {
      // Guardar tokens en localStorage
      localStorage.setItem('spotify_access_token', urlAccessToken);
      if (urlRefreshToken) {
        localStorage.setItem('spotify_refresh_token', urlRefreshToken);
      }
      
      // Actualizar estado
      setAccessToken(urlAccessToken);
      setRefreshToken(urlRefreshToken);
      setIsAuthenticated(true);
      
      // Inicializar conexión Socket.io
      initializeSocket(urlAccessToken);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Iniciar sesión con Spotify
  const login = () => {
    authService.login();
  };

  // Cerrar sesión
  const logout = () => {
    authService.logout();
    disconnectSocket();
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Refrescar token cuando expire
  const refreshAccessToken = async () => {
    if (!refreshToken) return false;
    
    try {
      const data = await authService.refreshToken(refreshToken);
      setAccessToken(data.access_token);
      localStorage.setItem('spotify_access_token', data.access_token);
      
      // Re-inicializar Socket.io con el nuevo token
      initializeSocket(data.access_token);
      
      return true;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      logout();
      return false;
    }
  };

  // Valor del contexto
  const value = {
    isAuthenticated,
    accessToken,
    refreshToken,
    user,
    loading,
    login,
    logout,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
