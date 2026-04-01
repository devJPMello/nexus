import { AGENT_LABELS } from '../constants/agentTypes';
import './Breadcrumbs.css';

const Breadcrumbs = ({ currentAgent }) => {
  const getAgentName = (agentId) => {
    return AGENT_LABELS[agentId] || agentId;
  };

  if (!currentAgent) {
    return null;
  }

  return (
    <div className="breadcrumbs">
      <nav className="breadcrumbs-nav" aria-label="Navegação">
        <ol className="breadcrumbs-list">
          <li className="breadcrumb-item breadcrumb-current" aria-current="page">
            {getAgentName(currentAgent)}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;

