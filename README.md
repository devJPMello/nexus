# 🚀 Nexus - Sistema de Chat com Agentes IA

Sistema completo de chat com diferentes tipos de agentes de IA especializados, desenvolvido com **NestJS** (backend) e **React + Vite** (frontend).

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Agentes Disponíveis](#-agentes-disponíveis)
- [API Routes](#-api-routes)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Como Executar](#-como-executar)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🏗️ Arquitetura

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   React Frontend│ ──────────────► │  NestJS Backend │
│   (Port 5173)   │                 │   (Port 3000)   │
└─────────────────┘                 └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Google Gemini    │
                                    │      API        │
                                    └─────────────────┘
```

---

## 🤖 Agentes Disponíveis

### 1. **FREE_CHAT** (`null`)
- **Descrição:** Chat livre sem prompts específicos
- **Uso:** Conversa geral com GPT
- **Sistema:** `createFreeChat()`

### 2. **STUDY_PLAN** (`'study_plan'`)
- **Descrição:** Especializado em criar planos de estudo personalizados
- **Uso:** Geração de cronogramas e materiais de estudo
- **Sistema:** Agent Factory

### 3. **SUMMARY** (`'summary'`)
- **Descrição:** Especializado em criar resumos estruturados
- **Uso:** Resumir textos, artigos ou conteúdos
- **Sistema:** Agent Factory

---

## 🛣️ API Routes

### **Base URL:** `http://localhost:3000`

---

## 🏠 **GET /**
**Endpoint raiz da aplicação**

```javascript
// Frontend
const response = await fetch('http://localhost:3000/');
```

**Resposta:**
```json
{
  "message": "Nexus API is running!"
}
```

---

## 💬 **POST /agents/chat**
**Sistema de chat principal - Centraliza toda comunicação com agentes**

### **Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `message` | `string` | ✅ | Mensagem do usuário |
| `agentType` | `string \| null` | ❌ | Tipo de agente (`null`, `'study_plan'`, `'summary'`) |
| `threadId` | `string` | ❌ | ID da thread (para continuar conversa) |

### **Exemplos de Uso:**

#### **1. Chat Livre (FREE_CHAT)**
```javascript
// Frontend - Chat livre
const response = await fetch('http://localhost:3000/agents/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Olá! Como você pode me ajudar?",
    agentType: null,  // null = chat livre
    threadId: null    // null = nova conversa
  }),
});

const data = await response.json();
```

**Resposta:**
```json
{
  "id": "uuid-da-resposta",
  "threadId": "thread_uuid-da-conversa",
  "response": "Olá! Posso ajudá-lo com diversas tarefas...",
  "agentType": null,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### **2. Agente de Planos de Estudo**
```javascript
// Frontend - Plano de estudos
const response = await fetch('http://localhost:3000/agents/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Preciso de um plano de estudos para aprender React em 30 dias",
    agentType: "study_plan",
    threadId: null
  }),
});
```

**Resposta:**
```json
{
  "id": "uuid-da-resposta",
  "threadId": "thread_uuid-da-conversa",
  "response": "# Plano de Estudos React - 30 dias\n\n## Semana 1: Fundamentos...",
  "agentType": "study_plan",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### **3. Agente de Resumos**
```javascript
// Frontend - Resumo
const response = await fetch('http://localhost:3000/agents/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Resuma este artigo: [texto longo aqui...]",
    agentType: "summary",
    threadId: null
  }),
});
```

**Resposta:**
```json
{
  "id": "uuid-da-resposta",
  "threadId": "thread_uuid-da-conversa",
  "response": "## Resumo do Artigo\n\n**Pontos principais:**\n1. ...",
  "agentType": "summary",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### **4. Continuando uma Conversa**
```javascript
// Frontend - Continuando thread existente
const response = await fetch('http://localhost:3000/agents/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Pode detalhar mais a semana 2?",
    agentType: "study_plan",
    threadId: "thread_abc123" // ID da thread anterior
  }),
});
```

---

## 📖 **GET /agents/chat/history**
**Buscar histórico de conversas**

### **Parâmetros de Query:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `threadId` | `string` | ❌ | ID específico da thread |

### **Exemplos:**

#### **1. Listar todas as threads**
```javascript
// Frontend - Buscar todas as threads
const response = await fetch('http://localhost:3000/agents/chat/history');
const threads = await response.json();
```

**Resposta:**
```json
[
  {
    "threadId": "thread_abc123",
    "lastMessage": "2024-01-15T10:30:00.000Z",
    "messageCount": 5,
    "lastMessageContent": "Preciso de um plano de estudos para..."
  }
]
```

#### **2. Buscar mensagens de uma thread específica**
```javascript
// Frontend - Mensagens de uma thread
const threadId = "thread_abc123";
const response = await fetch(`http://localhost:3000/agents/chat/history?threadId=${threadId}`);
const messages = await response.json();
```

**Resposta:**
```json
[
  {
    "id": "msg-1",
    "agentType": "study_plan",
    "prompt": "Preciso de um plano de estudos para React",
    "response": "# Plano de Estudos React...",
    "threadId": "thread_abc123",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "status": "completed"
  }
]
```

---

## 🗑️ **DELETE /agents/chat/thread/:threadId**
**Remover thread completa do histórico**

### **Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `threadId` | `string` | ✅ | ID da thread a ser removida (na URL) |

### **Exemplo:**

```javascript
// Frontend - Remover thread
const threadId = "thread_abc123";
const response = await fetch(`http://localhost:3000/agents/chat/thread/${threadId}`, {
  method: 'DELETE',
});

// Resposta: 204 No Content (sucesso)
```

---

## 📱 Exemplos de Uso Frontend

### **Implementação Completa no React:**

```javascript
// services/api.js
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000';
  }

  // Enviar mensagem para qualquer agente
  async sendChatMessage(message, agentType = null, threadId = null) {
    const response = await fetch(`${this.baseURL}/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        agentType,
        threadId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Buscar histórico
  async getChatHistory(threadId = null) {
    const url = threadId
      ? `${this.baseURL}/agents/chat/history?threadId=${threadId}`
      : `${this.baseURL}/agents/chat/history`;

    const response = await fetch(url);
    return response.json();
  }

  // Remover thread
  async deleteThread(threadId) {
    const response = await fetch(`${this.baseURL}/agents/chat/thread/${threadId}`, {
      method: 'DELETE',
    });

    return response.ok;
  }
}

export default new ApiService();
```

### **Componente React Example:**

```javascript
// components/ChatComponent.jsx
import { useState } from 'react';
import apiService from '../services/api.js';
import { AGENT_TYPES } from '../constants/agentTypes.js';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [agentType, setAgentType] = useState(AGENT_TYPES.FREE_CHAT);

  const sendMessage = async () => {
    try {
      const result = await apiService.sendChatMessage(message, agentType, threadId);

      setResponse(result.response);
      setThreadId(result.threadId); // Salvar para próximas mensagens
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  return (
    <div>
      {/* Seletor de Agente */}
      <select value={agentType} onChange={(e) => setAgentType(e.target.value)}>
        <option value={AGENT_TYPES.FREE_CHAT}>Chat Livre</option>
        <option value={AGENT_TYPES.STUDY_PLAN}>Plano de Estudos</option>
        <option value={AGENT_TYPES.SUMMARY}>Resumo</option>
      </select>

      {/* Campo de mensagem */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua mensagem..."
      />

      <button onClick={sendMessage}>Enviar</button>

      {/* Resposta */}
      {response && (
        <div>
          <h3>Resposta:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
}

export default ChatComponent;
```

---

## 🚀 Como Executar

### **1. Backend (NestJS)**
```bash
cd backend
npm install
npm run start:dev
```

### **2. Frontend (React + Vite)**
```bash
cd frontend
npm install
npm run dev
```

### **3. Variáveis de Ambiente**
```bash
# backend/.env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-1.5-flash
```

---

## 📁 Estrutura do Projeto

```
nexus/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── gpt/
│   │   │   ├── controllers/ # Rotas HTTP
│   │   │   ├── services/    # Lógica de negócio
│   │   │   ├── enums/       # Tipos de agentes
│   │   │   └── dtos/        # Validação de dados
│   │   └── main.ts
│   └── package.json
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── services/        # Comunicação com API
│   │   ├── constants/       # Tipos de agentes
│   │   └── components/      # Componentes React
│   └── package.json
│
└── README.md               # Este arquivo
```

---

## 🎯 Resumo das Funcionalidades

- ✅ **3 Agentes especializados** (Chat Livre, Planos de Estudo, Resumos)
- ✅ **Sistema de threads** (conversas contínuas)
- ✅ **Histórico completo** (busca e listagem)
- ✅ **Gerenciamento de threads** (criação e remoção)
- ✅ **API REST limpa** (apenas 4 endpoints essenciais)
- ✅ **Frontend integrado** (React com serviços prontos)

---

## 📧 Contato

Desenvolvido para o projeto **Nexus** - Sistema inteligente de chat com agentes especializados.