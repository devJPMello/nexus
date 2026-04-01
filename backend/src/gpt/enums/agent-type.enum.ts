export enum AgentType {
  STUDY_PLAN = 'study_plan',
  SUMMARY = 'summary',
  GENERAL = 'general',
}

export const AGENT_TYPE_DESCRIPTIONS = {
  [AgentType.STUDY_PLAN]: 'Agente especializado em criação de planos de estudo personalizados',
  [AgentType.SUMMARY]: 'Agente especializado em criação de resumos de conteúdo',
  [AgentType.GENERAL]: 'Agente assistente geral para conversas e consultas variadas',
} as const;