import React from 'react';
import styled from 'styled-components';
import { FiMusic } from 'react-icons/fi';

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

const Timestamp = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  text-align: right;
`;

const formatTime = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Message = ({ text, sender, timestamp, searchResults }) => {
  const isUser = sender === 'user';
  
  return (
    <MessageContainer isUser={isUser}>
      <MessageBubble isUser={isUser}>
        {text}
        
        {searchResults && searchResults.tracks && searchResults.tracks.length > 0 && (
          <SearchResultsContainer>
            {searchResults.tracks.map((track, index) => (
              <SearchResultItem key={index}>
                <SearchResultImage image={track.image} />
                <SearchResultInfo>
                  <TrackName>{track.name}</TrackName>
                  <ArtistName>{track.artist}</ArtistName>
                </SearchResultInfo>
              </SearchResultItem>
            ))}
          </SearchResultsContainer>
        )}
        
        <Timestamp>{formatTime(timestamp)}</Timestamp>
      </MessageBubble>
    </MessageContainer>
  );
};

export default Message;
