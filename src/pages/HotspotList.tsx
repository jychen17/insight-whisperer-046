import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, MapPin, Calendar, Flame, TrendingUp, Music2, Palette,
  Sparkles, ExternalLink, Bell, FileText, ArrowUpRight, Ticket, BookOpen, Hash,
  ChevronDown, ChevronUp, Download, Settings, CheckCircle2, Globe, Eye, Tag, Layers,
} from "lucide-react";
import StatCard from "@/components/StatCard";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
type SourceKind = "damai" | "bendibao" | "ranking";
type Category = "演唱会" | "音乐节" | "展览" | "市集" | "节庆" | "亲子" | "线上热议";
type Importance = "high" | "medium" | "low";

interface RawSource {
  kind: SourceKind;
  label: string;
  url?: string;
  extra?: string;
}

interface HotspotEvent {
  id: string;
  title: string;
  category: Category;
  city: string;
  venue?: string;
  date: string;
  dateRange?: string;
  heatScore: number;
  heatTrend: number;
  relatedVolume: { weibo: number; xhs: number; douyin: number };
  sentiment: { pos: number; neu: number; neg: number };
  businessRelevance: 1 | 2 | 3 | 4 | 5;
  sources: RawSource[];
  description: string;
  isNew?: boolean;
  crossSource: number;
  importance: Importance;
  firstTime: string;
  latestTime: string;
  itemCount: number; // 关联文章/线索数
}

// ────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────
const mockEvents: HotspotEvent[] = [
  {
    id: "h1", title: "周杰伦嘉年华世界巡回演唱会·上海站",
    category: "演唱会", city: "上海", venue: "上海体育场",
    date: "2026-04-18", dateRange: "2026-04-18 ~ 04-20",
    heatScore: 98700, heatTrend: 245,
    relatedVolume: { weibo: 12300, xhs: 4500, douyin: 8900 },
    sentiment: { pos: 82, neu: 12, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥455-2015" },
      { kind: "bendibao", label: "上海本地宝", extra: "周边交通指引" },
      { kind: "ranking", label: "微博热搜 #3", extra: "热度 98.7w" },
    ],
    description: "周杰伦嘉年华世界巡演上海三场连开，预计带动周边酒店、餐饮、出行需求显著增长，建议同程酒旅前置铺货。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-08 09:12", latestTime: "2026-04-15 22:45", itemCount: 248,
  },
  {
    id: "h2", title: "草莓音乐节·成都站",
    category: "音乐节", city: "成都", venue: "东安湖体育公园",
    date: "2026-05-01", dateRange: "2026-05-01 ~ 05-03",
    heatScore: 67500, heatTrend: 132,
    relatedVolume: { weibo: 8900, xhs: 6700, douyin: 5400 },
    sentiment: { pos: 76, neu: 18, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "三日通票 ¥980" },
      { kind: "bendibao", label: "成都本地宝", extra: "五一活动汇总" },
      { kind: "ranking", label: "抖音热点 #8", extra: "话题 670w 播放" },
    ],
    description: "五一假期成都草莓音乐节，叠加假期出行高峰，机酒搜索预计暴涨。",
    crossSource: 3, isNew: true, importance: "high",
    firstTime: "2026-04-10 14:20", latestTime: "2026-04-15 21:30", itemCount: 189,
  },
  {
    id: "h3", title: "teamLab 无界美术馆·上海特展",
    category: "展览", city: "上海", venue: "黄浦滨江",
    date: "2026-04-15", dateRange: "2026-04-15 ~ 06-30",
    heatScore: 45200, heatTrend: 68,
    relatedVolume: { weibo: 3200, xhs: 18900, douyin: 6700 },
    sentiment: { pos: 88, neu: 10, neg: 2 },
    businessRelevance: 4,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略 · 门票 ¥199" },
      { kind: "ranking", label: "小红书热搜 #12", extra: "笔记 1.8w 篇" },
    ],
    description: "小红书种草型展览，亲子+情侣双客群，长期持续热度，适合做城市目的地内容营销。",
    crossSource: 2, importance: "medium",
    firstTime: "2026-04-05 10:00", latestTime: "2026-04-15 19:50", itemCount: 142,
  },
  {
    id: "h4", title: "五一返程高峰·机票退改话题",
    category: "线上热议", city: "全国",
    date: "2026-05-05",
    heatScore: 89400, heatTrend: 412,
    relatedVolume: { weibo: 23400, xhs: 2100, douyin: 11200 },
    sentiment: { pos: 12, neu: 28, neg: 60 },
    businessRelevance: 5,
    sources: [
      { kind: "ranking", label: "微博热搜 #5", extra: "热度 89w" },
      { kind: "ranking", label: "抖音热点 #14", extra: "话题 1100w 播放" },
    ],
    description: "返程高峰叠加天气因素，退改签投诉量陡增，建议客服团队提前扩容并准备话术。",
    crossSource: 1, isNew: true, importance: "high",
    firstTime: "2026-04-12 08:00", latestTime: "2026-04-15 23:10", itemCount: 312,
  },
  {
    id: "h5", title: "上海咖啡文化周",
    category: "市集", city: "上海", venue: "新天地、武康路等多处",
    date: "2026-04-20", dateRange: "2026-04-20 ~ 04-28",
    heatScore: 28900, heatTrend: 45,
    relatedVolume: { weibo: 1200, xhs: 12400, douyin: 3400 },
    sentiment: { pos: 91, neu: 8, neg: 1 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略" },
      { kind: "ranking", label: "小红书热搜 #28", extra: "笔记 1.2w" },
    ],
    description: "城市生活方式类活动，可作为目的地周边内容素材。",
    crossSource: 2, importance: "low",
    firstTime: "2026-04-09 11:30", latestTime: "2026-04-15 18:20", itemCount: 87,
  },
  {
    id: "h6", title: "薛之谦天外来物巡演·北京站",
    category: "演唱会", city: "北京", venue: "国家体育场",
    date: "2026-04-25", dateRange: "2026-04-25 ~ 04-26",
    heatScore: 76800, heatTrend: 178,
    relatedVolume: { weibo: 9800, xhs: 5200, douyin: 7100 },
    sentiment: { pos: 78, neu: 15, neg: 7 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥380-1880" },
      { kind: "bendibao", label: "北京本地宝", extra: "鸟巢交通指引" },
      { kind: "ranking", label: "微博热搜 #11", extra: "热度 76w" },
    ],
    description: "鸟巢双场演唱会，京津冀客流为主，关注高铁+酒店组合包销售。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-07 09:00", latestTime: "2026-04-15 22:00", itemCount: 198,
  },
  {
    id: "h7", title: "广州春季亲子游园会",
    category: "亲子", city: "广州", venue: "天河区多个商圈",
    date: "2026-04-22", dateRange: "2026-04-22 ~ 04-24",
    heatScore: 18600, heatTrend: 22,
    relatedVolume: { weibo: 800, xhs: 4200, douyin: 2100 },
    sentiment: { pos: 86, neu: 12, neg: 2 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "广州本地宝", extra: "活动攻略" },
    ],
    description: "本地亲子客群活动，适合作为粤港澳片区目的地内容补充。",
    crossSource: 1, importance: "low",
    firstTime: "2026-04-11 16:00", latestTime: "2026-04-15 17:40", itemCount: 56,
  },
  {
    id: "h8", title: "成都国际车展",
    category: "展览", city: "成都", venue: "西博城",
    date: "2026-04-28", dateRange: "2026-04-28 ~ 05-05",
    heatScore: 52300, heatTrend: 89,
    relatedVolume: { weibo: 6700, xhs: 2300, douyin: 8400 },
    sentiment: { pos: 71, neu: 22, neg: 7 },
    businessRelevance: 4,
    sources: [
      { kind: "bendibao", label: "成都本地宝", extra: "展会攻略" },
      { kind: "ranking", label: "抖音热点 #22", extra: "话题 840w 播放" },
    ],
    description: "西部最大车展，跨城观展客流多，叠加五一长假，机酒需求集中。",
    crossSource: 2, isNew: true, importance: "medium",
    firstTime: "2026-04-08 13:15", latestTime: "2026-04-15 20:30", itemCount: 124,
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
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

const ALL_PLATFORMS = ["全部", "大麦网", "本地宝", "微博热搜", "抖音热点", "小红书热搜"];
const ALL_CITIES = ["上海", "北京", "成都", "广州", "全国"];

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
  const [hotspotView, setHotspotView] = useState<"events" | "city" | "category" | "raw">("events");
  const [detailEvent, setDetailEvent] = useState<HotspotEvent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // filters
  const [filterImportance, setFilterImportance] = useState<"all" | Importance>("all");
  const [filterCity, setFilterCity] = useState("全部");
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [filterSource, setFilterSource] = useState<"all" | SourceKind>("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"heat_desc" | "date_asc" | "trend_desc" | "biz_desc">("heat_desc");

  const filtered = useMemo(() => {
    let list = mockEvents;
    if (searchQuery) list = list.filter(e => e.title.includes(searchQuery) || e.city.includes(searchQuery));
    if (filterImportance !== "all") list = list.filter(e => e.importance === filterImportance);
    if (filterCity !== "全部") list = list.filter(e => e.city === filterCity);
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
  }, [searchQuery, filterImportance, filterCity, filterCategory, filterSource, filterDateStart, filterDateEnd, sortBy]);

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

      {/* ───── Stat cards ───── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="未来7天热点活动" value={stats.upcoming} change={18.5} />
        <StatCard title="今日新增热点" value={stats.newToday} change={45.2} />
        <StatCard title="业务高相关热点" value={stats.highBiz} change={22.8} />
        <StatCard title="跨源大热点" value={stats.cross} change={32.1} />
      </div>

      {/* ───── Sub-view toggle ───── */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {[
            { v: "events", label: "事件列表", icon: Flame },
            { v: "city", label: "城市视图", icon: MapPin },
            { v: "category", label: "品类视图", icon: Tag },
            { v: "raw", label: "原始榜单", icon: TrendingUp },
          ].map((t, i) => {
            const Icon = t.icon;
            const active = hotspotView === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setHotspotView(t.v as typeof hotspotView)}
                className={`px-4 py-1.5 font-medium inline-flex items-center gap-1.5 ${i > 0 ? "border-l border-border" : ""} ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
                {t.v === "events" && <span className="ml-1">({mockEvents.length})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== EVENTS LIST VIEW ========== */}
      {hotspotView === "events" && (
        <div className="space-y-4">
          {/* Filters card */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">热点等级</label>
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
                <label className="text-xs text-muted-foreground">城市</label>
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
                <label className="text-xs text-muted-foreground">活动品类</label>
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
                            onClick={(e) => { e.stopPropagation(); setDetailEvent(event); }}
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
        </div>
      )}

      {/* ========== CITY VIEW ========== */}
      {hotspotView === "city" && <CityView events={filtered} onSelect={setDetailEvent} />}

      {/* ========== CATEGORY VIEW ========== */}
      {hotspotView === "category" && <CategoryView events={filtered} onSelect={setDetailEvent} />}

      {/* ========== RAW RANKINGS ========== */}
      {hotspotView === "raw" && <RawRankings />}

      {/* Detail sheet */}
      <Sheet open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {detailEvent && <EventDetailPanel event={detailEvent} onReport={() => goReport([detailEvent.id])} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// City View
// ────────────────────────────────────────────────────────────
function CityView({ events, onSelect }: { events: HotspotEvent[]; onSelect: (e: HotspotEvent) => void }) {
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
function CategoryView({ events, onSelect }: { events: HotspotEvent[]; onSelect: (e: HotspotEvent) => void }) {
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

// ────────────────────────────────────────────────────────────
// Raw Rankings
// ────────────────────────────────────────────────────────────
function RawRankings() {
  const lists = [
    {
      platform: "微博热搜", color: "text-orange-600",
      items: [
        { rank: 1, title: "清明假期出行人数创新高", heat: "125w" },
        { rank: 3, title: "周杰伦上海演唱会开票秒空", heat: "98w" },
        { rank: 5, title: "五一返程机票退改话题", heat: "89w" },
        { rank: 11, title: "薛之谦鸟巢演唱会预热", heat: "76w" },
        { rank: 18, title: "成都草莓音乐节阵容公布", heat: "54w" },
      ],
    },
    {
      platform: "抖音热点", color: "text-rose-600",
      items: [
        { rank: 8, title: "成都草莓音乐节预热", heat: "670w播放" },
        { rank: 14, title: "五一返程攻略", heat: "1100w播放" },
        { rank: 22, title: "成都国际车展", heat: "840w播放" },
        { rank: 31, title: "周杰伦演唱会场外直击", heat: "520w播放" },
      ],
    },
    {
      platform: "小红书热搜", color: "text-pink-600",
      items: [
        { rank: 12, title: "teamLab 上海特展打卡", heat: "1.8w笔记" },
        { rank: 28, title: "上海咖啡文化周", heat: "1.2w笔记" },
        { rank: 41, title: "广州亲子游园会", heat: "4200笔记" },
        { rank: 56, title: "成都春季展览推荐", heat: "2300笔记" },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {lists.map(l => (
        <Card key={l.platform} className="p-4">
          <h3 className={`text-sm font-semibold mb-3 ${l.color}`}>{l.platform}</h3>
          <div className="space-y-0">
            {l.items.map(item => (
              <div key={item.rank} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  item.rank <= 3 ? "bg-rose-500 text-white" : item.rank <= 10 ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                }`}>{item.rank}</span>
                <span className="text-xs text-foreground flex-1 hover:text-primary cursor-pointer">{item.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.heat}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Detail Panel
// ────────────────────────────────────────────────────────────
function EventDetailPanel({ event, onReport }: { event: HotspotEvent; onReport: () => void }) {
  const Cat = CATEGORY_META[event.category];
  const CatIcon = Cat.icon;
  const totalVol = event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin;

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`text-[11px] gap-1 ${Cat.cls}`}>
            <CatIcon className="w-3 h-3" /> {event.category}
          </Badge>
          <Badge variant="outline" className="text-[11px] gap-1">
            <MapPin className="w-3 h-3" /> {event.city}
          </Badge>
          {importanceBadgeMap[event.importance]}
        </div>
        <SheetTitle className="text-lg">{event.title}</SheetTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.dateRange ?? event.date}</span>
          {event.venue && <span>📍 {event.venue}</span>}
        </div>
      </SheetHeader>

      <div className="space-y-5 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
            <div className="text-[11px] text-muted-foreground mb-1">综合热度</div>
            <div className="text-lg font-bold text-rose-600 flex items-center gap-1"><Flame className="w-4 h-4" />{formatHeat(event.heatScore)}</div>
            <div className="text-[10px] text-emerald-600">↑ {event.heatTrend}%</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="text-[11px] text-muted-foreground mb-1">关联讨论</div>
            <div className="text-lg font-bold text-blue-600">{formatHeat(totalVol)}</div>
            <div className="text-[10px] text-muted-foreground">3 个平台</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-[11px] text-muted-foreground mb-1">业务相关</div>
            <div className="text-lg text-amber-600">{"⭐".repeat(event.businessRelevance)}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
          <div className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI 洞察摘要
          </div>
          <p className="text-xs text-foreground leading-relaxed">{event.description}</p>
        </div>

        <div>
          <div className="text-xs font-semibold text-foreground mb-2">数据来源（{event.sources.length}）</div>
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

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1">
            <Bell className="w-3.5 h-3.5" /> 加入预警
          </Button>
          <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={onReport}>
            <FileText className="w-3.5 h-3.5" /> 生成报告
          </Button>
        </div>
      </div>
    </>
  );
}
