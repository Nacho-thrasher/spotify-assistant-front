import axios from 'axios';

// URL base para la API (hardcodeada para evitar problemas con variables de entorno)
// En producción, usar la URL de Railway
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://spotify-assistant-production.up.railway.app' 
  : 'http://localhost:8080';

// Configuración base para axios
const API = axios.create({
  baseURL: `${API_URL}/api`,
});

// Interceptor para incluir el token en las peticiones
API.interceptors.request.use(config => {
  const token = localStorage.getItem('spotify_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Servicios de autenticación
export const authService = {
  login: () => {
    // Redireccionar directamente sin pasar redirect_uri (usar el configurado en el backend)
    window.location.href = `${API_URL}/api/auth/login`;
  },
  refreshToken: async (refreshToken) => {
    const response = await API.post('/auth/refresh-token', { refresh_token: refreshToken });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  }
};

// Servicios del asistente
export const assistantService = {
  sendMessage: async (message, userId) => {
    const response = await API.post('/assistant/message', { message, userId });
    return response.data;
  },
  getStatus: async () => {
    const response = await API.get('/assistant/status');
    return response.data;
  }
};

// Servicios de control de Spotify
export const spotifyService = {
  getProfile: async () => {
    const response = await API.get('/user/profile');
    return response.data;
  },
  getCurrentTrack: async () => {
    const response = await API.get('/user/now-playing');
    return response.data;
  },
  play: async (options = {}) => {
    const response = await API.post('/user/play', options);
    return response.data;
  },
  pause: async () => {
    const response = await API.put('/user/pause');
    return response.data;
  },
  next: async () => {
    const response = await API.post('/user/next');
    return response.data;
  },
  previous: async () => {
    const response = await API.post('/user/previous');
    return response.data;
  },
  // Nuevos métodos para cola de reproducción
  addToQueue: async (uri) => {
    const response = await API.post('/user/queue', { uri });
    return response.data;
  },
  searchAndAddToQueue: async (query) => {
    const response = await API.post('/user/search-and-queue', { query });
    return response.data;
  },
  getQueue: async () => {
    const response = await API.get('/user/queue');
    return response.data;
  },
  clearQueue: async () => {
    const response = await API.delete('/user/queue');
    return response.data;
  },
  
  // Reproducir una canción específica de la cola por su posición
  playQueueItem: async (index) => {
    try {      
      console.log(`🎯 Intentando reproducir elemento #${index} de la cola (plan B)`);
      
      // Enfoque Plan B: Usar endpoints existentes 
      // 1. Primero obtenemos la cola actual
      console.log('Obteniendo cola actual...');
      const queueData = await spotifyService.getQueue();
      console.log('Datos de cola recibidos:', queueData);
      
      // Corregir la verificación para asegurarnos de que accedemos correctamente a la estructura
      if (!queueData || !queueData.nextInQueue || queueData.nextInQueue.length === 0) {
        console.error('Cola vacía o estructura de datos incorrecta:', queueData);
        throw new Error('No hay canciones en la cola para reproducir');
      }
      
      // Para depuración
      console.log(`Cola encontrada con ${queueData.nextInQueue.length} canciones`);
      
      if (index < 0 || index >= queueData.nextInQueue.length) {
        throw new Error(`Índice ${index} fuera de rango. Cola tiene ${queueData.nextInQueue.length} elementos`);
      }
      
      // 2. Obtener la URI de la canción en la posición seleccionada
      const selectedTrack = queueData.nextInQueue[index];
      if (!selectedTrack || !selectedTrack.uri) {
        throw new Error('No se pudo obtener información de la canción seleccionada');
      }
      
      console.log(`🎵 Reproduciendo directamente: ${selectedTrack.name} - ${selectedTrack.artist} (${selectedTrack.uri})`);
      
      // 3. Reproducir directamente la canción usando el endpoint /play
      const response = await API.post('/user/play', {
        uri: selectedTrack.uri,
        type: 'track'
      });
      
      // Esperamos un breve tiempo para que se actualice
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Obtenemos de nuevo el estado para confirmar
      const updatedTrack = await API.get('/user/now-playing');
      
      return { 
        success: true, 
        message: `Reproduciendo ${selectedTrack.name}`,
        track: selectedTrack,
        currentState: updatedTrack.data
      };
    } catch (error) {
      console.error('Error al reproducir elemento de la cola:', error);
      throw error;
    }
  }
};

export default API;
