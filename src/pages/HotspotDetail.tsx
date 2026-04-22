import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft, Flame, MapPin, Calendar, Sparkles, Bell, FileText, ExternalLink,
  Music2, Palette, Hash, Ticket, BookOpen, TrendingUp, Globe, ArrowUpRight, Eye, Layers,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import StatCard from "@/components/StatCard";
import { hotspotEvents, type HotspotEvent, type Category, type SourceKind } from "@/lib/hotspotData";

const CATEGORY_META: Record<Category, { icon: typeof Music2; cls: string }> = {
  "演唱会": { icon: Music2, cls: "bg-purple-100 text-purple-700 border-purple-200" },
  "音乐节": { icon: Music2, cls: "bg-pink-100 text-pink-700 border-pink-200" },
  "展览": { icon: Palette, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "市集": { icon: Sparkles, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "节庆": { icon: Sparkles, cls: "bg-rose-100 text-rose-700 border-rose-200" },
  "亲子": { icon: Sparkles, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "线上热议": { icon: Hash, cls: "bg-orange-100 text-orange-700 border-orange-200" },
};
const SOURCE_META: Record<SourceKind, { icon: typeof Ticket; label: string; cls: string; color: string }> = {
  damai: { icon: Ticket, label: "大麦", cls: "text-rose-600", color: "#e11d48" },
  bendibao: { icon: BookOpen, label: "本地宝", cls: "text-blue-600", color: "#2563eb" },
  ranking: { icon: TrendingUp, label: "热榜", cls: "text-orange-600", color: "#ea580c" },
};
const formatHeat = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

// 模拟热度时间线
const buildTimeline = (event: HotspotEvent) => {
  const base = event.heatScore;
  return Array.from({ length: 7 }, (_, i) => ({
    day: `D-${6 - i}`,
    热度: Math.round(base * (0.3 + (i / 6) * 0.7) + (Math.random() - 0.5) * base * 0.05),
    讨论量: Math.round((event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin) * (0.2 + (i / 6) * 0.8) / 100),
  }));
};

// 模拟原始线索
const buildClues = (event: HotspotEvent) => [
  { id: "c1", source: event.sources[0]?.label || "大麦网", title: `${event.title.slice(0, 20)} - 票务详情页`, time: event.firstTime, kind: event.sources[0]?.kind || "damai", url: "#" },
  { id: "c2", source: "微博热搜", title: `#${event.title.split("·")[0]}# 上榜微博热搜 第 ${Math.ceil(Math.random() * 30)} 位`, time: event.firstTime, kind: "ranking", url: "#" },
  { id: "c3", source: "小红书", title: `网友分享：${event.city}${event.category}打卡攻略`, time: event.latestTime, kind: "ranking", url: "#" },
  { id: "c4", source: "抖音", title: `${event.title} 现场视频热度上升`, time: event.latestTime, kind: "ranking", url: "#" },
  { id: "c5", source: `${event.city}本地宝`, title: `${event.city}周边活动汇总收录`, time: event.firstTime, kind: "bendibao", url: "#" },
];

const importanceMap = {
  high: { label: "重大", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { label: "一般", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  low: { label: "低", cls: "bg-muted text-muted-foreground" },
};

export default function HotspotDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");
  const event = useMemo(() => hotspotEvents.find(e => e.id === id), [id]);

  // 返回列表时保留筛选条件 (从 returnFilters 参数还原)
  const returnFilters = params.get("returnFilters") || "";
  const goBack = () => {
    const target = returnFilters ? `/hotspot/detail?${returnFilters}` : "/hotspot/detail";
    navigate(target);
  };

  // hooks must run unconditionally — provide safe fallback
  const timeline = useMemo(() => event ? buildTimeline(event) : [], [event]);
  const clues = useMemo(() => event ? buildClues(event) : [], [event]);
  const sourceDistribution = useMemo(() => {
    if (!event) return [];
    return [
      { name: "大麦/票务", value: event.sources.filter(s => s.kind === "damai").length * 1000 || 100, kind: "damai" as SourceKind },
      { name: "本地宝", value: event.sources.filter(s => s.kind === "bendibao").length * 1500 || 100, kind: "bendibao" as SourceKind },
      { name: "微博讨论", value: event.relatedVolume.weibo, kind: "ranking" as SourceKind },
      { name: "小红书笔记", value: event.relatedVolume.xhs, kind: "ranking" as SourceKind },
      { name: "抖音播放", value: event.relatedVolume.douyin, kind: "ranking" as SourceKind },
    ].filter(d => d.value > 0);
  }, [event]);

  if (!event) {
    return (
      <div className="text-center py-20">
        <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">未找到该热点事件</p>
        <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={goBack}>
          <ArrowLeft className="w-3 h-3 mr-1" /> 返回列表
        </Button>
      </div>
    );
  }

  const Cat = CATEGORY_META[event.category];
  const CatIcon = Cat.icon;
  const totalVol = event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin;
  const PIE_COLORS = ["#e11d48", "#2563eb", "#f97316", "#ec4899", "#10b981"];
  const importance = importanceMap[event.importance];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={goBack} className="cursor-pointer">热点洞察列表</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{event.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={goBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={`text-[11px] gap-1 ${Cat.cls}`}>
                <CatIcon className="w-3 h-3" /> {event.category}
              </Badge>
              <Badge variant="outline" className={`text-[11px] gap-1 ${importance.cls}`}>
                <Flame className="w-3 h-3" /> {importance.label}
              </Badge>
              {event.isNew && <Badge className="text-[10px] bg-rose-500">NEW</Badge>}
              <span className="text-[10px] text-muted-foreground/60 font-mono">#{event.id}</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">{event.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.dateRange ?? event.date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.city}{event.venue ? ` · ${event.venue}` : ""}</span>
              <span>首次发现 {event.firstTime}</span>
              <span>最近更新 {event.latestTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate(`/sentiment/event-alert?themeId=hotspot&eventId=${event.id}`)}>
            <Bell className="w-3.5 h-3.5" /> 加入预警
          </Button>
          <Button size="sm" className="text-xs gap-1" onClick={() => navigate("/analysis/report-manage", { state: { reportPrefill: { theme: "热点洞察", scope: "events", ids: [event.id], titles: [event.title], source: "热点洞察详情" } } })}>
            <FileText className="w-3.5 h-3.5" /> 生成报告
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="综合热度" value={formatHeat(event.heatScore)} subtitle={`↑ ${event.heatTrend}%`} />
        <StatCard title="关联讨论" value={formatHeat(totalVol)} subtitle={`${event.crossSource} 个数据源`} />
        <StatCard title="业务相关度" value={"⭐".repeat(event.businessRelevance)} />
        <StatCard title="关联线索" value={event.itemCount} />
      </div>

      {/* AI tag fields */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">AI 标签字段</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.sentiment.neg > 30 && <Badge className="bg-destructive/10 text-destructive border-0 text-[11px]">负向占比 {event.sentiment.neg}%</Badge>}
          {event.sentiment.pos > 60 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[11px]">正向占比 {event.sentiment.pos}%</Badge>}
          <Badge className="bg-primary/15 text-primary border-0 text-[11px]">业务相关 {"⭐".repeat(event.businessRelevance)}</Badge>
          <Badge className="bg-primary/10 text-primary border-0 text-[11px]">跨源数 {event.crossSource}</Badge>
          <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[11px]">活动品类 · {event.category}</Badge>
          <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[11px]">城市 · {event.city}</Badge>
        </div>
        <div className="mt-3 p-3 rounded-md bg-card/60 border border-border">
          <div className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> AI 洞察摘要
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
        </div>
      </Card>

      {/* Calculated fields */}
      <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">计算字段</span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          <Metric label="综合热度" value={formatHeat(event.heatScore)} className="text-rose-600" />
          <Metric label="热度增幅" value={`+${event.heatTrend}%`} className="text-emerald-600" />
          <Metric label="微博讨论" value={formatHeat(event.relatedVolume.weibo)} />
          <Metric label="小红书笔记" value={formatHeat(event.relatedVolume.xhs)} />
          <Metric label="抖音播放" value={formatHeat(event.relatedVolume.douyin)} />
          <Metric label="正向情感" value={`${event.sentiment.pos}%`} className="text-emerald-600" />
        </div>
      </Card>

      {/* Charts row: timeline + source distribution */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> 热度趋势（近 7 天）
            </h3>
            <span className="text-[11px] text-muted-foreground">综合热度 + 讨论量</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="热度" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="讨论量" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-primary" /> 来源分布
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sourceDistribution} dataKey="value" nameKey="name" outerRadius={70} label={(p) => `${p.name}`} labelLine={false} fontSize={10}>
                {sourceDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Sources detail */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary" /> 数据来源（{event.sources.length}）
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {event.sources.map((s, i) => {
            const Meta = SOURCE_META[s.kind];
            const Icon = Meta.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${Meta.cls.replace("text-", "bg-").replace("-600", "-100")}`}>
                  <Icon className={`w-4 h-4 ${Meta.cls}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{s.label}</div>
                  {s.extra && <div className="text-[11px] text-muted-foreground mt-0.5">{s.extra}</div>}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Raw clues / 原始线索 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" /> 原始线索（{clues.length}）
          </h3>
          <span className="text-[11px] text-muted-foreground">来自三类数据源的原始抓取记录</span>
        </div>
        <div className="space-y-2">
          {clues.map(c => {
            const Meta = SOURCE_META[c.kind as SourceKind];
            const Icon = Meta.icon;
            return (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${Meta.cls}`} />
                <Badge variant="outline" className="text-[10px] shrink-0">{c.source}</Badge>
                <span className="text-xs text-foreground flex-1 truncate hover:text-primary cursor-pointer">{c.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sentiment distribution */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-primary" /> 情感分布
        </h3>
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-emerald-500" style={{ width: `${event.sentiment.pos}%` }} />
          <div className="bg-slate-300" style={{ width: `${event.sentiment.neu}%` }} />
          <div className="bg-rose-500" style={{ width: `${event.sentiment.neg}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className="text-emerald-600">正面 {event.sentiment.pos}%</span>
          <span>中性 {event.sentiment.neu}%</span>
          <span className="text-rose-600">负面 {event.sentiment.neg}%</span>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-bold ${className ?? "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
