import { Search, ChevronDown, Star, Settings, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { currentUser } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstName = currentUser.name.split(" ")[0];
  const initials = currentUser.name.split(" ").map((n) => n[0]).join("");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 sticky top-0 z-20">
      {/* Left: title */}
      {title && (
        <h1 className="text-sm font-semibold text-foreground shrink-0">{title}</h1>
      )}

      {/* Center: search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar demandas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
          />
        </div>
      </div>

      {/* Right: notifications + avatar + name */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationsDropdown />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary">
              {initials}
            </div>
            <span className="text-[13px] font-medium text-foreground">{firstName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[13px] font-semibold text-foreground">{currentUser.name}</p>
                <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                {currentUser.rating && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="h-3.5 w-3.5 text-status-warning" />
                    <span className={cn(
                      "text-[13px] font-bold",
                      currentUser.rating >= 8 ? "text-status-success" : currentUser.rating >= 6 ? "text-status-warning" : "text-status-danger"
                    )}>
                      {currentUser.rating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">/10</span>
                  </div>
                )}
              </div>
              {/* Menu items */}
              <div className="py-1">
                <button className="w-full px-4 py-2 flex items-center gap-2 text-[12px] text-muted-foreground hover:bg-muted transition-colors">
                  <Settings className="h-3.5 w-3.5" /> Configurações
                </button>
                <button className="w-full px-4 py-2 flex items-center gap-2 text-[12px] text-muted-foreground hover:bg-muted transition-colors">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
