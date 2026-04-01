# 🚀 Guia de Deploy - Nexus Monorepo

Este guia explica como hospedar o projeto Nexus como monorepo na branch `develop` de forma privada.

## 📋 Pré-requisitos

- Repositório Git privado configurado
- Branch `develop` criada
- Contas nas plataformas de hospedagem escolhidas

---

## 🔐 Passo 0: Criar Seu Próprio Repositório Privado

**⚠️ IMPORTANTE:** Se você não é o dono do repositório GitHub atual, é **altamente recomendado** criar seu próprio repositório privado para ter controle total sobre o deploy e configurações.

### **Opção A: Fork do Repositório (Recomendado)**

Se você tem acesso ao repositório original:

1. **No GitHub:**
   - Acesse o repositório original
   - Clique em **"Fork"** (canto superior direito)
   - Selecione sua conta como destino
   - ⚠️ **IMPORTANTE:** Desmarque "Copy the main branch only"
   - Clique em **"Create fork"**

2. **Tornar o fork privado:**
   - Vá em **Settings** > **General** > **Danger Zone**
   - Clique em **"Change visibility"** > **"Make private"**
   - Confirme a ação

3. **Criar branch develop (se não existir):**
   ```bash
   git clone https://github.com/SEU_USUARIO/nexus.git
   cd nexus
   git checkout -b develop
   git push -u origin develop
   ```

### **Opção B: Criar Novo Repositório Privado**

Se você não tem acesso ou prefere começar do zero:

1. **Criar repositório no GitHub:**
   - Acesse [GitHub](https://github.com/new)
   - **Repository name:** `nexus` (ou outro nome)
   - **Visibility:** ✅ **Private**
   - ⚠️ **NÃO** marque "Initialize with README"
   - Clique em **"Create repository"**

2. **Fazer push do código local:**
   ```bash
   # No diretório do projeto
   git remote remove origin  # Remove o remote antigo (se existir)
   git remote add origin https://github.com/SEU_USUARIO/nexus.git
   git branch -M develop  # Renomeia branch atual para develop (ou cria nova)
   git push -u origin develop
   ```

3. **Verificar que está privado:**
   - Acesse seu repositório no GitHub
   - Deve aparecer um cadeado 🔒 indicando que é privado

### **Opção C: Usar GitLab/Bitbucket**

Se preferir outras plataformas:

1. **GitLab:**
   - Crie um novo projeto privado
   - Siga os mesmos passos de push do código

2. **Bitbucket:**
   - Crie um novo repositório privado
   - Siga os mesmos passos de push do código

### **✅ Após Criar Seu Repositório:**

- [ ] Repositório criado e configurado como **privado**
- [ ] Branch `develop` criada e com código atualizado
- [ ] Você tem acesso de **owner/admin** ao repositório
- [ ] Pronto para conectar nas plataformas de deploy

**💡 Dica:** Mantenha o repositório privado para proteger suas chaves de API e configurações sensíveis.

---

## 🎯 Opções de Hospedagem

### **Opção 1: Render.com (Recomendado para Monorepo)**

Render.com suporta monorepos nativamente e permite deploy automático da branch `develop`.

#### **Passo 1: Configurar Backend**

1. Acesse [Render.com](https://render.com) e crie uma conta
2. Clique em **"New +"** > **"Web Service"**
3. Conecte seu repositório privado
4. Configure:
   - **Name:** `nexus-backend`
   - **Branch:** `develop`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start:prod`

5. **Variáveis de Ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=sua_url_do_banco
   GEMINI_API_KEY=sua_chave_gemini
   GEMINI_MODEL=gemini-1.5-flash
   DB_SSL=true
   ```

6. **Auto-Deploy:** Ative "Auto-Deploy" para a branch `develop`

#### **Passo 2: Configurar Frontend**

1. Clique em **"New +"** > **"Static Site"**
2. Conecte o mesmo repositório
3. Configure:
   - **Name:** `nexus-frontend`
   - **Branch:** `develop`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`

4. **Variáveis de Ambiente:**
   ```
   VITE_API_URL=https://nexus-backend.onrender.com
   ```

#### **Passo 3: Atualizar CORS no Backend**

No arquivo `backend/src/main.ts`, atualize as origens permitidas:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://nexus-frontend.onrender.com', // URL do seu frontend
  ],
  // ... resto da configuração
});
```

---

### **Opção 2: Vercel (Frontend) + Railway (Backend)**

#### **Frontend no Vercel:**

1. Acesse [Vercel.com](https://vercel.com)
2. Importe seu repositório privado
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Branch:** `develop` (configure em Settings > Git)

4. **Variáveis de Ambiente:**
   ```
   VITE_API_URL=https://seu-backend.railway.app
   ```

#### **Backend no Railway:**

1. Acesse [Railway.app](https://railway.app)
2. **"New Project"** > **"Deploy from GitHub repo"**
3. Selecione seu repositório e branch `develop`
4. Configure:
   - **Root Directory:** `backend`
   - Railway detectará automaticamente o `package.json`

5. **Variáveis de Ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=sua_url_do_banco
   GEMINI_API_KEY=sua_chave_gemini
   GEMINI_MODEL=gemini-1.5-flash
   DB_SSL=true
   ```

6. **Settings > Source:**
   - **Branch:** `develop`
   - **Auto Deploy:** Enabled

---

### **Opção 3: Docker + Qualquer Plataforma**

#### **Usando Docker Compose:**

1. **Build das imagens:**
   ```bash
   docker-compose build
   ```

2. **Deploy em plataformas que suportam Docker:**
   - **Railway:** Suporta Dockerfile automaticamente
   - **Fly.io:** `fly deploy`
   - **DigitalOcean App Platform:** Upload do `docker-compose.yml`
   - **AWS ECS/Fargate:** Requer configuração adicional

#### **Exemplo para Railway com Docker:**

1. Railway detecta automaticamente o `Dockerfile` no `backend/`
2. Configure:
   - **Root Directory:** `backend`
   - **Branch:** `develop`

---

## 🔒 Configurando Repositório Privado

### **GitHub:**

1. Repositório já está privado? ✅
2. Para deploy automático, você precisa:
   - Conectar sua conta GitHub na plataforma de hospedagem
   - Autorizar acesso ao repositório privado
   - Configurar branch `develop` como padrão para deploy

### **GitLab/Bitbucket:**

- Processo similar ao GitHub
- Conecte sua conta na plataforma de hospedagem
- Autorize acesso ao repositório privado

---

## 🔧 Configurações Importantes

### **1. Atualizar CORS no Backend**

Após obter a URL do frontend em produção, atualize `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173', // Desenvolvimento
    'https://seu-frontend.vercel.app', // Produção
    'https://nexus-frontend.onrender.com', // Alternativa
  ],
  // ...
});
```

### **2. Variáveis de Ambiente**

#### **Backend (.env):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-1.5-flash
DB_SSL=true
```

#### **Frontend (.env.production):**
```env
VITE_API_URL=https://seu-backend.railway.app
```

### **3. Banco de Dados**

O projeto usa PostgreSQL. Opções:
- **Supabase** (gratuito, recomendado)
- **Render PostgreSQL** (gratuito)
- **Railway PostgreSQL** (pago após trial)
- **Neon** (gratuito)

Configure a `DATABASE_URL` nas variáveis de ambiente do backend.

---

## 🚀 Deploy Automático na Branch Develop

### **Render.com:**
- ✅ Suporta nativamente
- Configure em cada serviço: **Settings > Build & Deploy > Branch:** `develop`

### **Vercel:**
- ✅ Suporta nativamente
- **Settings > Git > Production Branch:** `develop`

### **Railway:**
- ✅ Suporta nativamente
- **Settings > Source > Branch:** `develop`
- **Auto Deploy:** Enabled

---

## 📝 Checklist de Deploy

- [ ] Repositório privado configurado
- [ ] Branch `develop` criada e atualizada
- [ ] Backend deployado e funcionando
- [ ] Frontend deployado e funcionando
- [ ] CORS configurado com URLs de produção
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado e acessível
- [ ] Testes de integração frontend ↔ backend
- [ ] Deploy automático da branch `develop` ativado

---

## 🐛 Troubleshooting

### **Erro: "Cannot find module"**
- Verifique se o `Root Directory` está correto na plataforma
- Certifique-se de que `package.json` está no diretório correto

### **Erro: "CORS policy"**
- Atualize as origens permitidas no backend
- Verifique se a URL do frontend está correta

### **Erro: "Database connection failed"**
- Verifique `DATABASE_URL` e `DB_SSL`
- Teste a conexão localmente primeiro

### **Build falha no monorepo**
- Configure o `Root Directory` corretamente
- Use os comandos de build específicos do diretório (`cd backend && npm run build`)

---

## 📚 Recursos Adicionais

- [Render.com Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## 💡 Dica Final

Para facilitar o gerenciamento, considere usar o arquivo `render.yaml` na raiz do projeto. Render.com pode ler esse arquivo e configurar os serviços automaticamente.

Boa sorte com o deploy! 🚀
