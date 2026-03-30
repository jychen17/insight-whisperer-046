import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, subtitle, change, changeLabel = "环比上期" }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 animate-fade-in">
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {subtitle && <span className="text-sm text-primary">{subtitle}</span>}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {change >= 0 ? (
            <ArrowUp className="w-3 h-3 text-destructive" />
          ) : (
            <ArrowDown className="w-3 h-3 text-success" />
          )}
          <span className={change >= 0 ? "text-destructive" : "text-success"}>
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground ml-1">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
