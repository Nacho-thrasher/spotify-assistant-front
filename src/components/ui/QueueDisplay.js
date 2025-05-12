import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiMusic, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { spotifyService } from '../../services/api';
import { useAssistant } from '../../contexts/AssistantContext';
import { toast } from 'react-toastify';
import { FixedSizeList as List } from 'react-window';

const QueueContainer = styled.div`
  background-color: #181818;
  border-radius: 8px;
  padding: 10px;
  margin: 0 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  max-height: 500px; /* Altura máxima para la cola */
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.4); }
  70% { box-shadow: 0 0 0 5px rgba(29, 185, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
`;

const playPulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
`;

const QueueTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #b3b3b3;
  margin-bottom: 10px;
  gap: 6px;
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.4s ease-out;
`;

const QueueItemContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 6px;
  background-color: ${props => {
    if (props.isCurrent) return 'rgba(29, 185, 84, 0.1)';
    if (props.isSelected) return 'rgba(29, 185, 84, 0.05)';
    return 'transparent';
  }};
  border-left: ${props => {
    if (props.isCurrent) return '3px solid #1DB954';
    if (props.isSelected) return '3px solid rgba(29, 185, 84, 0.5)';
    return '3px solid transparent';
  }};
  transition: all 0.3s ease-in-out;
  animation: ${props => {
    if (props.isCurrent) return css`${fadeIn} 0.4s ease-out, ${pulse} 2s infinite`;
    if (props.isSelected) return css`${fadeIn} 0.4s ease-out, ${playPulse} 0.8s infinite`;
    return css`${fadeIn} 0.4s ease-out`;
  }};
  transform-origin: center left;
  cursor: ${props => props.inQueue ? 'pointer' : 'default'};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    background-color: ${props => {
      if (props.isCurrent) return 'rgba(29, 185, 84, 0.15)';
      if (props.isSelected) return 'rgba(29, 185, 84, 0.1)';
      return 'rgba(255, 255, 255, 0.05)';
    }};
    transform: ${props => props.inQueue ? 'translateX(3px)' : 'none'};
  }
`;

const AlbumThumb = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 2px;
  background-image: ${props => props.image ? `url(${props.image})` : 'linear-gradient(#333, #222)'};
  background-size: cover;
  background-position: center;
  margin-right: 8px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: ${props => props.isCurrent ? '0 0 10px rgba(29, 185, 84, 0.3)' : 'none'};
  
  ${props => props.isCurrent && css`
    &:hover {
      transform: scale(1.05);
    }
  `}
`;

const TrackInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TrackName = styled.div`
  font-size: 12px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const ArtistName = styled.div`
  font-size: 11px;
  color: #b3b3b3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusLabel = styled.div`
  font-size: 10px;
  background: ${props => {
    if (!props.inQueue) return '#1DB954';
    if (props.isPlaying) return 'rgba(29, 185, 84, 0.3)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => {
    if (!props.inQueue) return 'white';
    if (props.isPlaying) return '#1DB954';
    return '#b3b3b3';
  }};
  border-radius: 2px;
  padding: 2px 6px;
  margin-left: 8px;
  white-space: nowrap;
  transition: all 0.3s ease;
  opacity: 0.9;
  
  ${props => !props.inQueue && css`
    animation: ${pulse} 2s infinite;
  `}
  
  ${props => props.isPlaying && css`
    animation: ${playPulse} 1s infinite;
  `}
  
  &:hover {
    opacity: 1;
  }
`;

const ClearQueueButton = styled.button`
  background: none;
  border: none;
  color: #b3b3b3;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.7;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #1DB954;
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    &:hover {
      background-color: transparent;
      color: #b3b3b3;
    }
  }
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #b3b3b3;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-right: 8px;
  opacity: 0.7;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #1DB954;
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  svg {
    transition: transform 0.5s ease;
  }
  
  &.loading svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const QueueItemsContainer = styled.div`
  overflow-y: auto;
  max-height: 300px;
  padding-right: 5px;
  margin-top: 5px;
  position: relative;
  z-index: 5;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
`;

const EmptyMessage = styled.div`
  color: #b3b3b3;
  font-size: 12px;
  padding: 10px;
  text-align: center;
  font-style: italic;
`;

const QueuePosition = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${props => props.isPlaying ? '#1DB954' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.isPlaying ? 'white' : '#b3b3b3'};
  font-size: 11px;
  font-weight: bold;
  margin-right: 8px;
  transition: all 0.3s ease;
`;

// Optimizamos QueueItem con memo para prevenir re-renderizados innecesarios
const QueueItem = memo(({ track, isCurrent, inQueue, queuePosition, onPlayItem }) => {
  const [isSelected, setIsSelected] = useState(false);
  
  useEffect(() => {
    if (isSelected) {
      const timer = setTimeout(() => setIsSelected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);
  
  const handleClick = useCallback(() => {
    if (inQueue && queuePosition !== undefined && onPlayItem) {
      console.log(`💾 Intentando reproducir canción #${queuePosition} en cola (index ${queuePosition - 1})`);
      setIsSelected(true);
      onPlayItem(queuePosition - 1); // Restamos 1 para obtener el índice en la cola (0-based)
    }
  }, [inQueue, queuePosition, onPlayItem]);
  
  // Usamos useCallback para evitar re-creaciones de funciones en cada render
  
  return (
    <QueueItemContainer 
      isCurrent={isCurrent}
      inQueue={inQueue}
      onClick={handleClick}
      isSelected={isSelected}
    >
      {/* Numeración en cola */}
      {inQueue && (
        <QueuePosition isPlaying={isSelected}>
          {queuePosition}
        </QueuePosition>
      )}
      
      <AlbumThumb image={track.image} isCurrent={isCurrent} />
      <TrackInfo>
        <TrackName>{track.name}</TrackName>
        <ArtistName>{track.artist}</ArtistName>
      </TrackInfo>
      <StatusLabel inQueue={inQueue}>
        {isCurrent ? 'Sonando ahora' : inQueue ? `En cola` : 'Último reproducido'}
      </StatusLabel>
    </QueueItemContainer>
  );
});

const QueueDisplay = ({ currentTrack, queueItems, onPlayItem }) => {
  // Usamos useMemo para evitar cálculos innecesarios cuando queueItems no cambia realmente
  const expandedQueueItems = useMemo(() => {
    console.log('🔄 QueueDisplay: Procesando elementos de cola');
    if (queueItems && queueItems.length > 0) {
      return queueItems.map((item, index) => ({
        ...item,
        queuePosition: index + 1, // Posición en cola (1-based)
        key: item.uri || `queue-item-${index}` // Aseguramos clave única para React
      }));
    }
    return [];
  }, [queueItems]);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(null);
  
  // Implementamos memoización para valores derivados en lugar de re-calcularlos en cada render
  const queueItemsHash = useMemo(() => {
    return queueItems ? queueItems.map(item => item.uri).join('|') : '';
  }, [queueItems]);
  
  // Log que se ejecuta solo cuando realmente la cola cambia
  useEffect(() => {
    console.log(`🔄 QueueDisplay: Cola actualizada con ${queueItems?.length || 0} elementos`);
  }, [queueItems?.length, queueItemsHash]);
  
  const { refreshQueue } = useAssistant(); // Obtener la función del contexto
  const [filteredQueue, setFilteredQueue] = useState([]);
  const [prevTrack, setPrevTrack] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlayingQueueItem, setIsPlayingQueueItem] = useState(false);
  
  // Detectar cambios en la pista actual para animar la transición
  useEffect(() => {
    if (currentTrack && prevTrack && currentTrack.name !== prevTrack.name) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevTrack(currentTrack);
  }, [currentTrack, prevTrack]);
  
  // Sincronizar con la información de cola desde el backend
  useEffect(() => {
    console.log('QueueDisplay - ACTUALIZACIÓN DE COLA DETECTADA');
    
    // Verificar si queueItems es un array válido
    if (!queueItems || !Array.isArray(queueItems)) {
      console.log('QueueDisplay - No hay items en cola o no es un array');
      console.log('QueueDisplay - LIMPIANDO COLA EN UI');
      setFilteredQueue([]);
      return;
    }
    
    // Si la cola está vacía, limpiar la UI
    if (queueItems.length === 0) {
      console.log('QueueDisplay - Cola vacía recibida del backend');
      console.log('QueueDisplay - LIMPIANDO COLA EN UI');
      setFilteredQueue([]);
      return;
    }
    
    console.log('QueueDisplay - Items en cola recibidos:', queueItems.length);
    queueItems.forEach((item, idx) => {
      console.log(`QueueDisplay - Queue[${idx}]:`, item.name, '-', item.artist);
    });
    console.log('QueueDisplay - Canción actual:', currentTrack?.name, 'URI:', currentTrack?.uri);
    
    // CONFIAMOS en el backend para el filtrado principal
    // El backend ya está filtrando:  
    // 1. La canción actual
    // 2. Duplicados
    // 3. Pistas inválidas
    // Solo hacemos un filtrado mínimo por seguridad
    
    let processedQueue = [...queueItems];
    
    // Por seguridad, verificamos una vez más que la pista actual no esté en la cola
    if (currentTrack && currentTrack.uri) {
      const beforeFilter = processedQueue.length;
      processedQueue = processedQueue.filter(item => item.uri !== currentTrack.uri);
      
      // Registrar si se eliminaron elementos (esto normalmente ya no debería ocurrir)
      if (processedQueue.length < beforeFilter) {
        console.log(`QueueDisplay - SEGURIDAD: Eliminadas ${beforeFilter - processedQueue.length} coincidencias con la pista actual`);
      }
    }
    
    // Verificación final para elementos duplicados manteniendo el orden original exacto
    // (Mantenemos el orden EXACTO sin reordenar elementos)
    const urisSet = new Set();
    const finalQueue = [];
    
    // ES EXTREMADAMENTE IMPORTANTE MANTENER EL ORDEN ORIGINAL
    for (let i = 0; i < processedQueue.length; i++) {
      const item = processedQueue[i];
      
      if (!item.uri) {
        finalQueue.push(item);
        continue;
      }
      
      if (!urisSet.has(item.uri)) {
        urisSet.add(item.uri);
        finalQueue.push(item);
      } else {
        console.log(`QueueDisplay - SEGURIDAD: Filtrado duplicado de ${item.name}`);
      }
    }
    
    console.log('QueueDisplay - Cola final:', finalQueue.length, 'elementos');
    if (finalQueue.length > 0) {
      finalQueue.forEach((item, idx) => {
        console.log(`QueueDisplay - Final[${idx}]:`, item.name, '-', item.artist);
      });
    }
    
    setFilteredQueue(finalQueue);
  }, [queueItems, currentTrack]); // Dependencias: se ejecuta cuando cambian los items o la canción actual
  
  // Función para actualizar manualmente la cola - optimizada con useCallback
  const handleRefreshQueue = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshQueue();
    } catch (error) {
      console.error('Error al actualizar cola:', error);
      toast.error('No se pudo actualizar la cola', {
        position: 'bottom-center'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshQueue]);
  
  // Función para limpiar la cola
  const handleClearQueue = async () => {
    try {
      setIsClearing(true);
      console.log('🔄 QueueDisplay - Limpiando cola...');
      await spotifyService.clearQueue();
      
      // Forzar actualización inmediata de la UI para dar feedback al usuario
      console.log('🔄 QueueDisplay - Forzando actualización de UI tras limpieza');
      setFilteredQueue([]); // Limpiar inmediatamente la cola en la UI
      
      // Esperar un momento y luego refrescar los datos desde el servidor
      setTimeout(async () => {
        try {
          console.log('🔄 QueueDisplay - Obteniendo cola actualizada tras limpieza...');
          await refreshQueue(); // Usar la función del contexto
        } catch (refreshErr) {
          console.error('Error al refrescar cola tras limpieza:', refreshErr);
        }
      }, 1000);
      
      console.log('✅ Cola limpiada exitosamente');
    } catch (error) {
      console.error('Error al limpiar la cola:', error);
    } finally {
      setIsClearing(false);
    }
  };
  
  // Función para reproducir una canción específica de la cola
  const handlePlayQueueItem = async (index) => {
    if (isPlayingQueueItem) {
      console.log('Ya hay una operación de reproducción en curso, espera...');
      toast.info('Hay una reproducción en curso, espera un momento...', {
        position: 'bottom-center',
        autoClose: 2000
      });
      return;
    }
    
    // Verifiquemos primero que el índice es válido
    if (index < 0 || index >= filteredQueue.length) {
      console.error(`Índice de cola inválido: ${index}. La cola tiene ${filteredQueue.length} elementos`);
      toast.error('No se puede reproducir: posición inválida en la cola', {
        position: 'bottom-center',
        autoClose: 5000
      });
      return;
    }
    
    console.log(`Reproduciendo elemento #${index + 1} de la cola: ${filteredQueue[index].name}`);
    setIsPlayingQueueItem(true);
    setIsTransitioning(true);
    
    try {
      // Validaciones de servicio
      if (!spotifyService) {
        throw new Error('Servicio de Spotify no disponible');
      }
      
      if (!spotifyService.playQueueItem) {
        throw new Error('Funcionalidad de reproducción de cola no disponible');
      }
      
      // Intentar reproducir la canción
      const result = await spotifyService.playQueueItem(index);
      console.log('Resultado de la operación:', result);
      
      toast.success(`Reproduciendo: ${filteredQueue[index].name}`, {
        position: 'bottom-center',
        autoClose: 2000
      });
      
      // Destacar visualmente la canción y actualizar la interfaz
      setTimeout(async () => {
        try {
          await refreshQueue();
          setIsTransitioning(false);
        } catch (error) {
          console.error('Error actualizando UI tras cambio de canción:', error);
          toast.warning(`No se pudo actualizar la interfaz: ${error.message}`, {
            position: 'bottom-center'
          });
        } finally {
          setIsPlayingQueueItem(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error reproduciendo canción de la cola:', error);
      
      // Mensajes de error más específicos según el problema
      let errorMessage = 'No se pudo reproducir la canción seleccionada';
      
      if (error.message.includes('No hay dispositivo activo')) {
        errorMessage = 'No hay dispositivo de Spotify activo. Abre Spotify en algún dispositivo primero.';
      } else if (error.message.includes('premium')) {
        errorMessage = 'Se requiere una cuenta premium de Spotify para esta función';
      } else if (error.message.includes('token')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Error: ${errorMessage}`, {
        position: 'bottom-center',
        autoClose: 5000
      });
      
      setIsTransitioning(false);
      setIsPlayingQueueItem(false);
    }
  };
  
  // No mostrar nada si no hay tracks para mostrar
  if (!currentTrack && (!filteredQueue || filteredQueue.length === 0)) {
    return null;
  }
  
  // Optimización para evitar re-renderizados innecesarios
  const memoizedQueueItems = useMemo(() => {
    // Solo procesamos esto cuando realmente cambien los datos relevantes
    if (filteredQueue && filteredQueue.length > 0) {
      return (
        <List
          height={Math.min(400, filteredQueue.length * 44)} // altura máxima o altura basada en número de elementos
          itemCount={filteredQueue.length}
          itemSize={44} // altura aproximada de cada elemento
          width="100%"
          overscanCount={5} // Precargar elementos para scroll más fluido
          // La clave key es importante para preservar el estado durante re-renderizados
          key={queueItemsHash} 
        >
          {({ index, style }) => {
            const track = filteredQueue[index];
            return (
              <div style={style} key={track.uri || `queue-item-${index}`}>
                <QueueItem
                  track={track}
                  isCurrent={false}
                  inQueue={true}
                  queuePosition={index + 1} // Mostramos la posición en la cola
                  onPlayItem={handlePlayQueueItem}
                />
              </div>
            );
          }}
        </List>
      );
    } else if (!currentTrack) {
      return <EmptyMessage>No hay canciones en cola</EmptyMessage>;
    }
    return null;
  }, [filteredQueue, queueItemsHash, currentTrack, handlePlayQueueItem]);

  // Optimizamos el renderizado del ítem actual para evitar parpadeos
  const currentTrackItem = useMemo(() => {
    return currentTrack ? (
      <QueueItem 
        track={currentTrack} 
        isCurrent={true}
        inQueue={false}
      />
    ) : null;
  }, [currentTrack]);

  return (
    <QueueContainer 
      style={isTransitioning ? { boxShadow: '0 0 15px rgba(29, 185, 84, 0.3)' } : {}}
    >
      <QueueTitle>
        <FiMusic size={14} style={{ color: isTransitioning ? '#1DB954' : '#b3b3b3' }} /> 
        Cola de reproducción
      </QueueTitle>
      
      {/* Botones de acción para la cola */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        {/* Botón para actualizar la cola */}
        <RefreshButton
          onClick={handleRefreshQueue}
          disabled={isRefreshing}
          className={isRefreshing ? 'loading' : ''}
          title="Actualizar cola desde Spotify"
        >
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          <FiRefreshCw size={12} />
        </RefreshButton>

        {/* Botón para limpiar la cola */}
        {filteredQueue && filteredQueue.length > 0 && (
          <ClearQueueButton
            onClick={handleClearQueue}
            disabled={isClearing}
            title="Limpiar cola"
          >
            {isClearing ? 'Limpiando...' : 'Limpiar cola'}
            <FiTrash2 size={12} />
          </ClearQueueButton>
        )}
      </div>
      
      {/* Canción actual (siempre visible) - usando componente memoizado */}
      {currentTrackItem}
      
      {/* Contenedor con virtualización para elementos de la cola - usando componente memoizado */}
      <QueueItemsContainer>
        {memoizedQueueItems}
      </QueueItemsContainer>
    </QueueContainer>
  );
};

// Aplicamos memo también al componente principal para prevenir re-renderizados innecesarios
export default memo(QueueDisplay);
