import React, { useState, useEffect } from 'react';
import { 
  getUserHistory, 
  getMostUsedCommands, 
  getMostPlayedArtists,
  clearUserHistory 
} from '../services/historyService';

/**
 * Dashboard para visualizar el historial y estadísticas del usuario
 * Muestra los comandos más utilizados, artistas favoritos y acciones recientes
 */
const UserHistoryDashboard = () => {
  // Estados para los datos
  const [history, setHistory] = useState([]);
  const [commands, setCommands] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'commands', 'artists'
  const [clearingHistory, setClearingHistory] = useState(false);

  // Cargar datos del historial
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar los tres tipos de datos en paralelo
        const [historyData, commandsData, artistsData] = await Promise.all([
          getUserHistory(20),
          getMostUsedCommands(5),
          getMostPlayedArtists(5)
        ]);
        
        // Map artist IDs to actual names using a lookup table
        const artistNames = {
          '711MCceyCBcFnzjGY4Q7Un': 'AC/DC',
          '6eUKZXaKkcviH0Ku9w2n3V': 'Ed Sheeran',
          '5eAWCfyUhZtHHtBdNk56l1': 'System Of A Down',
          '3MBsBdBhmIj9OJGTF6uL': 'TOTO',
          '5Pwc4xIPtQLFEnJriah9YJ': 'OneRepublic',
          '0UF7XLthtbSF2Eur7559oV': 'Coldplay'
        };
        
        // Add artist names to the artist data
        const enhancedArtistsData = artistsData.map(artist => ({
          ...artist,
          artistName: artistNames[artist.artistId] || `Artista ${artist.artistId.substring(0, 8)}`
        }));
        
        setHistory(historyData);
        setCommands(commandsData);
        setArtists(enhancedArtistsData);
      } catch (err) {
        console.error('Error al cargar datos del historial:', err);
        setError('No se pudo cargar tu historial. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Función para formatear la fecha
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Función para limpiar el historial
  const handleClearHistory = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todo tu historial? Esta acción no se puede deshacer.')) {
      try {
        setClearingHistory(true);
        await clearUserHistory();
        
        // Resetear todos los datos
        setHistory([]);
        setCommands([]);
        setArtists([]);
        
        alert('Historial eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar historial:', err);
        alert('Ocurrió un error al eliminar tu historial.');
      } finally {
        setClearingHistory(false);
      }
    }
  };
  
  // Renderizar mensaje de carga o error
  if (loading) {
    return (
      <div className="user-history-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu historial...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="user-history-dashboard error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  
  // Renderizar mensajes cuando no hay datos
  if (!loading && !error && history.length === 0 && commands.length === 0 && artists.length === 0) {
    return (
      <div className="user-history-dashboard empty">
        <h2>Sin historial</h2>
        <p>Aún no tienes historial de uso. Comienza a usar el asistente para ver tus estadísticas aquí.</p>
      </div>
    );
  }
  
  // Estilos CSS para el componente
  const styles = {
    scrollableList: {
      maxHeight: '400px',
      overflowY: 'auto',
      padding: '0',
      margin: '0',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    historyItem: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s ease'
    },
    artistItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      marginBottom: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },
    artistRank: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: '#1DB954',
      color: '#000',
      marginRight: '16px',
      fontWeight: 'bold'
    }
  };
  
  return (
    <div className="user-history-dashboard">
      <div className="dashboard-header">
        <h2>Tu actividad en Spotify Assistant</h2>
        <button 
          className="clear-history-button" 
          onClick={handleClearHistory} 
          disabled={clearingHistory}
        >
          {clearingHistory ? 'Eliminando...' : 'Eliminar historial'}
        </button>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial reciente
        </button>
        <button 
          className={`tab ${activeTab === 'commands' ? 'active' : ''}`}
          onClick={() => setActiveTab('commands')}
        >
          Comandos frecuentes
        </button>
        <button 
          className={`tab ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => setActiveTab('artists')}
        >
          Artistas favoritos
        </button>
      </div>
      
      <div className="dashboard-content">
        {/* Historial reciente */}
        {activeTab === 'history' && (
          <div className="history-list" style={{ height: '500px', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <h3>Historial reciente</h3>
            {history.length > 0 ? (
              <ul className="scrollable-list" style={{ 
                flex: 1,
                overflowY: 'auto',
                listStyleType: 'none',
                padding: '0 0 20px 0', // Added bottom padding inside scroll area
                margin: '0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px'
              }}>
                {history.map((item, index) => (
                  <li key={`history-${index}`} className={`history-item type-${item.type}`} style={styles.historyItem}>
                    <div className="history-meta">
                      <span className="history-time">{formatDate(item.timestamp)}</span>
                      <span className="history-type">{item.type}</span>
                    </div>
                    <div className="history-content">
                      {item.type === 'command' && (
                        <>
                          <div className="command-action">Comando: <strong>{item.data.command}</strong></div>
                          <div className="user-message">"{item.data.userMessage}"</div>
                          <div className="response-message">"{item.data.responseMessage}"</div>
                        </>
                      )}
                      
                      {item.type === 'playback' && (
                        <>
                          <div className="track-info">
                            {item.data.trackName} • {item.data.artistName}
                          </div>
                          <div className="playback-action">{item.data.action || 'play'}</div>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">No hay historial reciente disponible.</p>
            )}
          </div>
        )}
        
        {/* Comandos más usados */}
        {activeTab === 'commands' && (
          <div className="commands-stats" style={{ height: '400px', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <h3>Tus comandos más usados</h3>
            {commands.length > 0 ? (
              <div className="commands-chart" style={{ 
                flex: 1,
                overflowY: 'auto',
                padding: '0 10px 20px 10px',
                margin: '0',
                borderRadius: '4px'
              }}>
                {commands.map((command, index) => (
                  <div key={`command-${index}`} className="command-bar">
                    <div className="command-name">{command.command}</div>
                    <div className="command-bar-container">
                      <div 
                        className="command-bar-fill" 
                        style={{ 
                          width: `${(command.count / Math.max(...commands.map(c => c.count))) * 100}%` 
                        }}
                      ></div>
                      <span className="command-count">{command.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No hay datos de comandos disponibles.</p>
            )}
          </div>
        )}
        
        {/* Artistas favoritos */}
        {activeTab === 'artists' && (
          <div className="artists-stats" style={{ height: '400px', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <h3>Tus artistas favoritos</h3>
            {artists.length > 0 ? (
              <div className="artists-list" style={{ 
                flex: 1,
                overflowY: 'auto',
                padding: '0 10px 20px 10px', 
                margin: '0',
                borderRadius: '4px'
              }}>
                {artists.map((artist, index) => (
                  <div key={`artist-${index}`} className="artist-item" style={styles.artistItem}>
                    <span className="artist-rank" style={styles.artistRank}>{index + 1}</span>
                    <div className="artist-info">
                      {/* Intentar mostrar nombres de artistas si están disponibles,
                          de lo contrario, mostrar un mensaje más amigable con el ID acortado */}
                      <span className="artist-name">
                        {artist.artistName || 
                         `Artista ${artist.artistId.substring(0, 10)}...`}
                      </span>
                      <span className="artist-plays">{artist.count} reproducciones</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No hay datos de artistas disponibles.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistoryDashboard;
