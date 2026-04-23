import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame, TrendingUp, TrendingDown, Minus, Sparkles, Bell, FileText,
  Settings, ArrowUpRight, ArrowDownRight, Plane, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  rankTopics as initialTopics, RANK_SOURCES, BOARD_CATEGORIES, formatHeat, refreshSnapshot,
  type RankSource, type RankTopic, type TrendDir, type BoardCategory,
} from "@/lib/socialRankingData";

const TREND_META: Record<TrendDir, { icon: typeof TrendingUp; cls: string; label: string }> = {
  up:   { icon: TrendingUp,   cls: "text-rose-600",         label: "上升" },
  down: { icon: TrendingDown, cls: "text-emerald-600",      label: "下降" },
  flat: { icon: Minus,        cls: "text-muted-foreground", label: "持平" },
  new:  { icon: Sparkles,     cls: "text-amber-600",        label: "新上榜" },
  boom: { icon: Flame,        cls: "text-destructive",      label: "爆" },
};

const fmtTime = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4"];

// Mocked 7-day topic in/out trend by category
const trendData = [
  { date: "04-09", 实时榜: 320, 旅游榜: 210, 同城榜: 180, 景点榜: 95, 酒店榜: 60 },
  { date: "04-10", 实时榜: 360, 旅游榜: 240, 同城榜: 200, 景点榜: 100, 酒店榜: 65 },
  { date: "04-11", 实时榜: 410, 旅游榜: 280, 同城榜: 230, 景点榜: 120, 酒店榜: 72 },
  { date: "04-12", 实时榜: 380, 旅游榜: 260, 同城榜: 210, 景点榜: 110, 酒店榜: 70 },
  { date: "04-13", 实时榜: 450, 旅游榜: 310, 同城榜: 250, 景点榜: 130, 酒店榜: 80 },
  { date: "04-14", 实时榜: 520, 旅游榜: 350, 同城榜: 280, 景点榜: 145, 酒店榜: 88 },
  { date: "04-15", 实时榜: 610, 旅游榜: 410, 同城榜: 320, 景点榜: 160, 酒店榜: 95 },
];

export default function SocialRankingDashboard() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<RankTopic[]>(initialTopics);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(2026, 3, 15, 22, 0, 0));
  const [refreshing, setRefreshing] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeCategory, setActiveCategory] = useState<BoardCategory>("realtime");

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
      toast.success("数据已更新");
      setRefreshing(false);
    }, 600);
  };
  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);

  // ─── Per-category stats
  const categoryStats = useMemo(() => BOARD_CATEGORIES.map(c => {
    const list = topics.filter(t => RANK_SOURCES[t.source].category === c.key);
    return {
      key: c.key,
      label: c.label,
      icon: c.icon,
      total: list.length,
      travel: list.filter(t => t.travelRelated).length,
      newToday: list.filter(t => t.trend === "new").length,
      boom: list.filter(t => t.trend === "boom").length,
    };
  }), [topics]);

  const overall = useMemo(() => ({
    total: topics.length,
    travel: topics.filter(t => t.travelRelated).length,
    newToday: topics.filter(t => t.trend === "new").length,
    boom: topics.filter(t => t.trend === "boom").length,
    sources: Object.keys(RANK_SOURCES).length,
  }), [topics]);

  // Hero topics for current category
  const heroTopics = useMemo(() => {
    const cat = topics.filter(t => RANK_SOURCES[t.source].category === activeCategory);
    return [...cat]
      .filter(t => t.trend === "boom" || t.trend === "new" || (t.prevRank !== undefined && t.prevRank - t.rank >= 2))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 4);
  }, [topics, activeCategory]);

  // Distribution: source share
  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    topics.forEach(t => {
      const m = RANK_SOURCES[t.source];
      map.set(m.shortLabel, (map.get(m.shortLabel) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [topics]);

  // Travel vs non-travel
  const travelData = useMemo(() => [
    { name: "旅游相关", value: topics.filter(t => t.travelRelated).length },
    { name: "非旅游",   value: topics.filter(t => !t.travelRelated).length },
  ], [topics]);

  // Top 10 cross-platform topics by heat
  const topHeat = useMemo(
    () => [...topics].sort((a, b) => b.heat - a.heat).slice(0, 10),
    [topics]
  );

  const goDetail = (t: RankTopic) => navigate(`/social-ranking/topic/${t.id}`);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">社媒榜单大盘</h1>
          <p className="text-xs text-muted-foreground mt-1">
            聚合 <span className="text-slate-700 font-medium">抖音</span>、
            <span className="text-rose-600 font-medium">微博</span>、
            <span className="text-pink-600 font-medium">小红书</span>、
            <span className="text-blue-600 font-medium">百度</span>、
            <span className="text-orange-600 font-medium">快手</span> 多平台榜单 · 实时刷新与跨平台聚合
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
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => navigate("/sentiment/event-alert?themeId=social-ranking")}
          >
            <Bell className="w-3 h-3" />预警设置
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"
            onClick={() => navigate("/analysis/report-manage")}
          >
            <FileText className="w-3 h-3" />报告设置
          </button>
          <button
            className="px-3 py-1.5 border border-border rounded-md bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1"
            onClick={() => navigate("/datacenter/themes/manage")}
          >
            <Settings className="w-3 h-3" />主题配置
          </button>
        </div>
      </div>

      {/* Overall Stat Cards */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">在榜话题总量</div>
          <div className="text-2xl font-bold text-foreground">{overall.total}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{overall.sources} 个榜单源</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">旅游业务相关</div>
          <div className="text-2xl font-bold text-primary">{overall.travel}</div>
          <div className="text-[11px] text-muted-foreground mt-1">占比 {overall.total ? Math.round(overall.travel / overall.total * 100) : 0}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">新上榜话题</div>
          <div className="text-2xl font-bold text-amber-600">{overall.newToday}</div>
          <div className="text-[11px] text-muted-foreground mt-1">今日新增</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">爆点话题</div>
          <div className="text-2xl font-bold text-destructive">{overall.boom}</div>
          <div className="text-[11px] text-muted-foreground mt-1">热度激增 ≥ 200%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">跨平台话题</div>
          <div className="text-2xl font-bold text-violet-600">
            {topics.filter(t => t.crossSources.length >= 2).length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">同时上榜 ≥ 2 个来源</div>
        </Card>
      </div>

      {/* Per-category stats grid */}
      <div className="grid grid-cols-5 gap-3">
        {categoryStats.map(s => (
          <Card key={s.key} className="p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/social-ranking/list?cat=${s.key}`)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                <span>{s.icon}</span>{s.label}
              </span>
              <Badge variant="outline" className="text-[10px]">{s.total}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-muted-foreground">旅游</div>
                <div className="text-sm font-semibold text-primary">{s.travel}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">新上榜</div>
                <div className="text-sm font-semibold text-amber-600">{s.newToday}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">爆点</div>
                <div className="text-sm font-semibold text-destructive">{s.boom}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Hero topics by category */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-foreground">当前最热话题</h3>
            <span className="text-[11px] text-muted-foreground">· 跨平台爆点 / 新上榜 / 快速攀升</span>
          </div>
        </div>
        <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as BoardCategory)}>
          <TabsList className="h-auto p-1 flex-wrap">
            {BOARD_CATEGORIES.map(c => (
              <TabsTrigger key={c.key} value={c.key} className="gap-1.5">
                <span>{c.icon}</span><span>{c.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeCategory} className="mt-3">
            {heroTopics.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">该分类暂无爆点 / 新上榜话题</div>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Trend Chart */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">近 7 日各榜单话题数趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="实时榜" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="旅游榜" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="同城榜" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="景点榜" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="酒店榜" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">榜单源话题数分布</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={240}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-1.5 text-xs">
              {sourceData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                  <span className="text-foreground font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Travel vs non-travel */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">旅游业务相关分布</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={travelData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                  <Cell fill="#7c3aed" />
                  <Cell fill="#cbd5e1" />
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {travelData.map((d, i) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: i === 0 ? "#7c3aed" : "#cbd5e1" }} />
                      {d.name}
                    </span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top 10 cross-platform heat */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">跨平台热度 TOP 10</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topHeat.map(t => ({ name: t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title, 热度: Math.round(t.heat / 1000) }))} layout="vertical" margin={{ left: 90 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" width={90} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v}k`, "热度"]} />
              <Bar dataKey="热度" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
