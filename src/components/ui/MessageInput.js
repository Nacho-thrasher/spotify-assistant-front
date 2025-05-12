import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSend, FiMic } from 'react-icons/fi';
import Button from './Button';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #333333;
  border-radius: 30px;
  padding: 4px 4px 4px 16px;
  margin-top: 16px;
  border: 1px solid #444444;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  padding: 12px 8px;
  outline: none;

  &::placeholder {
    color: #888888;
  }
`;

const SendButton = styled(Button)`
  height: 40px;
  width: 40px;
  padding: 0;
  border-radius: 50%;
  margin-left: 8px;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MessageInput = ({ onSend, disabled = false, placeholder = "Pregúntale algo a tu asistente..." }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <SendButton 
          type="submit" 
          primary 
          disabled={!message.trim() || disabled}
          title="Enviar mensaje"
        >
          <IconContainer>
            <FiSend />
          </IconContainer>
        </SendButton>
      </InputContainer>
    </form>
  );
};

export default MessageInput;
