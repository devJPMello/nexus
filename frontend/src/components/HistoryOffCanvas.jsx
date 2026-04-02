import { useEffect, useMemo, useState } from 'react';
import { BRANDING } from '../constants/brandingUrls';
import { getFrontendAgentId } from '../constants/agentTypes';
import './HistoryOffCanvas.css';

const agentColors = {
  geral: '#10B981',
  summaries: '#06B6D4',
  'study-plan': '#8B5CF6',
};

const agentLabels = {
  geral: 'Chat Geral',
  summaries: 'Resumos',
  'study-plan': 'Plano de Estudos',
};

const filterOptions = [
  { value: 'all', label: 'Todos os agentes' },
  { value: 'geral', label: agentLabels.geral },
  { value: 'summaries', label: agentLabels.summaries },
  { value: 'study-plan', label: agentLabels['study-plan'] },
];

const resolveAgentFromBackend = (value) => {
  if (!value || value === 'Chat Livre') {
    return 'geral';
  }

  return getFrontendAgentId(value) || 'geral';
};

const HistoryOffCanvas = ({
  isOpen = false,
  onClose,
  threads = [],
  currentAgent = null,
  activeThreadId = null,
  onSelectThread,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setSelectedFilter(currentAgent || 'all');
    }
  }, [isOpen, currentAgent]);

  const normalizedThreads = useMemo(() => {
    return threads.map((thread) => {
      const agentKey = resolveAgentFromBackend(thread.agente_utilizado);

      return {
        ...thread,
        agentKey,
        agentLabel: agentLabels[agentKey] || 'Chat Livre',
      };
    });
  }, [threads]);

  const filteredThreads = useMemo(() => {
    if (selectedFilter === 'all') {
      return normalizedThreads;
    }

    return normalizedThreads.filter(
      (thread) => thread.agentKey === selectedFilter,
    );
  }, [normalizedThreads, selectedFilter]);

  const hasHistory = filteredThreads.length > 0;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    try {
      return timestamp.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderThreadCards = () => {
    if (!hasHistory) {
      return (
        <div className="history-empty">
          <img src={BRANDING.historia} alt="Histórico vazio" className="history-empty-icon" />
          <p>Suas interações aparecerão aqui assim que você conversar com um agente.</p>
        </div>
      );
    }

    return (
      <div className="history-thread-list">
        {filteredThreads.map((thread) => {
          const lastDate = thread.ultima_mensagem
            ? new Date(thread.ultima_mensagem)
            : null;

          return (
            <button
              type="button"
              key={thread.thread_id}
              className={`history-thread-card ${activeThreadId === thread.thread_id ? 'active' : ''}`}
              onClick={() => onSelectThread?.(thread)}
            >
              <div className="history-thread-title">
                <span
                  className="history-section-indicator"
                  style={{
                    backgroundColor: agentColors[thread.agentKey] || '#64748B',
                  }}
                />
                {thread.titulo || 'Conversa sem título'}
              </div>
              <div className="history-thread-agent">{thread.agentLabel}</div>
              <div className="history-thread-meta">
                <span>{thread.total_mensagens || 0} mensagens</span>
                {lastDate && <span>{formatTimestamp(lastDate)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`history-offcanvas ${isOpen ? 'open' : ''}`}>
      <div className="history-overlay" onClick={onClose} />

      <aside className="history-panel" aria-hidden={!isOpen}>
        <header className="history-panel-header">
          <div className="history-panel-title">
            <h2>Histórico de Interações</h2><br />
          </div>
        </header>

        <div className="history-filter">
          <select
            id="history-filter-select"
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="history-content">{renderThreadCards()}</div>
      </aside>
    </div>
  );
};

export default HistoryOffCanvas;
