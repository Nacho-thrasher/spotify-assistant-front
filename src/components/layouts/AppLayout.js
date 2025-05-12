import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import { FiLogOut, FiMusic, FiRefreshCw, FiMessageSquare, FiBarChart2 } from 'react-icons/fi';
import MusicPlayer from '../ui/MusicPlayer';
import Button from '../ui/Button';
import QueueDisplay from '../ui/QueueDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useAssistant } from '../../contexts/AssistantContext';
import { spotifyService } from '../../services/api';
import { toast } from 'react-toastify';
import AppRouter from '../../routes';
import trackingService from '../../services/trackingService';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #121212;
  color: white;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #070707;
  border-bottom: 1px solid #333;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #1DB954;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PlayerSection = styled.div`
  padding: 16px;
  background-color: #181818;
  position: relative;
`;

const RefreshButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #b3b3b3;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
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

const Navigation = styled.nav`
  background-color: #121212;
  border-bottom: 1px solid #333;
  padding: 0 24px;
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-right: 20px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: #b3b3b3;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
  }
  
  &.active {
    color: #1DB954;
    border-bottom-color: #1DB954;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  overflow: hidden;
`;

const AppLayout = () => {
  const { logout } = useAuth();
  const { currentTrack, isPlaying, setIsPlaying, queueItems, refreshQueue } = useAssistant();

  // Estado local para feedback visual y tracking
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sistema de caché para reducir peticiones innecesarias
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [lastTrackData, setLastTrackData] = useState(null);
  const MIN_REQUEST_INTERVAL = 15000; // 15 segundos mínimo entre peticiones completas
  
  // Estado para la información de la pista actual (usado para sincronizar con Spotify)
  const [currentTrackInfo, setCurrentTrackInfo] = useState(null);
  
  // Estado para almacenar el ID de la última canción (para detectar cambios)
  const [lastTrackId, setLastTrackId] = useState(null);
  
  // Referencia al intervalo de seguimiento automático
  const trackingIntervalRef = useRef(null);
  
  // Función mejorada para actualizar la información del track actual y cola con control de cache
  const updateCurrentTrack = useCallback(async () => {
    try {
      // Evitar que se quede bloqueado el estado de carga si hay errores
      const refreshTimeout = setTimeout(() => {
        setIsRefreshing(false);
      }, 10000); // Tiempo máximo de 10 segundos para evitar que se quede cargando indefinidamente
      
      setIsRefreshing(true);
      console.log('🔄 AppLayout: Iniciando actualización completa de estado');
      
      // Obtener la información de reproducción actual
      const response = await spotifyService.getCurrentTrack();
      
      // Limpiar timeout ya que la petición ha sido exitosa
      clearTimeout(refreshTimeout);
      
      // Procesar los datos recibidos
      if (response && response.body) {
        const playbackData = response.body;
        
        if (playbackData.item) {
          // Si hay una canción reproduciéndose
          const track = playbackData.item;
          
          // Actualizar la información de la pista actual
          setCurrentTrackInfo({
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            image: track.album.images[0]?.url,
            uri: track.uri,
            isPlaying: playbackData.is_playing
          });
          
          // Actualizar estado de reproducción
          setIsPlaying(playbackData.is_playing);
          
          // Actualizar ID de la última pista
          setLastTrackId(track.id);
          
          console.log(`✅ Estado actualizado: ${track.name} - ${track.artists[0].name} (${playbackData.is_playing ? 'reproduciendo' : 'pausado'})`);
        } else {
          // Si no hay canción reproduciéndose
          setCurrentTrackInfo(null);
          setIsPlaying(false);
          console.log('⏹️ No hay pista reproduciéndose actualmente');
        }
        
        // Actualizar la cola de reproducción
        await refreshQueue();
      } else {
        console.log('⚠️ No se pudo obtener información de reproducción');
        setCurrentTrackInfo(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      // No modificar estado en caso de error para evitar falsos negativos
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshQueue]);
  
  // Comprobar si hay cambios en el track actual (se usa en cada polling)
  const checkForChanges = useCallback(async () => {
    console.log('🔎 checkForChanges: Verificando cambios en la pista actual...');
    try {
      const response = await spotifyService.getCurrentTrack();
      
      if (!response?.item) {
        console.log('⚠️ checkForChanges: No hay pista reproduciéndose actualmente');
        return;
      }
      
      const newTrackId = response.item.id;
      const isCurrentlyPlaying = response.is_playing;
      const track = response.item;
      
      console.log(`🔎 ID actual: ${lastTrackId}, Nuevo ID: ${newTrackId}`);
      console.log(`🔎 Estado reproducción UI: ${isPlaying}, Estado real: ${isCurrentlyPlaying}`);
      console.log(`🔎 Canción actual: ${track.name} - ${track.artists[0].name}`);

      // Actualizar UI con la información más reciente, sin importar si cambió o no
      const updatedTrackInfo = {
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        image: track.album.images[0]?.url,
        uri: track.uri,
        isPlaying: isCurrentlyPlaying
      };
      
      setCurrentTrackInfo(updatedTrackInfo);
      setIsPlaying(isCurrentlyPlaying);
      setLastTrackId(newTrackId);
      
      // Si cambió el track, actualizar la cola
      if (newTrackId !== lastTrackId) {
        console.log('🔔 checkForChanges: Cambio de canción detectado, actualizando cola...');
        await refreshQueue();
      }
    } catch (error) {
      console.error('❌ Error comprobando cambios:', error);
    }
  }, [lastTrackId, isPlaying, refreshQueue]);

  // Función para configurar polling - siempre actualiza la UI
  const setupPolling = useCallback(async () => {
    console.log('🕐 Ejecutando polling completo...');
    try {
      // Obtener estado actual directamente de Spotify
      const currentData = await spotifyService.getCurrentTrack();
      
      if (currentData?.item) {
        const track = currentData.item;
        const newTrackId = track.id;
        const isCurrentlyPlaying = currentData.is_playing;
        
        console.log(`🎵 Pista actual: ${track.name} - ${track.artists[0].name}`);
        console.log(`🕒 Estado: ${isCurrentlyPlaying ? 'Reproduciendo' : 'Pausado'}`);
        
        // Actualizar estado aunque no haya cambios (forza sincronización)
        const updatedTrackInfo = {
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          image: track.album.images[0]?.url,
          uri: track.uri,
          isPlaying: isCurrentlyPlaying
        };
        
        // Actualizar UI agresivamente
        setCurrentTrackInfo(updatedTrackInfo);
        setIsPlaying(isCurrentlyPlaying);
        setLastTrackId(newTrackId);
        
        // Actualizar también la cola para mantener todo sincronizado
        if (newTrackId !== lastTrackId) {
          await refreshQueue();
        }
      } else {
        console.log('⚠️ No hay pista reproduciéndose');
        setCurrentTrackInfo(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error en polling completo:', error);
    }
  }, [lastTrackId, refreshQueue]);

  // Iniciar el seguimiento automático de reproducción
  useEffect(() => {
    console.log('🔄 Iniciando seguimiento automático de reproducción...');
    trackingIntervalRef.current = trackingService.startAutoTracking(3000); // Cada 3 segundos
    
    return () => {
      console.log('⏹️ Deteniendo seguimiento automático de reproducción');
      if (trackingIntervalRef.current) {
        trackingService.stopAutoTracking(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, []); // Solo se ejecuta una vez al montar el componente
  
  // Polling periódico para sincronizar cuando hay track actual
  useEffect(() => {
    if (currentTrack) {
      console.log('🕒 Configurando polling periódico para sincronización');
      const checkInterval = setInterval(setupPolling, 3000); // Cada 3 segundos
      return () => clearInterval(checkInterval);
    }
  }, [currentTrack, setupPolling]);
  
  // Iniciar actualización inicial
  useEffect(() => {
    // Realizar una verificación inmediata al iniciar
    console.log('🔄 Realizando verificación inicial de Spotify...');
    setupPolling();  // Usar setupPolling en lugar de updateCurrentTrack
    
    // Al montar, actualizar cada 2 segundos
    const initialInterval = setInterval(() => {
      console.log('🕒 Actualización programada inicial...');
      setupPolling(); // Usar setupPolling en lugar de checkForChanges
    }, 2000);

    // Limpiar al desmontar
    return () => clearInterval(initialInterval);
  }, [setupPolling]);
  
  // Sincronización después de montar
  useEffect(() => {
    // Retraso de 3 segundos para permitir que otras cosas se inicialicen
    console.log('🕔 Programando sincronización completa retrasada...');
    const syncTimeout = setTimeout(() => {
      console.log('🕒 Ejecutando sincronización completa retrasada...');
      setupPolling();
    }, 3000);
    
    // Limpiar timeout al desmontar
    return () => clearTimeout(syncTimeout);
  }, [setupPolling]);

  const handlePlayPause = async () => {
    // Feedback visual inmediato
    setIsLoading(true);
    
    try {
      // Verificar el estado actual para saber si reproducir o pausar
      if (currentTrackInfo && currentTrackInfo.isPlaying) {
        // Si está reproduciendo, pausar
        console.log('⏸️ Pausando reproducción actual...');
        await spotifyService.pause();
        console.log('✅ Reproducción pausada con éxito');
        
        // Actualizar UI inmediatamente sin esperar polling
        setIsPlaying(false);
        setCurrentTrackInfo(prev => prev ? {...prev, isPlaying: false} : null);
      } else {
        // Si está pausado o no hay reproducción, intentar reproducir
        console.log('▶️ Iniciando/reanudando reproducción...');
        
        // Intentar reproducir la última track o reanudar
        await spotifyService.play();
        console.log('✅ Reproducción iniciada con éxito');
        
        // Actualizar UI inmediatamente sin esperar polling
        setIsPlaying(true);
        setCurrentTrackInfo(prev => prev ? {...prev, isPlaying: true} : null);
        
        // Sincronizar para asegurarnos de tener la información más reciente
        console.log('🔄 Sincronizando después de reproducir...');
        setTimeout(() => {
          updateCurrentTrack();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado de reproducción:', error);
      
      // Mostrar notificación de error
      toast.error('❌ Error al reproducir/pausar', {
        position: 'bottom-center'
      });
      
      // Forzar sincronización para recuperar estado real en caso de error
      console.log('🔄 Resincronizando después de error...');
      setTimeout(() => {
        updateCurrentTrack();
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setIsLoadingNext(true);
    console.log('⏭️ Next: Pasando a la siguiente canción...');
    
    try {
      // Guardar referencia a la canción actual para comparar después
      const previousTrack = currentTrackInfo || currentTrack;
      
      const response = await spotifyService.next();
      console.log('✅ Next: Comando enviado con éxito');
      
      // Mostrar como reproduciendo inmediatamente para feedback al usuario
      setIsPlaying(true);
      
      // IMPORTANTE: Obtener inmediatamente información de la nueva canción
      console.log('🔍 Obteniendo información de la nueva canción');
      const newTrackData = await spotifyService.getCurrentTrack();
      
      if (newTrackData?.item) {
        // Forzar actualización del estado UI inmediatamente
        const track = newTrackData.item;
        console.log(`✅ Nueva canción detectada: ${track.name}`);
        
        // Actualizar la información de la pista actual explícitamente
        const newTrackInfo = {
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          image: track.album.images[0]?.url,
          uri: track.uri,
          isPlaying: newTrackData.is_playing
        };
        
        // Actualizar UI con la nueva canción y su estado
        setCurrentTrackInfo(newTrackInfo);
        setLastTrackId(track.id); // Importante para evitar actualizaciones innecesarias
        setIsPlaying(newTrackData.is_playing);
      }
      
      // Actualizar la cola después de procesar la nueva canción
      await refreshQueue();
      
      // Segundo intento para garantizar sincronización total
      setTimeout(async () => {
        console.log('🔄 Next: Verificando sincronización (segundo intento)...');
        await updateCurrentTrack();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error pasando a siguiente canción:', error);
      
      // Mostrar notificación de error
      toast.error('❌ Error al cambiar de canción', {
        position: 'bottom-center'
      });
      
      // Intentar recuperar en caso de error
      setTimeout(async () => {
        console.log('📲 Next: Intentando recuperar estado después de error...');
        await updateCurrentTrack();
      }, 800);
      
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handlePrevious = async () => {
    setIsLoadingPrevious(true);
    console.log('⏮️ Previous: Volviendo a la canción anterior...');
    
    try {
      // Guardar referencia a la canción actual para comparar después
      const previousTrack = currentTrackInfo || currentTrack;
      
      const response = await spotifyService.previous();
      console.log('✅ Previous: Comando enviado correctamente');
      
      // Actualizar interfaz inmediatamente para feedback
      setIsPlaying(true);
      
      // IMPORTANTE: Obtener inmediatamente información de la nueva canción
      console.log('🔍 Previous: Obteniendo información de la canción anterior');
      const newTrackData = await spotifyService.getCurrentTrack();
      
      if (newTrackData?.item) {
        // Forzar actualización del estado UI inmediatamente
        const track = newTrackData.item;
        console.log(`✅ Previous: Canción anterior detectada: ${track.name}`);
        
        // Actualizar la información de la pista actual explícitamente
        const newTrackInfo = {
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          image: track.album.images[0]?.url,
          uri: track.uri,
          isPlaying: newTrackData.is_playing
        };
        
        // Actualizar UI con la nueva canción y su estado
        setCurrentTrackInfo(newTrackInfo);
        setLastTrackId(track.id); // Importante para evitar actualizaciones innecesarias
        setIsPlaying(newTrackData.is_playing);
      }
      
      // Actualizar la cola después de procesar la nueva canción
      await refreshQueue();
      
      // Segundo intento para garantizar sincronización total
      setTimeout(async () => {
        console.log('🔄 Previous: Verificando sincronización completa...');
        await updateCurrentTrack(); 
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error pasando a canción anterior:', error);
      
      // Mostrar notificación de error
      toast.error('❌ Error al cambiar de canción', {
        position: 'bottom-center'
      });
      
      // Intentar recuperar en caso de error
      setTimeout(async () => {
        console.log('📲 Previous: Intentando recuperar estado después de error...');
        await updateCurrentTrack();
      }, 800);
      
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  // Usar el hook useLocation para determinar la ruta actual
  const location = useLocation();
  
  return (
    <AppContainer>
      <Header>
        <Logo>
          <FiMusic /> Asistente de Spotify
        </Logo>
        <Button onClick={logout}>
          <FiLogOut /> Cerrar sesión
        </Button>
      </Header>

      <Main>
        <PlayerSection>
          {currentTrack ? (
            <>
              <RefreshButton 
                onClick={updateCurrentTrack}
                className={isRefreshing ? 'loading' : ''}
                title="Actualizar estado de reproducción"
              >
                <FiRefreshCw size={16} />
              </RefreshButton>
              
              <QueueDisplay 
                currentTrack={currentTrackInfo || currentTrack} 
                queueItems={queueItems} 
              />
              <MusicPlayer
                currentTrack={currentTrackInfo || currentTrack}
                isPlaying={currentTrackInfo ? currentTrackInfo.isPlaying : isPlaying}
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                disabled={isLoading}
                isLoadingNext={isLoadingNext}
                isLoadingPrevious={isLoadingPrevious}
                onRefresh={setupPolling}
              />
            </>
          ) : null}
        </PlayerSection>
        
        {/* Navegación entre secciones */}
        <Navigation>
          <NavList>
            <NavItem>
              <StyledNavLink to="/" end>
                <FiMessageSquare size={18} /> Asistente
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/history">
                <FiBarChart2 size={18} /> Mi Historial
              </StyledNavLink>
            </NavItem>
          </NavList>
        </Navigation>

        <ContentSection>
          <AppRouter />
        </ContentSection>
      </Main>
    </AppContainer>
  );
};

export default AppLayout;
