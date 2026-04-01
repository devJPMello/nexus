import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GptService } from '../services/gpt.service';
import { ChatMessageDto } from '../dtos/chat-message.dto';
import { ChatListDto } from '../dtos/chat-list.dto';
import { AgentType } from '../enums/agent-type.enum';

@ApiTags('Agents')
@Controller('agents')
export class GptController {
  constructor(
    private readonly gptService: GptService,
  ) {}


  // Sistema de Chat com Histórico
  @Post('chat')
  @ApiOperation({
    summary: 'Enviar mensagem para chat',
    description: 'Envia mensagem para agente específico ou GPT livre, mantendo histórico por thread',
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem processada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID da resposta' },
        threadId: { type: 'string', description: 'ID da thread/conversa' },
        response: { type: 'string', description: 'Resposta gerada' },
        agentType: { type: 'string', description: 'Tipo de agente usado (ou null para GPT livre)' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body(ValidationPipe) body: ChatMessageDto) {
    const { message, agentType, threadId, images } = body;

    const result = await this.gptService.createFreeChat(message, threadId, agentType, images);

    return {
      id: result.id,
      threadId: result.threadId,
      response: result.response,
      agentType: agentType || null,
      createdAt: result.createdAt,
    };
  }

  @Get('chat/history')
  @ApiOperation({
    summary: 'Buscar histórico de conversas',
    description: 'Retorna lista de todas as threads/conversas ou filtra por threadId',
  })
  @ApiQuery({
    name: 'threadId',
    required: false,
    description: 'ID da thread específica para buscar mensagens',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico recuperado com sucesso',
  })
  async getChatHistory(@Query('threadId') threadId?: string) {
    // Buscar mensagens de uma thread específica
    if (threadId) {
      return this.gptService.getMessagesByThread(threadId);
    } 
    // Buscar todas as threads
    else {
      return this.gptService.getAllThreads();
    }
  }

  @Get('chat/list')
  @ApiOperation({
    summary: 'Listar conversas com paginação',
    description: 'Retorna lista paginada de conversas com títulos e filtro por agente',
  })
  @ApiQuery({
    name: 'agentType',
    enum: AgentType,
    required: false,
    description: 'Filtrar por tipo de agente',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 15)',
    example: 15,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas recuperada com sucesso',
    schema: {
      type: 'object',
      properties: {
        threads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              thread_id: { type: 'string', description: 'ID da thread' },
              agente_utilizado: { type: 'string', description: 'Tipo de agente ou "Chat Livre"' },
              titulo: { type: 'string', description: 'Título gerado da conversa' },
              ultima_mensagem: { type: 'string', format: 'date-time', description: 'Data da última mensagem' },
              total_mensagens: { type: 'number', description: 'Total de mensagens na thread' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            current_page: { type: 'number' },
            total_pages: { type: 'number' },
            total_threads: { type: 'number' },
            threads_per_page: { type: 'number' },
            has_next: { type: 'boolean' },
            has_previous: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getChatList(@Query() query: ChatListDto) {
    const { agentType, page = 1, limit = 15 } = query;
    return this.gptService.getChatList(agentType, page, limit);
  }

  @Delete('chat/thread/:threadId')
  @ApiOperation({
    summary: 'Remover thread completa',
    description: 'Remove uma thread/conversa inteira do histórico',
  })
  @ApiResponse({
    status: 204,
    description: 'Thread removida com sucesso',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteThread(@Param('threadId') threadId: string): Promise<void> {
    return this.gptService.deleteThread(threadId);
  }

  @Delete('chat/history')
  @ApiOperation({
    summary: 'Limpar todo o histórico de conversas',
    description: 'Remove permanentemente todas as threads e mensagens do histórico',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico limpo com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Indica se a operação foi bem-sucedida' },
        deletedThreads: { type: 'number', description: 'Número de threads deletadas' },
        deletedMessages: { type: 'number', description: 'Número total de mensagens deletadas' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async clearAllHistory() {
    return this.gptService.clearAllHistory();
  }

}