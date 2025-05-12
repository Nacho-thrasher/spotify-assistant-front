import React, { useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Message from '../ui/Message';
import MessageInput from '../ui/MessageInput';
import { useAssistant } from '../../contexts/AssistantContext';
import { FiMusic, FiTrash2 } from 'react-icons/fi';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  position: relative;
`;

const ClearHistoryButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(51, 51, 51, 0.85);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background-color: #e74c3c;
    transform: scale(1.1);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #666;
    border-radius: 4px;
  }
`;

const InputContainer = styled.div`
  padding: 0 20px 20px 20px;
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
`;

const DotContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  background-color: #1DB954;
  border-radius: 50%;
  display: inline-block;
  animation: ${bounce} 1.4s infinite ease-in-out both;
  animation-delay: ${props => props.delay};
`;

const TypingIndicator = styled.div`
  color: #1DB954;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
  margin-bottom: 10px;
  background-color: rgba(29, 185, 84, 0.1);
  padding: 8px 15px;
  border-radius: 18px;
  width: fit-content;
  box-shadow: 0 2px 10px rgba(29, 185, 84, 0.2);
`;

const ChatLayout = () => {
  const { messages, isProcessing, sendMessage, clearChatHistory } = useAssistant();
  const messagesEndRef = useRef(null);

  // Desplazarse automáticamente al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Manejar clic en el botón de limpiar historial
  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el historial del chat?')) {
      clearChatHistory();
    }
  };
  
  return (
    <ChatContainer>
      {messages.length > 1 && (
        <ClearHistoryButton onClick={handleClearHistory} title="Limpiar historial">
          <FiTrash2 size={16} />
        </ClearHistoryButton>
      )}
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message
            key={index}
            text={message.content}
            sender={message.role}
            timestamp={message.timestamp}
            searchResults={message.searchResults}
            action={message.action}
            parameters={message.parameters}
          />
        ))}
        {isProcessing && (
          <TypingIndicator>
            <FiMusic size={18} />
            <span>El asistente está procesando</span>
            <DotContainer>
              <Dot delay="0s" />
              <Dot delay="0.2s" />
              <Dot delay="0.4s" />
            </DotContainer>
          </TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <MessageInput
          onSend={sendMessage}
          disabled={isProcessing}
        />
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatLayout;
