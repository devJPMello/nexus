import { useState, useEffect } from 'react';
import apiService from '../services/api';

// Hook para gerenciar dados da API
export const useApiData = (agentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        switch (agentId) {
          case 'study-plan':
            response = await apiService.getCurrentStudyPlan();
            break;
          case 'summaries':
            response = await apiService.getRecentSummaries();
            break;
          default:
            response = await apiService.getCurrentStudyPlan();
        }

        setData(response);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
        // Dados de fallback caso a API falhe
        setData(getFallbackData(agentId));
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchData();
    }
  }, [agentId]);

  return { data, loading, error };
};

// Dados de fallback caso a API não esteja disponível
const getFallbackData = (agentId) => {
  const fallbackData = {
    'study-plan': {
      title: 'Plano de Estudos Atual',
      status: 'Ativo',
      progress: 65,
      nextTask: 'Revisar capítulo 3 de Matemática',
      upcomingTasks: [
        'Completar exercícios de Álgebra',
        'Estudar Física - Mecânica',
        'Revisar História do Brasil'
      ],
      message: 'Seu plano de estudos está progredindo bem! Você completou 65% das atividades planejadas. A próxima tarefa é revisar o capítulo 3 de Matemática. Continue assim!'
    },
    'summaries': {
      title: 'Resumos Recentes',
      count: 3,
      recent: [
        'Resumo: Revolução Francesa',
        'Resumo: Teorema de Pitágoras',
        'Resumo: Estrutura do DNA'
      ],
      message: 'Você tem 3 resumos recentes disponíveis. Posso ajudar você a criar novos resumos ou revisar os existentes. Que texto gostaria de resumir?'
    },
    'social-media': {
      title: 'Estratégias de Redes Sociais',
      platforms: ['Instagram', 'LinkedIn', 'Twitter'],
      engagement: 'Alto',
      nextPost: 'Dica de estudo: Técnica Pomodoro',
      message: 'Suas redes sociais estão com bom engajamento! A próxima postagem sugerida é sobre a técnica Pomodoro. Posso ajudar você a criar conteúdo estratégico.'
    }
  };

  return fallbackData[agentId] || fallbackData['study-plan'];
};
