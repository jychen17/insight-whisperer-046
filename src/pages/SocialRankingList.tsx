import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame, TrendingUp, TrendingDown, Minus, Sparkles, Search, Bell, FileText,
  Settings, ArrowUpRight, ArrowDownRight, Plane, Download, ChevronDown, CheckCircle2,
  RefreshCw, X, ExternalLink, MapPin, Building2, Image as ImageIcon, Hash,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  rankTopics as initialTopics, RANK_SOURCES, BOARD_CATEGORIES, formatHeat, refreshSnapshot,
  CITIES, REGIONS,
  type RankSource, type RankTopic, type TrendDir, type BoardCategory,
} from "@/lib/socialRankingData";

const TREND_META: Record<TrendDir, { icon: typeof TrendingUp; cls: string; label: string }> = {
  up:   { icon: TrendingUp,   cls: "text-rose-600",     label: "上升" },
  down: { icon: TrendingDown, cls: "text-emerald-600",  label: "下降" },
  flat: { icon: Minus,        cls: "text-muted-foreground", label: "持平" },
  new:  { icon: Sparkles,     cls: "text-amber-600",    label: "新上榜" },
  boom: { icon: Flame,        cls: "text-destructive",  label: "爆" },
};

const fmtTime = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

function RankBadge({ rank }: { rank: number }) {
  const top3 = rank <= 3;
  const colorMap = ["bg-rose-500 text-white", "bg-orange-500 text-white", "bg-amber-500 text-white"];
  return (
    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0 ${
      top3 ? colorMap[rank - 1] : "bg-muted text-foreground"
    }`}>{rank}</div>
  );
}

function RankDelta({ topic }: { topic: RankTopic }) {
  if (topic.trend === "new") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-0.5"><Sparkles className="w-2.5 h-2.5" />新</Badge>;
  if (topic.trend === "boom") return <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] gap-0.5"><Flame className="w-2.5 h-2.5" />爆</Badge>;
  if (topic.prevRank === undefined) return null;
  const delta = topic.prevRank - topic.rank;
  if (delta === 0) return <span className="text-[10px] text-muted-foreground inline-flex items-center"><Minus className="w-2.5 h-2.5" /></span>;
  return delta > 0
    ? <span className="text-[10px] text-rose-600 inline-flex items-center gap-0.5"><ArrowUpRight className="w-2.5 h-2.5" />{delta}</span>
    : <span className="text-[10px] text-emerald-600 inline-flex items-center gap-0.5"><ArrowDownRight className="w-2.5 h-2.5" />{Math.abs(delta)}</span>;
}

// ─── Per-source ranking column (used in board view for realtime/travel) ───
function RankingColumn({
  source, topics, highlightIds, onSelectTopic,
}: {
  source: RankSource;
  topics: RankTopic[];
  highlightIds: Set<string>;
  onSelectTopic: (t: RankTopic) => void;
}) {
  const meta = RANK_SOURCES[source];
  const list = topics.filter(t => t.source === source).sort((a, b) => a.rank - b.rank).slice(0, 10);
  return (
    <Card className="p-0 overflow-hidden">
      <div className={`w-full px-4 py-3 flex items-center justify-between ${meta.cls}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="text-sm font-semibold">{meta.platform} · {meta.board}</span>
        </div>
        <span className="text-[10px] opacity-80">TOP 10</span>
      </div>
      <div className="divide-y divide-border">
        {list.map(t => {
          const highlight = highlightIds.has(t.id);
          const isBoom = t.trend === "boom";
          const isNew = t.trend === "new";
          return (
            <button
              key={t.id}
              onClick={() => onSelectTopic(t)}
              className={`w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors flex items-start gap-2.5 relative ${
                highlight ? "bg-amber-50/60 animate-pulse-once" : ""
              } ${isBoom ? "border-l-2 border-l-destructive" : isNew ? "border-l-2 border-l-amber-500" : ""}`}
            >
              <RankBadge rank={t.rank} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  <span className="text-[13px] font-medium text-foreground line-clamp-1 flex-1">{t.title}</span>
                  <RankDelta topic={t} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-rose-500" />{formatHeat(t.heat)}
                  </span>
                  {t.travelRelated && (
                    <span className="inline-flex items-center gap-0.5 text-primary">
                      <Plane className="w-3 h-3" />旅游
                    </span>
                  )}
                  <span className="ml-auto">{t.duration}</span>
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">暂无数据</div>
        )}
      </div>
    </Card>
  );
}

export default function SocialRankingList() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<BoardCategory>("realtime");

  // Per-tab filter state
  const [filterSource, setFilterSource] = useState<"all" | RankSource>("all");
  const [filterCity, setFilterCity] = useState<string>("北京");
  const [filterRegion, setFilterRegion] = useState<string>("全国");
  const [travelOnly, setTravelOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periodMode, setPeriodMode] = useState<"day" | "month">("day");
  const [date, setDate] = useState("2026-04-22");

  // ─── Refresh state ───
  const [topics, setTopics] = useState<RankTopic[]>(initialTopics);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(2026, 3, 15, 22, 0, 0));
  const [refreshing, setRefreshing] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      const ts = Date.now();
      const { topics: next, updatedIds } = refreshSnapshot(ts);
      setTopics(next);
      setLastUpdated(new Date());
      const newOrBoom = next.filter(t => updatedIds.includes(t.id) && (t.trend === "boom" || t.trend === "new")).map(t => t.id);
      setHighlightIds(new Set(newOrBoom));
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightIds(new Set()), 6000);
      const boomCount = next.filter(t => t.trend === "boom" && updatedIds.includes(t.id)).length;
      const newCount = next.filter(t => t.trend === "new" && updatedIds.includes(t.id)).length;
      toast.success(
        boomCount + newCount > 0
          ? `数据已更新 · 新增 ${newCount} 条上榜、${boomCount} 条爆点`
          : "数据已是最新"
      );
      setRefreshing(false);
    }, 600);
  };

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);

  // Reset filter on category change
  useEffect(() => {
    setFilterSource("all");
    setSelectedIds([]);
    setSearch("");
  }, [activeCategory]);

  // Sources of current category
  const sourcesOfCategory = useMemo(
    () => (Object.keys(RANK_SOURCES) as RankSource[]).filter(k => RANK_SOURCES[k].category === activeCategory),
    [activeCategory]
  );

  // Topics for current tab
  const tabTopics = useMemo(() => {
    let list = topics.filter(t => RANK_SOURCES[t.source].category === activeCategory);
    if (filterSource !== "all") list = list.filter(t => t.source === filterSource);
    if (search) list = list.filter(t => t.title.includes(search) || t.keywords.some(k => k.includes(search)) || (t.poiName ?? "").includes(search));
    if (travelOnly) list = list.filter(t => t.travelRelated);
    if (activeCategory === "city") list = list.filter(t => t.city === filterCity);
    if ((activeCategory === "attractions" || activeCategory === "hotels") && filterRegion !== "全国")
      list = list.filter(t => t.poiRegion === filterRegion);
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [topics, activeCategory, filterSource, filterCity, filterRegion, travelOnly, search]);

  // Hero topics across the current category (boom/new/快速攀升)
  const heroTopics = useMemo(() => {
    const cat = topics.filter(t => RANK_SOURCES[t.source].category === activeCategory);
    return [...cat]
      .filter(t => t.trend === "boom" || t.trend === "new" || (t.prevRank !== undefined && t.prevRank - t.rank >= 2))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 4);
  }, [topics, activeCategory]);

  const stats = useMemo(() => {
    const cat = topics.filter(t => RANK_SOURCES[t.source].category === activeCategory);
    return {
      total: cat.length,
      travel: cat.filter(t => t.travelRelated).length,
      newToday: cat.filter(t => t.trend === "new").length,
      boom: cat.filter(t => t.trend === "boom").length,
    };
  }, [topics, activeCategory]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const goDetail = (t: RankTopic) => navigate(`/social-ranking/topic/${t.id}`);

  const goReport = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("请先选择至少一个话题");
      return;
    }
    const titles = topics.filter(t => ids.includes(t.id)).map(t => t.title);
    toast.success(`已为 ${ids.length} 个话题创建报告任务,跳转到报告管理...`);
    navigate("/analysis/report-manage", {
      state: { reportPrefill: { theme: "社媒榜单", scope: "topics", ids, titles, source: "社媒榜单列表" } }
    });
  };

  const isPOI = activeCategory === "attractions" || activeCategory === "hotels";
  const isCity = activeCategory === "city";
  const currentMeta = BOARD_CATEGORIES.find(c => c.key === activeCategory)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">社媒榜单</h1>
          <p className="text-xs text-muted-foreground mt-1">
            实时聚合 <span className="text-slate-700 font-medium">抖音</span>、
            <span className="text-rose-600 font-medium">微博</span>、
            <span className="text-pink-600 font-medium">小红书</span>、
            <span className="text-blue-600 font-medium">百度</span>、
            <span className="text-orange-600 font-medium">快手</span> 等多平台榜单
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden md:flex items-center gap-1 text-muted-foreground mr-1">
            <span className="text-[11px]">数据更新:</span>
            <span className="text-[11px] font-mono text-foreground">{fmtTime(lastUpdated)}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "刷新中..." : "刷新"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1">
                <Download className="w-3 h-3" />导出数据<ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem><FileText className="w-3.5 h-3.5" />导出当前榜单</DropdownMenuItem>
              <DropdownMenuItem disabled={selectedIds.length === 0}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                导出所选数据
                {selectedIds.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{selectedIds.length}</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => navigate("/sentiment/event-alert?themeId=social-ranking")}
          >
            <Bell className="w-3 h-3" />预警设置
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => goReport(selectedIds)}
          >
            <FileText className="w-3 h-3" />
            {selectedIds.length > 0 ? `生成报告 (${selectedIds.length})` : "报告设置"}
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1"
            onClick={() => navigate("/datacenter/themes/manage")}
          >
            <Settings className="w-3 h-3" />主题配置
          </button>
        </div>
      </div>

      {/* Top-level category tabs */}
      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as BoardCategory)}>
        <TabsList className="h-auto p-1 flex-wrap">
          {BOARD_CATEGORIES.map(c => (
            <TabsTrigger key={c.key} value={c.key} className="gap-1.5">
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Render each tab */}
        {BOARD_CATEGORIES.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4 space-y-4">
            {/* Tab subheader */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{cat.label}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {cat.desc} · <span className="text-amber-700">数据时效: {cat.tip}</span>
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">在榜话题</div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{sourcesOfCategory.length} 个榜单源</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">旅游业务相关</div>
                <div className="text-2xl font-bold text-primary">{stats.travel}</div>
                <div className="text-[11px] text-muted-foreground mt-1">占比 {stats.total ? Math.round(stats.travel / stats.total * 100) : 0}%</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">新上榜</div>
                <div className="text-2xl font-bold text-amber-600">{stats.newToday}</div>
                <div className="text-[11px] text-muted-foreground mt-1">今日新增</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">爆点话题</div>
                <div className="text-2xl font-bold text-destructive">{stats.boom}</div>
                <div className="text-[11px] text-muted-foreground mt-1">热度激增 ≥ 200%</div>
              </Card>
            </div>

            {/* Hero glance */}
            {heroTopics.length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-rose-50/60 via-orange-50/40 to-amber-50/40 border-rose-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-semibold text-foreground">当前最热话题</h3>
                    <span className="text-[11px] text-muted-foreground">· 跨平台爆点 / 新上榜 / 快速攀升</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {heroTopics.map((t) => {
                    const meta = RANK_SOURCES[t.source];
                    const TIcon = TREND_META[t.trend].icon;
                    const highlighted = highlightIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => goDetail(t)}
                        className={`text-left bg-card rounded-lg border p-3 hover:border-primary/40 hover:shadow-sm transition-all group ${
                          highlighted ? "border-amber-400 ring-2 ring-amber-200" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.shortLabel}</Badge>
                          <Badge variant="outline" className="text-[10px]">#{t.rank}</Badge>
                          <span className={`ml-auto text-[10px] inline-flex items-center gap-0.5 ${TREND_META[t.trend].cls}`}>
                            <TIcon className="w-2.5 h-2.5" />{TREND_META[t.trend].label}
                          </span>
                        </div>
                        <div className="text-[13px] font-semibold text-foreground line-clamp-2 group-hover:text-primary mb-1.5">
                          {t.title}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{t.summary}</p>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-0.5 text-rose-600 font-medium">
                            <Flame className="w-3 h-3" />{formatHeat(t.heat)}
                          </span>
                          {t.heatTrend !== 0 && (
                            <span className={`inline-flex items-center gap-0.5 ${t.heatTrend > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {t.heatTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(t.heatTrend)}%
                            </span>
                          )}
                          {t.travelRelated && (
                            <Badge variant="outline" className="ml-auto text-[10px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                              <Plane className="w-2.5 h-2.5" />旅游
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Filter bar */}
            <div className="bg-card rounded-lg border border-border p-3 flex flex-wrap items-end gap-3">
              {/* Period (POI tabs) */}
              {isPOI && (
                <>
                  <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                      className={`px-3 py-1.5 text-xs ${periodMode === "day" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                      onClick={() => setPeriodMode("day")}
                    >日榜</button>
                    <button
                      className={`px-3 py-1.5 text-xs ${periodMode === "month" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                      onClick={() => setPeriodMode("month")}
                    >月榜</button>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  />
                </>
              )}

              {/* Source filter */}
              {!isCity && !isPOI && (
                <div className="min-w-[140px]">
                  <label className="text-[11px] text-muted-foreground">榜单来源</label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                    value={filterSource}
                    onChange={e => setFilterSource(e.target.value as typeof filterSource)}
                  >
                    <option value="all">全部</option>
                    {sourcesOfCategory.map(s => (
                      <option key={s} value={s}>{RANK_SOURCES[s].shortLabel}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* City filter */}
              {isCity && (
                <>
                  <div className="min-w-[140px]">
                    <label className="text-[11px] text-muted-foreground">平台</label>
                    <select
                      className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                      value={filterSource}
                      onChange={e => setFilterSource(e.target.value as typeof filterSource)}
                    >
                      <option value="all">全部</option>
                      {sourcesOfCategory.map(s => (
                        <option key={s} value={s}>{RANK_SOURCES[s].shortLabel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[140px]">
                    <label className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><MapPin className="w-3 h-3" />城市</label>
                    <select
                      className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                      value={filterCity}
                      onChange={e => setFilterCity(e.target.value)}
                    >
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Region filter (POI) */}
              {isPOI && (
                <div className="min-w-[140px]">
                  <label className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><MapPin className="w-3 h-3" />省份</label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                    value={filterRegion}
                    onChange={e => setFilterRegion(e.target.value)}
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {/* Travel only (only for realtime/city — travel/POI are inherently travel) */}
              {(activeCategory === "realtime" || activeCategory === "city") && (
                <label className="flex items-center gap-1.5 text-xs px-2 py-1.5 border border-border rounded-md bg-card">
                  <input type="checkbox" checked={travelOnly} onChange={e => setTravelOnly(e.target.checked)} className="rounded" />
                  <span className="text-foreground">仅看旅游相关</span>
                </label>
              )}

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] text-muted-foreground">搜索</label>
                <div className="relative mt-1">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder={isPOI ? "搜索景点 / 酒店名称..." : "搜索话题 / 关键词..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  />
                </div>
              </div>

              <button
                className="px-3 py-1.5 text-xs border border-border rounded-md bg-card text-muted-foreground hover:text-foreground"
                onClick={() => { setFilterSource("all"); setSearch(""); setTravelOnly(false); setFilterRegion("全国"); }}
              >重置</button>
            </div>

            {/* Selection toolbar */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedIds.length > 0 && selectedIds.length === tabTopics.length}
                    onChange={e => setSelectedIds(e.target.checked ? tabTopics.map(x => x.id) : [])}
                  />
                  <span className="text-muted-foreground">全选</span>
                </label>
                {selectedIds.length > 0 && (
                  <>
                    <span className="text-primary font-medium">已选 {selectedIds.length} 个</span>
                    <Button size="sm" variant="default" className="h-6 text-[11px] gap-1" onClick={() => goReport(selectedIds)}>
                      <FileText className="w-3 h-3" /> 一键生成报告
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setSelectedIds([])}>
                      取消选择
                    </Button>
                  </>
                )}
                <span className="ml-2 text-muted-foreground">共 {tabTopics.length} 条</span>
              </div>
            </div>

            {/* === Realtime / Travel: 5列看板 + 列表 === */}
            {(cat.key === "realtime" || cat.key === "travel") && filterSource === "all" && (
              <div className={`grid gap-3 ${cat.key === "realtime" ? "grid-cols-4" : "grid-cols-3"}`}>
                {sourcesOfCategory.map(src => (
                  <RankingColumn
                    key={src}
                    source={src}
                    topics={topics}
                    highlightIds={highlightIds}
                    onSelectTopic={goDetail}
                  />
                ))}
              </div>
            )}

            {/* === City list (Weibo-同城样式) === */}
            {isCity && (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-24">排名</TableHead>
                      <TableHead>热点</TableHead>
                      <TableHead className="w-28 text-right">热度值</TableHead>
                      <TableHead className="w-72">相关帖子</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabTopics.map(t => {
                      const highlight = highlightIds.has(t.id);
                      return (
                        <TableRow key={t.id} className={`hover:bg-muted/30 cursor-pointer ${highlight ? "bg-amber-50/60" : ""}`} onClick={() => goDetail(t)}>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="rounded" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <RankBadge rank={t.rank} />
                              <RankDelta topic={t} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm text-foreground line-clamp-1 hover:text-primary">{t.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.summary}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-rose-600">{t.heat.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            {t.relatedPosts?.[0] && (
                              <div className="text-xs">
                                <div className="text-primary line-clamp-1 hover:underline">{t.relatedPosts[0].title}</div>
                                <div className="text-[10px] text-muted-foreground">发布者: {t.relatedPosts[0].author || "—"}</div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {tabTopics.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">该城市暂无榜单数据</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* === POI 景点/酒店 list === */}
            {isPOI && (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-20">排名</TableHead>
                      <TableHead className="w-20">缩略图</TableHead>
                      <TableHead className="w-48">{cat.key === "attractions" ? "景点名称" : "酒店名称"}</TableHead>
                      <TableHead className="w-24">所属地</TableHead>
                      <TableHead className="w-28 text-right">热度值</TableHead>
                      <TableHead>相关帖子</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabTopics.map(t => {
                      const highlight = highlightIds.has(t.id);
                      return (
                        <TableRow key={t.id} className={`hover:bg-muted/30 cursor-pointer ${highlight ? "bg-amber-50/60" : ""}`} onClick={() => goDetail(t)}>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="rounded" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <RankBadge rank={t.rank} />
                              <RankDelta topic={t} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                              {cat.key === "attractions"
                                ? <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                : <Building2 className="w-5 h-5 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-foreground hover:text-primary line-clamp-1">{t.poiName ?? t.title}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{t.poiRegion ?? "全国"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-rose-600 inline-flex items-center gap-0.5 justify-end">
                              <Flame className="w-3 h-3" />{formatHeat(t.heat)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {t.relatedPosts?.[0] && (
                              <div className="text-xs">
                                <div className="text-primary line-clamp-1 hover:underline">{t.relatedPosts[0].title}</div>
                                <div className="text-[10px] text-muted-foreground">发布者: {t.relatedPosts[0].author}</div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {tabTopics.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">暂无数据</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* === Realtime/Travel: when filterSource selected, show full table === */}
            {(cat.key === "realtime" || cat.key === "travel") && filterSource !== "all" && (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-20">排名</TableHead>
                      <TableHead>话题</TableHead>
                      <TableHead className="w-28">来源</TableHead>
                      <TableHead className="w-28 text-right">热度</TableHead>
                      <TableHead className="w-20 text-right">涨幅</TableHead>
                      <TableHead className="w-20">趋势</TableHead>
                      <TableHead className="w-24">在榜时长</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabTopics.map(t => {
                      const meta = RANK_SOURCES[t.source];
                      const TIcon = TREND_META[t.trend].icon;
                      const highlight = highlightIds.has(t.id);
                      return (
                        <TableRow key={t.id} className={`hover:bg-muted/30 cursor-pointer ${highlight ? "bg-amber-50/60" : ""}`} onClick={() => goDetail(t)}>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="rounded" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5"><RankBadge rank={t.rank} /><RankDelta topic={t} /></div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm text-foreground line-clamp-1 hover:text-primary">{t.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.summary}</div>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {t.keywords.slice(0, 3).map(k => (
                                <span key={k} className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground">#{k}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.shortLabel}</Badge></TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-rose-600 inline-flex items-center gap-0.5 justify-end">
                              <Flame className="w-3 h-3" />{formatHeat(t.heat)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {t.heatTrend !== 0 ? (
                              <span className={`text-xs font-medium ${t.heatTrend > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {t.heatTrend > 0 ? "+" : ""}{t.heatTrend}%
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs inline-flex items-center gap-0.5 ${TREND_META[t.trend].cls}`}>
                              <TIcon className="w-3 h-3" />{TREND_META[t.trend].label}
                            </span>
                          </TableCell>
                          <TableCell><span className="text-xs text-muted-foreground">{t.duration}</span></TableCell>
                        </TableRow>
                      );
                    })}
                    {tabTopics.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">未找到匹配的话题</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
