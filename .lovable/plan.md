
## Plano de Implementação — BackMaster v2

### Fase 1: Dados e Tipos
- Atualizar `types/ticket.ts` com campos: `userRating`, `attendantNotes`, `hasUnreadUpdate`, `userScore`
- Atualizar `mockData.ts` com dados de notas, avaliações pendentes, e scores de usuários

### Fase 2: Portal do Assessor (`PortalPage.tsx`)
1. **Demandas abertas e concluídas** — listar separadas, com ponto amarelo em demandas com atualizações não lidas
2. **Bloqueio de nova demanda** — se houver demandas concluídas pendentes de avaliação, bloquear botão de nova demanda e mostrar aviso
3. **Separação por status** — ordenar: SLA vencidas no topo, depois AGUARDANDO RETORNO > AGUARDANDO XP > EM ANDAMENTO, bloco separado de concluídas
4. **Chat MIAjuda** — botão flutuante no canto inferior direito, chat com IA real (Lovable AI via edge function)
5. **Nota do usuário** — ao clicar no nome, mostrar nota atual + histórico de notas + benefícios de nota alta
6. **Notificações** — dropdown no sino mostrando últimas movimentações dos tickets

### Fase 3: Tela de Demandas (`DemandsPage.tsx`)
1. **Reordenar colunas**: Responsável → Categoria → Resumo → Cliente → PL → Prioridade → SLA → Status
2. **Responsável obrigatório** — quem abre é sempre responsável, atendente/gestor pode adicionar mais
3. **Nota do atendente** — ao lado das iniciais, mostrar nota + resumo IA das últimas avaliações
4. **SLA em dias** — após 24h mostrar em dias, tooltip com horas/minutos/segundos
5. **Descrição no detalhe** — mover descrição para fora do chat, como parte das info do ticket

### Fase 4: Dashboard (`DashboardPage.tsx`)
1. **KPIs**: demandas abertas, por status, concluídas, média de notas
2. **Tempo médio por status**
3. **Rankings**: assessores que mais abriram demandas, melhores notas
4. **Filtros de período**: dia, semana, mês, trimestre, semestre, datas customizadas
5. **Filtro por atendente**
6. **IA de sugestões** — integrar com Lovable AI para análise e sugestões (requer Lovable Cloud)

### Fase 5: IA (requer Lovable Cloud)
- Edge function para MIAjuda (chat FAQ)
- Edge function para sugestões no Dashboard
- Edge function para resumo de notas do atendente

> **Nota**: As features de IA real precisam do Lovable Cloud ativado. Como escolheu "mock primeiro", vou implementar toda a UI e lógica com dados mock, e deixar a integração de IA preparada para quando ativar o Cloud. Posso criar interfaces de chat e sugestões funcionais com respostas mock simulando IA.

### Arquivos a criar/modificar:
- `src/types/ticket.ts` — novos campos
- `src/data/mockData.ts` — dados atualizados
- `src/pages/PortalPage.tsx` — refatorar completamente
- `src/pages/DemandsPage.tsx` — reordenar e adicionar features
- `src/pages/DashboardPage.tsx` — redesign completo
- `src/pages/TicketDetailPage.tsx` — mover descrição para fora do chat
- `src/components/MIAjudaChat.tsx` — novo componente de chat
- `src/components/UserScorePopover.tsx` — novo componente de nota
- `src/components/NotificationsDropdown.tsx` — novo componente
- `src/components/RatingModal.tsx` — modal de avaliação
- `src/components/TopBar.tsx` — integrar notificações e perfil
- `src/lib/ticket-utils.ts` — formatação SLA em dias
