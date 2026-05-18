import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket } from "@/types/ticket";
import { toast } from "sonner";

interface RatingModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSubmit: (ticketId: string, rating: number, justification: string) => void;
  /** If true, this is an attendant rating a user (justification mandatory) */
  isAttendantRating?: boolean;
}

export function RatingModal({ ticket, onClose, onSubmit, isAttendantRating }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [justification, setJustification] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Selecione uma nota de 0 a 10.");
      return;
    }
    if (!justification.trim()) {
      toast.error("Justifique sua avaliação.");
      return;
    }
    onSubmit(ticket.id, rating, justification);
    toast.success("Avaliação enviada com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isAttendantRating ? "Avaliar Assessor" : "Avaliar Atendimento"}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{ticket.code || ticket.id} — {ticket.title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Motivational message */}
        <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/10">
          <p className="text-[12px] text-foreground leading-relaxed">
            {isAttendantRating
              ? "Uma avaliação justa e detalhada ajuda a manter a qualidade das demandas e reconhecer bons assessores."
              : "Uma avaliação detalhada nos ajuda a melhorar continuamente o atendimento. Seu feedback faz a diferença!"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating selector 0-10 */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Nota (0-10)</p>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoveredRating(n)}
                  onMouseLeave={() => setHoveredRating(-1)}
                  className={cn(
                    "h-8 flex-1 rounded-lg text-[12px] font-semibold transition-all border",
                    (hoveredRating >= 0 ? hoveredRating : rating) >= n && rating > 0 || (n === 0 && rating === 0 && hoveredRating === 0)
                      ? n <= 3
                        ? "bg-status-danger/20 text-status-danger border-status-danger/30"
                        : n <= 6
                          ? "bg-status-warning/20 text-status-warning border-status-warning/30"
                          : "bg-status-success/20 text-status-success border-status-success/30"
                      : "bg-muted text-muted-foreground border-transparent hover:border-border"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Justificativa <span className="text-status-danger">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Descreva com detalhes sua experiência..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enviar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
