import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '';
const viteApiUrl = import.meta.env.VITE_API_URL ?? '';

if (import.meta.env.PROD) {
  if (!clerkPublishableKey.trim()) {
    throw new Error(
      'Defina VITE_CLERK_PUBLISHABLE_KEY nas variáveis de ambiente do build (Render → Static Site → Environment).',
    );
  }
  if (!viteApiUrl.trim()) {
    throw new Error(
      'Defina VITE_API_URL no build (URL HTTPS do backend, ex.: https://nexus-backend.onrender.com).',
    );
  }
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <div className="app">
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </ClerkProvider>
  );
}

export default App;