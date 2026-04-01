import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import Sidebar from '../Sidebar';
import MainDashboard from '../MainDashboard';
import FloatingHamburger from '../FloatingHamburger';
import HistoryOffCanvas from '../HistoryOffCanvas';
import SettingsModal from '../SettingsModal';
import Breadcrumbs from '../Breadcrumbs';
import Geral from './Geral';
import StudyPlanDashboard from './StudyPlan';
import Summaries from './Summaries';
import apiService from '../../services/api';
import { getBackendAgentType, getFrontendAgentId } from '../../constants/agentTypes';
import './ChatInterface.css';
import historyIcon from '../../assets/images/historia.svg';

const parseTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveAgentFromBackend = (agentType) => {
  if (!agentType || agentType === 'Chat Livre') {
    return 'geral';
  }
  return getFrontendAgentId(agentType) || 'geral';
};

const adaptHistoryForAgent = (records = [], agentKey) =>
  records.flatMap((record) => {
    const promptTimestamp =
      parseTimestamp(record.createdAt) ?? new Date();
    const responseTimestamp =
      parseTimestamp(record.updatedAt) ?? promptTimestamp;

    const promptText = record.prompt ?? record.message ?? '';
    
    // Detectar se a mensagem contém conteúdo de arquivo
    // Padrão: "--- Conteúdo do arquivo: nome.pdf ---\nconteúdo..."
    const fileContentPattern = /---\s*Conteúdo do arquivo:\s*([^\n]+)\s*---/g;
    const fileMatches = [...promptText.matchAll(fileContentPattern)];
    
    let displayText = promptText;
    let attachedFiles = undefined;
    
    // Se encontrar arquivos, extrair informações e limpar o texto de exibição
    if (fileMatches.length > 0) {
      attachedFiles = fileMatches.map(match => {
        const fileName = match[1].trim();
        // Determinar tipo do arquivo pela extensão
        const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
        const mimeTypes = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
        };
        
        return {
          name: fileName,
          type: mimeTypes[extension] || 'application/pdf',
        };
      });
      
      // Remover todo o conteúdo dos arquivos do texto de exibição
      // Manter apenas o texto antes do primeiro "--- Conteúdo do arquivo:"
      const firstFileIndex = promptText.indexOf('--- Conteúdo do arquivo:');
      if (firstFileIndex > 0) {
        displayText = promptText.substring(0, firstFileIndex).trim();
      } else {
        // Se começar com arquivo, mostrar apenas "Arquivos anexados"
        displayText = attachedFiles.length > 0 ? 'Arquivos anexados' : '';
      }
    }

    const normalized = [
      {
        id: `${record.id}-prompt`,
        text: displayText || (attachedFiles ? 'Arquivos anexados' : ''),
        sender: 'user',
        timestamp: promptTimestamp,
        agent: agentKey,
        attachedFiles: attachedFiles,
      },
    ];

    if (record.response) {
      normalized.push({
        id: `${record.id}-response`,
        text: record.response,
        sender: 'assistant',
        timestamp: responseTimestamp,
        agent: agentKey,
      });
    }

    return normalized;
  });

const ChatInterface = () => {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [threadList, setThreadList] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [processingStates, setProcessingStates] = useState({
    sending: false,
    updating: false,
    analyzing: false,
    validating: false,
    optimizing: false
  });
  const abortControllerRef = useRef(null);
  const messagesRef = useRef([]);
  const [planUpdateProgress, setPlanUpdateProgress] = useState(0);
  const [planUpdateSteps, setPlanUpdateSteps] = useState({
    currentStep: 0,
    totalSteps: 5,
    currentStepName: '',
    isComplete: false
  });
  const [validationChecks, setValidationChecks] = useState([]);
  const [optimizationSteps, setOptimizationSteps] = useState({
    currentStep: 1,
    totalSteps: 3,
    currentStepName: ''
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Hook para buscar dados da API - removido para evitar conflitos
  // const { data: apiData, loading: apiLoading } = useApiData(currentAgent);

  const refreshThreadList = useCallback(async () => {
    try {
      const { threads = [] } = await apiService.getChatList();
      setThreadList(threads);
    } catch (error) {
      console.error('Erro ao carregar lista de conversas:', error);
    }
  }, []);

  useEffect(() => {
    void refreshThreadList();
  }, [refreshThreadList]);

  useEffect(() => {
    if (isHistoryOpen) {
      void refreshThreadList();
    }
  }, [isHistoryOpen, refreshThreadList]);

  const fetchHistoryForThread = useCallback(
    async (threadId, agentKey) => {
      if (!threadId) {
        return [];
      }

      try {
        const history = await apiService.getChatHistory(threadId);
        return adaptHistoryForAgent(history, agentKey);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }
    },
    [],
  );

  // Manter ref sincronizada com messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Não limpar mensagens se não há threadId mas há mensagens no ref
    // Isso evita limpar mensagens durante a transição de agente
    if (!activeThreadId || !currentAgent) {
      // Só limpar se não há mensagens no ref (evita limpar durante transição)
      if (messagesRef.current.length === 0) {
        setMessages([]);
        messagesRef.current = [];
      }
      return;
    }

    const hydrateChat = async () => {
      // Preservar imagens das mensagens existentes antes de recarregar
      const prevMessages = messagesRef.current;
      
      // Verificar se há mensagens com imagens que precisam ser preservadas
      const hasMessagesWithImages = prevMessages.some(
        msg => msg.attachedImages && msg.attachedImages.length > 0
      );
      
      // Se não há imagens para preservar, simplesmente carregar o histórico
      if (!hasMessagesWithImages) {
        const normalized = await fetchHistoryForThread(
          activeThreadId,
          currentAgent,
        );
        setMessages(normalized);
        return;
      }
      
      // Coletar índices das mensagens do usuário com imagens no frontend
      // Criar um mapa: índice da mensagem do usuário (no frontend) -> imagens
      const frontendUserMessageIndices = new Map();
      let frontendUserIndex = 0;
      prevMessages.forEach(msg => {
        if (msg.sender === 'user') {
          if (msg.attachedImages && msg.attachedImages.length > 0) {
            frontendUserMessageIndices.set(frontendUserIndex, msg.attachedImages);
          }
          frontendUserIndex++;
        }
      });
      
      const normalized = await fetchHistoryForThread(
        activeThreadId,
        currentAgent,
      );
      
      // Mesclar imagens preservadas com o histórico normalizado pela ordem
      // Mapear mensagens do usuário do backend para mensagens do usuário do frontend pelo índice
      let backendUserIndex = 0;
      const mergedMessages = normalized.map(msg => {
        if (msg.sender === 'user') {
          // Verificar se a mensagem correspondente no frontend tinha imagens
          const preservedImages = frontendUserMessageIndices.get(backendUserIndex);
          backendUserIndex++;
          
          if (preservedImages && preservedImages.length > 0) {
            return {
              ...msg,
              attachedImages: preservedImages,
            };
          }
        }
        
        return msg;
      });
      
      setMessages(mergedMessages);
    };

    hydrateChat();
  }, [activeThreadId, currentAgent, fetchHistoryForThread]);

  const handleSelectAgent = (agentId) => {
    setCurrentAgent(agentId);
    setActiveThreadId(null);

    // Limpa apenas a tela, mas não cria nova conversa ainda
    // Nova conversa só será criada ao enviar a primeira mensagem
    setMessages([]);
  };

  const getAgentName = (agentId) => {
    const names = {
      'geral': 'Chat Geral',
      'study-plan': 'Plano de Estudos',
      'summaries': 'Resumos'
    };
    return names[agentId] || 'Agente';
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleToggleHistory = () => {
    setIsHistoryOpen((prev) => !prev);
  };

  const handleResumeThread = async (thread) => {
    if (!thread) {
      return;
    }

    const agentKey = resolveAgentFromBackend(thread.agente_utilizado);
    setCurrentAgent(agentKey);
    setActiveThreadId(thread.thread_id);
    setIsHistoryOpen(false);

    const normalized = await fetchHistoryForThread(thread.thread_id, agentKey);
    setMessages(normalized);
  };

  const handleSendMessage = async (message, files = [], images = [], agentId) => {
    // Normalizar files para garantir que seja um array
    let filesArray = [];
    if (files) {
      if (Array.isArray(files)) {
        filesArray = files;
      } else if (files instanceof FileList) {
        filesArray = Array.from(files);
      } else if (files.length !== undefined) {
        filesArray = Array.from(files);
      } else {
        filesArray = [files];
      }
    }

    // Normalizar images para garantir que seja um array
    let imagesArray = [];
    if (images) {
      if (Array.isArray(images)) {
        imagesArray = images;
      } else {
        imagesArray = [images];
      }
    }

    if (!message.trim() && (!filesArray || filesArray.length === 0) && (!imagesArray || imagesArray.length === 0)) {
      return;
    }

    const agent = agentId || currentAgent;
    if (!agent) {
      return;
    }

    // Se o agente precisa ser mudado (vindo do MainDashboard), mudar agora e limpar mensagens antigas
    const needsAgentChange = agentId && agentId !== currentAgent;
    let threadIdToUse = activeThreadId;
    
    // Preparar a mensagem do usuário ANTES de mudar o agente (para usar na atualização)
    let displayText = message;
    if ((filesArray.length > 0 || imagesArray.length > 0) && !message.trim()) {
      if (imagesArray.length > 0 && filesArray.length === 0) {
        displayText = `${imagesArray.length} imagem(ns) anexada(s)`;
      } else if (filesArray.length > 0 && imagesArray.length === 0) {
        displayText = 'Arquivos anexados';
      } else {
        displayText = `${imagesArray.length} imagem(ns) e ${filesArray.length} arquivo(s) anexado(s)`;
      }
    } else if (filesArray.length > 0 || imagesArray.length > 0) {
      displayText = message;
    }

    const userMessage = {
      id: Date.now(),
      text: displayText || '',
      sender: 'user',
      timestamp: new Date(),
      agent: agentId || currentAgent,
      // Armazenar informações dos arquivos para exibição
      attachedFiles: filesArray.length > 0 ? filesArray.map((file, index) => ({
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
      })) : undefined,
      // Armazenar informações das imagens para exibição
      attachedImages: imagesArray.length > 0 ? imagesArray.map((img, index) => ({
        preview: img,
        name: `Imagem ${index + 1}`,
      })) : undefined,
    };

    if (needsAgentChange) {
      // Usar flushSync para garantir renderização imediata e evitar delay
      flushSync(() => {
        setCurrentAgent(agentId);
        setActiveThreadId(null);
        setMessages([userMessage]);
      });
      messagesRef.current = [userMessage]; // Atualizar ref também
      threadIdToUse = null; // Garantir que usamos null para criar nova thread
    }

    // Cancelar requisição anterior se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Criar novo AbortController para esta requisição
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setProcessingStates((prev) => ({ ...prev, sending: true }));

    // Se não mudamos o agente, adicionar mensagem normalmente
    if (!needsAgentChange) {
      setMessages((prev) => [...prev, userMessage]);
      messagesRef.current = [...messagesRef.current, userMessage];
    }
    // Se mudamos o agente, a mensagem já foi adicionada acima

    let finalMessage = message;
    let uploadedContent = '';
    let imagesToSend = undefined;

    // Se houver imagens diretas (coladas ou arrastadas), adicionar à lista
    if (imagesArray && imagesArray.length > 0) {
      // Validar que são strings base64
      const validImages = imagesArray.filter(img => {
        if (typeof img !== 'string') {
          console.error('Imagem inválida (não é string):', typeof img, img);
          return false;
        }
        // Verificar formato base64
        const isValidBase64 = img.startsWith('data:image/') || img.length > 100;
        if (!isValidBase64) {
          console.error('Imagem não está em formato base64 válido:', img.substring(0, 50));
          return false;
        }
        return true;
      });

      if (validImages.length !== imagesArray.length) {
        console.warn(`${imagesArray.length - validImages.length} imagem(ns) inválida(s) foram removidas`);
      }

      if (validImages.length > 0) {
        imagesToSend = validImages;
        console.log(`✓ ${validImages.length} imagem(ns) direta(s) adicionada(s)`, {
          firstImagePreview: validImages[0].substring(0, 100) + '...',
          imageLengths: validImages.map(img => img.length),
        });
        
        // Se não houver mensagem, criar uma mensagem padrão
        if (!message || !message.trim()) {
          finalMessage = `Por favor, analise esta(s) imagem(ns) e me explique o que você vê.`;
        }
      } else {
        console.error('Nenhuma imagem válida encontrada após validação');
      }
    }

    // Se houver arquivos, fazer upload primeiro
    if (filesArray && filesArray.length > 0) {
      // Verificar se há arquivos válidos (instâncias de File)
      const validFiles = filesArray.filter(file => file instanceof File);
      
      if (validFiles.length === 0) {
        console.warn('Nenhum arquivo válido encontrado para upload');
        setProcessingStates((prev) => ({ ...prev, sending: false }));
        return;
      }

      try {
        // Gerar ou obter userId (pode ser melhorado com autenticação real)
        const userId = localStorage.getItem('userId') || `user-${Date.now()}`;
        localStorage.setItem('userId', userId);

        const uploadResult = await apiService.uploadUserContent(validFiles, userId);
        
        if (uploadResult.items && uploadResult.items.length > 0) {
          // Coletar imagens e texto dos arquivos
          const allImages = [];
          const fileContents = [];
          
          uploadResult.items.forEach((item, index) => {
            const fileName = item.filename || filesArray[index]?.name || `Arquivo ${index + 1}`;
            const textContent = item.textContent || '';
            
            console.log(`Processando item ${index}:`, {
              filename: fileName,
              hasImages: item.hasImages,
              imagesCount: item.images?.length || 0,
              textLength: textContent.length,
              itemKeys: Object.keys(item)
            });
            
            // Se o item tiver imagens, adicionar à lista
            if (item.hasImages && item.images && Array.isArray(item.images)) {
              allImages.push(...item.images);
              console.log(`✓ Arquivo ${fileName}: ${item.images.length} imagens extraídas e adicionadas`);
            } else {
              console.warn(`✗ Arquivo ${fileName}: Sem imagens (hasImages: ${item.hasImages}, images: ${item.images ? 'existe mas não é array' : 'não existe'})`);
            }
            
            // Adicionar texto se houver
            if (textContent && textContent.trim().length > 0) {
              fileContents.push(`\n\n--- Conteúdo do arquivo: ${fileName} ---\n${textContent}`);
              console.log(`✓ Conteúdo extraído do arquivo ${fileName}: ${textContent.length} caracteres`);
            } else if (!item.hasImages) {
              console.warn(`⚠ Aviso: O arquivo ${fileName} não possui conteúdo extraído (textContent vazio e sem imagens)`);
            }
          });
          
          uploadedContent = fileContents.join('\n\n');
          
          // Combinar imagens extraídas de PDFs com imagens diretas
          if (allImages.length > 0) {
            if (imagesToSend && imagesToSend.length > 0) {
              imagesToSend = [...imagesToSend, ...allImages];
            } else {
              imagesToSend = allImages;
            }
          }
          
          const totalImages = (imagesToSend?.length || 0);
          console.log('Resumo do processamento:', {
            totalItems: uploadResult.items.length,
            imagesFromPdfs: allImages.length,
            imagesDirect: imagesArray.length,
            totalImages: totalImages,
            textContentLength: uploadedContent.length,
            willSendImages: !!imagesToSend
          });
          
          // Se não houver mensagem do usuário, criar uma mensagem clara para o agente
          if (!message || !message.trim()) {
            if (totalImages > 0) {
              finalMessage = `Por favor, analise as imagens${uploadedContent ? ' e o seguinte conteúdo textual' : ''}.`;
            } else {
              finalMessage = `Por favor, analise e responda sobre o conteúdo dos seguintes arquivos anexados:\n\n${uploadedContent}`;
            }
          } else {
            if (totalImages > 0) {
              finalMessage = `${message}${uploadedContent ? '\n\nAbaixo está o conteúdo textual dos arquivos anexados:\n\n' + uploadedContent : ''}`;
            } else {
              finalMessage = `${message}\n\nAbaixo está o conteúdo dos arquivos anexados para referência:\n\n${uploadedContent}`;
            }
          }
          
          console.log(`Total: ${totalImages} imagens, ${uploadedContent.length} caracteres de texto`);
        } else {
          console.warn('Upload result não contém items ou está vazio:', uploadResult);
        }
      } catch (uploadError) {
        console.error('Erro ao fazer upload dos arquivos:', uploadError);
        setProcessingStates((prev) => ({ ...prev, sending: false }));
        
        // Extrair mensagem de erro mais específica
        let errorText = 'Erro ao processar arquivos. Tente novamente.';
        if (uploadError instanceof Error) {
          if (uploadError.message.includes('user-id')) {
            errorText = 'Erro: ID de usuário não encontrado. Por favor, recarregue a página.';
          } else if (uploadError.message.includes('Nenhum arquivo')) {
            errorText = 'Erro: Nenhum arquivo válido foi enviado.';
          } else if (uploadError.message.includes('400')) {
            errorText = 'Erro: Arquivo inválido ou muito grande. Verifique o formato e tamanho dos arquivos.';
          } else {
            errorText = `Erro ao processar arquivos: ${uploadError.message}`;
          }
        }
        
        const errorMessage = {
          id: Date.now() + 1,
          text: errorText,
          sender: 'assistant',
          timestamp: new Date(),
          agent,
        };
        
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
    }

    console.log('Adicionando mensagem do usuário com imagens:', {
      hasImages: imagesArray.length > 0,
      imagesCount: imagesArray.length,
      attachedImages: userMessage.attachedImages,
    });

    try {
      const backendAgentType = getBackendAgentType(agent);
      // Enviar imagens se houver
      console.log('Enviando mensagem ao agente:', {
        messageLength: finalMessage.length,
        hasImages: !!imagesToSend,
        imagesCount: imagesToSend?.length || 0,
        agentType: backendAgentType
      });
      
      const response = await apiService.sendChatMessage(
        finalMessage,
        backendAgentType,
        threadIdToUse,
        imagesToSend,
        abortController,
      );

      const threadId = response.threadId || threadIdToUse;

      if (threadId) {
        setActiveThreadId(threadId);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        agent,
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        // Verificar se as imagens estão sendo preservadas
        const userMessagesWithImages = updated.filter(msg => 
          msg.sender === 'user' && msg.attachedImages && msg.attachedImages.length > 0
        );
        console.log('Após adicionar resposta do assistente:', {
          totalMessages: updated.length,
          userMessagesWithImages: userMessagesWithImages.length,
          imagesPreserved: userMessagesWithImages.map(msg => ({
            id: msg.id,
            imagesCount: msg.attachedImages?.length || 0
          }))
        });
        return updated;
      });

      if (threadId) {
        // Não recarregar o histórico completo imediatamente - apenas atualizar quando necessário
        // Isso preserva as imagens que já estão nas mensagens
        // O histórico será recarregado apenas quando o usuário abrir o histórico ou mudar de thread
        void refreshThreadList();
      }
    } catch (error) {
      // Se a requisição foi cancelada, não mostrar erro
      if (error.message === 'REQUEST_ABORTED') {
        console.log('Requisição cancelada pelo usuário');
        return;
      }

      console.error('Erro ao enviar mensagem:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        imagesCount: imagesToSend?.length || 0,
        hasImages: !!imagesToSend,
        imagesSize: imagesToSend?.map(img => img?.length || 0),
      });

      // Extrair mensagem de erro mais específica
      let errorText = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorText = 'Erro: Requisição inválida. Verifique se as imagens não estão muito grandes (máximo recomendado: 10MB por imagem).';
        } else if (error.message.includes('413')) {
          errorText = 'Erro: As imagens são muito grandes. Por favor, reduza o tamanho das imagens e tente novamente.';
        } else if (error.message.includes('500')) {
          errorText = 'Erro: Problema no servidor. Por favor, tente novamente em alguns instantes.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorText = 'Erro: Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message) {
          errorText = `Erro: ${error.message}`;
        }
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'assistant',
        timestamp: new Date(),
        agent,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Limpar referência do AbortController se não foi cancelado
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }

    setProcessingStates({
      sending: false,
      updating: false,
      analyzing: false,
      validating: false,
      optimizing: false,
    });
    setPlanUpdateProgress(0);
    setPlanUpdateSteps({
      currentStep: 0,
      totalSteps: 5,
      currentStepName: '',
      isComplete: false,
    });
    setValidationChecks([]);
    setOptimizationSteps({
      currentStep: 1,
      totalSteps: 3,
      currentStepName: '',
    });
  };

  const handleCancelGeneration = () => {
    // Cancelar qualquer requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Resetar estados de processamento
    setProcessingStates({
      sending: false,
      updating: false,
      analyzing: false,
      validating: false,
      optimizing: false,
    });
  };

  const handleEditMessage = async (messageId, newText, agentId) => {
    if (!newText.trim()) {
      return;
    }

    const agent = agentId || currentAgent;
    if (!agent) {
      return;
    }

    // Cancelar qualquer requisição em andamento
    handleCancelGeneration();

    // Aguardar um pouco para garantir que o cancelamento foi processado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Encontrar o índice da mensagem a ser editada
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) {
      return;
    }

    // Atualizar a mensagem do usuário no lugar
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText } : msg
      )
    );

    // Encontrar e remover apenas a resposta do assistente que vem imediatamente após esta mensagem
    const nextMessageIndex = messageIndex + 1;
    const nextMessage = messages[nextMessageIndex];
    
    // Se a próxima mensagem é do assistente, removê-la
    if (nextMessage && nextMessage.sender === 'assistant') {
      setMessages((prev) => prev.filter((msg, idx) => idx !== nextMessageIndex));
    }

    // Resetar estados de processamento
    setProcessingStates({
      sending: false,
      updating: false,
      analyzing: false,
      validating: false,
      optimizing: false,
    });

    // Criar novo AbortController para a nova requisição
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reenviar a mensagem editada automaticamente
    setProcessingStates((prev) => ({ ...prev, sending: true }));

    try {
      const backendAgentType = getBackendAgentType(agent);
      const response = await apiService.sendChatMessage(
        newText,
        backendAgentType,
        activeThreadId,
        null,
        abortController,
      );

      const threadId = response.threadId || activeThreadId;

      if (threadId) {
        setActiveThreadId(threadId);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        agent,
      };

      // Adicionar a nova resposta do assistente após a mensagem editada
      setMessages((prev) => {
        const newMessages = [...prev];
        const editIndex = newMessages.findIndex((msg) => msg.id === messageId);
        if (editIndex !== -1) {
          newMessages.splice(editIndex + 1, 0, assistantMessage);
        } else {
          newMessages.push(assistantMessage);
        }
        return newMessages;
      });

      if (threadId) {
        // Atualizar o histórico no backend sem recarregar tudo
        void refreshThreadList();
      }
    } catch (error) {
      // Se a requisição foi cancelada, não mostrar erro
      if (error.message === 'REQUEST_ABORTED') {
        console.log('Requisição cancelada pelo usuário');
        return;
      }

      console.error('Erro ao reenviar mensagem editada:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem editada. Tente novamente.',
        sender: 'assistant',
        timestamp: new Date(),
        agent,
      };

      setMessages((prev) => {
        const newMessages = [...prev];
        const editIndex = newMessages.findIndex((msg) => msg.id === messageId);
        if (editIndex !== -1) {
          newMessages.splice(editIndex + 1, 0, errorMessage);
        } else {
          newMessages.push(errorMessage);
        }
        return newMessages;
      });
    } finally {
      // Limpar referência do AbortController se não foi cancelado
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }

    setProcessingStates({
      sending: false,
      updating: false,
      analyzing: false,
      validating: false,
      optimizing: false,
    });
    setPlanUpdateProgress(0);
    setPlanUpdateSteps({
      currentStep: 0,
      totalSteps: 5,
      currentStepName: '',
      isComplete: false,
    });
    setValidationChecks([]);
    setOptimizationSteps({
      currentStep: 1,
      totalSteps: 3,
      currentStepName: '',
    });
  };

  const getProcessingTime = (agent, message) => {
    // Tempos mais rápidos e realistas
    const baseTime = 800; // Reduzido de 1500 para 800ms
    const agentMultiplier = {
      'study-plan': 1.2, // Reduzido de 1.5
      'summaries': 1.0   // Reduzido de 1.2
    };

    const messageMultiplier = message.length > 100 ? 1.2 : 1.0; // Reduzido de 1.3

    return baseTime * (agentMultiplier[agent] || 1.0) * messageMultiplier;
  };

  const simulatePlanUpdate = () => {
    const updateSteps = [
      { 
        progress: 20, 
        message: "Analisando objetivos de estudo...",
        stepName: "Análise de Objetivos",
        stepNumber: 1
      },
      { 
        progress: 40, 
        message: "Reorganizando cronograma...", 
        stepName: "Reorganização do Cronograma",
        stepNumber: 2
      },
      { 
        progress: 60, 
        message: "Ajustando prioridades...", 
        stepName: "Ajuste de Prioridades",
        stepNumber: 3
      },
      { 
        progress: 80, 
        message: "Otimizando horários...", 
        stepName: "Otimização de Horários",
        stepNumber: 4
      },
      { 
        progress: 100, 
        message: "Plano atualizado com sucesso!", 
        stepName: "Finalização",
        stepNumber: 5,
        isComplete: true
      }
    ];
    
    updateSteps.forEach((step, index) => {
      setTimeout(() => {
        setPlanUpdateProgress(step.progress);
        setPlanUpdateSteps({
          currentStep: step.stepNumber,
          totalSteps: 5,
          currentStepName: step.stepName,
          isComplete: step.isComplete || false
        });
      }, index * 1200);
    });
  };

  const simulateValidation = () => {
    const checks = [
      { text: "Verificando disponibilidade de horários", completed: false },
      { text: "Validando objetivos de aprendizado", completed: false },
      { text: "Confirmando recursos necessários", completed: false },
      { text: "Checando compatibilidade com cronograma", completed: false }
    ];
    
    setValidationChecks(checks);
    
    checks.forEach((check, index) => {
      setTimeout(() => {
        setValidationChecks(prev => 
          prev.map((c, i) => 
            i === index ? { ...c, completed: true } : c
          )
        );
      }, (index + 1) * 1000);
    });
  };

  const simulateOptimization = () => {
    const optimizationSteps = [
      { step: 1, name: "Análise de Performance", message: "Analisando performance atual..." },
      { step: 2, name: "Ajuste de Parâmetros", message: "Ajustando parâmetros de estudo..." },
      { step: 3, name: "Otimização Final", message: "Aplicando otimizações finais..." }
    ];
    
    optimizationSteps.forEach((optStep, index) => {
      setTimeout(() => {
        setOptimizationSteps({
          currentStep: optStep.step,
          totalSteps: 3,
          currentStepName: optStep.name
        });
      }, index * 1500);
    });
  };

  const handleBackToDashboard = () => {
    setCurrentAgent(null);
    setMessages([]);
  };

  const clearConversationHistory = async () => {
    try {
      await apiService.clearAllHistory();
      setMessages([]);
      setActiveThreadId(null);
      setThreadList([]);
      void refreshThreadList();
    } catch (error) {
      console.error('Erro ao limpar histórico no backend:', error);
    }
  };

  return (
    <div className="chat-interface">
      <FloatingHamburger 
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        onSelectAgent={handleSelectAgent}
        currentAgent={currentAgent}
        onBackToDashboard={handleBackToDashboard}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <HistoryOffCanvas
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentAgent={currentAgent}
        threads={threadList}
        activeThreadId={activeThreadId}
        onSelectThread={handleResumeThread}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <div className={`chat-main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <Breadcrumbs 
          currentAgent={currentAgent}
        />
        {currentAgent === 'geral' && (
          <Geral
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onCancelGeneration={handleCancelGeneration}
            onBackToDashboard={handleBackToDashboard}
            sidebarOpen={sidebarOpen}
            messages={messages}
            processingStates={processingStates}
          />
        )}

        {currentAgent === 'study-plan' && (
          <StudyPlanDashboard
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onCancelGeneration={handleCancelGeneration}
            onBackToDashboard={handleBackToDashboard}
            sidebarOpen={sidebarOpen}
            messages={messages}
            processingStates={processingStates}
          />
        )}

        {currentAgent === 'summaries' && (
          <Summaries
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onCancelGeneration={handleCancelGeneration}
            onBackToDashboard={handleBackToDashboard}
            sidebarOpen={sidebarOpen}
            messages={messages}
            processingStates={processingStates}
          />
        )}

        {!currentAgent && (
          <MainDashboard
            onSelectAgent={handleSelectAgent}
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
      <button
        className={`history-trigger ${isHistoryOpen ? 'open' : ''}`}
        onClick={handleToggleHistory}
        aria-label={isHistoryOpen ? 'Fechar histórico' : 'Abrir histórico de interações'}
      >
        <img src={historyIcon} alt="" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ChatInterface;
