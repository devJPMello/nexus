import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import './Sidebar.css';
import { BRANDING } from '../constants/brandingUrls';
import { getBackendAgentType } from '../constants/agentTypes';


const Sidebar = ({ isOpen, onToggle, onSelectAgent, currentAgent, onBackToDashboard, onOpenSettings }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const profileMenuRef = useRef(null);

  const agents = [
    { 
      id: 'geral', 
      title: "Chat Geral", 
      icon: (
        <img 
          src={BRANDING.escreva} 
          alt="Escreva" 
          width="16" 
          height="16"
          style={{ objectFit: 'contain' }}
        />
      ),
      color: "#10B981"
    },
    { 
      id: 'study-plan', 
      title: "Plano de Estudos", 
      icon: (
        <img 
          src={BRANDING.mapeamento} 
          alt="Mapeamento da Mente" 
          width="16" 
          height="16"
          style={{ objectFit: 'contain' }}
        />
      ),
      color: "#8B5CF6"
    },
    {
      id: 'summaries',
      title: "Resumos",
      icon: (
        <img 
          src={BRANDING.contrato} 
          alt="Contrato" 
          width="16" 
          height="16"
          style={{ objectFit: 'contain' }}
        />
      ),
      color: "#06B6D4"
    }
  ];

  const communityAgents = [
    { 
      id: 'social-media', 
      title: "Redes Sociais", 
      icon: (
        <img 
          src={BRANDING.comunidade} 
          alt="Comunidade" 
          width="16" 
          height="16"
          style={{ objectFit: 'contain' }}
        />
      ),
      color: "#F59E0B"
    }
  ];

  // Função para obter iniciais do nome
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    if (isOpen) {
      setShowProfileMenu(!showProfileMenu);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSettings = () => {
    setShowProfileMenu(false);
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    // Adicionar listener quando o menu estiver aberto
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Fechar menu quando a sidebar fechar
  useEffect(() => {
    if (!isOpen) {
      setShowProfileMenu(false);
    }
  }, [isOpen]);

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon" onClick={onBackToDashboard} style={{ cursor: 'pointer' }}>
              <img
                src={BRANDING.logoWhite}
                alt="Nexus AI Logo"
                className="logo-image"
              />
            </div>
          </div>
        </div>

        {/* Agents Section */}
        <div className="agents-section">
          <div className="section-header">
            <h3 className="section-title">Agentes</h3>
            <button className="sidebar-toggle-btn" onClick={onToggle} title={isOpen ? 'Fechar sidebar' : 'Abrir sidebar'}>
              {isOpen ? (
                <img src={BRANDING.arrowLeft} alt="Fechar sidebar" className="arrow-icon" />
              ) : (
                <img src={BRANDING.arrowRight} alt="Abrir sidebar" className="arrow-icon" />
              )}
            </button>
          </div>
          {agents.map((agent) => (
            <button
              key={agent.id}
              className={`agent-item ${currentAgent === agent.id ? 'active' : ''}`}
              onClick={() => {
                const backendAgentType = getBackendAgentType(agent.id);
                onSelectAgent(agent.id, backendAgentType);
              }}
              style={{ '--agent-color': agent.color }}
            >
              <span className="agent-icon" style={{ color: agent.color }}>
                {agent.icon}
              </span>
              <span className="agent-title">{agent.title}</span>
            </button>
          ))}

          {/* Comunidade Section */}
          {/* <div className="section-header" style={{ marginTop: '1.5rem' }}>
            <h3 className="section-title">Comunidade</h3>
          </div>
          {communityAgents.map((agent) => (
            <button
              key={agent.id}
              className={`agent-item disabled`}
              disabled
              style={{ '--agent-color': agent.color }}
            >
              <span className="agent-icon" style={{ color: agent.color, opacity: 0.5 }}>
                {agent.icon}
              </span>
              <div className="agent-text-container">
                <span className="agent-title" style={{ opacity: 0.5 }}>{agent.title}</span>
                <span className="coming-soon-text">Em breve...</span>
              </div>
            </button>
          ))} */}
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-container" ref={profileMenuRef}>
            <button className="profile-button" onClick={handleProfileClick}>
              <div className="user-avatar">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User'} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }}
                  />
                ) : (
                  getInitials(user?.fullName || user?.firstName)
                )}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user?.fullName || user?.firstName || 'Usuário'}
                </span>
                <span className="user-email">
                  {user?.primaryEmailAddress?.emailAddress || 'email@exemplo.com'}
                </span>
              </div>
              <svg
                className={`profile-arrow ${showProfileMenu ? 'rotated' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="1" fill="#f0f0f0"/>
                <circle cx="12" cy="5" r="1" fill="#f0f0f0"/>
                <circle cx="12" cy="19" r="1" fill="#f0f0f0"/>
              </svg>
            </button>
            
            {showProfileMenu && (
              <div className="profile-menu">
                <button className="profile-menu-item" onClick={handleSettings}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="#f0f0f0" strokeWidth="2"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#f0f0f0" strokeWidth="2"/>
                  </svg>
                  <span>Configurações</span>
                </button>
                <button className="profile-menu-item logout" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#f0f0f0" strokeWidth="2"/>
                    <polyline points="16,17 21,12 16,7" stroke="#f0f0f0" strokeWidth="2"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="#f0f0f0" strokeWidth="2"/>
                  </svg>
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;