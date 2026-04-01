import { AgentType } from './enums/agent-type.enum';

export class Gpt {
  id: string;
  agentType: AgentType | null; // null para chat sem Agente
  prompt: string;
  response: string;
  parameters?: Record<string, any>;
  temperature: number;
  maxTokens: number;
  systemMessage?: string;
  threadId?: string; // ID da "Conversa" - #Não esquecer
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}