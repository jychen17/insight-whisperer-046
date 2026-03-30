import { Moon, Sun, Bell, User } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="h-12 gradient-header flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-primary-foreground font-semibold text-sm">灵泉数据</span>
      </div>
      <div className="flex items-center gap-4 text-primary-foreground/80">
        <span className="text-xs hover:text-primary-foreground cursor-pointer">平台&指标说明</span>
        <Bell className="w-4 h-4 cursor-pointer hover:text-primary-foreground" />
        <div className="flex items-center gap-1.5 text-xs">
          <User className="w-4 h-4" />
          <span>管理员</span>
        </div>
      </div>
    </header>
  );
}
