/**
 * Servicio para interactuar con los endpoints de historial
 * Permite obtener el historial del usuario, comandos más usados y artistas favoritos
 */
import api from './api';
import { spotifyService } from './api';

// Cache para el ID de usuario
let cachedUserId = null;

/**
 * Obtiene el ID de usuario de Spotify
 * Si ya se ha obtenido previamente, devuelve el valor cacheado
 */
async function getUserId() {
  // OVERRIDE TEMPORAL: Siempre devolver "nacho" para propósitos de prueba
  // Una vez que la app esté en producción, volver a usar el código original
  cachedUserId = 'nacho';
  return 'nacho';
  
  /* CÓDIGO ORIGINAL COMENTADO
  // Si ya tenemos el ID en cache, lo usamos
  if (cachedUserId) return cachedUserId;
  
  try {
    // Obtener el perfil del usuario para extraer su ID
    const profileData = await spotifyService.getProfile();
    if (profileData && profileData.id) {
      cachedUserId = profileData.id;
      return profileData.id;
    }
    throw new Error('No se pudo obtener el ID de usuario');
  } catch (error) {
    console.error('Error al obtener ID de usuario:', error);
    throw error;
  }
  */
}

/**
 * Obtiene el historial reciente del usuario
 * @param {number} limit - Número máximo de elementos a obtener
 * @param {string} type - Filtrar por tipo de evento (opcional)
 * @returns {Promise<Array>} - Historial de eventos del usuario
 */
export const getUserHistory = async (limit = 20, type = null) => {
  try {
    const userId = await getUserId();
    let url = `/history/recent?limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    
    const response = await api.get(url, {
      headers: {
        'user-id': userId
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener historial del usuario:', error);
    throw error;
  }
};

/**
 * Obtiene los comandos más utilizados por el usuario
 * @param {number} limit - Número máximo de comandos a obtener
 * @returns {Promise<Array>} - Lista de comandos y su frecuencia de uso
 */
export const getMostUsedCommands = async (limit = 10) => {
  try {
    const userId = await getUserId();
    const response = await api.get(`/history/commands?limit=${limit}`, {
      headers: {
        'user-id': userId
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener comandos más usados:', error);
    throw error;
  }
};

/**
 * Obtiene los artistas más escuchados por el usuario
 * @param {number} limit - Número máximo de artistas a obtener
 * @returns {Promise<Array>} - Lista de artistas y su frecuencia
 */
export const getMostPlayedArtists = async (limit = 10) => {
  try {
    const userId = await getUserId();
    const response = await api.get(`/history/artists?limit=${limit}`, {
      headers: {
        'user-id': userId
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener artistas favoritos:', error);
    throw error;
  }
};

/**
 * Elimina todo el historial del usuario
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const clearUserHistory = async () => {
  try {
    const userId = await getUserId();
    const response = await api.delete('/history', {
      headers: {
        'user-id': userId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar historial:', error);
    throw error;
  }
};

export default {
  getUserHistory,
  getMostUsedCommands,
  getMostPlayedArtists,
  clearUserHistory
};
