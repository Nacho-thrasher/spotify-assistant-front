import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import API from '../services/api';
import Button from './ui/Button';

const ProfileContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h1 {
    color: #1DB954;
    font-size: 2rem;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const ProfileCard = styled.div`
  background-color: #282828;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    svg {
      color: #1DB954;
      font-size: 40px;
    }
  }
  
  .info {
    flex: 1;
    
    h2 {
      margin: 0 0 5px 0;
      font-size: 1.5rem;
    }
    
    p {
      margin: 0;
      color: #b3b3b3;
    }
  }
`;

const ActionButton = styled(Button)`
  margin-top: 10px;
  width: 100%;
  background-color: ${props => props.danger ? '#e01e5a' : '#1DB954'};
  
  &:hover {
    background-color: ${props => props.danger ? '#c01c54' : '#1aa34a'};
  }
`;

const StatsCard = styled(ProfileCard)`
  margin-top: 20px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 15px;
  background-color: #333;
  border-radius: 6px;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 2rem;
    color: #1DB954;
  }
  
  p {
    margin: 0;
    color: #b3b3b3;
    font-size: 0.9rem;
  }
`;

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await API.get('/user/profile');
        setUserProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        setError('No se pudo cargar la información del perfil');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      // Redirigir a la página de inicio de sesión
      window.location.href = '/login';
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      // Forzar logout aunque haya error
      localStorage.removeItem('spotify_access_token');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <ProfileContainer>
        <ProfileHeader>
          <h1>Cargando perfil...</h1>
        </ProfileHeader>
      </ProfileContainer>
    );
  }

  if (error) {
    return (
      <ProfileContainer>
        <ProfileHeader>
          <h1>Perfil</h1>
        </ProfileHeader>
        <ProfileCard>
          <p>{error}</p>
          <ActionButton danger onClick={handleLogout}>
            <FiLogOut /> Cerrar Sesión
          </ActionButton>
        </ProfileCard>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <h1>Tu Perfil</h1>
      </ProfileHeader>
      
      <ProfileCard>
        <ProfileInfo>
          <div className="avatar">
            {userProfile?.images?.[0]?.url ? (
              <img src={userProfile.images[0].url} alt="Foto de perfil" />
            ) : (
              <FiUser />
            )}
          </div>
          <div className="info">
            <h2>{userProfile?.display_name || 'Usuario de Spotify'}</h2>
            <p>{userProfile?.email || ''}</p>
            <p>Plan: {userProfile?.product === 'premium' ? 'Premium' : 'Free'}</p>
          </div>
        </ProfileInfo>
        
        <ActionButton danger onClick={handleLogout}>
          <FiLogOut /> Cerrar Sesión
        </ActionButton>
      </ProfileCard>
      
      <StatsCard>
        <h2>Estadísticas</h2>
        <StatGrid>
          <StatItem>
            <h3>{userProfile?.followers?.total || 0}</h3>
            <p>Seguidores</p>
          </StatItem>
          <StatItem>
            <h3>-</h3>
            <p>Días activo</p>
          </StatItem>
          <StatItem>
            <h3>-</h3>
            <p>Canciones reproducidas</p>
          </StatItem>
        </StatGrid>
      </StatsCard>
    </ProfileContainer>
  );
};

export default Profile;
