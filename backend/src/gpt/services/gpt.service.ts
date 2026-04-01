import {
  Injectable,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gpt } from '../gpt.entity';
import { AgentType } from '../enums/agent-type.enum';
import { STUDY_PLAN_PROMPT } from '../config/study-plan-prompt';
import { SUMMARY_PROMPT } from '../config/summary-prompt';
import { GENERAL_PROMPT } from '../config/general-prompt';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { History } from '../entities/history.entity';

@Injectable()
export class GptService {
  private readonly logger = new Logger(GptService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  private maxOutputTokens =
    Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? '4096') || 4096;

  private getPromptByAgentType(agentType: AgentType): string {
    switch (agentType) {
      case AgentType.STUDY_PLAN:
        return STUDY_PLAN_PROMPT;
      case AgentType.SUMMARY:
        return SUMMARY_PROMPT;
      case AgentType.GENERAL:
        return GENERAL_PROMPT;
      default:
        return GENERAL_PROMPT;
    }
  }

  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
  ) {
    void this.initializeServices();
  }

  private async initializeServices() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY nÃ£o configurada no ambiente');
      }
      this.defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

      const configuredMaxTokens = Number(
        process.env.GEMINI_MAX_OUTPUT_TOKENS ?? this.maxOutputTokens.toString(),
      );

      if (Number.isFinite(configuredMaxTokens) && configuredMaxTokens > 0) {
        this.maxOutputTokens = configuredMaxTokens;
      } else {
        this.logger.warn(
          `Valor inválido para GEMINI_MAX_OUTPUT_TOKENS. Mantendo ${this.maxOutputTokens}.`,
        );
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(
        `GPT service initialized with Gemini model ${this.defaultModel}`,
      );
    } catch (error) {
      throw error;
    }
  }

  private async persistHistoryRecord(gpt: Gpt): Promise<void> {
    if (!gpt.threadId) {
      return;
    }

    const history = this.historyRepository.create({
      threadId: gpt.threadId,
      agentType: gpt.agentType ?? null,
      message: gpt.prompt,
      response: gpt.response,
      status: gpt.status,
      systemMessage: gpt.systemMessage ?? null,
      temperature: gpt.temperature,
      maxTokens: gpt.maxTokens,
      errorMessage: gpt.errorMessage ?? null,
      isActive: true,
    });

    await this.historyRepository.save(history);
  }

  async generateResponse(
    message: string,
    agentType?: AgentType,
    threadId?: string,
    images?: string[],
  ): Promise<string> {
    if (!this.genAI) {
      await this.initializeServices();
    }

    const genAI = this.genAI;
    if (!genAI) {
      throw new Error('Cliente Gemini não inicializado');
    }

    const systemPrompt = agentType ? this.getPromptByAgentType(agentType) : '';
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (threadId) {
      const threadHistory = await this.historyRepository.find({
        where: { threadId, isActive: true },
        order: { createdAt: 'ASC' },
      });

      for (const historyMessage of threadHistory) {
        history.push({ role: 'user', parts: [{ text: historyMessage.message }] });
        history.push({ role: 'model', parts: [{ text: historyMessage.response }] });
      }
    }

    const model = genAI.getGenerativeModel({
      model: this.defaultModel,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    });

    try {
      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: this.maxOutputTokens,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      // Preparar partes da mensagem (texto + imagens se houver)
      // A API do Gemini aceita string ou array de Part (TextPart | InlineDataPart)
      // IMPORTANTE: Para multimodal, as imagens devem vir ANTES do texto
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      
      this.logger.log(`Preparando mensagem: texto (${message.length} chars), imagens (${images?.length || 0})`);
      
      // Adicionar imagens PRIMEIRO (ordem importante para multimodal)
      // Adicionar imagens se houver
      if (images && images.length > 0) {
        this.logger.log(`Processando ${images.length} imagens para envio ao Gemini`);
        let processedImages = 0;
        for (let i = 0; i < images.length; i++) {
          const imageData = images[i];
          this.logger.log(`Processando imagem ${i + 1}/${images.length}, tipo: ${typeof imageData}, tamanho: ${imageData?.length || 0} chars`);
          
          // Extrair base64 da string data:image/png;base64,...
          const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const mimeType = `image/${base64Match[1]}`;
            const base64Data = base64Match[2];
            
            // Validar que o base64 não está vazio
            if (!base64Data || base64Data.length === 0) {
              this.logger.error(`Imagem ${i + 1}: base64 está vazio após extração`);
              continue;
            }
            
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            } as { inlineData: { mimeType: string; data: string } });
            processedImages++;
            this.logger.log(`✓ Imagem ${processedImages}/${images.length} processada: ${mimeType}, ${base64Data.length} bytes de dados`);
          } else {
            // Tentar verificar se é base64 puro (sem prefixo)
            if (typeof imageData === 'string' && imageData.length > 100) {
              this.logger.warn(`Imagem ${i + 1}: Formato não corresponde ao padrão data:image/...;base64,...`);
              this.logger.warn(`Primeiros 100 chars: ${imageData.substring(0, 100)}`);
              
              // Tentar adicionar como PNG se parecer ser base64
              if (/^[A-Za-z0-9+/=]+$/.test(imageData)) {
                this.logger.log(`Tentando processar como base64 puro (PNG)`);
                parts.push({
                  inlineData: {
                    mimeType: 'image/png',
                    data: imageData,
                  },
                } as { inlineData: { mimeType: string; data: string } });
                processedImages++;
              }
            } else {
              this.logger.error(`Imagem ${i + 1}: Formato inválido ou muito curto`);
            }
          }
        }
        this.logger.log(`Total de ${processedImages} imagens adicionadas à mensagem de ${images.length} recebidas`);
        
        // Se nenhuma imagem foi processada, lançar erro
        if (processedImages === 0 && images.length > 0) {
          this.logger.error('Nenhuma imagem foi processada com sucesso!');
          throw new HttpException(
            'Nenhuma imagem foi processada corretamente. Verifique o formato das imagens.',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        this.logger.log('Nenhuma imagem para processar');
      }
      
      // Adicionar texto DEPOIS das imagens (ordem importante para multimodal)
      if (message) {
        parts.push({ text: message });
      }

      // Se não houver partes, usar apenas a mensagem como string
      const messageToSend = parts.length > 0 ? parts : message;
      this.logger.log(`Enviando mensagem ao Gemini: ${parts.length} partes (${parts.filter(p => 'text' in p).length} texto, ${parts.filter(p => 'inlineData' in p).length} imagens)`);
      const result = await chat.sendMessage(messageToSend as any);
      const response = this.extractTextFromGeminiResponse(result.response);

      if (!response) {
        this.logger.warn('Gemini response was empty after generation.');
        return 'Não foi possível gerar uma resposta.';
      }

      this.logger.log('Successfully generated response for message');
      return response;
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating response: ${messageText}`);
      throw new HttpException(
        'Falha na geração da resposta pela IA',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async create(message: string, agentType?: AgentType, threadId?: string, images?: string[]): Promise<Gpt> {
    const id = randomUUID();
    const currentThreadId = threadId || `thread_${randomUUID()}`;

    try {
      const response = await this.generateResponse(message, agentType, currentThreadId, images);
      const systemPrompt = agentType ? this.getPromptByAgentType(agentType) : '';

      const gpt: Gpt = {
        id,
        agentType: agentType || null,
        prompt: message,
        response,
        temperature: 0.8,
        maxTokens: this.maxOutputTokens,
        systemMessage: systemPrompt,
        threadId: currentThreadId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'completed',
      };

      await this.persistHistoryRecord(gpt);
      this.logger.log(`Successfully processed GPT request ${id} in thread ${currentThreadId}`);

      return gpt;
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';
      this.logger.error(`Error processing GPT request ${id}: ${errorMessage}`);

      const systemPrompt = agentType ? this.getPromptByAgentType(agentType) : '';

      const gpt: Gpt = {
        id,
        agentType: agentType || null,
        prompt: message,
        response: '',
        temperature: 0.8,
        maxTokens: this.maxOutputTokens,
        systemMessage: systemPrompt,
        threadId: currentThreadId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'error',
        errorMessage,
      };

      await this.persistHistoryRecord(gpt);
      return gpt;
    }
  }

  async createFreeChat(message: string, threadId?: string, agentType?: AgentType, images?: string[]): Promise<Gpt> {
    return this.create(message, agentType, threadId, images);
  }

  async getMessagesByThread(threadId: string): Promise<any[]> {
    const records = await this.historyRepository.find({
      where: { threadId, isActive: true },
      order: { createdAt: 'ASC' },
    });

    return records.map((record) => ({
      id: record.id,
      agentType: record.agentType,
      prompt: record.message,
      response: record.response,
      temperature: record.temperature,
      maxTokens: record.maxTokens,
      systemMessage: record.systemMessage,
      threadId: record.threadId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status,
      errorMessage: record.errorMessage,
    }));
  }

  async getAllThreads(): Promise<
    {
      threadId: string;
      lastMessage: Date;
      messageCount: number;
      lastMessageContent: string;
      agentType: AgentType | null;
      firstMessage: string;
    }[]
  > {
    const rawThreads = await this.historyRepository
      .createQueryBuilder('history')
      .select('history.threadId', 'threadId')
      .addSelect('MAX(history.createdAt)', 'lastMessage')
      .addSelect('COUNT(history.id)', 'messageCount')
      .where('history.isActive = :isActive', { isActive: true })
      .groupBy('history.threadId')
      .orderBy('MAX(history.createdAt)', 'DESC')
      .getRawMany<{ threadId: string; lastMessage: string; messageCount: string }>();

    const threads: {
      threadId: string;
      lastMessage: Date;
      messageCount: number;
      lastMessageContent: string;
      agentType: AgentType | null;
      firstMessage: string;
    }[] = [];

    for (const thread of rawThreads) {
      const [firstMessage, lastMessage] = await Promise.all([
        this.historyRepository.findOne({
          where: { threadId: thread.threadId, isActive: true },
          order: { createdAt: 'ASC' },
        }),
        this.historyRepository.findOne({
          where: { threadId: thread.threadId, isActive: true },
          order: { createdAt: 'DESC' },
        }),
      ]);

      if (!firstMessage || !lastMessage) {
        continue;
      }

      threads.push({
        threadId: thread.threadId,
        lastMessage: lastMessage.createdAt,
        messageCount: Number(thread.messageCount),
        lastMessageContent: lastMessage.response,
        agentType: firstMessage.agentType ?? null,
        firstMessage: firstMessage.message,
      });
    }

    return threads;
  }


  private extractTextFromGeminiResponse(response: any): string {
    if (!response) {
      return '';
    }

    if (typeof response.text === 'function') {
      const textResult = response.text();
      if (typeof textResult === 'string' && textResult.trim().length > 0) {
        return textResult.trim();
      }
    }

    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];
      const text = parts
        .map((part: { text?: string }) => part?.text ?? '')
        .join('')
        .trim();
      if (text.length > 0) {
        return text;
      }
    }

    return '';
  }

  private async generateChatTitle(firstMessage: string, agentType: AgentType | null): Promise<string> {
    // Retorna apenas a primeira mensagem truncada, sem incluir o nome do agente
    if (!firstMessage || firstMessage.trim().length === 0) {
      return 'Conversa sem título';
    }

    // Limpar a mensagem removendo possíveis prefixos de arquivo
    let cleanMessage = firstMessage.trim();
    const fileContentPattern = /---\s*Conteúdo do arquivo:.*?---/s;
    cleanMessage = cleanMessage.replace(fileContentPattern, '').trim();
    
    // Se após limpar ficar vazio, usar mensagem padrão
    if (cleanMessage.length === 0) {
      return 'Arquivos anexados';
    }

    // Truncar para 50 caracteres e adicionar ellipsis se necessário
    const maxLength = 50;
    if (cleanMessage.length > maxLength) {
      return cleanMessage.substring(0, maxLength) + '...';
    }

    return cleanMessage;
  }

  async getChatList(agentType?: AgentType, page: number = 1, limit: number = 15) {
    const threadsData = await this.getAllThreads();
    const filteredThreads: Array<{
      threadId: string;
      agentType: AgentType | null;
      title: string;
      lastMessage: Date;
      messageCount: number;
    }> = [];

    for (const threadData of threadsData) {
      if (agentType && threadData.agentType !== agentType) {
        continue;
      }

      const title = await this.generateChatTitle(
        threadData.firstMessage,
        threadData.agentType,
      );

      filteredThreads.push({
        threadId: threadData.threadId,
        agentType: threadData.agentType,
        title,
        lastMessage: threadData.lastMessage,
        messageCount: threadData.messageCount,
      });
    }

    filteredThreads.sort(
      (a, b) => b.lastMessage.getTime() - a.lastMessage.getTime(),
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedThreads = filteredThreads.slice(startIndex, endIndex);

    const totalThreads = filteredThreads.length;
    const totalPages = Math.ceil(totalThreads / limit);

    return {
      threads: paginatedThreads.map((thread) => ({
        thread_id: thread.threadId,
        agente_utilizado: thread.agentType || 'Chat Livre',
        titulo: thread.title,
        ultima_mensagem: thread.lastMessage,
        total_mensagens: thread.messageCount,
      })),
        pagination: {
        current_page: page,
        total_pages: totalPages,
        total_threads: totalThreads,
        threads_per_page: limit,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    };
  }

  async deleteThread(threadId: string): Promise<void> {
    const result = await this.historyRepository.update(
      { threadId, isActive: true },
      { isActive: false },
    );

    if (!result.affected) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    this.logger.log(
      `Successfully soft deleted thread ${threadId} (${result.affected} messages marked as inactive)`,
    );
  }

  /**
   * Limpa todo o histórico de conversas
   * Remove permanentemente todas as threads e mensagens do armazenamento temporário
   */
  async clearAllHistory(): Promise<{ success: boolean; deletedThreads: number; deletedMessages: number }> {
    const activeThreads = await this.historyRepository
      .createQueryBuilder('history')
      .select('history.threadId', 'threadId')
      .where('history.isActive = :isActive', { isActive: true })
      .groupBy('history.threadId')
      .getRawMany();

    const result = await this.historyRepository.update(
      { isActive: true },
      { isActive: false },
    );

    const deletedMessages = result.affected ?? 0;
    const deletedThreads = activeThreads.length;

    this.logger.log(
      `Successfully cleared all history: ${deletedThreads} threads and ${deletedMessages} messages marked as inactive`,
    );

    return {
      success: true,
      deletedThreads,
      deletedMessages,
    };
  }
}
