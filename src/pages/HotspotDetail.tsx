import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft, Flame, MapPin, Calendar, Sparkles, Bell, FileText, ExternalLink,
  Music2, Palette, Hash, Ticket, BookOpen, TrendingUp, Globe, ArrowUpRight, Eye, Layers,
  Clock, BarChart3, ListChecks,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { hotspotEvents, buildClues, type HotspotEvent, type Category, type SourceKind, type ClueItem } from "@/lib/hotspotData";

const CATEGORY_META: Record<Category, { icon: typeof Music2; cls: string }> = {
  "演唱会": { icon: Music2, cls: "bg-purple-100 text-purple-700 border-purple-200" },
  "音乐节": { icon: Music2, cls: "bg-pink-100 text-pink-700 border-pink-200" },
  "展览": { icon: Palette, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "市集": { icon: Sparkles, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "节庆": { icon: Sparkles, cls: "bg-rose-100 text-rose-700 border-rose-200" },
  "亲子": { icon: Sparkles, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "线上热议": { icon: Hash, cls: "bg-orange-100 text-orange-700 border-orange-200" },
};
const SOURCE_META: Record<SourceKind, { icon: typeof Ticket; label: string; cls: string }> = {
  damai: { icon: Ticket, label: "大麦", cls: "text-rose-600" },
  bendibao: { icon: BookOpen, label: "本地宝", cls: "text-blue-600" },
  ranking: { icon: TrendingUp, label: "热榜", cls: "text-orange-600" },
};
const formatHeat = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

const importanceMap = {
  high: { label: "重大", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { label: "一般", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  low: { label: "低", cls: "bg-muted text-muted-foreground" },
};

// ─── Mock builders ───
const buildTimeline = (event: HotspotEvent) => {
  const base = event.heatScore;
  return Array.from({ length: 7 }, (_, i) => ({
    day: `D-${6 - i}`,
    热度: Math.round(base * (0.3 + (i / 6) * 0.7) + (Math.random() - 0.5) * base * 0.05),
    讨论量: Math.round((event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin) * (0.2 + (i / 6) * 0.8) / 100),
  }));
};

const buildEventTimeline = (event: HotspotEvent) => [
  { time: event.firstTime, desc: `首次发现于 ${event.sources[0]?.label ?? "数据源"}` },
  { time: event.firstTime, desc: `${event.city} 本地宝活动攻略收录` },
  { time: event.latestTime, desc: `跨 ${event.crossSource} 个数据源同步上榜，热度上升 ${event.heatTrend}%` },
  { time: event.latestTime, desc: `综合热度达到 ${formatHeat(event.heatScore)}，关联线索 ${event.itemCount} 条` },
];

// ClueItem & buildClues imported from @/lib/hotspotData

export default function HotspotDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");
  const event = useMemo(() => hotspotEvents.find(e => e.id === id), [id]);

  const returnFilters = params.get("returnFilters") || "";
  const goBack = () => {
    const target = returnFilters ? `/hotspot/detail?${returnFilters}` : "/hotspot/detail";
    navigate(target);
  };

  // hooks must run unconditionally
  const heatTimeline = useMemo(() => event ? buildTimeline(event) : [], [event]);
  const eventTimeline = useMemo(() => event ? buildEventTimeline(event) : [], [event]);
  const clues = useMemo(() => event ? buildClues(event) : [], [event]);
  const sourceDistribution = useMemo(() => {
    if (!event) return [];
    return [
      { name: "大麦/票务", value: event.sources.filter(s => s.kind === "damai").length * 1000 || 100 },
      { name: "本地宝", value: event.sources.filter(s => s.kind === "bendibao").length * 1500 || 100 },
      { name: "微博讨论", value: event.relatedVolume.weibo },
      { name: "小红书笔记", value: event.relatedVolume.xhs },
      { name: "抖音播放", value: event.relatedVolume.douyin },
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

  const importanceBadge = (
    <Badge variant="outline" className={`text-[10px] justify-center py-1.5 gap-1 ${importance.cls}`}>
      <Flame className="w-3 h-3" /> {importance.label}
    </Badge>
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/")} className="cursor-pointer">首页</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={goBack} className="cursor-pointer">热点洞察列表</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>事件详情</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">事件详情</h1>
          <Badge variant="outline" className={`text-[11px] gap-1 ${Cat.cls}`}>
            <CatIcon className="w-3 h-3" /> {event.category}
          </Badge>
          {event.isNew && <Badge className="text-[10px] bg-rose-500">NEW</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate(`/sentiment/event-alert?themeId=hotspot&eventId=${event.id}`)}>
            <Bell className="w-3 h-3" /> 设置预警
          </Button>
          <Button size="sm" className="text-xs gap-1" onClick={() => navigate("/analysis/report-manage", { state: { reportPrefill: { theme: "热点洞察", scope: "events", ids: [event.id], titles: [event.title], source: "热点洞察详情" } } })}>
            <FileText className="w-3 h-3" /> 生成报告
          </Button>
        </div>
      </div>

      {/* Event title & summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </CardContent>
      </Card>

      {/* AI 标签字段 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {event.sentiment.neg > 0 && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">负向 {event.sentiment.neg}%</Badge>}
            {event.sentiment.neu > 0 && <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">中性 {event.sentiment.neu}%</Badge>}
            {event.sentiment.pos > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">正向 {event.sentiment.pos}%</Badge>}
            <Badge className="bg-primary/20 text-primary border-0 text-[10px]">活动品类: {event.category}</Badge>
            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">城市: {event.city}</Badge>
            <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">业务相关 {"⭐".repeat(event.businessRelevance)}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-muted/30 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="w-4 h-4" /> 关联线索总量
              </div>
              <div className="text-lg font-semibold text-foreground">{event.itemCount}</div>
            </div>
          </div>
          <div className="p-3 rounded-md bg-card/60 border border-border">
            <div className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> AI 洞察摘要
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* 计算字段 */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-6 gap-3">
            {importanceBadge}
            <div className="bg-muted/30 rounded-md p-3 text-center">
              <Flame className="w-4 h-4 mx-auto text-rose-600 mb-1" />
              <div className="text-base font-semibold text-rose-600">{formatHeat(event.heatScore)}</div>
              <div className="text-[11px] text-muted-foreground">综合热度</div>
            </div>
            <div className="bg-muted/30 rounded-md p-3 text-center">
              <ArrowUpRight className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-base font-semibold text-emerald-600">+{event.heatTrend}%</div>
              <div className="text-[11px] text-muted-foreground">热度增幅</div>
            </div>
            <div className="bg-muted/30 rounded-md p-3 text-center">
              <div className="text-base font-semibold text-foreground">{formatHeat(event.relatedVolume.weibo)}</div>
              <div className="text-[11px] text-muted-foreground">微博讨论</div>
            </div>
            <div className="bg-muted/30 rounded-md p-3 text-center">
              <div className="text-base font-semibold text-foreground">{formatHeat(event.relatedVolume.xhs)}</div>
              <div className="text-[11px] text-muted-foreground">小红书</div>
            </div>
            <div className="bg-muted/30 rounded-md p-3 text-center">
              <div className="text-base font-semibold text-foreground">{formatHeat(event.relatedVolume.douyin)}</div>
              <div className="text-[11px] text-muted-foreground">抖音播放</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 原始字段 */}
      <Card className="bg-muted/20">
        <CardContent className="pt-4 grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />活动日期</div>
            <div className="text-foreground text-sm">{event.dateRange ?? event.date}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />地点</div>
            <div className="text-foreground text-sm">{event.city}{event.venue ? ` · ${event.venue}` : ""}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">首发时间 / 最新时间</div>
            <div className="text-foreground text-xs">{event.firstTime}<br/>{event.latestTime}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="w-3 h-3" />覆盖数据源（{event.sources.length}）</div>
            <div className="flex gap-1.5 flex-wrap">
              {event.sources.map((s, i) => {
                const Meta = SOURCE_META[s.kind];
                return <Badge key={i} variant="outline" className={`text-[10px] ${Meta.cls}`}>{s.label}</Badge>;
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> 热度趋势（近 7 天）
            </h3>
            <span className="text-[11px] text-muted-foreground">综合热度 + 讨论量</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={heatTimeline}>
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
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceDistribution} dataKey="value" nameKey="name" outerRadius={65} label={(p) => `${p.name}`} labelLine={false} fontSize={10}>
                {sourceDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> 事件时间线</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventTimeline.map((t, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {idx < eventTimeline.length - 1 && <div className="w-px h-8 bg-border" />}
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{t.time}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
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

      {/* Clue / Source list — Tabbed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> 事件关联线索 ({clues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">全部线索 ({clues.length})</TabsTrigger>
              <TabsTrigger value="damai" className="text-xs">大麦演出 ({clues.filter(c => c.kind === "damai").length})</TabsTrigger>
              <TabsTrigger value="bendibao" className="text-xs">本地宝活动 ({clues.filter(c => c.kind === "bendibao").length})</TabsTrigger>
              <TabsTrigger value="ranking" className="text-xs">社媒热榜 ({clues.filter(c => c.kind === "ranking").length})</TabsTrigger>
            </TabsList>

            {(["all", "damai", "bendibao", "ranking"] as const).map(tab => {
              const list = tab === "all" ? clues : clues.filter(c => c.kind === tab);
              return (
                <TabsContent key={tab} value={tab} className="mt-3">
                  {list.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">暂无该类线索</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">标题</TableHead>
                          <TableHead className="text-xs">来源</TableHead>
                          <TableHead className="text-xs">发布者</TableHead>
                          <TableHead className="text-xs">发布时间</TableHead>
                          <TableHead className="text-xs">地区</TableHead>
                          <TableHead className="text-xs">热度</TableHead>
                          <TableHead className="text-xs">评论</TableHead>
                          <TableHead className="text-xs">点赞</TableHead>
                          <TableHead className="text-xs">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map(c => {
                          const Meta = SOURCE_META[c.kind];
                          const Icon = Meta.icon;
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs font-medium max-w-[280px]">
                                <span className="flex items-center gap-1.5">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${Meta.cls}`} />
                                  <span className="truncate hover:text-primary cursor-pointer">{c.title}</span>
                                </span>
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className={`text-[10px] ${Meta.cls}`}>{c.source}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{c.author}</TableCell>
                              <TableCell className="text-xs">{c.publishTime}</TableCell>
                              <TableCell className="text-xs">{c.region}</TableCell>
                              <TableCell className="text-xs text-rose-600 font-medium">{formatHeat(c.heat)}</TableCell>
                              <TableCell className="text-xs">{c.comments}</TableCell>
                              <TableCell className="text-xs">{c.likes}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5">
                                  <ExternalLink className="w-3 h-3" /> 查看
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
