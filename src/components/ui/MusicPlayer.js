import React from 'react';
import styled from 'styled-components';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiLoader } from 'react-icons/fi';
import Button from './Button';

const PlayerContainer = styled.div`
  background-color: #121212;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const TrackInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const AlbumCover = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  background-image: ${(props) => (props.image ? `url(${props.image})` : 'linear-gradient(#333, #222)')};
  background-size: cover;
  background-position: center;
  margin-right: 12px;
`;

const TrackDetails = styled.div`
  flex: 1;
`;

const TrackName = styled.h3`
  color: white;
  margin: 0 0 4px 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArtistName = styled.p`
  color: #b3b3b3;
  margin: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

const ControlButton = styled(Button)`
  height: 36px;
  width: 36px;
  padding: 0;
  border-radius: 50%;
  background-color: ${(props) => (props.primary ? '#1DB954' : 'rgba(255, 255, 255, 0.1)')};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background-color: ${(props) => (props.primary ? '#1ED760' : 'rgba(255, 255, 255, 0.2)')};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    transition: all 0.2s ease;
  }
  
  ${props => props.disabled && `
    svg {
      opacity: 0.7;
    }
  `}
`;

const LoadingIcon = styled(FiLoader)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NoTrackContainer = styled.div`
  text-align: center;
  padding: 20px;
  color: #b3b3b3;
`;

const MusicPlayer = ({ 
  currentTrack = null,
  isPlaying = false,
  onPlay = () => {},
  onPause = () => {},
  onNext = () => {},
  onPrevious = () => {},
  disabled = false,
  isLoadingNext = false,
  isLoadingPrevious = false,
  onRefresh = () => {}
}) => {
  // Si no hay track actual, mostrar mensaje
  if (!currentTrack) {
    return (
      <PlayerContainer>
        <NoTrackContainer>
          <p>No hay ninguna canción reproduciéndose actualmente</p>
          <p>Prueba diciendo: "Reproducir música"</p>
        </NoTrackContainer>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer>
      <TrackInfo>
        <AlbumCover image={currentTrack.image} />
        <TrackDetails>
          <TrackName>{currentTrack.name || 'Desconocido'}</TrackName>
          <ArtistName>{currentTrack.artist || 'Artista desconocido'}</ArtistName>
        </TrackDetails>
      </TrackInfo>
      
      <ControlsContainer>
        <ControlButton 
          onClick={onPrevious} 
          disabled={disabled || isLoadingPrevious} 
          title="Anterior"
        >
          {isLoadingPrevious ? <LoadingIcon size={16} /> : <FiSkipBack />}
        </ControlButton>
        
        {isPlaying ? (
          <ControlButton 
            primary 
            onClick={onPause} 
            disabled={disabled} 
            title="Pausar"
          >
            {disabled ? <LoadingIcon size={16} /> : <FiPause />}
          </ControlButton>
        ) : (
          <ControlButton 
            primary 
            onClick={onPlay} 
            disabled={disabled} 
            title="Reproducir"
          >
            {disabled ? <LoadingIcon size={16} /> : <FiPlay />}
          </ControlButton>
        )}
        
        <ControlButton 
          onClick={onNext} 
          disabled={disabled || isLoadingNext} 
          title="Siguiente"
        >
          {isLoadingNext ? <LoadingIcon size={16} /> : <FiSkipForward />}
        </ControlButton>
      </ControlsContainer>
    </PlayerContainer>
  );
};

export default MusicPlayer;
