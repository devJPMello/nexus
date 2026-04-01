import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentType } from '../enums/agent-type.enum';
import { Transform } from 'class-transformer';

export class ChatListDto {
  @ApiPropertyOptional({
    description: 'Tipo de agente para filtrar (opcional)',
    enum: AgentType,
    example: AgentType.SUMMARY,
  })
  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @ApiPropertyOptional({
    description: 'Número da página (padrão: 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página (padrão: 15)',
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 15;
}