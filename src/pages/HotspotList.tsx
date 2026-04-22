import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Search, MapPin, Calendar, Flame, TrendingUp, Music2, Palette,
  Sparkles, Tag, ExternalLink, Bell, FileText, ArrowUpRight, Ticket, BookOpen, Hash,
} from "lucide-react";
import StatCard from "@/components/StatCard";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
type SourceKind = "damai" | "bendibao" | "ranking";
type Category = "演唱会" | "音乐节" | "展览" | "市集" | "节庆" | "亲子" | "线上热议";

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
  date: string; // unified_date
  dateRange?: string;
  heatScore: number; // 0-100k
  heatTrend: number; // % change
  relatedVolume: { weibo: number; xhs: number; douyin: number };
  sentiment: { pos: number; neu: number; neg: number };
  businessRelevance: 1 | 2 | 3 | 4 | 5;
  sources: RawSource[];
  cover?: string;
  description: string;
  isNew?: boolean;
  crossSource: number; // count of source kinds covered
}

// ────────────────────────────────────────────────────────────
// Mock data (cross-source merged hotspots)
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
    crossSource: 3,
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
    crossSource: 3, isNew: true,
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
    crossSource: 2,
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
    crossSource: 1, isNew: true,
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
    crossSource: 2,
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
    crossSource: 3,
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
    crossSource: 1,
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
    crossSource: 2, isNew: true,
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

const formatHeat = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function HotspotList() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [catFilter, setCatFilter] = useState<"all" | Category>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceKind>("all");
  const [dateFilter, setDateFilter] = useState("7");
  const [view, setView] = useState("event");
  const [detailEvent, setDetailEvent] = useState<HotspotEvent | null>(null);

  const cities = useMemo(() => Array.from(new Set(mockEvents.map(e => e.city))), []);

  const filtered = useMemo(() => mockEvents.filter(e => {
    if (search && !e.title.includes(search) && !e.city.includes(search)) return false;
    if (cityFilter !== "all" && e.city !== cityFilter) return false;
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (sourceFilter !== "all" && !e.sources.some(s => s.kind === sourceFilter)) return false;
    return true;
  }), [search, cityFilter, catFilter, sourceFilter]);

  const stats = useMemo(() => ({
    upcoming: mockEvents.filter(e => new Date(e.date) >= new Date("2026-04-15")).length,
    newToday: mockEvents.filter(e => e.isNew).length,
    highBiz: mockEvents.filter(e => e.businessRelevance >= 4).length,
    cross: mockEvents.filter(e => e.crossSource >= 2).length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">热点洞察列表</h1>
          <p className="text-xs text-muted-foreground mt-1">
            融合 <span className="text-rose-600 font-medium">大麦演出日历</span>、
            <span className="text-blue-600 font-medium">本地宝活动攻略</span>、
            <span className="text-orange-600 font-medium">社媒实时热榜</span> 的跨源热点事件
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Bell className="w-3.5 h-3.5" /> 添加预警
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1">
            <FileText className="w-3.5 h-3.5" /> 生成报告
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="未来7天热点活动" value={stats.upcoming} change={18.5} />
        <StatCard title="今日新增热点" value={stats.newToday} change={45.2} />
        <StatCard title="业务高相关热点" value={stats.highBiz} change={22.8} />
        <StatCard title="跨源大热点" value={stats.cross} change={32.1} />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索事件 / 城市"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">未来3天</SelectItem>
              <SelectItem value="7">未来7天</SelectItem>
              <SelectItem value="14">未来14天</SelectItem>
              <SelectItem value="30">未来30天</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="全部城市" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部城市</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={(v) => setCatFilter(v as typeof catFilter)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部品类</SelectItem>
              {(Object.keys(CATEGORY_META) as Category[]).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部数据源</SelectItem>
              <SelectItem value="damai">大麦演出</SelectItem>
              <SelectItem value="bendibao">本地宝</SelectItem>
              <SelectItem value="ranking">社媒热榜</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">共 {filtered.length} 个热点</span>
        </div>
      </Card>

      {/* View tabs */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="event" className="text-xs gap-1.5"><Flame className="w-3.5 h-3.5" />事件视图</TabsTrigger>
          <TabsTrigger value="city" className="text-xs gap-1.5"><MapPin className="w-3.5 h-3.5" />城市视图</TabsTrigger>
          <TabsTrigger value="category" className="text-xs gap-1.5"><Tag className="w-3.5 h-3.5" />品类视图</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs gap-1.5"><TrendingUp className="w-3.5 h-3.5" />原始榜单</TabsTrigger>
        </TabsList>

        {/* EVENT VIEW: card grid */}
        <TabsContent value="event" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(e => <EventCard key={e.id} event={e} onClick={() => setDetailEvent(e)} />)}
          </div>
        </TabsContent>

        {/* CITY VIEW */}
        <TabsContent value="city" className="mt-4">
          <CityView events={filtered} onSelect={setDetailEvent} />
        </TabsContent>

        {/* CATEGORY VIEW */}
        <TabsContent value="category" className="mt-4">
          <CategoryView events={filtered} onSelect={setDetailEvent} />
        </TabsContent>

        {/* RAW RANKINGS */}
        <TabsContent value="raw" className="mt-4">
          <RawRankings />
        </TabsContent>
      </Tabs>

      {/* Detail sheet */}
      <Sheet open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {detailEvent && <EventDetailPanel event={detailEvent} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Event Card
// ────────────────────────────────────────────────────────────
function EventCard({ event, onClick }: { event: HotspotEvent; onClick: () => void }) {
  const Cat = CATEGORY_META[event.category];
  const CatIcon = Cat.icon;
  const totalVol = event.relatedVolume.weibo + event.relatedVolume.xhs + event.relatedVolume.douyin;

  return (
    <Card onClick={onClick} className="p-5 hover:shadow-lg transition-shadow cursor-pointer group">
      {/* Top row: heat + date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-orange-500/10 to-rose-500/10">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-sm font-bold text-rose-600">{formatHeat(event.heatScore)}</span>
          </div>
          {event.heatTrend > 0 && (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> {event.heatTrend}%
            </span>
          )}
          {event.isNew && <Badge className="h-4 text-[10px] px-1.5 bg-rose-500">NEW</Badge>}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {event.dateRange ?? event.date}
        </div>
      </div>

      {/* Title + category */}
      <div className="flex items-start gap-2 mb-2">
        <Badge variant="outline" className={`shrink-0 text-[11px] gap-1 ${Cat.cls}`}>
          <CatIcon className="w-3 h-3" /> {event.category}
        </Badge>
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary leading-snug">
          {event.title}
        </h3>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <MapPin className="w-3 h-3" />
        <span>{event.city}</span>
        {event.venue && <span>· {event.venue}</span>}
      </div>

      {/* Related discussion */}
      <div className="bg-muted/30 rounded-md p-2.5 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">关联讨论</span>
          <span className="font-medium text-foreground">{formatHeat(totalVol)}</span>
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span>微博 {formatHeat(event.relatedVolume.weibo)}</span>
          <span>小红书 {formatHeat(event.relatedVolume.xhs)}</span>
          <span>抖音 {formatHeat(event.relatedVolume.douyin)}</span>
        </div>
        {/* Sentiment bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden mt-2">
          <div className="bg-emerald-500" style={{ width: `${event.sentiment.pos}%` }} />
          <div className="bg-slate-300" style={{ width: `${event.sentiment.neu}%` }} />
          <div className="bg-rose-500" style={{ width: `${event.sentiment.neg}%` }} />
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="text-emerald-600">正 {event.sentiment.pos}%</span>
          <span>中 {event.sentiment.neu}%</span>
          <span className="text-rose-600">负 {event.sentiment.neg}%</span>
        </div>
      </div>

      {/* Sources */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {event.sources.map((s, i) => {
            const Meta = SOURCE_META[s.kind];
            const Icon = Meta.icon;
            return (
              <Badge key={i} variant="outline" className={`text-[10px] gap-1 px-1.5 ${Meta.cls}`}>
                <Icon className="w-2.5 h-2.5" /> {s.label}
              </Badge>
            );
          })}
        </div>
        <div className="flex items-center gap-0.5 text-[11px]">
          <span className="text-muted-foreground">业务相关</span>
          <span className="text-amber-500 font-medium">{"⭐".repeat(event.businessRelevance)}</span>
        </div>
      </div>
    </Card>
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
        {catEvents.map(e => <EventCard key={e.id} event={e} onClick={() => onSelect(e)} />)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Raw Rankings (preserve original platform top lists)
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
function EventDetailPanel({ event }: { event: HotspotEvent }) {
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
        </div>
        <SheetTitle className="text-lg">{event.title}</SheetTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.dateRange ?? event.date}</span>
          {event.venue && <span>📍 {event.venue}</span>}
        </div>
      </SheetHeader>

      <div className="space-y-5 mt-5">
        {/* Heat & metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
            <div className="text-[11px] text-muted-foreground mb-1">综合热度</div>
            <div className="text-lg font-bold text-rose-600 flex items-center gap-1">
              <Flame className="w-4 h-4" />{formatHeat(event.heatScore)}
            </div>
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

        {/* AI summary */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
          <div className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI 洞察摘要
          </div>
          <p className="text-xs text-foreground leading-relaxed">{event.description}</p>
        </div>

        {/* Sources */}
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

        {/* Sentiment detail */}
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

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1">
            <Bell className="w-3.5 h-3.5" /> 加入预警
          </Button>
          <Button size="sm" className="flex-1 h-8 text-xs gap-1">
            <FileText className="w-3.5 h-3.5" /> 生成报告
          </Button>
        </div>
      </div>
    </>
  );
}
