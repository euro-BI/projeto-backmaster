import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, ArrowRightLeft, UserPlus, Check, CheckCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { mockNotifications } from "@/data/mockData";
import { formatTimeAgo } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "status_change": return <ArrowRightLeft className="h-3 w-3" />;
      case "new_comment": return <MessageSquare className="h-3 w-3" />;
      case "assigned": return <UserPlus className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const markRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Todas marcadas como lidas");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[9px] font-bold bg-status-danger text-status-danger-foreground rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">Notificações</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-3 w-3" /> Marcar todas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                Nenhuma notificação.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    navigate(`/ticket/${notif.ticketId}`);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0",
                    !notif.read && "bg-primary/[0.04]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                    !notif.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[12px] font-medium truncate", !notif.read ? "text-foreground" : "text-muted-foreground")}>
                      {notif.ticketTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!notif.read && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <button
                          onClick={(e) => markRead(notif.id, e)}
                          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
