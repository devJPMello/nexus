import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import ChatInterface from '../components/chat/ChatInterface';
import LoginScreen from '../pages/login.jsx';
import WelcomeAnimation from '../components/WelcomeAnimation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (isSignedIn && isLoaded && userLoaded) {
      // Sempre mostrar a animação ao fazer login
      setShowWelcome(true);
    }
  }, [isSignedIn, isLoaded, userLoaded]);

  if (!isLoaded || !userLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        background: '#212121',
        color: '#ffffff'
      }}>
        Carregando...
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  if (showWelcome && !hasShownWelcome) {
    const userName = user?.firstName || user?.username || 'Usuário';

    return (
      <WelcomeAnimation
        userName={userName}
        onComplete={() => {
          setShowWelcome(false);
          setHasShownWelcome(true);
        }}
      />
    );
  }

  return children;
};

// Public Route Component (redirects to home if already signed in)
const PublicRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    );
  }

  return isSignedIn ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginScreen />
          </PublicRoute>
        } 
      /> 
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={
        <div className="not-found" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center'
        }}>
          <h2>404 - Página não encontrada</h2>
          <p>A página que você está procurando não existe.</p>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes;