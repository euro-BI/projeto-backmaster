import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const mockResponses: Record<string, string> = {
  "abertura": "Para abrir uma conta, acesse a categoria **Abertura de Conta** no portal. Você precisará do CNPJ/CPF do cliente, comprovante de residência e documento de identidade. O prazo médio é de 3 dias úteis.",
  "portabilidade": "Para portabilidade de investimentos, use a categoria **Portabilidade de Investimentos**. Você precisará informar o fundo, valor e instituição de origem. O prazo do STVM é de até 5 dias úteis.",
  "cadastro": "Para atualização cadastral, acesse **Atualização Cadastral**. Será necessário o novo comprovante de endereço com CEP visível ou documento atualizado.",
  "seguro": "Para cotações de seguros, use a categoria **Seguros**. Informe o tipo de seguro, valor de cobertura e perfil do cliente. Retornamos em até 48h.",
  "credito": "Para crédito, acesse a categoria **Crédito**. Será preciso enviar holerite ou demonstrativo de renda do cliente.",
  "sla": "O SLA padrão é de 48h para respostas. Demandas **urgentes** recebem prioridade e são tratadas em até 12h. Se o SLA estiver vencido, a demanda sobe automaticamente para o topo da fila.",
  "nota": "Sua nota é baseada nas avaliações dos atendentes. Notas acima de **7** permitem selecionar a prioridade ao abrir demandas. Notas acima de **8.5** dão prioridade no atendimento.",
  "prioridade": "Você pode selecionar prioridade apenas se sua nota for superior a 7. As prioridades são: Baixa, Média, Alta e Urgente.",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(mockResponses)) {
    if (lower.includes(key)) return response;
  }
  return "Entendi! Para melhor ajudá-lo, me diga sobre qual assunto precisa de ajuda: **abertura de conta**, **portabilidade**, **atualização cadastral**, **seguros**, **crédito**, **SLA** ou **nota/prioridade**. Se sua dúvida não for sanada, recomendo abrir uma demanda na categoria mais adequada.";
}

export function MIAjudaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Olá! Sou a **MIAjuda**, sua assistente virtual. Como posso ajudar hoje? 😊" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-elevated flex items-center justify-center transition-all",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-accent"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-80 h-[28rem] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-primary/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">MIAjuda</p>
              <p className="text-[10px] text-muted-foreground">Assistente virtual</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-3 py-3 space-y-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.content.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-[12px] text-muted-foreground">
                  <span className="animate-pulse-soft">Digitando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Digite sua dúvida..."
                className="flex-1 h-8 px-3 text-[12px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={handleSend}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}