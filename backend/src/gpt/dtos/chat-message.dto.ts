import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentType } from '../enums/agent-type.enum';

export class ChatMessageDto {
  @ApiProperty({
    description: 'Mensagem do usuário',
    example: 'Crie um plano de estudos para programação',
    maxLength: 100000, // Aumentado para suportar conteúdo de PDFs
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, { message: 'Mensagem não pode exceder 100000 caracteres' })
  message: string;

  @ApiPropertyOptional({
    description: 'Tipo de agente (opcional - se não informado, usa GPT livre)',
    enum: AgentType,
    example: AgentType.STUDY_PLAN,
  })
  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @ApiPropertyOptional({
    description: 'ID da thread/conversa (opcional - se não informado, cria nova)',
    example: 'thread_123456',
  })
  @IsOptional()
  @IsString()
  threadId?: string;

  @ApiPropertyOptional({
    description: 'Imagens em base64 para análise multimodal (opcional)',
    type: [String],
    example: ['data:image/png;base64,iVBORw0KGgoAAAANS...'],
  })
  @IsOptional()
  images?: string[];
}