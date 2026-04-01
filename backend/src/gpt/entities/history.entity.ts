import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentType } from '../enums/agent-type.enum';

@Entity({ name: 'chat_history' })
@Index(['threadId', 'isActive'])
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id', type: 'varchar', length: 255 })
  threadId: string;

  @Column({ name: 'agent_type', type: 'varchar', length: 32, nullable: true })
  agentType: AgentType | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status: string;

  @Column({ name: 'system_message', type: 'text', nullable: true })
  systemMessage: string | null;

  @Column({ type: 'float', default: 0.8 })
  temperature: number;

  @Column({ name: 'max_tokens', type: 'int', default: 16000 })
  maxTokens: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
