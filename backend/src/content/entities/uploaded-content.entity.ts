import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_uploaded_contents' })
@Index(['userId', 'createdAt'])
export class UploadedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'text' })
  filename: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 255 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ name: 'text_content', type: 'text' })
  textContent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
