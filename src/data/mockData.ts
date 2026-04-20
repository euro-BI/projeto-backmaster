import { Ticket, User, TicketNotification } from "@/types/ticket";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

// ==================== USERS ====================
// 2 gestores, 10 atendentes, 20 assessores, 6 excluídos

export const mockUsers: User[] = [
  // --- GESTORES ---
  { id: "g1", name: "Roberto Lima", email: "roberto@backmaster.com", role: "gestor", cargos: ["gestor"], rating: 9.5, active: true },
  { id: "g2", name: "Patricia Mendes", email: "patricia@backmaster.com", role: "gestor", cargos: ["gestor"], rating: 9.2, active: true },

  // --- ATENDENTES ---
  { id: "a1", name: "Marcos Santos", email: "marcos@backmaster.com", role: "atendente", cargos: ["atendente_senior"], area: "backoffice", rating: 8.8, active: true },
  { id: "a2", name: "Julia Costa", email: "julia@backmaster.com", role: "atendente", cargos: ["atendente_senior"], area: "rv", rating: 9.1, active: true },
  { id: "a3", name: "Fernanda Souza", email: "fernanda@backmaster.com", role: "atendente", cargos: ["atendente_pleno"], area: "rf", rating: 7.9, active: true },
  { id: "a4", name: "Lucas Pereira", email: "lucas@backmaster.com", role: "atendente", cargos: ["atendente_pleno"], area: "seguros", rating: 8.2, active: true },
  { id: "a5", name: "Camila Ribeiro", email: "camila@backmaster.com", role: "atendente", cargos: ["atendente_junior"], area: "credito", rating: 7.4, active: true },
  { id: "a6", name: "Thiago Almeida", email: "thiago@backmaster.com", role: "atendente", cargos: ["atendente_junior"], area: "pj", rating: 7.1, active: true },
  { id: "a7", name: "Beatriz Nunes", email: "beatriz@backmaster.com", role: "atendente", cargos: ["mesa_rv"], area: "rv", rating: 8.5, active: true },
  { id: "a8", name: "Rafael Cardoso", email: "rafael@backmaster.com", role: "atendente", cargos: ["mesa_rf"], area: "rf", rating: 8.0, active: true },
  { id: "a9", name: "Amanda Ferreira", email: "amanda@backmaster.com", role: "atendente", cargos: ["atendente_treinamento"], area: "backoffice", rating: 6.5, active: true },
  { id: "a10", name: "Diego Martins", email: "diego@backmaster.com", role: "atendente", cargos: ["atendente_pleno"], area: "backoffice", rating: 8.3, active: true },

  // --- ASSESSORES ---
  { id: "u1", name: "Carlos Silva", email: "carlos@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.5, active: true,
    ratingsReceived: [
      { ticketId: "BM-006", score: 9, comment: "Assessor muito prestativo e ágil.", ratedBy: "a3", ratedByName: "Fernanda Souza", date: hoursAgo(72) },
      { ticketId: "BM-002", score: 8, comment: "Boa comunicação, mas poderia detalhar mais.", ratedBy: "a2", ratedByName: "Julia Costa", date: hoursAgo(48) },
      { ticketId: "BM-009", score: 9, comment: "Excelente organização nas demandas.", ratedBy: "a1", ratedByName: "Marcos Santos", date: hoursAgo(120) },
    ],
  },
  { id: "u2", name: "Ana Oliveira", email: "ana@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 6.2, active: true,
    ratingsReceived: [
      { ticketId: "BM-003", score: 5, comment: "Documentação incompleta. Precisa melhorar.", ratedBy: "a1", ratedByName: "Marcos Santos", date: hoursAgo(48) },
      { ticketId: "BM-005", score: 7, comment: "Melhorou a clareza nas solicitações.", ratedBy: "a2", ratedByName: "Julia Costa", date: hoursAgo(24) },
    ],
  },
  { id: "u3", name: "Pedro Barros", email: "pedro@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 9.6, active: true },
  { id: "u4", name: "Marina Lopes", email: "marina@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 7.8, active: true },
  { id: "u5", name: "Bruno Araujo", email: "bruno@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 9.0, active: true },
  { id: "u6", name: "Larissa Dias", email: "larissa@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 5.5, active: true },
  { id: "u7", name: "Gustavo Moura", email: "gustavo@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.1, active: true },
  { id: "u8", name: "Isabella Rocha", email: "isabella@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 7.3, active: true },
  { id: "u9", name: "Felipe Campos", email: "felipe@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.7, active: true },
  { id: "u10", name: "Carolina Vieira", email: "carolina@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 6.9, active: true },
  { id: "u11", name: "Leonardo Teixeira", email: "leonardo@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 7.5, active: true },
  { id: "u12", name: "Daniela Cunha", email: "daniela@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.9, active: true },
  { id: "u13", name: "Vinicius Pinto", email: "vinicius@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 6.0, active: true },
  { id: "u14", name: "Juliana Melo", email: "juliana@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 9.3, active: true },
  { id: "u15", name: "Alexandre Gomes", email: "alexandre@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 7.0, active: true },
  { id: "u16", name: "Renata Borges", email: "renata@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.4, active: true },
  { id: "u17", name: "Rodrigo Farias", email: "rodrigo@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 5.8, active: true },
  { id: "u18", name: "Natalia Cruz", email: "natalia@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 8.6, active: true },
  { id: "u19", name: "Eduardo Ramos", email: "eduardo@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 7.7, active: true },
  { id: "u20", name: "Mariana Freitas", email: "mariana@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 9.1, active: true },

  // --- EXCLUÍDOS ---
  { id: "x1", name: "João Batista", email: "joao@backmaster.com", role: "atendente", cargos: ["atendente_junior"], area: "backoffice", rating: 5.0, active: false },
  { id: "x2", name: "Tatiana Reis", email: "tatiana@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 4.5, active: false },
  { id: "x3", name: "Henrique Moraes", email: "henrique@backmaster.com", role: "atendente", cargos: ["atendente_treinamento"], rating: 3.8, active: false },
  { id: "x4", name: "Priscila Andrade", email: "priscila@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 4.2, active: false },
  { id: "x5", name: "Marcelo Barbosa", email: "marcelo@backmaster.com", role: "assessor", cargos: ["assessor"], rating: 5.1, active: false },
  { id: "x6", name: "Aline Correia", email: "aline@backmaster.com", role: "atendente", cargos: ["atendente_pleno"], area: "rv", rating: 6.0, active: false },
];

export const currentUser: User = mockUsers.find(u => u.id === "a1")!; // atendente sênior

export const mockNotifications: TicketNotification[] = [
  { id: "n1", ticketId: "BM-001", ticketTitle: "Abertura de conta PJ", type: "status_change", message: "Status alterado para Em Análise", createdAt: hoursAgo(1), read: false },
  { id: "n2", ticketId: "BM-005", ticketTitle: "Problema no acesso ao portal", type: "new_comment", message: "Julia Costa comentou no ticket", createdAt: hoursAgo(2), read: false },
  { id: "n3", ticketId: "BM-002", ticketTitle: "Portabilidade de investimentos", type: "status_change", message: "Status alterado para Aguardando XP", createdAt: hoursAgo(5), read: true },
  { id: "n4", ticketId: "BM-008", ticketTitle: "Renda fixa - CDB", type: "new_comment", message: "Fernanda Souza enviou nova mensagem", createdAt: hoursAgo(8), read: true },
  { id: "n5", ticketId: "BM-003", ticketTitle: "Atualização cadastral", type: "assigned", message: "Você foi atribuído como responsável", createdAt: hoursAgo(12), read: true },
  { id: "n6", ticketId: "BM-012", ticketTitle: "Compra VALE3", type: "rating_change", message: "Nota do assessor alterada: 8.5 → 6.2", createdAt: hoursAgo(3), read: false },
  { id: "n7", ticketId: "BM-015", ticketTitle: "Abertura PJ - Startup X", type: "goal_reached", message: "Meta semanal atingida: 12 demandas concluídas!", createdAt: hoursAgo(6), read: true },
];

// Helper to create tickets
function t(
  id: string, title: string, desc: string, cat: Ticket["category"], status: Ticket["status"], priority: Ticket["priority"],
  clientCode: string, clientPL: string, createdBy: string, createdByName: string,
  assignees: string[], assigneeNames: string[], attendants: string[], attendantNames: string[],
  createdH: number, updatedH: number, opts: Partial<Ticket> = {}
): Ticket {
  return {
    id, title, description: desc, category: cat, demandType: opts.demandType || "normal", status, priority,
    clientCode, clientPL, createdBy, createdByName, assignees, assigneeNames,
    attendants, attendantNames,
    createdAt: hoursAgo(createdH), updatedAt: hoursAgo(updatedH),
    messages: opts.messages || [], statusHistory: opts.statusHistory || [],
    hasUnreadUpdate: opts.hasUnreadUpdate, pendingRating: opts.pendingRating,
    closedAt: opts.closedAt, rating: opts.rating, ratingJustification: opts.ratingJustification,
    linkedTickets: opts.linkedTickets,
  };
}

export const mockTickets: Ticket[] = [
  // --- NOVA DEMANDA ---
  t("BM-001", "Abertura de conta PJ - Tech Solutions LTDA", "Cliente solicita abertura de conta PJ para empresa Tech Solutions LTDA. CNPJ: 12.345.678/0001-90.", "abertura_conta", "nova_demanda", "alta",
    "4521", "R$ 2.500.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a1"], ["Marcos Santos"], 52, 2,
    { hasUnreadUpdate: true, messages: [
      { id: "m1", ticketId: "BM-001", userId: "u1", userName: "Carlos Silva", content: "Cliente precisa da conta aberta com urgência para receber transferência internacional.", createdAt: hoursAgo(52) },
      { id: "m1b", ticketId: "BM-001", userId: "a1", userName: "Marcos Santos", content: "Vou verificar a documentação e dar andamento.", createdAt: hoursAgo(2) },
    ], statusHistory: [
      { id: "sh1", ticketId: "BM-001", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(52) },
    ], linkedTickets: ["BM-005"] }),

  t("BM-007", "Operação de renda variável - Compra PETR4", "Cliente deseja comprar 1000 ações PETR4 a mercado.", "renda_variavel", "nova_demanda", "urgente",
    "2234", "R$ 5.800.000", "u2", "Ana Oliveira", ["u2"], ["Ana Oliveira"], [], [], 1, 1,
    { messages: [{ id: "m14", ticketId: "BM-007", userId: "u2", userName: "Ana Oliveira", content: "Cliente quer comprar URGENTE.", createdAt: hoursAgo(1) }],
      statusHistory: [{ id: "sh14", ticketId: "BM-007", fromStatus: null, toStatus: "nova_demanda", changedBy: "u2", changedByName: "Ana Oliveira", changedAt: hoursAgo(1) }] }),

  t("BM-010", "Abertura conta PF - Investidor novo", "Novo investidor quer abrir conta PF.", "abertura_conta", "nova_demanda", "media",
    "8801", "R$ 350.000", "u3", "Pedro Barros", ["u3"], ["Pedro Barros"], [], [], 3, 3),

  t("BM-011", "Transferência custódia fundos", "Cliente quer transferir custódia de 3 fundos.", "portabilidade", "nova_demanda", "alta",
    "5590", "R$ 1.200.000", "u5", "Bruno Araujo", ["u5"], ["Bruno Araujo"], [], [], 4, 4),

  // --- EM ANÁLISE ---
  t("BM-002", "Portabilidade de investimentos - Fundo ABC", "Transferência de R$ 500.000 em fundos do Banco X.", "portabilidade", "em_analise", "media",
    "7892", "R$ 850.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a2"], ["Julia Costa"], 24, 6,
    { messages: [
      { id: "m2", ticketId: "BM-002", userId: "u1", userName: "Carlos Silva", content: "Cliente deseja portar fundo ABC e DEF.", createdAt: hoursAgo(24) },
      { id: "m3", ticketId: "BM-002", userId: "a2", userName: "Julia Costa", content: "Vou solicitar o STVM. Prazo estimado: 5 dias úteis.", createdAt: hoursAgo(6) },
    ], statusHistory: [
      { id: "sh2", ticketId: "BM-002", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(24) },
      { id: "sh3", ticketId: "BM-002", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a2", changedByName: "Julia Costa", changedAt: hoursAgo(12) },
    ] }),

  t("BM-005", "Problema no acesso ao portal do cliente", "Cliente reporta erro 403 ao tentar acessar o portal.", "problema_tecnico", "em_analise", "urgente",
    "4521", "R$ 2.500.000", "u2", "Ana Oliveira", ["u2"], ["Ana Oliveira"], ["a1", "a2"], ["Marcos Santos", "Julia Costa"], 4, 1,
    { hasUnreadUpdate: true, messages: [
      { id: "m8", ticketId: "BM-005", userId: "u2", userName: "Ana Oliveira", content: "Cliente não consegue acessar desde ontem à noite.", createdAt: hoursAgo(4) },
      { id: "m9", ticketId: "BM-005", userId: "a1", userName: "Marcos Santos", content: "Estou verificando com TI.", createdAt: hoursAgo(2) },
    ], statusHistory: [
      { id: "sh9", ticketId: "BM-005", fromStatus: null, toStatus: "nova_demanda", changedBy: "u2", changedByName: "Ana Oliveira", changedAt: hoursAgo(4) },
      { id: "sh10", ticketId: "BM-005", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a1", changedByName: "Marcos Santos", changedAt: hoursAgo(2) },
    ], linkedTickets: ["BM-001"] }),

  t("BM-008", "Renda fixa - Aplicação em CDB", "Cliente deseja aplicar R$ 200.000 em CDB pré-fixado 14% a.a.", "renda_fixa", "em_analise", "alta",
    "6678", "R$ 1.200.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a3"], ["Fernanda Souza"], 8, 3,
    { messages: [
      { id: "m15", ticketId: "BM-008", userId: "u1", userName: "Carlos Silva", content: "Verificar CDB pré 14% para 2 anos.", createdAt: hoursAgo(8) },
      { id: "m16", ticketId: "BM-008", userId: "a3", userName: "Fernanda Souza", content: "Temos CDB pré 13.8% do Banco XYZ. Confirma?", createdAt: hoursAgo(3) },
    ], statusHistory: [
      { id: "sh15", ticketId: "BM-008", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(8) },
      { id: "sh16", ticketId: "BM-008", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a3", changedByName: "Fernanda Souza", changedAt: hoursAgo(5) },
    ] }),

  t("BM-012", "Compra VALE3 - Lote 500", "Comprar 500 ações VALE3 para cliente.", "renda_variavel", "em_analise", "alta",
    "3344", "R$ 4.100.000", "u7", "Gustavo Moura", ["u7"], ["Gustavo Moura"], ["a7"], ["Beatriz Nunes"], 6, 2),

  t("BM-013", "Seguro empresarial - Loja Centro", "Cotação seguro patrimonial para loja.", "seguros", "em_analise", "media",
    "1122", "R$ 780.000", "u4", "Marina Lopes", ["u4"], ["Marina Lopes"], ["a4"], ["Lucas Pereira"], 10, 4),

  // --- AGUARDANDO RETORNO ---
  t("BM-003", "Atualização cadastral - Endereço e telefone", "Cliente mudou de endereço e precisa atualizar cadastro.", "atualizacao_cadastral", "aguardando_retorno", "baixa",
    "3310", "R$ 120.000", "u2", "Ana Oliveira", ["u2"], ["Ana Oliveira"], ["a1"], ["Marcos Santos"], 72, 48,
    { hasUnreadUpdate: true, messages: [
      { id: "m4", ticketId: "BM-003", userId: "u2", userName: "Ana Oliveira", content: "Segue comprovante do novo endereço.", createdAt: hoursAgo(72) },
      { id: "m5", ticketId: "BM-003", userId: "a1", userName: "Marcos Santos", content: "Preciso do comprovante com CEP visível.", createdAt: hoursAgo(48) },
    ], statusHistory: [
      { id: "sh4", ticketId: "BM-003", fromStatus: null, toStatus: "nova_demanda", changedBy: "u2", changedByName: "Ana Oliveira", changedAt: hoursAgo(72) },
      { id: "sh5", ticketId: "BM-003", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a1", changedByName: "Marcos Santos", changedAt: hoursAgo(60) },
      { id: "sh6", ticketId: "BM-003", fromStatus: "em_analise", toStatus: "aguardando_retorno", changedBy: "a1", changedByName: "Marcos Santos", changedAt: hoursAgo(48) },
    ] }),

  t("BM-014", "Crédito consignado - Simulação 2", "Simulação de crédito consignado.", "credito", "aguardando_retorno", "media",
    "7711", "R$ 320.000", "u9", "Felipe Campos", ["u9"], ["Felipe Campos"], ["a5"], ["Camila Ribeiro"], 30, 18),

  t("BM-015", "Abertura PJ - Startup X", "Abertura de conta PJ para startup.", "abertura_conta", "aguardando_retorno", "alta",
    "9933", "R$ 1.800.000", "u12", "Daniela Cunha", ["u12"], ["Daniela Cunha"], ["a10"], ["Diego Martins"], 36, 12),

  t("BM-016", "Portabilidade previdência", "Transferência de previdência privada.", "portabilidade", "aguardando_retorno", "baixa",
    "2255", "R$ 550.000", "u8", "Isabella Rocha", ["u8"], ["Isabella Rocha"], ["a3"], ["Fernanda Souza"], 48, 24),

  // --- AGUARDANDO XP ---
  t("BM-004", "Cotação de seguro de vida", "Cliente deseja cotação para seguro de vida com cobertura de R$ 1.000.000.", "seguros", "aguardando_xp", "media",
    "5567", "R$ 3.200.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a3"], ["Fernanda Souza"], 96, 50,
    { messages: [
      { id: "m6", ticketId: "BM-004", userId: "u1", userName: "Carlos Silva", content: "Cliente quer cotação com e sem IOF.", createdAt: hoursAgo(96) },
      { id: "m7", ticketId: "BM-004", userId: "a3", userName: "Fernanda Souza", content: "Encaminhei para a XP. Aguardando retorno.", createdAt: hoursAgo(50) },
    ], statusHistory: [
      { id: "sh7", ticketId: "BM-004", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(96) },
      { id: "sh8", ticketId: "BM-004", fromStatus: "nova_demanda", toStatus: "aguardando_xp", changedBy: "a3", changedByName: "Fernanda Souza", changedAt: hoursAgo(50) },
    ] }),

  t("BM-017", "Operação COE - Produto novo", "Cliente quer alocar em COE novo.", "renda_fixa", "aguardando_xp", "alta",
    "4455", "R$ 2.100.000", "u14", "Juliana Melo", ["u14"], ["Juliana Melo"], ["a8"], ["Rafael Cardoso"], 20, 8),

  t("BM-018", "Fundo exclusivo - Análise", "Análise de fundo exclusivo para cliente.", "renda_variavel", "aguardando_xp", "media",
    "6677", "R$ 8.500.000", "u3", "Pedro Barros", ["u3"], ["Pedro Barros"], ["a7"], ["Beatriz Nunes"], 72, 36),

  // --- CONCLUÍDAS ---
  t("BM-006", "Solicitação de crédito consignado", "Cliente solicita simulação de crédito consignado.", "credito", "concluida", "media",
    "9981", "R$ 450.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a3"], ["Fernanda Souza"], 168, 72,
    { closedAt: hoursAgo(72), pendingRating: false, rating: 9, ratingJustification: "Atendimento rápido e eficiente.",
      messages: [
        { id: "m11", ticketId: "BM-006", userId: "u1", userName: "Carlos Silva", content: "Favor simular crédito consignado.", createdAt: hoursAgo(168) },
        { id: "m12", ticketId: "BM-006", userId: "a3", userName: "Fernanda Souza", content: "Simulação realizada.", createdAt: hoursAgo(96) },
        { id: "m13", ticketId: "BM-006", userId: "u1", userName: "Carlos Silva", content: "Perfeito, pode prosseguir.", createdAt: hoursAgo(72) },
      ], statusHistory: [
        { id: "sh11", ticketId: "BM-006", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(168) },
        { id: "sh12", ticketId: "BM-006", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a3", changedByName: "Fernanda Souza", changedAt: hoursAgo(120) },
        { id: "sh13", ticketId: "BM-006", fromStatus: "em_analise", toStatus: "concluida", changedBy: "a3", changedByName: "Fernanda Souza", changedAt: hoursAgo(72) },
      ] }),

  t("BM-009", "Transferência entre contas - PIX", "Cliente precisa transferir R$ 50.000 via PIX.", "outro", "concluida", "baixa",
    "4521", "R$ 2.500.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a1"], ["Marcos Santos"], 240, 200,
    { closedAt: hoursAgo(200), pendingRating: true,
      messages: [
        { id: "m17", ticketId: "BM-009", userId: "u1", userName: "Carlos Silva", content: "Transferir entre contas.", createdAt: hoursAgo(240) },
        { id: "m18", ticketId: "BM-009", userId: "a1", userName: "Marcos Santos", content: "Transferência realizada com sucesso.", createdAt: hoursAgo(200) },
      ], statusHistory: [
        { id: "sh17", ticketId: "BM-009", fromStatus: null, toStatus: "nova_demanda", changedBy: "u1", changedByName: "Carlos Silva", changedAt: hoursAgo(240) },
        { id: "sh18", ticketId: "BM-009", fromStatus: "nova_demanda", toStatus: "em_analise", changedBy: "a1", changedByName: "Marcos Santos", changedAt: hoursAgo(220) },
        { id: "sh19", ticketId: "BM-009", fromStatus: "em_analise", toStatus: "concluida", changedBy: "a1", changedByName: "Marcos Santos", changedAt: hoursAgo(200) },
      ] }),

  // More completed tickets
  ...Array.from({ length: 22 }, (_, i) => {
    const idx = i + 19;
    const assessors = ["u1","u2","u3","u4","u5","u6","u7","u8","u9","u10","u11","u12","u13","u14","u15","u16","u17","u18","u19","u20"];
    const attendantIds = ["a1","a2","a3","a4","a5","a6","a7","a8","a9","a10"];
    const cats: Ticket["category"][] = ["abertura_conta","atualizacao_cadastral","portabilidade","renda_variavel","renda_fixa","seguros","credito","pj","problema_tecnico","outro"];
    const aIdx = i % assessors.length;
    const atIdx = i % attendantIds.length;
    const catIdx = i % cats.length;
    const aUser = mockUsers.find(u => u.id === assessors[aIdx])!;
    const atUser = mockUsers.find(u => u.id === attendantIds[atIdx])!;
    const cH = 200 + i * 24;
    const hasRating = i % 3 !== 0;
    return t(
      `BM-0${idx}`, `Demanda concluída #${idx}`, `Demanda de exemplo ${idx}.`, cats[catIdx], "concluida" as Ticket["status"], "media",
      `${3000 + i * 111}`, `R$ ${(500 + i * 150).toLocaleString("pt-BR")}.000`,
      assessors[aIdx], aUser.name, [assessors[aIdx]], [aUser.name], [attendantIds[atIdx]], [atUser.name],
      cH, cH - 48,
      {
        closedAt: hoursAgo(cH - 48),
        pendingRating: !hasRating,
        rating: hasRating ? 6 + Math.round(Math.random() * 4 * 10) / 10 : undefined,
        ratingJustification: hasRating ? "Atendimento satisfatório." : undefined,
      }
    );
  }),

  // Extra overdue open tickets (SLA vencido)
  t("BM-041", "SOCORRO - Cliente VIP sem acesso", "Cliente VIP reporta problemas graves.", "problema_tecnico", "nova_demanda", "urgente",
    "1001", "R$ 12.000.000", "u3", "Pedro Barros", ["u3"], ["Pedro Barros"], [], [], 8, 8,
    { demandType: "socorro" }),
  t("BM-042", "BACK! - Falha operação grande", "Erro em operação de grande porte.", "renda_variavel", "em_analise", "urgente",
    "1002", "R$ 25.000.000", "u14", "Juliana Melo", ["u14"], ["Juliana Melo"], ["a2"], ["Julia Costa"], 12, 6,
    { demandType: "back" }),
  t("BM-043", "Cadastro pendente - Docs atrasados", "Docs do cliente não chegaram.", "atualizacao_cadastral", "aguardando_retorno", "media",
    "1003", "R$ 200.000", "u6", "Larissa Dias", ["u6"], ["Larissa Dias"], ["a6"], ["Thiago Almeida"], 96, 80),
  t("BM-044", "Crédito imobiliário - Análise", "Análise de crédito imobiliário.", "credito", "em_analise", "alta",
    "1004", "R$ 3.500.000", "u10", "Carolina Vieira", ["u10"], ["Carolina Vieira"], ["a5"], ["Camila Ribeiro"], 10, 5),
  t("BM-045", "PJ - Alteração contrato social", "Alteração de contrato social de empresa.", "pj", "nova_demanda", "media",
    "1005", "R$ 900.000", "u11", "Leonardo Teixeira", ["u11"], ["Leonardo Teixeira"], [], [], 6, 6),
  t("BM-046", "Seguro auto - Renovação", "Renovação de seguro auto do cliente.", "seguros", "aguardando_xp", "baixa",
    "1006", "R$ 600.000", "u16", "Renata Borges", ["u16"], ["Renata Borges"], ["a4"], ["Lucas Pereira"], 100, 72),

  // --- MORE OPEN TICKETS FOR CARLOS SILVA (u1) — no SLA overdue ---
  t("BM-047", "Transferência TED - Conta corrente", "Cliente solicita TED para conta terceiro.", "outro", "nova_demanda", "baixa",
    "4521", "R$ 2.500.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a1"], ["Marcos Santos"], 2, 1),
  t("BM-048", "Abertura subconta investimentos", "Abertura de subconta para investimentos.", "abertura_conta", "em_analise", "media",
    "4521", "R$ 2.500.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a2"], ["Julia Costa"], 3, 1),
  t("BM-049", "Portabilidade fundo GHI", "Portar fundo GHI do banco Y.", "portabilidade", "em_analise", "alta",
    "7892", "R$ 850.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a3"], ["Fernanda Souza"], 4, 2),
  t("BM-050", "Renda fixa - LCI 2 anos", "Aplicação em LCI pré 12.5%.", "renda_fixa", "nova_demanda", "media",
    "6678", "R$ 1.200.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], [], [], 1, 1),
  t("BM-051", "Seguro residencial - Cotação", "Cotação de seguro residencial completo.", "seguros", "aguardando_retorno", "baixa",
    "5567", "R$ 3.200.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a4"], ["Lucas Pereira"], 5, 2),
  t("BM-052", "Atualização dados bancários", "Atualizar dados bancários do cliente.", "atualizacao_cadastral", "em_analise", "media",
    "3310", "R$ 120.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a1"], ["Marcos Santos"], 3, 1),
  t("BM-053", "Compra ITUB4 - Lote 200", "Comprar 200 ações ITUB4.", "renda_variavel", "nova_demanda", "alta",
    "2234", "R$ 5.800.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], [], [], 1, 1),
  t("BM-054", "Crédito pessoal - Simulação", "Simulação de crédito pessoal para cliente.", "credito", "aguardando_xp", "media",
    "9981", "R$ 450.000", "u1", "Carlos Silva", ["u1"], ["Carlos Silva"], ["a5"], ["Camila Ribeiro"], 4, 2),
];
