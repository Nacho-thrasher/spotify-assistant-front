import React from 'react';
import styled from 'styled-components';
import { FiMusic } from 'react-icons/fi';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #121212 0%, #181818 100%);
  color: white;
  padding: 20px;
`;

const Logo = styled.div`
  font-size: 40px;
  color: #1DB954;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  svg {
    font-size: 60px;
    margin-bottom: 16px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 16px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #b3b3b3;
  margin-bottom: 32px;
  text-align: center;
  max-width: 500px;
`;

const LoginButton = styled(Button)`
  font-size: 16px;
  padding: 14px 30px;
`;

const LoginLayout = () => {
  const { login } = useAuth();

  return (
    <LoginContainer>
      <Logo>
        <FiMusic />
        Asistente de Spotify
      </Logo>
      <Title>Control por voz inteligente</Title>
      <Subtitle>
        Controla tu música con comandos en lenguaje natural. Pide canciones, crea playlists,
        ajusta el volumen y mucho más, todo con simples mensajes.
      </Subtitle>
      <LoginButton primary onClick={login}>
        Conectar con Spotify
      </LoginButton>
    </LoginContainer>
  );
};

export default LoginLayout;
