import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '';
const viteApiUrl = import.meta.env.VITE_API_URL ?? '';

function ConfigError({ message }) {
  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: 520,
        margin: '2rem auto',
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1.5,
        color: '#e4e4e7',
        background: '#18181b',
        borderRadius: 8,
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginTop: 0 }}>Configuração em falta</h1>
      <p style={{ marginBottom: 0 }}>{message}</p>
      <p style={{ opacity: 0.75, fontSize: '0.9rem', marginTop: '1rem' }}>
        No Render: Static Site → Environment → novo deploy (o Vite só lê estas variáveis no build).
        Nomes exatos: <code>VITE_CLERK_PUBLISHABLE_KEY</code> e <code>VITE_API_URL</code>.
      </p>
    </div>
  );
}

function getProdConfigError() {
  if (!import.meta.env.PROD) return null;
  if (!clerkPublishableKey.trim()) {
    return (
      'Defina VITE_CLERK_PUBLISHABLE_KEY nas variáveis de ambiente do build (chave publishable do Clerk).'
    );
  }
  if (!viteApiUrl.trim()) {
    return 'Defina VITE_API_URL no build com a URL HTTPS do backend (ex.: https://teu-api.onrender.com).';
  }
  return null;
}

function App() {
  const configError = getProdConfigError();
  if (configError) {
    return <ConfigError message={configError} />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/login"
      signUpUrl="/login"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <div className="app">
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </ClerkProvider>
  );
}

export default App;