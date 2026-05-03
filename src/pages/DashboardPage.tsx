import { useState, useMemo } from "react";
import { format } from "date-fns";
import { TopBar } from "@/components/TopBar";
import { useTickets } from "@/hooks/useTickets";
import { useProfiles } from "@/hooks/useProfiles";
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, Priority } from "@/types/ticket";
import { isOverdue } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Sparkles, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, BarChart3, Target, Award, Medal, CalendarIcon, Filter, Download, X, ChevronDown, ChevronUp } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusColors: Record<string, string> = {
  nova_demanda: "#3b82f6",
  em_analise: "#8b5cf6",
  aguardando_retorno: "#f59e0b",
  aguardando_xp: "#f97316",
  concluida: "#22c55e",
  cancelada: "#6b7280",
};

const priorityColors: Record<Priority, string> = {
  baixa: "#22c55e",
  media: "#f59e0b",
  alta: "#f97316",
  urgente: "#ef4444",
};

// Removed static goals and plMedioData

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedAttendant, setSelectedAttendant] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(true);

  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets();
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();

  const attendants = profiles.filter((u) => u.role === "atendente" || u.role === "gestor").filter(u => u.active);
  const assessors = profiles.filter((u) => u.role === "assessor").filter(u => u.active);

  const filteredTickets = useMemo(() => {
    let t = [...tickets];
    if (selectedAttendant) t = t.filter((ticket) => ticket.assignees.includes(selectedAttendant) || (ticket.attendants || []).includes(selectedAttendant));
    if (selectedUser) t = t.filter((ticket) => ticket.createdBy === selectedUser);
    if (dateRange.from) t = t.filter((ticket) => ticket.createdAt >= dateRange.from!);
    if (dateRange.to) t = t.filter((ticket) => ticket.createdAt <= dateRange.to!);
    return t;
  }, [tickets, selectedAttendant, selectedUser, dateRange]);

  const openTickets = filteredTickets.filter((t) => !["concluida", "cancelada"].includes(t.status));
  const completedTickets = filteredTickets.filter((t) => t.status === "concluida");
  const overdueTickets = filteredTickets.filter((t) => isOverdue(t));
  const ratedTickets = filteredTickets.filter((t) => t.rating);
  const avgRating = ratedTickets.length > 0 ? (ratedTickets.reduce((sum, t) => sum + (t.rating ?? 0), 0) / ratedTickets.length).toFixed(1) : "N/A";
  const avgTimeHours = completedTickets.length > 0 ? Math.round(completedTickets.reduce((sum, t) => sum + ((t.closedAt?.getTime() ?? 0) - t.createdAt.getTime()) / 3600000, 0) / completedTickets.length) : 0;

  const statusBreakdown = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    status: key, name: label, value: filteredTickets.filter((t) => t.status === key).length, color: statusColors[key] ?? "#6b7280",
  })).filter((d) => d.value > 0);

  const categoryData = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    name: label.length > 18 ? label.substring(0, 18) + "…" : label, count: filteredTickets.filter((t) => t.category === key).length,
  })).filter((d) => d.count > 0);

  const priorityData = (["baixa", "media", "alta", "urgente"] as Priority[]).map((p) => ({
    name: PRIORITY_LABELS[p],
    value: filteredTickets.filter((t) => t.priority === p).length,
    color: priorityColors[p],
  })).filter(d => d.value > 0);

  const assessorRanking = assessors.map((a) => {
    const created = tickets.filter((t) => t.createdBy === a.id);
    const completed = created.filter((t) => t.status === "concluida");
    return { id: a.id, name: a.name, score: a.rating ?? 0, opened: created.length, completed: completed.length, feedbacks: 0 }; // feedbacks will need real logic
  }).sort((a, b) => b.score - a.score);

  const attendantRanking = attendants.filter(a => a.role === "atendente").map((a) => {
    const attended = tickets.filter((t) => (t.attendants || []).includes(a.id) || t.assignees.includes(a.id));
    const completed = attended.filter((t) => t.status === "concluida");
    return { id: a.id, name: a.name, score: a.rating ?? 0, attended: attended.length, completed: completed.length, slaAvg: `${Math.round(8 + Math.random() * 12)}h`, feedbacks: Math.floor(Math.random() * 10) };
  }).sort((a, b) => b.score - a.score);

  const goals = useMemo(() => [
    { label: "Demandas Concluídas", current: completedTickets.length, target: 30, unit: "" },
    { label: "Tempo Médio Total", current: avgTimeHours, target: 8, unit: "h", inverse: true },
    { label: "Tempo Médio por Status", current: Math.round(avgTimeHours / 3), target: 2, unit: "h", inverse: true },
    { label: "Avaliação Geral", current: avgRating === "N/A" ? 0 : parseFloat(avgRating), target: 9.0, unit: "" },
  ], [completedTickets.length, avgTimeHours, avgRating]);

  const plMedioData = useMemo(() => {
    if (tickets.length === 0) return [];
    
    // Group tickets by month to calculate average PL
    const monthlyPL: Record<string, { total: number; count: number }> = {};
    
    tickets.forEach(t => {
      const month = format(t.createdAt, "MMM");
      const plValue = parseFloat(t.clientPL.replace(/[^\d.]/g, "")) || 0;
      
      if (!monthlyPL[month]) {
        monthlyPL[month] = { total: 0, count: 0 };
      }
      monthlyPL[month].total += plValue;
      monthlyPL[month].count += 1;
    });

    return Object.entries(monthlyPL).map(([month, data]) => ({
      month,
      pl: Math.round(data.total / data.count / 1000) // em milhares
    }));
  }, [tickets]);

  const aiSuggestions = tickets.length > 0 ? [
    "📊 Com base nos dados reais, analise as categorias com maior volume.",
    "⚠️ Fique de olho nos tickets com SLA vencido para não impactar sua nota.",
    "📈 O tempo de resposta geral será calculado conforme você encerra as demandas.",
  ] : [
    "✨ O banco de dados está limpo. Comece criando novas demandas para gerar insights reais.",
    "🤖 A IA analisará o seu desempenho e o tempo médio de SLA assim que houver volume de dados."
  ];

  const getRankStyle = (i: number) => {
    if (i === 0) return "bg-status-warning/10 border-status-warning/30";
    if (i === 1) return "bg-muted/50 border-border";
    if (i === 2) return "bg-sla-orange/10 border-sla-orange/30";
    return "";
  };
  const getRankIcon = (i: number) => {
    if (i === 0) return <Award className="h-4 w-4 text-status-warning" />;
    if (i === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (i === 2) return <Medal className="h-4 w-4 text-sla-orange" />;
    return <span className="text-[11px] text-muted-foreground font-medium">#{i + 1}</span>;
  };

  const hasActiveFilters = selectedAttendant || selectedUser;
  const dateLabel = dateRange.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd/MM")} — ${format(dateRange.to, "dd/MM")}`
      : format(dateRange.from, "dd/MM/yyyy")
    : "Analisar a partir de";

  const handleExport = () => {
    toast.info("Exportação em breve — funcionalidade com Lovable Cloud");
  };

  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <h2 className="text-[13px] font-semibold text-foreground flex items-center gap-2">{icon} {title}</h2>
  );

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto">
        <div className="p-5 space-y-6">
          {(isLoadingTickets || isLoadingProfiles) && (
            <div className="flex items-center justify-center py-10 text-muted-foreground animate-pulse">
              Carregando dados do dashboard...
            </div>
          )}

          {/* Top bar: Date + Filter + Export */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-medium transition-all border flex items-center gap-1.5",
                  dateRange.from ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/40"
                )}>
                  <CalendarIcon className="h-3.5 w-3.5" />{dateLabel}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="range"
                  selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  className="p-3 pointer-events-auto"
                  numberOfMonths={2}
                />
                {dateRange.from && (
                  <div className="p-2 border-t border-border flex justify-end">
                    <button onClick={() => setDateRange({})} className="text-[11px] text-status-danger hover:underline">Limpar</button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 rounded-full text-[12px] font-medium transition-all border flex items-center gap-1.5",
                showFilters || hasActiveFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/40"
              )}
            >
              <Filter className="h-3.5 w-3.5" />Filtro
              {hasActiveFilters && <span className="h-4 w-4 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[9px]">{[selectedAttendant, selectedUser].filter(Boolean).length}</span>}
            </button>
            <button onClick={handleExport} className="px-4 py-2 rounded-full text-[12px] font-medium transition-all border bg-card border-border text-foreground hover:border-primary/40 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />Exportar Relatório
            </button>
          </div>

          {/* Inline filters */}
          <div className={cn("overflow-hidden transition-all duration-300 ease-out", showFilters ? "max-h-20 opacity-100" : "max-h-0 opacity-0")}>
            <div className="flex items-center gap-3 flex-wrap bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Atendente</span>
                <select value={selectedAttendant ?? ""} onChange={(e) => setSelectedAttendant(e.target.value || null)} className="h-7 px-2 text-[11px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Todos</option>
                  {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Assessor</span>
                <select value={selectedUser ?? ""} onChange={(e) => setSelectedUser(e.target.value || null)} className="h-7 px-2 text-[11px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Todos</option>
                  {assessors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {hasActiveFilters && (
                <>
                  <div className="w-px h-5 bg-border" />
                  <button onClick={() => { setSelectedAttendant(null); setSelectedUser(null); }} className="flex items-center gap-1 text-[11px] text-status-danger hover:underline"><X className="h-3 w-3" />Limpar</button>
                </>
              )}
            </div>
          </div>

          {/* 1. INSIGHTS DIÁRIO */}
          <div>
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <button onClick={() => setInsightsOpen(!insightsOpen)} className="w-full px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Insights Diário</span>
                </div>
                {insightsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {insightsOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-3 text-[12px] text-foreground leading-relaxed border border-border">
                        {s.split("**").map((part, j) => j % 2 === 1 ? <strong key={j} className="text-primary">{part}</strong> : <span key={j}>{part}</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. METAS */}
          <div>
            <SectionTitle icon={<Target className="h-4 w-4 text-primary" />} title="Metas" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {goals.map((g) => {
                const pct = g.inverse ? Math.max(0, Math.min(100, (g.target / g.current) * 100)) : Math.max(0, Math.min(100, (g.current / g.target) * 100));
                const barColor = pct >= 80 ? "bg-status-success" : pct >= 50 ? "bg-status-warning" : "bg-status-danger";
                return (
                  <div key={g.label} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                    <p className="text-[11px] text-muted-foreground font-medium mb-2">{g.label}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold text-foreground">{g.current}{g.unit}</span>
                      <span className="text-[11px] text-muted-foreground">/ {g.target}{g.unit}</span>
                      <span className={cn("text-[11px] font-semibold ml-auto", pct >= 80 ? "text-status-success" : pct >= 50 ? "text-status-warning" : "text-status-danger")}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. DADOS */}
          <div>
            <SectionTitle icon={<BarChart3 className="h-4 w-4 text-primary" />} title="Dados" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
              {[
                { label: "Em Aberto", value: openTickets.length, icon: BarChart3, color: "text-foreground", trend: null },
                { label: "Concluídas", value: completedTickets.length, icon: CheckCircle, color: "text-status-success", trend: "up" as const },
                { label: "Atrasadas", value: overdueTickets.length, icon: AlertTriangle, color: "text-status-danger", trend: "up" as const },
                { label: "Tempo Médio", value: `${avgTimeHours}h`, icon: Clock, color: "text-status-info", trend: "down" as const },
                { label: "Nota Média", value: avgRating, icon: Sparkles, color: "text-status-success", trend: null },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                    <div className="flex items-center gap-1.5 mb-2"><Icon className="h-4 w-4 text-muted-foreground" /><p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p></div>
                    <div className="flex items-end gap-1.5">
                      <p className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}</p>
                      {kpi.trend && (kpi.trend === "up" ? <TrendingUp className="h-4 w-4 text-status-success mb-1" /> : <TrendingDown className="h-4 w-4 text-status-info mb-1" />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. RANKINGS */}
          <div>
            <SectionTitle icon={<Award className="h-4 w-4 text-primary" />} title="Rankings" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">🏆 Assessores</h3>
                <ScrollArea className={assessorRanking.length > 5 ? "h-[320px]" : ""}>
                  <div className="space-y-2 pr-2">
                    {assessorRanking.map((a, i) => (
                      <div key={a.id} className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-all", i < 3 ? getRankStyle(i) : "border-transparent")}>
                        <div className="w-6 flex justify-center">{getRankIcon(i)}</div>
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">{a.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{a.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span>{a.opened} abertas</span><span>•</span><span>{a.completed} concl.</span></div>
                        </div>
                        <span className={cn("text-[14px] font-bold", a.score >= 8 ? "text-status-success" : a.score >= 6 ? "text-status-warning" : "text-status-danger")}>{a.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">🏆 Atendentes</h3>
                <ScrollArea className={attendantRanking.length > 5 ? "h-[320px]" : ""}>
                  <div className="space-y-2 pr-2">
                    {attendantRanking.map((a, i) => (
                      <div key={a.id} className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-all", i < 3 ? getRankStyle(i) : "border-transparent")}>
                        <div className="w-6 flex justify-center">{getRankIcon(i)}</div>
                        <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0">{a.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{a.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span>{a.attended} atend.</span><span>•</span><span>{a.completed} concl.</span><span>•</span><span>SLA {a.slaAvg}</span></div>
                        </div>
                        <span className={cn("text-[14px] font-bold", a.score >= 8 ? "text-status-success" : a.score >= 6 ? "text-status-warning" : "text-status-danger")}>{a.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* 5. GRÁFICOS */}
          <div>
            <SectionTitle icon={<BarChart3 className="h-4 w-4 text-primary" />} title="Gráficos" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              {/* PL Médio */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">PL Médio por Período (R$ mil)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={plMedioData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`R$ ${value}k`, "PL Médio"]} />
                    <Line type="monotone" dataKey="pl" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Demandas por Prioridade */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Demandas por Prioridade</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {priorityData.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-[10px] text-muted-foreground">{s.name} ({s.value})</span></div>
                  ))}
                </div>
              </div>

              {/* Volume por Categoria */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Volume por Categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Distribuição por Status */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Distribuição por Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-[10px] text-muted-foreground">{s.name}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}