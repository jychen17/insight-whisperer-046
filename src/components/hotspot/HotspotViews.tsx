import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, Flame, ArrowUpRight, Music2, Palette, Sparkles, Hash, Ticket, BookOpen, TrendingUp,
} from "lucide-react";
import { type HotspotEvent, type Category, type SourceKind } from "@/lib/hotspotData";

export const CATEGORY_META: Record<Category, { icon: typeof Music2; cls: string }> = {
  "演唱会": { icon: Music2, cls: "bg-purple-100 text-purple-700 border-purple-200" },
  "音乐节": { icon: Music2, cls: "bg-pink-100 text-pink-700 border-pink-200" },
  "展览": { icon: Palette, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "市集": { icon: Sparkles, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "节庆": { icon: Sparkles, cls: "bg-rose-100 text-rose-700 border-rose-200" },
  "亲子": { icon: Sparkles, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "线上热议": { icon: Hash, cls: "bg-orange-100 text-orange-700 border-orange-200" },
};

export const SOURCE_META: Record<SourceKind, { icon: typeof Ticket; label: string; cls: string }> = {
  damai: { icon: Ticket, label: "大麦", cls: "text-rose-600" },
  bendibao: { icon: BookOpen, label: "本地宝", cls: "text-blue-600" },
  ranking: { icon: TrendingUp, label: "热榜", cls: "text-orange-600" },
};

export const formatHeat = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

// ────────────────────────────────────────────────────────────
// City View
// ────────────────────────────────────────────────────────────
export function CityView({ events, onSelect }: { events: HotspotEvent[]; onSelect: (e: HotspotEvent) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<string, HotspotEvent[]>();
    events.forEach(e => {
      if (!map.has(e.city)) map.set(e.city, []);
      map.get(e.city)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [events]);

  const [activeCity, setActiveCity] = useState(grouped[0]?.[0] ?? "");
  const cityEvents = grouped.find(([c]) => c === activeCity)?.[1] ?? [];

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="col-span-1 p-3 h-fit">
        <div className="text-xs font-medium text-foreground mb-2 px-2">城市</div>
        <div className="space-y-0.5">
          {grouped.map(([city, list]) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                activeCity === city ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{city}</span>
              <Badge variant="secondary" className="h-4 text-[10px] px-1.5">{list.length}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card className="col-span-3 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{activeCity} · 未来热点活动时间线</h3>
          <span className="text-xs text-muted-foreground">{cityEvents.length} 项</span>
        </div>
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {cityEvents.sort((a, b) => a.date.localeCompare(b.date)).map(e => {
            const Cat = CATEGORY_META[e.category];
            const CatIcon = Cat.icon;
            return (
              <div key={e.id} className="relative">
                <div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <button onClick={() => onSelect(e)} className="text-left w-full p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{e.dateRange ?? e.date}</span>
                    <Badge variant="outline" className={`text-[10px] gap-0.5 ${Cat.cls}`}>
                      <CatIcon className="w-2.5 h-2.5" />{e.category}
                    </Badge>
                    <span className="ml-auto text-xs text-rose-600 font-medium flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />{formatHeat(e.heatScore)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">{e.title}</div>
                  {e.venue && <div className="text-[11px] text-muted-foreground">📍 {e.venue}</div>}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Category View
// ────────────────────────────────────────────────────────────
export function CategoryView({ events, onSelect }: { events: HotspotEvent[]; onSelect: (e: HotspotEvent) => void }) {
  const cats = (Object.keys(CATEGORY_META) as Category[]).filter(c => events.some(e => e.category === c));
  const [activeCat, setActiveCat] = useState<Category>(cats[0] ?? "演唱会");
  const catEvents = events.filter(e => e.category === activeCat).sort((a, b) => b.heatScore - a.heatScore);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {cats.map(c => {
          const Meta = CATEGORY_META[c];
          const Icon = Meta.icon;
          const count = events.filter(e => e.category === c).length;
          const active = c === activeCat;
          return (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                active ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c}
              <Badge variant="secondary" className="h-4 text-[10px] px-1.5">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {catEvents.map(e => {
          const Cat = CATEGORY_META[e.category];
          const CatIcon = Cat.icon;
          const totalVol = e.relatedVolume.weibo + e.relatedVolume.xhs + e.relatedVolume.douyin;
          return (
            <Card key={e.id} onClick={() => onSelect(e)} className="p-5 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-orange-500/10 to-rose-500/10">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-sm font-bold text-rose-600">{formatHeat(e.heatScore)}</span>
                  </div>
                  {e.heatTrend > 0 && (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {e.heatTrend}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {e.dateRange ?? e.date}
                </div>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <Badge variant="outline" className={`shrink-0 text-[11px] gap-1 ${Cat.cls}`}>
                  <CatIcon className="w-3 h-3" /> {e.category}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary leading-snug">{e.title}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="w-3 h-3" /><span>{e.city}</span>
                {e.venue && <span>· {e.venue}</span>}
              </div>
              <div className="text-[11px] text-muted-foreground">关联讨论 <span className="font-medium text-foreground">{formatHeat(totalVol)}</span></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
