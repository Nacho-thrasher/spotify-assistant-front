import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  background-color: ${(props) => (props.primary ? '#1DB954' : '#333333')};
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: ${(props) => (props.primary ? '#1ED760' : '#444444')};
    transform: scale(1.03);
  }

  &:disabled {
    background-color: #888888;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const Button = ({ 
  children, 
  primary = false, 
  disabled = false, 
  onClick,
  ...rest 
}) => {
  return (
    <StyledButton 
      primary={primary} 
      disabled={disabled} 
      onClick={onClick}
      {...rest}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
