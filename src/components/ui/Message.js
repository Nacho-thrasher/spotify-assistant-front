import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMusic, FiZap, FiPlus } from 'react-icons/fi'; // Importamos íconos necesarios
import FeedbackButton from './FeedbackButton';
import { spotifyService } from '../../services/api';
import { toast } from 'react-toastify';
import { useAssistant } from '../../contexts/AssistantContext'; // Importar el contexto del asistente

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
  justify-content: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div`
  background-color: ${(props) => (props.isUser ? '#1DB954' : '#333333')};
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 70%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  
  border-bottom-right-radius: ${(props) => (props.isUser ? '4px' : '18px')};
  border-bottom-left-radius: ${(props) => (props.isUser ? '18px' : '4px')};
  display: flex;
  flex-direction: column;
`;

const SearchResultsContainer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  gap: 10px;
  position: relative;
  padding-right: ${props => props.showActions ? '70px' : '40px'}; // Espacio para los botones/badges
`;

const SearchResultImage = styled.div`
  width: 40px;
  height: 40px;
  background-image: ${props => props.image ? `url(${props.image})` : 'linear-gradient(#333, #222)'};
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  flex-shrink: 0;
`;

const SearchResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TrackName = styled.div`
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArtistName = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MessageContent = styled.div`
  flex: 1;
`;

const MessageFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const Timestamp = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
`;

// Nuevo componente para mostrar la etiqueta de IA
const AIBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(90deg, #7e57c2, #1db954);
  color: white;
  font-size: 9px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 10;
`;

// Botón para añadir a la cola
const AddToQueueButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  right: 8px;
  bottom: 8px;
  background: #1DB954;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.9;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Estilo para el tooltips explicativo
const TrackTooltip = styled.div`
  position: absolute;
  background-color: #282828;
  border: 1px solid #444;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  width: 200px;
  color: white;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 5px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  ${SearchResultItem}:hover & {
    opacity: 1;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #444 transparent transparent transparent;
  }
`;

const formatTime = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Componente individual para cada resultado de búsqueda
const SearchResultCard = ({ track, isAI, aiSuggestion }) => {
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const { getCurrentPlayingTrack } = useAssistant(); // Acceder al contexto del asistente
  
  const handleAddToQueue = async (trackUri) => {
    if (isAddingToQueue) return;
    
    setIsAddingToQueue(true);
    try {
      await spotifyService.addToQueue(trackUri);
      // Mostrar feedback al usuario con toast
      toast.success(
        <div>
          <strong>{track.name}</strong> de {track.artist} <br/>
          añadida a la cola
        </div>,
        {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        }
      );
      console.log('Canción añadida a la cola exitosamente');
      
      // Actualizar automáticamente la lista de reproducción
      await getCurrentPlayingTrack();
    } catch (error) {
      console.error('Error al añadir a la cola:', error);
    } finally {
      setIsAddingToQueue(false);
    }
  };
  
  return (
    <SearchResultItem showActions={true}>
      <SearchResultImage image={track.image} />
      <SearchResultInfo>
        <TrackName>{track.name}</TrackName>
        <ArtistName>{track.artist}</ArtistName>
      </SearchResultInfo>
      
      {isAI && (
        <>
          <AIBadge>
            <FiZap size={10} />
            IA
          </AIBadge>
          <TrackTooltip>
            Recomendación generada por IA basada en tus gustos y contexto musical.
          </TrackTooltip>
        </>
      )}
      
      {track.uri && (
        <AddToQueueButton 
          onClick={() => handleAddToQueue(track.uri)}
          disabled={isAddingToQueue}
          title="Añadir a la cola"
        >
          <FiPlus size={14} />
        </AddToQueueButton>
      )}
    </SearchResultItem>
  );
};

const Message = ({ text, sender, timestamp, searchResults, action, parameters }) => {
  const isUser = sender === 'user';
  const isAIRecommendation = searchResults?.aiSuggestions && searchResults.tracks;
  
  return (
    <MessageContainer isUser={isUser}>
      <MessageBubble isUser={isUser}>
        <MessageContent>
          {text}
          
          {searchResults && searchResults.tracks && searchResults.tracks.length > 0 && (
            <SearchResultsContainer>
              {searchResults.tracks.map((track, index) => {
                // Buscar la sugerencia original de la IA si existe
                const aiSuggestion = isAIRecommendation 
                  ? searchResults.aiSuggestions.find(s => 
                      (s.song === track.name || s.song?.toLowerCase() === track.name.toLowerCase()) && 
                      (s.artist === track.artist || s.artist?.toLowerCase() === track.artist.toLowerCase())
                    )
                  : null;
                
                return (
                  <SearchResultCard 
                    key={index}
                    track={track}
                    isAI={isAIRecommendation}
                    aiSuggestion={aiSuggestion}
                  />
                );
              })}
            </SearchResultsContainer>
          )}
        </MessageContent>
        
        <MessageFooter>
          <Timestamp>{formatTime(timestamp)}</Timestamp>
          {!isUser && (
            <FeedbackButton 
              message={text} 
              action={action} 
              parameters={parameters} 
            />
          )}
        </MessageFooter>
      </MessageBubble>
    </MessageContainer>
  );
};

export default Message;