import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { MapPin, Tag, TrendingUp, Flame } from "lucide-react";
import { hotspotEvents, type HotspotEvent } from "@/lib/hotspotData";
import { CityView, CategoryView } from "@/components/hotspot/HotspotViews";

const listStats = {
  upcoming: hotspotEvents.filter(e => new Date(e.date) >= new Date("2026-04-15")).length,
  exam: hotspotEvents.filter(e => e.category === "考试").length,
  concert: hotspotEvents.filter(e => e.category === "演唱会").length,
  expo: hotspotEvents.filter(e => e.category === "展会").length,
  match: hotspotEvents.filter(e => e.category === "演出赛事").length,
  holiday: hotspotEvents.filter(e => e.category === "节假日").length,
  activity: hotspotEvents.filter(e => e.category === "活动").length,
  highHeat: hotspotEvents.filter(e => e.heatLevel === "高").length,
  newToday: hotspotEvents.filter(e => e.isNew).length,
  highBiz: hotspotEvents.filter(e => e.businessRelevance >= 4).length,
  cross: hotspotEvents.filter(e => e.crossSource >= 2).length,
};

const hotItems = [
  { rank: 1, title: "清明假期出行人数创新高", heat: 125000, platform: "微博", time: "2小时前", sentiment: "正向" },
  { rank: 2, title: "机票价格暴涨引发网友热议", heat: 98700, platform: "抖音", time: "3小时前", sentiment: "负向" },
  { rank: 3, title: "小长假酒店预订量同比增长200%", heat: 87600, platform: "小红书", time: "4小时前", sentiment: "正向" },
  { rank: 4, title: "OTA平台大促活动对比", heat: 76500, platform: "微博", time: "5小时前", sentiment: "中性" },
  { rank: 5, title: "旅游目的地推荐TOP10", heat: 65400, platform: "小红书", time: "6小时前", sentiment: "正向" },
  { rank: 6, title: "高铁票秒光引发退票难", heat: 54300, platform: "微博", time: "7小时前", sentiment: "负向" },
  { rank: 7, title: "景区限流政策引争议", heat: 43200, platform: "抖音", time: "8小时前", sentiment: "负向" },
  { rank: 8, title: "民宿市场春季回暖", heat: 32100, platform: "小红书", time: "9小时前", sentiment: "正向" },
];

const trendData = [
  { hour: "00:00", 热度: 120 },
  { hour: "04:00", 热度: 80 },
  { hour: "08:00", 热度: 350 },
  { hour: "12:00", 热度: 680 },
  { hour: "16:00", 热度: 520 },
  { hour: "20:00", 热度: 890 },
  { hour: "23:00", 热度: 450 },
];

const keywordData = [
  { keyword: "机票", count: 12500 },
  { keyword: "酒店", count: 9800 },
  { keyword: "旅游", count: 8700 },
  { keyword: "清明", count: 7600 },
  { keyword: "退票", count: 6500 },
  { keyword: "涨价", count: 5400 },
  { keyword: "预订", count: 4300 },
  { keyword: "攻略", count: 3200 },
];

// Original 微博/抖音/小红书 raw rankings card group
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

export default function HotspotDiscover() {
  const navigate = useNavigate();
  const events = useMemo(() => hotspotEvents, []);

  const goEventDetail = (e: HotspotEvent) => navigate(`/hotspot/event-detail?id=${e.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">热点洞察大盘</h1>
        <div className="flex gap-2 text-xs">
          <select className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">
            <option>全部平台</option>
            <option>微博</option>
            <option>抖音</option>
            <option>小红书</option>
          </select>
          <select className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">
            <option>实时</option>
            <option>今日</option>
            <option>本周</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="未来30天热点活动" value={listStats.upcoming} change={18.5} />
        <StatCard title="今日新增热点" value={listStats.newToday} change={45.2} />
        <StatCard title="高热度事件" value={listStats.highHeat} change={22.8} />
        <StatCard title="跨源大热点" value={listStats.cross} change={32.1} />
      </div>

      <div className="grid grid-cols-6 gap-3">
        <StatCard title="考试" value={listStats.exam} change={6.0} />
        <StatCard title="演唱会" value={listStats.concert} change={45.2} />
        <StatCard title="展会" value={listStats.expo} change={18.5} />
        <StatCard title="演出赛事" value={listStats.match} change={26.4} />
        <StatCard title="节假日" value={listStats.holiday} change={12.3} />
        <StatCard title="活动" value={listStats.activity} change={8.7} />
      </div>

      {/* ───── Sub-views: 实时榜 / 城市视图 / 品类视图 / 原始榜单 ───── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            实时热点榜
          </TabsTrigger>
          <TabsTrigger value="city" className="gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            城市视图
          </TabsTrigger>
          <TabsTrigger value="category" className="gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            品类视图
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            原始榜单
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">实时热点榜</h3>
              <div className="space-y-0">
                {hotItems.map((item) => (
                  <div key={item.rank} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.rank <= 3 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{item.rank}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground cursor-pointer hover:text-primary">{item.title}</span>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>{item.platform}</span>
                        <span>{item.time}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                          item.sentiment === "正向" ? "text-success border-success/30" :
                          item.sentiment === "负向" ? "text-destructive border-destructive/30" :
                          "text-muted-foreground"
                        }`}>{item.sentiment}</Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{item.heat.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">热度趋势</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="热度" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">关键词热度</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={keywordData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis dataKey="keyword" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" width={50} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="city" className="mt-4">
          <CityView events={events} onSelect={goEventDetail} />
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <CategoryView events={events} onSelect={goEventDetail} />
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <RawRankings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
