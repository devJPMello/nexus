// Serviço de API para comunicação com o backend
// Produção no mesmo host (Railway): URLs relativas. Dev: VITE_API_URL ou localhost.
const API_BASE_URL =
  typeof import.meta.env.VITE_API_URL === 'string' &&
  import.meta.env.VITE_API_URL.length > 0
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? 'http://localhost:3000'
      : '';

class ApiService {


  // Sistema de Chat com Histórico
  async sendChatMessage(message, agentType = null, threadId = null, images = null, abortController = null) {
    try {
      const body = {
        message,
        agentType, // null para chat livre
        threadId,   // null para nova thread
      };
      
      // Adicionar imagens se houver
      if (images && images.length > 0) {
        // Validar formato das imagens
        const validImages = images.filter(img => {
          if (typeof img !== 'string') {
            console.warn('Imagem inválida (não é string):', typeof img);
            return false;
          }
          // Verificar se é base64 válido (começa com data:image/... ou é base64 puro)
          const isBase64 = img.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(img);
          if (!isBase64) {
            console.warn('Imagem não está em formato base64 válido');
            return false;
          }
          return true;
        });

        if (validImages.length !== images.length) {
          console.warn(`${images.length - validImages.length} imagem(ns) inválida(s) foram removidas`);
        }

        if (validImages.length > 0) {
          body.images = validImages;
          console.log(`Enviando ${validImages.length} imagem(ns) válida(s)`);
        } else {
          console.warn('Nenhuma imagem válida para enviar');
        }
      }

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };

      // Log do tamanho do body para debug
      const bodySize = new Blob([JSON.stringify(body)]).size;
      console.log(`Tamanho do body: ${(bodySize / 1024 / 1024).toFixed(2)} MB`);
      
      if (bodySize > 10 * 1024 * 1024) { // 10MB
        console.warn('Aviso: Body muito grande, pode causar problemas no servidor');
      }

      // Adicionar signal do AbortController se fornecido
      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(`${API_BASE_URL}/agents/chat`, fetchOptions);

      if (!response.ok) {
        // Tentar obter a mensagem de erro do backend
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = Array.isArray(errorData.message) 
              ? errorData.message.join(', ') 
              : errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch {
          // Se não conseguir parsear o JSON, tentar texto
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text.substring(0, 200);
            }
          } catch {
            // Ignora se não conseguir ler
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Se o erro for de abort, relançar com mensagem específica
      if (error.name === 'AbortError') {
        throw new Error('REQUEST_ABORTED');
      }
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async uploadUserContent(files, userId) {
    // Garantir que files seja um array
    let filesArray = [];
    if (files) {
      if (Array.isArray(files)) {
        filesArray = files;
      } else if (files instanceof FileList) {
        filesArray = Array.from(files);
      } else if (files.length !== undefined) {
        // Se tiver propriedade length, tentar converter
        filesArray = Array.from(files);
      } else {
        // Se for um único arquivo
        filesArray = [files];
      }
    }

    if (!filesArray || filesArray.length === 0) {
      return { items: [] };
    }

    try {
      // Filtrar apenas arquivos válidos
      const validFiles = filesArray.filter(file => file instanceof File);
      
      if (validFiles.length === 0) {
        console.warn('Nenhum arquivo válido encontrado para upload');
        return { items: [] };
      }

      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Verificar se userId está presente
      const finalUserId = userId || 'anonymous-user';
      if (!finalUserId) {
        throw new Error('userId é obrigatório para upload de arquivos');
      }

      const response = await fetch(`${API_BASE_URL}/content/upload`, {
        method: 'POST',
        headers: {
          'user-id': finalUserId,
        },
        body: formData,
      });

      if (!response.ok) {
        // Tentar obter a mensagem de erro do backend
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch {
          // Se não conseguir parsear o JSON, usar a mensagem padrão
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar arquivos:', error);
      throw error;
    }
  }

  // Buscar histórico
  async getChatHistory(threadId = null) {
    try {
      const url = threadId
        ? `${API_BASE_URL}/agents/chat/history?threadId=${threadId}`
        : `${API_BASE_URL}/agents/chat/history`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // Remover thread
  async deleteThread(threadId) {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/chat/thread/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao remover thread:', error);
      throw error;
    }
  }

  // Listar conversas com paginação
  async getChatList(agentType = null, page = 1, limit = 15) {
    try {
      let url = `${API_BASE_URL}/agents/chat/list?page=${page}&limit=${limit}`;

      if (agentType) {
        url += `&agentType=${agentType}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar lista de conversas:', error);
      throw error;
    }
  }

  // Buscar plano de estudos atual
  async getCurrentStudyPlan() {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/study-plan/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar plano de estudos:', error);
      throw error;
    }
  }

  // Buscar resumos recentes
  async getRecentSummaries() {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/summary/recent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar resumos:', error);
      throw error;
    }
  }

  // Limpar todo o histórico de conversas
  async clearAllHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/chat/history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
  }

}

// Instância singleton do serviço
const apiService = new ApiService();

export default apiService;
