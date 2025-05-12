import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatLayout from '../components/layouts/ChatLayout';
import UserHistoryDashboard from '../components/UserHistoryDashboard';

/**
 * Router principal de la aplicación
 * Define las rutas disponibles para usuarios autenticados
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Ruta principal - Chat con el asistente */}
      <Route path="/" element={<ChatLayout />} />
      
      {/* Ruta para el historial del usuario */}
      <Route path="/history" element={<UserHistoryDashboard />} />
    </Routes>
  );
};

export default AppRouter;
