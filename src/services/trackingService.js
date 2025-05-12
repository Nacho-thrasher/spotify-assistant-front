/**
 * Servicio para el seguimiento automático de reproducción
 * Detecta cambios en la canción actual y los registra en el historial
 */
import api from './api';
import { spotifyService } from './api';

// Último track registrado (para evitar registros duplicados)
let lastTrackedTrack = null;

/**
 * Registra un evento de reproducción en el historial
 * @param {Object} trackInfo - Información de la canción
 * @returns {Promise} - Promesa con el resultado de la operación
 */
const logPlaybackToHistory = async (trackInfo) => {
  try {
    // Si no hay información de track o es el mismo que el último registrado, no hacer nada
    if (!trackInfo || 
        (lastTrackedTrack && lastTrackedTrack.uri === trackInfo.uri)) {
      return false;
    }
    
    // Registrar el nuevo track
    console.log(`📝 Registrando reproducción automática: ${trackInfo.name} - ${trackInfo.artists[0].name}`);
    
    // Actualizar el último track registrado
    lastTrackedTrack = {
      uri: trackInfo.uri,
      name: trackInfo.name,
      artist: trackInfo.artists[0].name
    };
    
    // Registrar en el historial a través del backend
    await api.post('/user/log-playback', {
      trackId: trackInfo.id,
      trackName: trackInfo.name,
      artistId: trackInfo.artists[0].id,
      artistName: trackInfo.artists[0].name,
      uri: trackInfo.uri,
      action: 'auto_play' // Acción especial para reproducciones automáticas
    });
    
    return true;
  } catch (error) {
    console.error('Error al registrar reproducción en historial:', error);
    return false;
  }
};

/**
 * Verifica la canción actual y registra cambios
 * @returns {Promise} - Promesa con información del track actual
 */
const checkCurrentTrack = async () => {
  try {
    // Obtener información de la canción actual
    const response = await spotifyService.getCurrentTrack();
    
    // Si hay una canción reproduciéndose
    if (response && response.is_playing && response.item) {
      // Registrar la reproducción
      await logPlaybackToHistory(response.item);
      return response.item;
    }
    
    return null;
  } catch (error) {
    console.error('Error al verificar canción actual:', error);
    return null;
  }
};

/**
 * Inicia el seguimiento automático de reproducción
 * @param {number} interval - Intervalo en milisegundos (por defecto: 30 segundos)
 * @returns {number} - ID del intervalo para poder detenerlo
 */
const startAutoTracking = (interval = 30000) => {
  console.log(`🔄 Iniciando seguimiento automático de reproducción (cada ${interval/1000} segundos)`);
  
  // Ejecutar inmediatamente la primera vez
  checkCurrentTrack();
  
  // Configurar el intervalo para ejecuciones futuras
  const intervalId = setInterval(checkCurrentTrack, interval);
  return intervalId;
};

/**
 * Detiene el seguimiento automático
 * @param {number} intervalId - ID del intervalo a detener
 */
const stopAutoTracking = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('⏹️ Seguimiento de reproducción detenido');
  }
};

export default {
  startAutoTracking,
  stopAutoTracking,
  checkCurrentTrack
};
