import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, 
         FormControl, InputLabel, Select, MenuItem, TextField, 
         Typography, IconButton, Tooltip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CloseIcon from '@mui/icons-material/Close';
import { sendPositiveFeedback, sendCorrection } from '../../services/socket';

/**
 * Componente para recopilar feedback del usuario sobre las respuestas del asistente
 */
const FeedbackButton = ({ message, action, parameters }) => {
  const [open, setOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [correctedAction, setCorrectedAction] = useState('');
  const [correctedQuery, setCorrectedQuery] = useState('');
  
  // Lista de acciones posibles para corregir
  const availableActions = [
    { value: 'play', label: 'Reproducir música' },
    { value: 'pause', label: 'Pausar reproducción' },
    { value: 'resume', label: 'Reanudar reproducción' },
    { value: 'next', label: 'Siguiente canción' },
    { value: 'previous', label: 'Canción anterior' },
    { value: 'queue', label: 'Añadir a la cola' },
    { value: 'multi_queue', label: 'Añadir múltiples canciones a la cola' },
    { value: 'volume', label: 'Ajustar volumen' },
    { value: 'search', label: 'Buscar música' },
    { value: 'clear_queue', label: 'Limpiar cola' },
    { value: 'recommendations', label: 'Recomendaciones' },
    { value: 'get_info', label: 'Obtener información' }
  ];
  
  // Abrir el diálogo de feedback negativo
  const handleNegativeFeedback = () => {
    setOpen(true);
    setCorrectedAction(action || '');
    setCorrectedQuery(parameters?.query || '');
  };
  
  // Enviar feedback positivo
  const handlePositiveFeedback = () => {
    sendPositiveFeedback(message, action, parameters);
    
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  };
  
  // Cerrar el diálogo
  const handleClose = () => {
    setOpen(false);
  };
  
  // Enviar la corrección
  const handleSubmit = () => {
    // Preparar los parámetros corregidos según la acción
    let correctedParameters = {};
    
    if (['play', 'queue', 'search'].includes(correctedAction)) {
      correctedParameters = { query: correctedQuery };
    } else if (correctedAction === 'multi_queue') {
      // Dividir por comas para múltiples canciones
      const queries = correctedQuery.split(',').map(q => q.trim()).filter(q => q);
      correctedParameters = { queries };
    } else if (correctedAction === 'volume') {
      // Intentar extraer un número para el volumen
      const volumeMatch = correctedQuery.match(/\d+/);
      const volumeLevel = volumeMatch ? parseInt(volumeMatch[0]) : 50;
      correctedParameters = { level: volumeLevel };
    }
    
    // Enviar la corrección al servidor
    sendCorrection(message, action, correctedAction, correctedParameters);
    
    setOpen(false);
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  };
  
  // Renderizar campos adicionales según la acción seleccionada
  const renderActionFields = () => {
    if (['play', 'queue', 'search'].includes(correctedAction)) {
      return (
        <TextField
          autoFocus
          margin="dense"
          id="query"
          label="¿Qué querías buscar o reproducir?"
          type="text"
          fullWidth
          variant="outlined"
          value={correctedQuery}
          onChange={(e) => setCorrectedQuery(e.target.value)}
        />
      );
    } else if (correctedAction === 'multi_queue') {
      return (
        <TextField
          autoFocus
          margin="dense"
          id="queries"
          label="Canciones separadas por comas"
          type="text"
          fullWidth
          variant="outlined"
          value={correctedQuery}
          onChange={(e) => setCorrectedQuery(e.target.value)}
          helperText="Ejemplo: Bohemian Rhapsody, Stairway to Heaven, Hotel California"
        />
      );
    } else if (correctedAction === 'volume') {
      return (
        <TextField
          autoFocus
          margin="dense"
          id="volume"
          label="Nivel de volumen (0-100)"
          type="number"
          fullWidth
          variant="outlined"
          value={correctedQuery}
          onChange={(e) => setCorrectedQuery(e.target.value)}
          inputProps={{ min: 0, max: 100 }}
        />
      );
    }
    
    return null;
  };
  
  return (
    <div style={{ display: 'inline-block', marginLeft: '8px' }}>
      {/* Botones de feedback */}
      <Tooltip title="Me gustó esta respuesta">
        <IconButton 
          size="small" 
          color={feedbackSent ? "success" : "default"}
          onClick={handlePositiveFeedback}
        >
          <ThumbUpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="No entendió lo que quería">
        <IconButton 
          size="small" 
          color="default"
          onClick={handleNegativeFeedback}
        >
          <ThumbDownIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      {/* Diálogo de feedback negativo */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ayúdanos a mejorar
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Tu mensaje: "{message}"
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            El asistente lo interpretó como: {action || "No reconocido"}
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="corrected-action-label">¿Qué querías hacer realmente?</InputLabel>
            <Select
              labelId="corrected-action-label"
              id="corrected-action"
              value={correctedAction}
              label="¿Qué querías hacer realmente?"
              onChange={(e) => setCorrectedAction(e.target.value)}
            >
              {availableActions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {renderActionFields()}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!correctedAction}
          >
            Enviar corrección
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FeedbackButton;
