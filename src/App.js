import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AssistantContextProvider } from './contexts/AssistantContext';
import AppLayout from './components/layouts/AppLayout';
import LoginLayout from './components/layouts/LoginLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importar estilos del dashboard de historial
import './styles/UserHistoryDashboard.css';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginLayout />;
  }

  return (
    <AssistantContextProvider>
      <AppLayout />
    </AssistantContextProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        {/* Sistema de notificaciones toast desactivado por preferencia del usuario */}
        {/* <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        /> */}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
