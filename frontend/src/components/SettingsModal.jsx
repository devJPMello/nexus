import { useState, useEffect } from 'react';
import { UserProfile } from '@clerk/clerk-react';
import apiService from '../services/api';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('geral');

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body quando modal estiver aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  // Função para limpar histórico de conversas
  const clearChatHistory = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.')) {
      try {
        // Limpar no backend
        const response = await apiService.clearAllHistory();
        
        if (response.success) {
          // Limpar no frontend (localStorage)
          localStorage.removeItem('chatHistory');
          localStorage.removeItem('threadIds');
          
          alert(`Histórico limpo com sucesso! ${response.deletedThreads} conversas e ${response.deletedMessages} mensagens foram removidas.`);
          window.location.reload(); // Recarrega a página para atualizar o estado
        }
      } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        // Mesmo com erro no backend, limpa o localStorage
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('threadIds');
        alert('Histórico local limpo. Houve um erro ao limpar no servidor, mas os dados locais foram removidos.');
        window.location.reload();
      }
    }
  };

  const downloadPrivacyPolicy = () => {
    const privacyPolicyHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade - Nexus</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #444;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    h2 {
      color: #444;
      border-bottom: 2px solid #5b8def;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    h3 {
      color: #444;
      margin-top: 25px;
    }
    a {
      color: #5b8def;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    ul {
      margin: 15px 0;
      padding-left: 30px;
    }
    li {
      margin: 8px 0;
    }
    p {
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <h2>Política Privacidade</h2>
  <p>A sua privacidade é importante para nós. É política do Nexus respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site <a href="">Nexus</a>, e outros sites que possuímos e operamos.</p>
  <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</p>
  <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
  <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</p>
  <p>O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas <a href="https://politicaprivacidade.com/" rel="noopener noreferrer" target="_blank">políticas de privacidade</a>.</p>
  <p>Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.</p>
  <p>O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.</p>
  <ul>
    <li>O serviço Google AdSense que usamos para veicular publicidade usa um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de vezes que um determinado anúncio é exibido para você.</li>
    <li>Para mais informações sobre o Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense.</li>
    <li>Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental usados ​​por este site foram projetados para garantir que você forneça os anúncios mais relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando coisas semelhantes que possam ser do seu interesse.</li>
    <li>Vários parceiros anunciam em nosso nome e os cookies de rastreamento de afiliados simplesmente nos permitem ver se nossos clientes acessaram o site através de um dos sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode fornecê-lo para fazer uma compra.</li>
  </ul>
  <h3>Compromisso do Usuário</h3>
  <p>O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Nexus oferece no site e com caráter enunciativo, mas não limitativo:</p>
  <ul>
    <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
    <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
    <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Nexus, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
  </ul>
  <h3>Mais informações</h3>
  <p>Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.</p>
  <p>Esta política é efetiva a partir de 11 November 2025 01:26</p>
</body>
</html>
    `;

    const blob = new Blob([privacyPolicyHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Termo-de-Responsabilidade-Nexus.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const categories = [
    { 
      id: 'geral', 
      label: 'Geral', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    },
    { 
      id: 'seguranca', 
      label: 'Segurança', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )
    },
    { 
      id: 'conta', 
      label: 'Conta', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
  ];

  return (
    <div className={`settings-modal ${isOpen ? 'open' : ''}`}>
      <div className="settings-overlay" onClick={onClose} />
      
      <div className="settings-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Sidebar de categorias */}
        <div className="settings-sidebar">
          <button 
            className="settings-close-button" 
            onClick={onClose}
            aria-label="Fechar configurações"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <nav className="settings-categories">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`settings-category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="settings-category-icon">
                  {category.icon}
                </span>
                <span className="settings-category-label">{category.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Área de conteúdo */}
        <div className="settings-content">
          {selectedCategory !== 'conta' && (
            <div className="settings-content-header">
              <h2 className="settings-content-title">
                {categories.find(cat => cat.id === selectedCategory)?.label || 'Configurações'}
              </h2>
            </div>
          )}

          <div className={`settings-content-body ${selectedCategory === 'conta' ? 'account-mode' : ''}`}>
            {selectedCategory === 'conta' ? (
              <div className="settings-account-section">
                <UserProfile 
                  appearance={{
                    elements: {
                      rootBox: {
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      card: {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        height: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'hidden',
                      },
                      navbar: {
                        backgroundColor: 'rgba(17, 20, 29, 0.4)',
                        borderRight: '1px solid rgba(61, 65, 82, 0.6)',
                        width: '240px',
                        maxWidth: '240px',
                        flexShrink: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                      },
                      userButton: {
                        backgroundColor: 'rgba(47, 50, 65, 0.6)',
                        color: '#f8fafc',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                        '&:hover': {
                          backgroundColor: 'rgba(47, 50, 65, 0.8)',
                        },
                      },
                      userPreview: {
                        backgroundColor: 'rgba(47, 50, 65, 0.6)',
                        color: '#f8fafc',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                      },
                      userPreviewTextContainer: {
                        color: '#f8fafc',
                      },
                      userPreviewMainIdentifier: {
                        color: '#f8fafc',
                      },
                      userPreviewSecondaryIdentifier: {
                        color: '#b8b8b8',
                      },
                      avatarBox: {
                        backgroundColor: 'rgba(91, 141, 239, 0.15)',
                        borderColor: 'rgba(91, 141, 239, 0.3)',
                      },
                      avatarImage: {
                        borderColor: 'rgba(91, 141, 239, 0.3)',
                      },
                      page: {
                        flex: 1,
                        minWidth: 0,
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        backgroundColor: 'rgba(17, 20, 29, 0.4)',
                      },
                      pageScrollBox: {
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        maxWidth: '100%',
                        padding: '32px',
                        backgroundColor: 'rgba(17, 20, 29, 0.4)',
                      },
                      navbarButton: {
                        color: '#f8fafc',
                        '&:hover': {
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#f8fafc',
                        },
                      },
                      navbarButtonActive: {
                        color: '#5b8def',
                        backgroundColor: 'rgba(91, 141, 239, 0.15)',
                      },
                      formButtonPrimary: {
                        backgroundColor: '#5b8def',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#f8fafc',
                        },
                      },
                      formButtonDanger: {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#f8fafc',
                          borderColor: 'rgba(61, 65, 82, 0.6)',
                        },
                      },
                      formButtonSecondary: {
                        backgroundColor: 'transparent',
                        color: '#5b8def',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#f8fafc',
                        },
                      },
                      formFieldInput: {
                        backgroundColor: 'rgba(47, 50, 65, 0.6)',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                        color: '#f8fafc',
                        '&:focus': {
                          borderColor: '#5b8def',
                        },
                      },
                      formFieldLabel: {
                        color: '#f8fafc',
                      },
                      headerTitle: {
                        color: '#f8fafc',
                      },
                      headerSubtitle: {
                        color: '#f8fafc',
                      },
                      identityPreview: {
                        backgroundColor: 'rgba(47, 50, 65, 0.6)',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                      },
                      identityPreviewText: {
                        color: '#f8fafc',
                      },
                      identityPreviewEditButton: {
                        color: '#5b8def',
                      },
                      accordionTriggerButton: {
                        color: '#f8fafc',
                        '&:hover': {
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#f8fafc',
                        },
                      },
                      accordionContent: {
                        color: '#f8fafc',
                      },
                      badge: {
                        backgroundColor: 'rgba(91, 141, 239, 0.15)',
                        color: '#5b8def',
                      },
                      dividerLine: {
                        backgroundColor: 'rgba(61, 65, 82, 0.6)',
                      },
                      dividerText: {
                        color: '#f8fafc',
                      },
                      alertText: {
                        color: '#f8fafc',
                      },
                      formResendCodeLink: {
                        color: '#5b8def',
                      },
                      otpCodeFieldInput: {
                        backgroundColor: 'rgba(47, 50, 65, 0.6)',
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                        color: '#f8fafc',
                      },
                      footerActionLink: {
                        color: '#5b8def',
                      },
                      formFieldAction: {
                        color: '#5b8def',
                      },
                      tableHead: {
                        color: '#f8fafc',
                      },
                      tableBody: {
                        color: '#f8fafc',
                      },
                      tableRow: {
                        borderColor: 'rgba(61, 65, 82, 0.6)',
                      },
                    },
                  }}
                />
              </div>
            ) : selectedCategory === 'seguranca' ? (
              <div className="settings-security-section">
                <div className="security-privacy-info">
                  <h3 className="security-section-title">Privacidade e Segurança</h3>
                  <p className="security-description">
                    A sua privacidade é fundamental para nós. No Nexus, protegemos suas informações pessoais 
                    e garantimos que seus dados sejam tratados com total transparência e segurança. 
                    Todas as suas conversas e dados são criptografados e armazenados de forma segura.
                  </p>
                  <p className="security-description">
                    Nossa política de privacidade descreve em detalhes como coletamos, usamos e protegemos 
                    suas informações. Recomendamos que você leia o documento completo para entender 
                    melhor nossos compromissos com sua privacidade.
                  </p>
                </div>

                <div className="security-download-section">
                  <div className="security-download-card">
                    <div className="security-download-info">
                      <h4 className="security-download-title">Termo de Responsabilidade e Política de Privacidade</h4>
                      <p className="security-download-description">
                        Baixe o documento completo contendo nossa Política de Privacidade e Termo de Responsabilidade. 
                        Este documento contém todas as informações sobre como tratamos seus dados e suas responsabilidades 
                        ao usar nossa plataforma.
                      </p>
                    </div>
                    <button 
                      className="security-download-button"
                      onClick={() => downloadPrivacyPolicy()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>Baixar Termo de Responsabilidade</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedCategory === 'geral' ? (
              <div className="settings-general-section">
                {/* Limpar Histórico */}
                <div className="settings-section-card">
                  <div className="settings-section-header">
                    <h3 className="settings-section-title">Limpar Histórico de Conversas</h3>
                    <p className="settings-section-description">
                      Remove permanentemente todo o histórico de conversas armazenado localmente. 
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                  <div className="settings-section-content">
                    <button 
                      className="settings-danger-button"
                      onClick={clearChatHistory}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Limpar Histórico</span>
                    </button>
                  </div>
                </div>

                {/* Informações do Sistema */}
                <div className="settings-section-card">
                  <div className="settings-section-header">
                    <h3 className="settings-section-title">Informações do Sistema</h3>
                    <p className="settings-section-description">
                      Informações sobre a versão e configurações do Nexus.
                    </p>
                  </div>
                  <div className="settings-section-content">
                    <div className="settings-info-grid">
                      <div className="settings-info-item">
                        <span className="settings-info-label">Versão</span>
                        <span className="settings-info-value">1.0.0</span>
                      </div>
                      <div className="settings-info-item">
                        <span className="settings-info-label">Navegador</span>
                        <span className="settings-info-value">
                          {(() => {
                            const ua = navigator.userAgent;
                            if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
                            if (ua.includes('Firefox')) return 'Firefox';
                            if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
                            if (ua.includes('Edg')) return 'Edge';
                            return 'Desconhecido';
                          })()}
                        </span>
                      </div>
                      <div className="settings-info-item">
                        <span className="settings-info-label">Armazenamento Local</span>
                        <span className="settings-info-value">
                          {localStorage.getItem('chatHistory') ? 'Ativo' : 'Vazio'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="settings-placeholder">
                <p>As configurações serão implementadas em breve.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
