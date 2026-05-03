# BackMaster - Gestão Inteligente de Demandas

BackMaster é uma plataforma avançada desenvolvida para otimizar a comunicação e o fluxo de trabalho entre **Assessores de Investimento** e o **Backoffice**. O sistema permite a abertura, acompanhamento e gestão de demandas operacionais com alta eficiência e segurança.

## 🚀 Funcionalidades Principais

### 💼 Portal do Assessor
- **Abertura de Demandas Dinâmicas**: Formulários inteligentes que se adaptam ao tipo de solicitação (Abertura de Conta, Renda Fixa, Seguros, etc.).
- **Acompanhamento em Tempo Real**: Status atualizado de cada ticket e notificações de atualizações.
- **Bloqueio de Demandas por Avaliação**: Sistema que incentiva o feedback obrigando a avaliação de tickets concluídos antes de novas aberturas.

### 🛠️ Gestão de Backoffice (Demandas)
- **Visão Global**: Central de tickets para Atendentes e Gestores.
- **Filtros Avançados**: Busca por prioridade, status, assessor ou categoria.
- **SLA e Prazos**: Indicadores visuais de tickets vencidos ou próximos do prazo.

### 📊 Dashboard Estratégico
- **KPIs em Tempo Real**: Total de demandas, tempo médio de atendimento (SLA) e nota média de satisfação.
- **Rankings de Performance**: Visualize os assessores e atendentes mais produtivos e bem avaliados.
- **Gráficos Dinâmicos**: Distribuição por categoria, prioridade e status.

### ⚙️ Configurações e Administração
- **Gestão de Usuários**: Vinculação de perfis a usuários existentes no Supabase Auth.
- **Customização de Cargos**: Atribuição de permissões baseadas em funções (Gestor, Atendente, Assessor).

## 🛠️ Stack Tecnológica

- **Frontend**: React + Vite + TypeScript
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Backend/Banco**: Supabase (PostgreSQL)
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **Tema**: Dark & Light Mode (Persistente)

## 📋 Pré-requisitos e Instalação

1. **Clone o repositório**
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto com suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=seu_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_key
   ```
4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🔒 Segurança (RLS)

O projeto utiliza **Row Level Security (RLS)** no Supabase para garantir que:
- **Assessores** vejam apenas suas próprias demandas.
- **Backoffice** tenha visão completa para atendimento.
- **Perfis** sejam protegidos contra acesso não autorizado.

---
Desenvolvido para máxima performance e usabilidade operacional.
