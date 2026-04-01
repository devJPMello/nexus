import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '';

if (import.meta.env.PROD && !clerkPublishableKey) {
  throw new Error(
    'Defina VITE_CLERK_PUBLISHABLE_KEY nas variáveis de ambiente do build (Railway → Variables).',
  );
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