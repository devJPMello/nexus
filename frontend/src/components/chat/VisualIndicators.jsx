import React from 'react';
import './VisualIndicators.css';

// Componente para indicador de "digitando..."
export const TypingIndicator = ({ message = "Digitando..." }) => {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span className="typing-text">{message}</span>
    </div>
  );
};

// Componente para indicador de processamento
export const ProcessingIndicator = ({ message = "Processando..." }) => {
  return (
    <div className="processing-indicator">
      <div className="processing-spinner"></div>
      <span className="processing-text">{message}</span>
    </div>
  );
};

// Componente para indicador de atualização do plano
export const PlanUpdateIndicator = ({ 
  progress = 0, 
  message = "Atualizando plano...", 
  currentStep = "",
  totalSteps = 5,
  isComplete = false 
}) => {
  return (
    <div className={`plan-update-indicator ${isComplete ? 'complete' : ''}`}>
      <div className="plan-update-header">
        <div className="plan-update-icon">
          {isComplete ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#f0f0f0" strokeWidth="2"/>
            </svg>
          ) : (
            <div className="plan-update-spinner"></div>
          )}
        </div>
        <div className="plan-update-content">
          <span className="plan-update-text">{message}</span>
          {currentStep && (
            <span className="plan-update-step">Passo {currentStep} de {totalSteps}</span>
          )}
        </div>
      </div>
      <div className="plan-progress-bar">
        <div 
          className="plan-progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="plan-progress-text">
        {isComplete ? 'Plano atualizado com sucesso!' : `${progress}% concluído`}
      </div>
    </div>
  );
};

// Componente para indicador de status da API
export const ApiStatusIndicator = ({ status = 'loading', message }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: '⏳',
          text: message || 'Conectando...'
        };
      case 'success':
        return {
          icon: '✅',
          text: message || 'Conectado'
        };
      case 'error':
        return {
          icon: '❌',
          text: message || 'Erro de conexão'
        };
      default:
        return {
          icon: '⚪',
          text: message || 'Desconectado'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`api-status-indicator ${status}`}>
      <span className="api-status-icon">{config.icon}</span>
      <span className="api-status-text">{config.text}</span>
    </div>
  );
};

// Componente para indicador de carregamento geral
export const LoadingIndicator = ({ size = 'medium', message = 'Carregando...' }) => {
  return (
    <div className={`loading-indicator ${size}`}>
      <div className={`loading-spinner ${size}`}></div>
      <span className={`loading-text ${size}`}>{message}</span>
    </div>
  );
};

// Componente para indicador de análise de dados
export const AnalysisIndicator = ({ message = "Analisando dados...", progress = 0 }) => {
  return (
    <div className="analysis-indicator">
      <div className="analysis-header">
        <div className="analysis-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 19c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z" stroke="#f0f0f0" strokeWidth="2"/>
            <path d="M9 9h6v6H9z" stroke="#f0f0f0" strokeWidth="2"/>
          </svg>
        </div>
        <span className="analysis-text">{message}</span>
      </div>
      <div className="analysis-progress">
        <div className="analysis-dots">
          <div className="analysis-dot"></div>
          <div className="analysis-dot"></div>
          <div className="analysis-dot"></div>
        </div>
        {progress > 0 && (
          <div className="analysis-progress-bar">
            <div 
              className="analysis-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para indicador de otimização
export const OptimizationIndicator = ({ message = "Otimizando configurações...", step = 1, totalSteps = 3 }) => {
  return (
    <div className="optimization-indicator">
      <div className="optimization-header">
        <div className="optimization-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#f0f0f0" strokeWidth="2"/>
          </svg>
        </div>
        <div className="optimization-content">
          <span className="optimization-text">{message}</span>
          <span className="optimization-step">Etapa {step} de {totalSteps}</span>
        </div>
      </div>
      <div className="optimization-steps">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div 
            key={i} 
            className={`optimization-step-dot ${i < step ? 'active' : i === step - 1 ? 'current' : ''}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Componente para indicador de validação
export const ValidationIndicator = ({ message = "Validando informações...", checks = [] }) => {
  return (
    <div className="validation-indicator">
      <div className="validation-header">
        <div className="validation-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#f0f0f0" strokeWidth="2"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="#f0f0f0" strokeWidth="2"/>
          </svg>
        </div>
        <span className="validation-text">{message}</span>
      </div>
      {checks.length > 0 && (
        <div className="validation-checks">
          {checks.map((check, index) => (
            <div key={index} className={`validation-check ${check.completed ? 'completed' : 'pending'}`}>
              <div className="validation-check-icon">
                {check.completed ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#f0f0f0" strokeWidth="2"/>
                  </svg>
                ) : (
                  <div className="validation-check-spinner"></div>
                )}
              </div>
              <span className="validation-check-text">{check.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default {
  TypingIndicator,
  ProcessingIndicator,
  PlanUpdateIndicator,
  ApiStatusIndicator,
  LoadingIndicator,
  AnalysisIndicator,
  OptimizationIndicator,
  ValidationIndicator
};
