#  Migração para Supabase 

##  Status Atual
Seu sistema está **funcionando perfeitamente** com dados em memória. Para ter dados persistentes, siga este guia.

---

## 📋 Passo a Passo Completo

### **PASSO 1: Criar Projeto no Supabase**

1. **Acesse:** https://supabase.com
2. **Clique em:** "Start your project"
3. **Faça login** com GitHub
4. **Clique em:** "New Project"
5. **Preencha:**
   - **Name:** `nexus-chat` (ou outro nome)
   - **Database Password:** Crie uma senha forte (anote ela!)
   - **Region:** South America (São Paulo)
6. **Clique em:** "Create new project"
7. **Aguarde** 2-3 minutos para o projeto ser criado

### **PASSO 2: Criar Tabela no Supabase**

1. **No painel do Supabase**, vá em **SQL Editor** (menu lateral)
2. **Clique em:** "New query"
3. **Cole este código** e clique "Run":

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela history
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  "agentType" VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  "systemMessage" TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.8,
  "maxTokens" INTEGER DEFAULT 16000,
  "errorMessage" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_history_thread_id ON history(thread_id);
CREATE INDEX IF NOT EXISTS idx_history_is_active ON history("isActive");
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history("createdAt");

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_history_updated_at
  BEFORE UPDATE ON history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. **Verifique** se apareceu "Success. No rows returned"

### **PASSO 3: Pegar Credenciais do Banco**

1. **No Supabase**, vá em **Settings** > **Database** (menu lateral)
2. **Na seção "Connection string"**, clique em **URI**
3. **Copie a URI** que aparece (algo como: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
4. **Guarde essa informação!**

### **PASSO 4: Configurar .env no Projeto**

No arquivo `.env` do seu backend, adicione:

```env
# Supabase Database
DB_TYPE=postgres
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=SUA_SENHA_AQUI
DB_DATABASE=postgres
DB_SSL=true

# Gemini (já deve ter)
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-1.5-flash
```

**⚠️ Substitua:**
- `DB_HOST`: Pegar do Supabase (sem `postgresql://` e sem `:5432`)
- `DB_PASSWORD`: A senha que você criou no Passo 1

### **PASSO 5: Instalar Dependências**

No terminal do backend:
```bash
npm install @nestjs/typeorm typeorm pg
npm install --save-dev @types/pg
```

### **PASSO 6: Criar Entity**

Crie o arquivo `src/gpt/entities/history.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AgentType } from '../enums/agent-type.enum';

@Entity('history')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  thread_id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text' })
  response: string;

  @Column({
    type: 'enum',
    enum: AgentType,
    nullable: true
  })
  agentType: AgentType | null;

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: 'pending' | 'processing' | 'completed' | 'error';

  @Column({ type: 'text', nullable: true })
  systemMessage: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.8 })
  temperature: number;

  @Column({ type: 'int', default: 16000 })
  maxTokens: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **PASSO 7: Atualizar App Module**

No `src/app.module.ts`, adicione a configuração do TypeORM:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GptModule } from './gpt/gpt.module';
import { History } from './gpt/entities/history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [History],
      synchronize: false,
      logging: ['error'],
    }),
    GptModule,
  ],
})
export class AppModule {}
```

### **PASSO 8: Atualizar GPT Module**

No `src/gpt/gpt.module.ts`, descomente as linhas:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // ← DESCOMENTAR
import { GptService } from './services/gpt.service';
import { GptController } from './controllers/gpt.controller';
import { History } from './entities/history.entity'; // ← DESCOMENTAR

@Module({
  imports: [TypeOrmModule.forFeature([History])], // ← DESCOMENTAR
  controllers: [GptController],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
```

### **PASSO 9: Atualizar Service**

No `src/gpt/services/gpt.service.ts`, descomente as linhas do constructor:

```typescript
constructor(
  @InjectRepository(History) // ← DESCOMENTAR
  private readonly historyRepository: Repository<History>, // ← DESCOMENTAR
) {
  void this.initializeServices();
}
```

E adicione os imports no topo:
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from '../entities/history.entity';
```

### **PASSO 10: Testar**

1. **Execute:** `npm run build`
2. **Se der erro**, verifique se:
   - As credenciais do .env estão corretas
   - A tabela foi criada no Supabase
   - Todas as linhas foram descomentadas

3. **Execute:** `npm run start:dev`
4. **Teste a API** - agora os dados ficam salvos permanentemente!

---

##  Como Verificar se Funcionou

1. **Faça uma requisição** para sua API
2. **No Supabase**, vá em **Table Editor** > **history**
3. **Deve aparecer** os dados da conversa salvos na tabela

---

##  Problemas Comuns

** Erro de conexão:**
- Verifique se a senha do .env está correta
- Verifique se o DB_HOST está sem `postgresql://`

** Tabela não existe:**
- Execute novamente o SQL do Passo 2

** Erro de compilação:**
- Verifique se todas as linhas foram descomentadas
- Execute `npm install` novamente

---

##  Resultado Final

 **Dados persistentes** no Supabase
 **Backup automático**
 **Escalabilidade ilimitada**
 **Dashboard para visualizar dados**
 **Soft delete** funcionando
