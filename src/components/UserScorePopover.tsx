import { useState, useRef, useEffect } from "react";
import { Star, TrendingUp, Award, Zap } from "lucide-react";
import { User } from "@/types/ticket";
import { cn } from "@/lib/utils";

interface UserScorePopoverProps {
  user: User;
}

export function UserScorePopover({ user }: UserScorePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const score = user.rating ?? 0;
  const scoreColor = score >= 8 ? "text-status-success" : score >= 6 ? "text-status-warning" : "text-status-danger";

  const benefits = [
    { min: 7, icon: Zap, label: "Selecionar prioridade nas demandas" },
    { min: 8, icon: TrendingUp, label: "Prioridade no atendimento" },
    { min: 9, icon: Award, label: "Acesso a relatórios avançados" },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Star className="h-3 w-3" />
        <span className={cn("font-semibold", scoreColor)}>{score.toFixed(1)}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">Sua Nota</p>
              <span className={cn("text-lg font-bold", scoreColor)}>{score.toFixed(1)}</span>
            </div>
          </div>

          {/* Ratings received */}
          {user.ratingsReceived && user.ratingsReceived.length > 0 && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Últimas avaliações
              </p>
              <div className="space-y-2">
                {user.ratingsReceived.map((r, i) => (
                  <div key={i} className="text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{r.ratedByName}</span>
                      <span className={cn(
                        "font-semibold",
                        r.score >= 8 ? "text-status-success" : r.score >= 6 ? "text-status-warning" : "text-status-danger"
                      )}>
                        {r.score}/10
                      </span>
                    </div>
                    <p className="text-muted-foreground/70 mt-0.5">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Benefícios por nota
            </p>
            <div className="space-y-1.5">
              {benefits.map((b) => {
                const Icon = b.icon;
                const unlocked = score >= b.min;
                return (
                  <div
                    key={b.min}
                    className={cn(
                      "flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg",
                      unlocked ? "bg-status-success/10 text-status-success" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{b.label}</span>
                    <span className="ml-auto text-[10px] font-medium">≥ {b.min}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}