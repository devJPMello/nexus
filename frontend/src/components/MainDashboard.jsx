import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import './MainDashboard.css';
import { BRANDING } from '../constants/brandingUrls';
import { getBackendAgentType } from '../constants/agentTypes';
import MessageInput from './MessageInput';

const MainDashboard = ({ onSelectAgent, onToggleSidebar, sidebarOpen, onSendMessage }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const cardsRef = useRef([]);
  const iconsRef = useRef([]);
  const hasAnimated = useRef(false);

  const agents = [
    {
      id: 'study-plan',
      title: 'Plano de Estudos',
      description: 'Crie um plano personalizado de estudos baseado nos seus objetivos e disponibilidade.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)'
    },
    {
      id: 'summaries',
      title: 'Resumos',
      description: 'Gere resumos automáticos de textos, artigos e documentos com IA avançada.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
          <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
    }
  ];

  const handleAgentSelect = (agentId) => {
    setSelectedAgent(agentId);
    const backendAgentType = getBackendAgentType(agentId);
    onSelectAgent(agentId, backendAgentType);
  };

  const handleSendMessageFromDashboard = (message, files = [], images = []) => {
    // Enviar mensagem diretamente com 'geral' como agentId
    // O handleSendMessage do ChatInterface já gerencia a mudança de agente e renderização imediata
    if (onSendMessage) {
      onSendMessage(message, files, images, 'geral');
    }
  };

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    anime({
      targets: cardsRef.current,
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.9, 1],
      duration: 800,
      delay: anime.stagger(150, { start: 300 }),
      easing: 'spring(1, 80, 10, 0)'
    });

    anime({
      targets: iconsRef.current,
      rotate: [0, 360],
      scale: [0, 1],
      duration: 1000,
      delay: anime.stagger(150, { start: 500 }),
      easing: 'easeOutElastic(1, .8)'
    });

    anime({
      targets: cardsRef.current,
      translateY: [-3, 3],
      duration: 3000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(200)
    });
  }, []);


  return (
    <div className="main-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="welcome-title">Bem vindo ao Nexus</h1>
            <p className="welcome-subtitle">Vamos fazer resumos e organizar seu plano de estudos?</p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="dashboard-cards">
          {/* Plano de Estudos Card */}
          <div
            className="dashboard-card agent-card"
            onClick={() => handleAgentSelect('study-plan')}
            ref={(el) => cardsRef.current[0] = el}
            style={{ opacity: 0 }}
          >
            <div className="card-header">
              <div className="card-title-section">
                <div
                  className="agent-icon"
                  ref={(el) => iconsRef.current[0] = el}
                >
                  <img
                    src={BRANDING.mapeamento}
                    alt="Mapeamento da Mente"
                    width="20"
                    height="20"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h3 className="card-title">Plano de Estudos</h3>
              </div>
              <div className="agent-status">
                <div className="status-dot"></div>
                <span>Disponível</span>
              </div>
            </div>
            <div className="card-content">
              <h4 className="agent-title">Crie um plano personalizado de estudos</h4>
              <p className="agent-description">Baseado nos seus objetivos e disponibilidade, organize seu aprendizado de forma eficiente.</p>
              <button
                className="agent-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgentSelect('study-plan');
                }}
              >
                <span>Iniciar conversa</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Resumos Card */}
          <div
            className="dashboard-card agent-card"
            onClick={() => handleAgentSelect('summaries')}
            ref={(el) => cardsRef.current[1] = el}
            style={{ opacity: 0 }}
          >
            <div className="card-header">
              <div className="card-title-section">
                <div
                  className="agent-icon"
                  ref={(el) => iconsRef.current[1] = el}
                >
                  <img
                    src={BRANDING.contrato}
                    alt="Contrato"
                    width="20"
                    height="20"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h3 className="card-title">Resumos</h3>
              </div>
              <div className="agent-status">
                <div className="status-dot"></div>
                <span>Disponível</span>
              </div>
            </div>
            <div className="card-content">
              <h4 className="agent-title">Gere resumos automáticos</h4>
              <p className="agent-description">De textos, artigos e documentos com IA avançada para otimizar seu tempo de estudo.</p>
              <button
                className="agent-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgentSelect('summaries');
                }}
              >
                <span>Iniciar conversa</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Input Section */}
        <div className="chat-input-section">
          <div className="input-container">
            <MessageInput
              onSendMessage={handleSendMessageFromDashboard}
              placeholder="Digite sua pergunta aqui..."
              disabled={false}
              isProcessing={false}
            />
          </div>
        </div>
      </div>
  );
};

export default MainDashboard;