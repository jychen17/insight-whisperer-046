import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hotspotEvents as mockEvents, allClues, type HotspotEvent, type SourceKind, type Category, type Importance } from "@/lib/hotspotData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, MapPin, Calendar, Flame, TrendingUp, Music2, Palette,
  Sparkles, ExternalLink, Bell, FileText, ArrowUpRight, Ticket, BookOpen, Hash,
  ChevronDown, ChevronUp, Download, Settings, CheckCircle2, Globe, Eye, Tag, Layers,
  ListChecks, GraduationCap, Trophy, CalendarDays, PartyPopper, Landmark,
} from "lucide-react";
import StatCard from "@/components/StatCard";

// Types & mock data are imported from @/lib/hotspotData

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const CATEGORY_META: Record<Category, { icon: typeof Music2; cls: string }> = {
  "考试": { icon: GraduationCap, cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  "演唱会": { icon: Music2, cls: "bg-purple-100 text-purple-700 border-purple-200" },
  "展会": { icon: Palette, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "演出赛事": { icon: Trophy, cls: "bg-rose-100 text-rose-700 border-rose-200" },
  "节假日": { icon: CalendarDays, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "活动": { icon: PartyPopper, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const SOURCE_META: Record<SourceKind, { icon: typeof Ticket; label: string; cls: string }> = {
  damai: { icon: Ticket, label: "大麦", cls: "text-rose-600" },
  bendibao: { icon: BookOpen, label: "本地宝", cls: "text-blue-600" },
  ranking: { icon: TrendingUp, label: "热榜", cls: "text-orange-600" },
  gov: { icon: Landmark, label: "政府网站", cls: "text-slate-600" },
  exam: { icon: GraduationCap, label: "考试官网", cls: "text-indigo-600" },
};

const ALL_CITIES = ["全国", "上海", "北京", "成都", "广州", "武汉", "西双版纳"];
const HEAT_LEVELS: Array<"高" | "中" | "低"> = ["高", "中", "低"];

const formatHeat = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

const importanceBadgeMap: Record<Importance, JSX.Element> = {
  high: <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] gap-0.5"><Flame className="w-2.5 h-2.5" />重大</Badge>,
  medium: <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-0.5"><Eye className="w-2.5 h-2.5" />一般</Badge>,
  low: <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">低</Badge>,
};

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function HotspotList() {
  const navigate = useNavigate();
  const [hotspotView, setHotspotView] = useState<"events" | "clues">("events");
  // 跳转到详情页时保留当前筛选条件
  const goDetail = (e: HotspotEvent) => {
    const qs = new URLSearchParams();
    if (searchQuery) qs.set("q", searchQuery);
    if (filterImportance !== "all") qs.set("importance", filterImportance);
    if (filterCity !== "全部") qs.set("city", filterCity);
    if (filterCategory !== "all") qs.set("category", filterCategory);
    if (filterSource !== "all") qs.set("source", filterSource);
    if (filterDateStart) qs.set("ds", filterDateStart);
    if (filterDateEnd) qs.set("de", filterDateEnd);
    if (sortBy) qs.set("sort", sortBy);
    if (hotspotView) qs.set("view", hotspotView);
    const returnFilters = qs.toString();
    navigate(`/hotspot/event-detail?id=${e.id}${returnFilters ? `&returnFilters=${encodeURIComponent(returnFilters)}` : ""}`);
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // filters
  const [filterImportance, setFilterImportance] = useState<"all" | Importance>("all");
  const [filterHeat, setFilterHeat] = useState<"all" | "高" | "中" | "低">("all");
  const [filterCity, setFilterCity] = useState("全部");
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [filterSource, setFilterSource] = useState<"all" | SourceKind>("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"heat_desc" | "date_asc" | "trend_desc" | "biz_desc">("heat_desc");

  const filtered = useMemo(() => {
    let list = mockEvents;
    if (searchQuery) list = list.filter(e => e.title.includes(searchQuery) || e.city.includes(searchQuery) || (e.subType ?? "").includes(searchQuery));
    if (filterImportance !== "all") list = list.filter(e => e.importance === filterImportance);
    if (filterHeat !== "all") list = list.filter(e => e.heatLevel === filterHeat);
    if (filterCity !== "全部") list = list.filter(e => e.city === filterCity || e.province === filterCity);
    if (filterCategory !== "all") list = list.filter(e => e.category === filterCategory);
    if (filterSource !== "all") list = list.filter(e => e.sources.some(s => s.kind === filterSource));
    if (filterDateStart) list = list.filter(e => e.date >= filterDateStart);
    if (filterDateEnd) list = list.filter(e => e.date <= filterDateEnd);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "heat_desc": return b.heatScore - a.heatScore;
        case "date_asc": return a.date.localeCompare(b.date);
        case "trend_desc": return b.heatTrend - a.heatTrend;
        case "biz_desc": return b.businessRelevance - a.businessRelevance;
        default: return 0;
      }
    });
  }, [searchQuery, filterImportance, filterHeat, filterCity, filterCategory, filterSource, filterDateStart, filterDateEnd, sortBy]);

  const stats = useMemo(() => ({
    upcoming: mockEvents.filter(e => new Date(e.date) >= new Date("2026-04-15")).length,
    newToday: mockEvents.filter(e => e.isNew).length,
    highBiz: mockEvents.filter(e => e.businessRelevance >= 4).length,
    cross: mockEvents.filter(e => e.crossSource >= 2).length,
  }), []);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const goReport = (ids: string[]) => {
    const titles = mockEvents.filter(e => ids.includes(e.id)).map(e => e.title);
    navigate("/analysis/report-manage", {
      state: { reportPrefill: { theme: "热点洞察", scope: "events", ids, titles, source: "热点洞察列表" } }
    });
  };

  return (
    <div className="space-y-5">
      {/* ───── Header ───── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">热点洞察列表</h1>
          <p className="text-xs text-muted-foreground mt-1">
            融合 <span className="text-rose-600 font-medium">大麦演出日历</span>、
            <span className="text-blue-600 font-medium">本地宝活动攻略</span>、
            <span className="text-orange-600 font-medium">社媒实时热榜</span> 的跨源热点事件
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1">
                <Download className="w-3 h-3" />导出数据<ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem><FileText className="w-3.5 h-3.5" />导出全部数据</DropdownMenuItem>
              <DropdownMenuItem disabled={selectedIds.length === 0}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                导出所选数据
                {selectedIds.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{selectedIds.length}</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => navigate("/sentiment/event-alert?themeId=hotspot")}
          >
            <Bell className="w-3 h-3" />预警设置
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => goReport(selectedIds)}
          >
            <FileText className="w-3 h-3" />
            报告设置
            {selectedIds.length > 0 && (
              <span className="ml-1 px-1.5 rounded bg-primary/15 text-primary text-[10px]">已选 {selectedIds.length}</span>
            )}
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1"
            onClick={() => navigate("/datacenter/themes")}
          >
            <Settings className="w-3 h-3" />主题配置
          </button>
        </div>
      </div>

      {/* Tabs: events list / all articles list */}
      <Tabs value={hotspotView} onValueChange={(v) => setHotspotView(v as "events" | "clues")}>
        <TabsList>
          <TabsTrigger value="events" className="gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            事件列表
            <span className="ml-1 text-[11px] opacity-70">({mockEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="clues" className="gap-1.5">
            <ListChecks className="w-3.5 h-3.5" />
            全部文章列表
            <span className="ml-1 text-[11px] opacity-70">({allClues().length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ========== EVENTS LIST VIEW ========== */}
        <TabsContent value="events" className="space-y-4 mt-4">
          {/* Filters card */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-7 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">热度分级</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterHeat}
                  onChange={e => setFilterHeat(e.target.value as typeof filterHeat)}
                >
                  <option value="all">全部</option>
                  {HEAT_LEVELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">业务重要性</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterImportance}
                  onChange={e => setFilterImportance(e.target.value as typeof filterImportance)}
                >
                  <option value="all">全部</option>
                  <option value="high">重大</option>
                  <option value="medium">一般</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">省份/城市</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                >
                  <option value="全部">全部</option>
                  {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">热点类型</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as typeof filterCategory)}
                >
                  <option value="all">全部</option>
                  {(Object.keys(CATEGORY_META) as Category[]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">数据源</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value as typeof filterSource)}
                >
                  <option value="all">全部</option>
                  <option value="damai">大麦演出</option>
                  <option value="bendibao">本地宝</option>
                  <option value="ranking">社媒热榜</option>
                  <option value="gov">政府网站</option>
                  <option value="exam">考试官网</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">活动日期</label>
                <div className="flex gap-1 mt-1">
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">搜索热点</label>
                <div className="relative mt-1">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="搜索事件 / 城市..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(filtered.map(x => x.id));
                      else setSelectedIds([]);
                    }}
                  />
                  <span>全选</span>
                </label>
                {selectedIds.length > 0 && (
                  <>
                    <span className="text-primary font-medium">已选 {selectedIds.length} 个热点</span>
                    <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={() => goReport(selectedIds)}>
                      <FileText className="w-3 h-3" /> 生成报告
                    </Button>
                  </>
                )}
                <span className="ml-2">共 {filtered.length} 个热点</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground"
                >
                  <option value="heat_desc">综合热度降序</option>
                  <option value="trend_desc">热度增幅降序</option>
                  <option value="date_asc">活动日期升序</option>
                  <option value="biz_desc">业务相关度降序</option>
                </select>
              </div>
            </div>
          </div>

          {/* Event Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-lg border border-border">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>未找到匹配的热点</p>
              <p className="text-xs mt-1">请调整筛选条件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(event => {
                const isExpanded = expandedId === event.id;
                const Cat = CATEGORY_META[event.category];
                const CatIcon = Cat.icon;
                const totalVol = event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin;
                const importanceBorder = {
                  high: "border-l-destructive border-l-4",
                  medium: "border-l-amber-500 border-l-4",
                  low: "",
                }[event.importance];

                return (
                  <div key={event.id} className={`bg-card rounded-lg border border-border overflow-hidden ${importanceBorder}`}>
                    <div className="p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedId(isExpanded ? null : event.id)}>
                      {/* Row 1: title + actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedIds.includes(event.id)}
                              onChange={(e) => { e.stopPropagation(); toggleSelect(event.id); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <Badge variant="outline" className={`text-[11px] gap-1 ${Cat.cls}`}>
                              <CatIcon className="w-3 h-3" /> {event.category}
                            </Badge>
                            {event.isNew && <Badge className="h-4 text-[10px] px-1.5 bg-rose-500">NEW</Badge>}
                            <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                            <span className="text-[10px] text-muted-foreground/60 font-mono" title="热点ID">#{event.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px] gap-1"
                            onClick={(e) => { e.stopPropagation(); goReport([event.id]); }}
                          >
                            <FileText className="w-3 h-3" /> 报告
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px] gap-1"
                            onClick={(e) => { e.stopPropagation(); goDetail(event); }}
                          >
                            <ExternalLink className="w-3 h-3" /> 详情
                          </Button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* AI tag fields */}
                      <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {event.sentiment.neg > 30 && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">负向占比 {event.sentiment.neg}%</Badge>}
                          {event.sentiment.pos > 60 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">正向占比 {event.sentiment.pos}%</Badge>}
                          <Badge className="bg-primary/20 text-primary border-0 text-[10px]">业务相关 {"⭐".repeat(event.businessRelevance)}</Badge>
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">跨源数 {event.crossSource}</Badge>
                          <span className="ml-auto text-[10px] text-muted-foreground">关联线索</span>
                          <span className="text-xs font-semibold text-foreground">{event.itemCount}</span>
                        </div>
                      </div>

                      {/* Calculated fields */}
                      <div className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <div className="grid grid-cols-6 gap-3">
                          <div className="text-center">
                            <div>{importanceBadgeMap[event.importance]}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">热点等级</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-rose-600 flex items-center justify-center gap-0.5">
                              <Flame className="w-3 h-3" /> {formatHeat(event.heatScore)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">综合热度</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-emerald-600 flex items-center justify-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" /> {event.heatTrend}%
                            </div>
                            <div className="text-[10px] text-muted-foreground">热度增幅</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-foreground">{formatHeat(event.relatedVolume.weibo)}</div>
                            <div className="text-[10px] text-muted-foreground">微博讨论</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-foreground">{formatHeat(event.relatedVolume.xhs)}</div>
                            <div className="text-[10px] text-muted-foreground">小红书</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-foreground">{formatHeat(event.relatedVolume.douyin)}</div>
                            <div className="text-[10px] text-muted-foreground">抖音</div>
                          </div>
                        </div>
                      </div>

                      {/* Raw fields */}
                      <div className="mt-2 rounded-md border border-border bg-muted/20 p-2.5">
                        <div className="grid grid-cols-4 gap-3 text-[11px]">
                          <div>
                            <div className="text-muted-foreground text-[10px] flex items-center gap-1"><Calendar className="w-3 h-3" />活动日期</div>
                            <div className="text-foreground">{event.dateRange ?? event.date}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3" />地点</div>
                            <div className="text-foreground">{event.city}{event.venue ? ` · ${event.venue}` : ""}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">首次发现</div>
                            <div className="text-foreground">{event.firstTime}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px] flex items-center gap-1"><Globe className="w-3 h-3" />数据源</div>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {event.sources.map((s, i) => {
                                const Meta = SOURCE_META[s.kind];
                                return <Badge key={i} variant="outline" className={`text-[10px] px-1.5 py-0 ${Meta.cls}`}>{s.label}</Badge>;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                            <div className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> AI 洞察摘要
                            </div>
                            <p className="text-xs text-foreground leading-relaxed">{event.description}</p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground mb-2">数据来源详情（{event.sources.length}）</div>
                            <div className="space-y-2">
                              {event.sources.map((s, i) => {
                                const Meta = SOURCE_META[s.kind];
                                const Icon = Meta.icon;
                                return (
                                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30">
                                    <Icon className={`w-4 h-4 ${Meta.cls}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-foreground">{s.label}</div>
                                      {s.extra && <div className="text-[11px] text-muted-foreground">{s.extra}</div>}
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground mb-2">情感分布</div>
                            <div className="flex h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500" style={{ width: `${event.sentiment.pos}%` }} />
                              <div className="bg-slate-300" style={{ width: `${event.sentiment.neu}%` }} />
                              <div className="bg-rose-500" style={{ width: `${event.sentiment.neg}%` }} />
                            </div>
                            <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                              <span className="text-emerald-600">正面 {event.sentiment.pos}%</span>
                              <span>中性 {event.sentiment.neu}%</span>
                              <span className="text-rose-600">负面 {event.sentiment.neg}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========== ALL ARTICLES (CLUES) LIST VIEW ========== */}
        <TabsContent value="clues" className="mt-4">
          <ClueListView onEventClick={(eid) => {
            const ev = mockEvents.find(e => e.id === eid);
            if (ev) goDetail(ev);
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Clue (article) list view — aggregates all clues across events
// ────────────────────────────────────────────────────────────
function ClueListView({ onEventClick }: { onEventClick: (eventId: string) => void }) {
  const all = useMemo(() => allClues(), []);
  const [kindFilter, setKindFilter] = useState<"all" | SourceKind>("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    let list = all;
    if (kindFilter !== "all") list = list.filter(c => c.kind === kindFilter);
    if (keyword) list = list.filter(c => c.title.includes(keyword) || c.eventTitle.includes(keyword) || c.author.includes(keyword));
    return list.sort((a, b) => b.heat - a.heat);
  }, [all, kindFilter, keyword]);

  const counts = useMemo(() => ({
    all: all.length,
    damai: all.filter(c => c.kind === "damai").length,
    bendibao: all.filter(c => c.kind === "bendibao").length,
    ranking: all.filter(c => c.kind === "ranking").length,
  }), [all]);

  const KIND_TABS: { v: "all" | SourceKind; label: string }[] = [
    { v: "all", label: "全部" },
    { v: "damai", label: "大麦演出" },
    { v: "bendibao", label: "本地宝活动" },
    { v: "ranking", label: "社媒热榜" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {KIND_TABS.map((t, i) => {
            const active = kindFilter === t.v;
            const cnt = counts[t.v];
            return (
              <button
                key={t.v}
                onClick={() => setKindFilter(t.v)}
                className={`px-3 py-1.5 inline-flex items-center gap-1.5 ${i > 0 ? "border-l border-border" : ""} ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
              >
                {t.label}
                <span className={`text-[10px] ${active ? "opacity-90" : "opacity-60"}`}>({cnt})</span>
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="搜索文章 / 关联事件..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground w-64"
          />
        </div>
        <span className="text-[11px] text-muted-foreground">共 {filtered.length} 条线索</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[36%]">标题</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>关联热点事件</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="text-right">热度</TableHead>
              <TableHead className="text-right">互动</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无匹配的文章线索
                </TableCell>
              </TableRow>
            ) : filtered.map(c => {
              const Meta = SOURCE_META[c.kind];
              const Icon = Meta.icon;
              return (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-foreground">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] gap-1 ${Meta.cls}`}>
                      <Icon className="w-3 h-3" />{c.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-xs text-primary hover:underline text-left"
                      onClick={() => onEventClick(c.eventId)}
                    >
                      {c.eventTitle}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-foreground">{c.author}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{c.region}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{c.publishTime}</TableCell>
                  <TableCell className="text-right text-xs font-medium text-rose-600">
                    <span className="inline-flex items-center gap-0.5"><Flame className="w-3 h-3" />{formatHeat(c.heat)}</span>
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">
                    👍 {c.likes.toLocaleString()} · 💬 {c.comments.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

