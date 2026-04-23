import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame, TrendingUp, TrendingDown, Minus, Sparkles, Search, Bell, FileText,
  Settings, ArrowUpRight, ArrowDownRight, Hash, Plane, Layers, Download, ChevronDown, CheckCircle2,
  RefreshCw, X, ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  rankTopics as initialTopics, RANK_SOURCES, formatHeat, refreshSnapshot,
  type RankSource, type RankTopic, type TrendDir, type TopicCategory,
} from "@/lib/socialRankingData";

const TREND_META: Record<TrendDir, { icon: typeof TrendingUp; cls: string; label: string }> = {
  up:   { icon: TrendingUp,   cls: "text-rose-600",     label: "上升" },
  down: { icon: TrendingDown, cls: "text-emerald-600",  label: "下降" },
  flat: { icon: Minus,        cls: "text-muted-foreground", label: "持平" },
  new:  { icon: Sparkles,     cls: "text-amber-600",    label: "新上榜" },
  boom: { icon: Flame,        cls: "text-destructive",  label: "爆" },
};

const CATEGORIES: TopicCategory[] = [
  "明星娱乐","旅游目的地","节假出行","社会民生","美食","酒店住宿","交通出行","户外活动",
];

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

// ─── Per-source ranking column ───
function RankingColumn({
  source, topics, highlightIds, activeSource, onSelectSource, onSelectTopic,
}: {
  source: RankSource;
  topics: RankTopic[];
  highlightIds: Set<string>;
  activeSource: "all" | RankSource;
  onSelectSource: (s: RankSource) => void;
  onSelectTopic: (t: RankTopic) => void;
}) {
  const meta = RANK_SOURCES[source];
  const list = topics.filter(t => t.source === source).sort((a, b) => a.rank - b.rank).slice(0, 10);
  const isActive = activeSource === source;
  return (
    <Card className={`p-0 overflow-hidden transition-all ${isActive ? "ring-2 ring-primary shadow-md" : ""}`}>
      <button
        onClick={() => onSelectSource(source)}
        className={`w-full px-4 py-3 flex items-center justify-between ${meta.cls} hover:opacity-90 transition-opacity`}
        title="点击联动筛选话题列表"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="text-sm font-semibold">{meta.platform} · {meta.board}</span>
        </div>
        <span className="text-[10px] opacity-80 inline-flex items-center gap-1">
          {isActive && <CheckCircle2 className="w-3 h-3" />} TOP 10
        </span>
      </button>
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
  const [view, setView] = useState<"board" | "list">("board");
  const [filterSource, setFilterSource] = useState<"all" | RankSource>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | TopicCategory>("all");
  const [filterTrend, setFilterTrend] = useState<"all" | TrendDir>("all");
  const [travelOnly, setTravelOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"heat_desc" | "rank_asc" | "trend_desc">("heat_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Refresh state (Feature 3) ───
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
      // Highlight only topics that became boom or new this round
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

  // ─── Filtering (list view) ───
  const filtered = useMemo(() => {
    let list = topics;
    if (search) list = list.filter(t => t.title.includes(search) || t.keywords.some(k => k.includes(search)));
    if (filterSource !== "all") list = list.filter(t => t.source === filterSource);
    if (filterCategory !== "all") list = list.filter(t => t.category === filterCategory);
    if (filterTrend !== "all") list = list.filter(t => t.trend === filterTrend);
    if (travelOnly) list = list.filter(t => t.travelRelated);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "heat_desc": return b.heat - a.heat;
        case "rank_asc":  return a.rank - b.rank;
        case "trend_desc":return b.heatTrend - a.heatTrend;
      }
    });
  }, [topics, search, filterSource, filterCategory, filterTrend, travelOnly, sortBy]);

  const heroTopics = useMemo(() => {
    return [...topics]
      .filter(t => t.trend === "boom" || t.trend === "new" || (t.prevRank !== undefined && t.prevRank - t.rank >= 2))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 4);
  }, [topics]);

  const stats = useMemo(() => ({
    total: topics.length,
    travel: topics.filter(t => t.travelRelated).length,
    newToday: topics.filter(t => t.trend === "new").length,
    boom: topics.filter(t => t.trend === "boom").length,
  }), [topics]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ─── Feature 4: Click a board column to drive table filter ───
  const handleSelectSource = (s: RankSource) => {
    setFilterSource(prev => prev === s ? "all" : s); // toggle
    setView("list");
    toast.info(`已联动筛选: ${RANK_SOURCES[s].shortLabel}（旅游/趋势 等其他筛选已保留）`);
  };

  // ─── Feature 1: navigate to topic detail ───
  const goDetail = (t: RankTopic) => navigate(`/social-ranking/topic/${t.id}`);

  // ─── Feature 2: bulk report ───
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

  const activeFilterCount =
    (filterSource !== "all" ? 1 : 0) +
    (filterCategory !== "all" ? 1 : 0) +
    (filterTrend !== "all" ? 1 : 0) +
    (travelOnly ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">社媒榜单</h1>
          <p className="text-xs text-muted-foreground mt-1">
            实时聚合 <span className="text-slate-700 font-medium">抖音</span>、
            <span className="text-rose-600 font-medium">微博</span>、
            <span className="text-pink-600 font-medium">小红书</span> 实时与旅游榜单话题
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {/* Feature 3: refresh + last update */}
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

      {/* ─── At-a-glance: 热门话题速览 ─── */}
      <Card className="p-4 bg-gradient-to-br from-rose-50/60 via-orange-50/40 to-amber-50/40 border-rose-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-foreground">当前最热话题</h3>
            <span className="text-[11px] text-muted-foreground">· 跨平台爆点 / 新上榜 / 快速攀升</span>
          </div>
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />最近刷新 {fmtTime(lastUpdated)}
          </span>
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
                      <Plane className="w-2.5 h-2.5" />旅游相关
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">在榜话题</div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-[11px] text-muted-foreground mt-1">5 个榜单源</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">旅游业务相关</div>
          <div className="text-2xl font-bold text-primary">{stats.travel}</div>
          <div className="text-[11px] text-muted-foreground mt-1">占比 {Math.round(stats.travel / stats.total * 100)}%</div>
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

      {/* View tabs */}
      <Tabs value={view} onValueChange={v => setView(v as "board" | "list")}>
        <TabsList>
          <TabsTrigger value="board" className="gap-1.5"><Layers className="w-3.5 h-3.5" />榜单看板</TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <Hash className="w-3.5 h-3.5" />话题列表
            <span className="ml-1 text-[11px] opacity-70">({filtered.length}/{topics.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ───── Board view ───── */}
        <TabsContent value="board" className="mt-4 space-y-2">
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            提示:点击榜单标题可联动筛选下方话题列表;点击具体话题进入详情。
          </div>
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(RANK_SOURCES) as RankSource[]).map(src => (
              <RankingColumn
                key={src}
                source={src}
                topics={topics}
                highlightIds={highlightIds}
                activeSource={filterSource}
                onSelectSource={handleSelectSource}
                onSelectTopic={goDetail}
              />
            ))}
          </div>
        </TabsContent>

        {/* ───── List view ───── */}
        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Active filter chips (Feature 4 visibility) */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-muted-foreground">已应用筛选:</span>
              {filterSource !== "all" && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterSource("all")}>
                  来源: {RANK_SOURCES[filterSource].shortLabel} <X className="w-3 h-3" />
                </Badge>
              )}
              {filterCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterCategory("all")}>
                  分类: {filterCategory} <X className="w-3 h-3" />
                </Badge>
              )}
              {filterTrend !== "all" && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterTrend("all")}>
                  趋势: {TREND_META[filterTrend].label} <X className="w-3 h-3" />
                </Badge>
              )}
              {travelOnly && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTravelOnly(false)}>
                  仅旅游相关 <X className="w-3 h-3" />
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSearch("")}>
                  关键词: {search} <X className="w-3 h-3" />
                </Badge>
              )}
              <button className="text-primary hover:underline ml-1" onClick={() => {
                setFilterSource("all"); setFilterCategory("all"); setFilterTrend("all"); setTravelOnly(false); setSearch("");
              }}>清空全部</button>
            </div>
          )}

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">榜单来源</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value as typeof filterSource)}
                >
                  <option value="all">全部</option>
                  {(Object.keys(RANK_SOURCES) as RankSource[]).map(s => (
                    <option key={s} value={s}>{RANK_SOURCES[s].shortLabel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">话题分类</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as typeof filterCategory)}
                >
                  <option value="all">全部</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">趋势</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={filterTrend}
                  onChange={e => setFilterTrend(e.target.value as typeof filterTrend)}
                >
                  <option value="all">全部</option>
                  <option value="boom">爆</option>
                  <option value="new">新上榜</option>
                  <option value="up">上升</option>
                  <option value="down">下降</option>
                  <option value="flat">持平</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">业务相关</label>
                <div className="mt-1 flex items-center gap-2 px-2 py-1.5 text-xs border border-border rounded-md bg-card">
                  <input type="checkbox" checked={travelOnly} onChange={e => setTravelOnly(e.target.checked)} className="rounded" />
                  <span className="text-foreground">仅看旅游相关</span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">搜索话题</label>
                <div className="relative mt-1">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="搜索话题 / 关键词..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
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
                    onChange={e => setSelectedIds(e.target.checked ? filtered.map(x => x.id) : [])}
                  />
                  <span>全选</span>
                </label>
                {selectedIds.length > 0 && (
                  <>
                    <span className="text-primary font-medium">已选 {selectedIds.length} 个话题</span>
                    <Button size="sm" variant="default" className="h-6 text-[11px] gap-1" onClick={() => goReport(selectedIds)}>
                      <FileText className="w-3 h-3" /> 一键生成报告
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setSelectedIds([])}>
                      取消选择
                    </Button>
                  </>
                )}
                <span className="ml-2">共 {filtered.length} 个话题</span>
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground"
              >
                <option value="heat_desc">热度降序</option>
                <option value="rank_asc">榜单排名升序</option>
                <option value="trend_desc">热度涨幅降序</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-16">排名</TableHead>
                  <TableHead>话题</TableHead>
                  <TableHead className="w-28">来源</TableHead>
                  <TableHead className="w-24">分类</TableHead>
                  <TableHead className="w-24 text-right">热度</TableHead>
                  <TableHead className="w-20 text-right">涨幅</TableHead>
                  <TableHead className="w-20">趋势</TableHead>
                  <TableHead className="w-24">在榜时长</TableHead>
                  <TableHead className="w-24">跨榜分布</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => {
                  const meta = RANK_SOURCES[t.source];
                  const TIcon = TREND_META[t.trend].icon;
                  const highlight = highlightIds.has(t.id);
                  return (
                    <TableRow
                      key={t.id}
                      className={`hover:bg-muted/30 cursor-pointer ${highlight ? "bg-amber-50/60" : ""}`}
                      onClick={() => goDetail(t)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {t.keywords.slice(0, 3).map(k => (
                            <span key={k} className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground">#{k}</span>
                          ))}
                          {t.travelRelated && (
                            <Badge variant="outline" className="text-[10px] gap-0.5 bg-primary/5 text-primary border-primary/20 h-4 px-1">
                              <Plane className="w-2.5 h-2.5" />旅游
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.shortLabel}</Badge></TableCell>
                      <TableCell><span className="text-xs text-foreground">{t.category}</span></TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {t.crossSources.map(s => (
                            <span key={s} title={RANK_SOURCES[s].shortLabel} className={`w-2 h-2 rounded-full ${RANK_SOURCES[s].dot}`} />
                          ))}
                          <span className="ml-1 text-[10px] text-muted-foreground">{t.crossSources.length}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                      未找到匹配的话题,请调整筛选条件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
