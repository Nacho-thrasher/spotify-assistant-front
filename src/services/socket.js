import { io } from 'socket.io-client';

// URL del socket (hardcodeada para evitar problemas con variables de entorno)
// En producción, usar la URL de Railway
const isProduction = window.location.hostname !== 'localhost';
const SOCKET_URL = isProduction 
  ? 'https://spotify-assistant-production.up.railway.app' 
  : 'http://localhost:8080';

let socket = null;

// Crear una instancia de Socket.io
export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  // Crear nueva conexión con el token de autenticación
  socket = io(SOCKET_URL, {
    auth: {
      token
    }
  });

  // Manejar eventos de conexión
  socket.on('connect', () => {
    console.log('Conectado al servidor Socket.io');
  });

  socket.on('connect_error', (error) => {
    console.error('Error de conexión Socket.io:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Desconectado del servidor Socket.io:', reason);
  });

  return socket;
};

// Obtener la instancia actual de Socket.io
export const getSocket = () => {
  return socket;
};

// Suscribirse a eventos del asistente
export const subscribeToAssistant = (callback) => {
  if (!socket) return false;
  
  socket.on('assistant_response', (data) => {
    callback(data);
  });
  
  // Suscribirse a respuestas de acciones corregidas
  socket.on('action_result', (data) => {
    if (data.success) {
      console.log('Acción corregida ejecutada:', data);
      // Notificar al usuario que la corrección fue aplicada
      callback({
        message: data.message,
        action: data.action,
        parameters: data.parameters || {},
        timestamp: new Date().toISOString(),
        isCorrectionResult: true
      });
    }
  });
  
  return true;
};

// Suscribirse a actualizaciones de reproducción
export const subscribeToPlayback = (callback) => {
  if (!socket) return false;
  
  socket.on('playback_update', (data) => {
    callback(data);
  });
  
  return true;
};

// Desconectar Socket.io
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Enviar feedback positivo
export const sendPositiveFeedback = (message, action, parameters) => {
  if (!socket) return false;
  
  socket.emit('user_feedback', {
    originalMessage: message,
    originalAction: action,
    feedbackType: 'positive',
    timestamp: Date.now()
  });
  
  return true;
};

// Enviar corrección
export const sendCorrection = (originalMessage, originalAction, correctedAction, correctedParameters) => {
  if (!socket) return false;
  
  socket.emit('user_correction', {
    originalMessage,
    originalAction,
    correctedAction,
    correctedParameters,
    timestamp: Date.now()
  });
  
  return true;
};

export default {
  initializeSocket,
  getSocket,
  subscribeToAssistant,
  subscribeToPlayback,
  disconnectSocket,
  sendPositiveFeedback,
  sendCorrection
};
