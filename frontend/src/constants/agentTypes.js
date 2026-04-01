// Mapeamento dos IDs do frontend para os tipos do backend
export const AGENT_TYPE_MAP = {
  'study-plan': 'study_plan',
  'summaries': 'summary',
  'geral': 'general',
};

// Reverso - do backend para frontend
export const FRONTEND_AGENT_MAP = {
  'study_plan': 'study-plan',
  'summary': 'summaries',
  'general': 'geral',
};

// Labels para exibição
export const AGENT_LABELS = {
  'study-plan': 'Plano de Estudos',
  'summaries': 'Resumos',
  'geral': 'Chat Geral',
};

// Função para converter ID do frontend para tipo do backend
export const getBackendAgentType = (frontendId) => {
  return AGENT_TYPE_MAP[frontendId] || null;
};

// Função para converter tipo do backend para ID do frontend
export const getFrontendAgentId = (backendType) => {
  return FRONTEND_AGENT_MAP[backendType] || null;
};