import StatCard from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const sovData = [
  { name: "同程旅行", value: 35 },
  { name: "携程", value: 28 },
  { name: "美团", value: 18 },
  { name: "飞猪", value: 12 },
  { name: "去哪儿", value: 7 },
];

const trendData = [
  { date: "03-23", 同程旅行: 800, 携程: 1200, 美团: 600, 飞猪: 400 },
  { date: "03-24", 同程旅行: 1100, 携程: 1500, 美团: 900, 飞猪: 500 },
  { date: "03-25", 同程旅行: 950, 携程: 1300, 美团: 750, 飞猪: 450 },
  { date: "03-26", 同程旅行: 880, 携程: 1100, 美团: 700, 飞猪: 380 },
  { date: "03-27", 同程旅行: 760, 携程: 980, 美团: 620, 飞猪: 350 },
  { date: "03-28", 同程旅行: 720, 携程: 900, 美团: 580, 飞猪: 320 },
  { date: "03-29", 同程旅行: 690, 携程: 870, 美团: 550, 飞猪: 300 },
];

const hotTopics = [
  { rank: 1, topic: "清明节旅游攻略", heat: 98500, trend: "上升" },
  { rank: 2, topic: "机票价格波动讨论", heat: 87200, trend: "上升" },
  { rank: 3, topic: "酒店盲盒活动", heat: 65400, trend: "持平" },
  { rank: 4, topic: "OTA平台竞争格局", heat: 54300, trend: "下降" },
  { rank: 5, topic: "旅游业复苏分析", heat: 43200, trend: "上升" },
];

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function IndustryOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">行业大盘</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="行业总声量" value="12.5万" change={15.2} />
        <StatCard title="品牌提及量" value="3.8万" change={8.7} />
        <StatCard title="SOV份额" value="35%" subtitle="行业第一" change={2.3} />
        <StatCard title="情感正面率" value="68%" change={-3.1} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">品牌声量趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="同程旅行" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="携程" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="美团" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="飞猪" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">品牌份额 (SOV)</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={250}>
              <PieChart>
                <Pie data={sovData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={2} label={({ name, value }) => `${value}%`}>
                  {sovData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-xs">
              {sovData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">行业热点话题</h3>
        <div className="space-y-0">
          <div className="grid grid-cols-[40px_1fr_100px_80px] gap-4 text-xs text-muted-foreground pb-2 border-b border-border font-medium">
            <span>排名</span><span>话题</span><span>热度值</span><span>趋势</span>
          </div>
          {hotTopics.map((item) => (
            <div key={item.rank} className="grid grid-cols-[40px_1fr_100px_80px] gap-4 text-sm py-3 border-b border-border last:border-0 items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                item.rank <= 3 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{item.rank}</span>
              <span className="text-foreground cursor-pointer hover:text-primary">{item.topic}</span>
              <span className="text-muted-foreground text-xs">{item.heat.toLocaleString()}</span>
              <span className={`text-xs ${item.trend === "上升" ? "text-destructive" : item.trend === "下降" ? "text-success" : "text-muted-foreground"}`}>{item.trend}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
