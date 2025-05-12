import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { assistantService, spotifyService } from '../services/api';
import { getSocket } from '../services/socket';
import { toast } from 'react-toastify';

// Crear contexto
const AssistantContext = createContext();

// Hook personalizado para usar el contexto
export const useAssistant = () => useContext(AssistantContext);

// Proveedor del contexto
export const AssistantContextProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Inicializar mensajes desde localStorage o usar el mensaje inicial
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueItems, setQueueItems] = useState([]);

  // Función para obtener información del estado de reproducción
  const getCurrentPlayingTrack = useCallback(async () => {
    try {
      console.log('🔄 Actualizando información de reproducción...');
      const data = await spotifyService.getCurrentTrack();
      
      let currentTrackData = null;
      
      if (data && data.item) {
        currentTrackData = {
          name: data.item.name,
          artist: data.item.artists[0].name,
          album: data.item.album.name,
          image: data.item.album.images[0]?.url,
          uri: data.item.uri,
          isPlaying: data.is_playing
        };
        
        console.log(`🎵 Canción actual: ${currentTrackData.name} - ${currentTrackData.artist}`);
        setCurrentTrack(currentTrackData);
        setIsPlaying(data.is_playing);
      } else {
        console.log('⚠️ No hay canción reproduciéndose actualmente');
        setCurrentTrack(null);
        setIsPlaying(false);
      }

      // Obtener la cola actualizada del backend (que ya tiene implementación de caché)
      try {
        console.log('📋 Solicitando cola de reproducción al backend...');
        const queueData = await spotifyService.getQueue();
        
        if (queueData && queueData.nextInQueue) {
          console.log(`📊 Cola recibida: ${queueData.nextInQueue.length} elementos`);
            
          // CONFIAR EN EL FILTRADO DEL BACKEND - Mantener el orden exacto
          // El backend ya está eliminando la canción actual y duplicados
          console.log('💾 CONTEXTO: Respetando el orden exacto del backend');
          if (queueData.nextInQueue.length > 0) {
            console.log('--------- LISTA EXACTA DEL BACKEND ---------');
            queueData.nextInQueue.forEach((item, idx) => {
              console.log(`   • [${idx}] ${item.name} - ${item.artist}`);
            });
            console.log('------------------------------------------');
          }
          
          // Aplicar la cola EXACTAMENTE como viene del backend
          // Esto garantiza que se respete el orden enviado
          setQueueItems(queueData.nextInQueue);
        } else {
          console.log('🔵 No hay elementos en cola');
          setQueueItems([]);
        }
      } catch (queueErr) {
        console.error('❌ Error al obtener cola:', queueErr);
        // No interrumpimos el flujo principal
      }
    } catch (err) {
      console.error('❌ Error al obtener el estado de reproducción:', err);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);
  
  // Mensaje inicial del asistente y carga inicial
  useEffect(() => {
    if (isAuthenticated) {
      // Si no hay mensajes guardados, inicializar con el mensaje de bienvenida
      if (messages.length === 0) {
        const initialMessage = {
          role: 'assistant',
          content: 'Hola, soy tu asistente de Spotify. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date().toISOString()
        };
        setMessages([initialMessage]);
      }

      // Cargar estado inicial de reproducción
      getCurrentPlayingTrack();
    }
  }, [isAuthenticated, getCurrentPlayingTrack, messages.length]);

  // Guardar mensajes en localStorage cuando cambien
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Manejar respuestas del asistente
  const handleAssistantResponse = (data) => {
    if (data.message) {
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Mostrar notificación de acción si corresponde
      if (data.action) {
        let notificationMsg = '';
        let notificationType = 'info';
        
        switch(data.action) {
          case 'PLAY':
            notificationMsg = '▶️ Reproducción iniciada';
            notificationType = 'success';
            break;
          case 'PAUSE':
            notificationMsg = '⏸️ Reproducción pausada';
            notificationType = 'info';
            break;
          case 'NEXT':
            notificationMsg = '⏭️ Pasando a la siguiente canción';
            notificationType = 'info';
            break;
          case 'PREVIOUS':
            notificationMsg = '⏮️ Volviendo a la canción anterior';
            notificationType = 'info';
            break;
          case 'ADD_TO_QUEUE':
            notificationMsg = '🎵 Canción añadida a la cola';
            notificationType = 'success';
            break;
          case 'SEARCH':
            notificationMsg = '🔍 Búsqueda de música iniciada';
            notificationType = 'info';
            break;
          case 'VOLUME':
            notificationMsg = '🔊 Volumen ajustado';
            notificationType = 'info';
            break;
          case 'ERROR':
            notificationMsg = '❌ Error al procesar la acción';
            notificationType = 'error';
            break;
          default:
            // No mostrar notificación para acciones desconocidas
            break;
        }
        
        if (notificationMsg) {
          toast[notificationType](notificationMsg);
        }
      }
    }
  };

  // Manejar actualizaciones del reproductor
  const handlePlaybackUpdate = useCallback((data) => {
    if (data) {
      setCurrentTrack({
        name: data.name,
        artist: data.artist,
        album: data.album,
        image: data.image
      });
      setIsPlaying(data.isPlaying);
    }
  }, []);





  // Enviar mensaje al asistente
  const sendMessage = async (message) => {
    if (!message || isProcessing) return;
    
    // Mostrar notificación de procesamiento
    const toastId = toast.info('🤖 Procesando tu mensaje...', {
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false
    });
    
    setIsProcessing(true);
    
    // Añadir mensaje del usuario al estado
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // Enviar mensaje al backend
      const response = await assistantService.sendMessage(message);

      if (response) {
        const assistantMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
          action: response.action,
          searchResults: response.searchResults
        };
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);

        // Actualizar información del reproductor si es necesario
        if (response.queue && Array.isArray(response.queue)) {
          // Backend provides full queue
          console.log('📋 Utilizando cola completa del backend:', response.queue.length, 'elementos');
          setQueueItems(response.queue);
        } 
        // Si devuelve múltiples pistas (desde queue_multiple)
        else if (response.tracks && Array.isArray(response.tracks) && response.tracks.length > 0) {
          console.log('🎵 Añadiendo múltiples pistas a la cola:', response.tracks.length);
          
          // Si tenemos una cola completa, usarla directamente
          if (response.queue && Array.isArray(response.queue)) {
            setQueueItems(response.queue);
          } 
          // Si no hay una cola completa, añadir las nuevas pistas a la cola existente
          else {
            setQueueItems(prevQueue => {
              // Filtrar duplicados por URI
              const newQueue = [...prevQueue];
              
              response.tracks.forEach(track => {
                const exists = newQueue.some(item => item.uri === track.uri);
                
                if (!exists) {
                  // Añadir la nueva pista a la cola
                  newQueue.push({
                    name: track.name,
                    artist: track.artist,
                    album: track.album,
                    image: track.image,
                    uri: track.uri
                  });
                }
              });
              
              return newQueue;
            });
          }
        }
        // Si devuelve una sola pista
        else if (response.track) {
          console.log('🎵 Añadiendo una pista a la cola:', response.track.name);
          // If queue not provided, fall back to deducing from track info
          // If the response includes a track that should be queued (not currently playing)
          const newQueueItem = {
            name: response.track.name,
            artist: response.track.artist,
            album: response.track.album,
            image: response.track.image,
            uri: response.track.uri
          };
          setQueueItems(prevQueue => {
            // Avoid duplicates by URI
            const exists = prevQueue.some(item => item.uri === newQueueItem.uri);
            return exists ? prevQueue : [...prevQueue, newQueueItem];
          });
        }
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      // Mostrar notificación de error
      toast.error('❌ Error al procesar tu mensaje');
      
      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      // Cerrar la notificación de procesamiento
      toast.dismiss(toastId);
      setIsProcessing(false);
    }
  };

  // Actualiza manualmente la cola desde el backend
  const refreshQueue = useCallback(async () => {
    try {
      console.log('🔄 CONTEXTO: Actualizando cola manualmente...');
      const queueData = await spotifyService.getQueue();
      
      if (queueData && queueData.nextInQueue) {
        console.log(`🔄 CONTEXTO: Cola actualizada recibida: ${queueData.nextInQueue.length} elementos`);
        // Actualizar directamente sin filtrado adicional
        setQueueItems(queueData.nextInQueue);
      } else {
        console.log('🔄 CONTEXTO: Cola vacía recibida, limpiando UI');
        setQueueItems([]);
      }
    } catch (error) {
      console.error('Error al actualizar cola manualmente:', error);
    }
  }, []);

  // Limpiar historial de mensajes
  const clearMessages = () => {
    const initialMessage = {
      role: 'assistant',
      content: 'Hola, soy tu asistente de Spotify. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toISOString()
    };
    
    setMessages([initialMessage]);
    // También limpiar el localStorage
    localStorage.setItem('chat_messages', JSON.stringify([initialMessage]));
    
    // Refrescar la cola cuando se limpian los mensajes
    refreshQueue();
  };

  // Valor del contexto
  const value = {
    messages,
    isProcessing,
    currentTrack,
    isPlaying,
    setIsPlaying, // Exponer la función setter para uso externo
    queueItems,
    sendMessage,
    clearMessages,
    refreshQueue  // Exponer la función de actualización manual de la cola
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};

export default AssistantContext;
