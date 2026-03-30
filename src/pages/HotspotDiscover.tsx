import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

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

export default function HotspotDiscover() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">热点发现</h1>
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
        <StatCard title="实时热点数" value={128} change={23.5} />
        <StatCard title="上升热点" value={42} change={15.8} />
        <StatCard title="旅游相关热点" value={36} change={45.2} />
        <StatCard title="负面热点" value={8} change={-12.3} />
      </div>

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
    </div>
  );
}
