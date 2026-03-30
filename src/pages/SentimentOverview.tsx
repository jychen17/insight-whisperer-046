import StatCard from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const trendData = [
  { date: "03-23", 全部舆情: 320, 一般舆情: 280, 重大舆情: 40 },
  { date: "03-24", 全部舆情: 680, 一般舆情: 610, 重大舆情: 70 },
  { date: "03-25", 全部舆情: 450, 一般舆情: 400, 重大舆情: 50 },
  { date: "03-26", 全部舆情: 380, 一般舆情: 340, 重大舆情: 40 },
  { date: "03-27", 全部舆情: 290, 一般舆情: 260, 重大舆情: 30 },
  { date: "03-28", 全部舆情: 250, 一般舆情: 220, 重大舆情: 30 },
  { date: "03-29", 全部舆情: 200, 一般舆情: 170, 重大舆情: 30 },
];

const businessData = [
  { name: "国内酒店", value: 35 },
  { name: "国内机票", value: 25 },
  { name: "旅游", value: 15 },
  { name: "金服", value: 10 },
  { name: "用车", value: 5 },
  { name: "人资", value: 5 },
  { name: "其他", value: 5 },
];

const sentimentData = [
  { name: "正向", value: 45 },
  { name: "中性", value: 30 },
  { name: "负向", value: 25 },
];

const platformData = [
  { name: "抖音", value: 35 },
  { name: "新浪微博", value: 20 },
  { name: "小红书", value: 15 },
  { name: "百度视频", value: 10 },
  { name: "今日头条", value: 8 },
  { name: "黑猫投诉", value: 7 },
  { name: "其他", value: 5 },
];

const issueData = [
  { date: "03-23", 票价计费: 65, 诱导加购: 11, 盲盒吐槽: 8, 演出赛事: 5, 其他: 11 },
  { date: "03-24", 票价计费: 70, 诱导加购: 7, 盲盒吐槽: 5, 演出赛事: 15, 其他: 3 },
  { date: "03-25", 票价计费: 54, 诱导加购: 10, 盲盒吐槽: 8, 演出赛事: 3, 其他: 25 },
  { date: "03-26", 票价计费: 57, 诱导加购: 6, 盲盒吐槽: 11, 演出赛事: 4, 其他: 22 },
  { date: "03-27", 票价计费: 59, 诱导加购: 5, 盲盒吐槽: 12, 演出赛事: 2, 其他: 22 },
  { date: "03-28", 票价计费: 60, 诱导加购: 8, 盲盒吐槽: 12, 演出赛事: 2, 其他: 18 },
  { date: "03-29", 票价计费: 54, 诱导加购: 10, 盲盒吐槽: 3, 演出赛事: 7, 其他: 26 },
];

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];
const SENTIMENT_COLORS = ["#3b82f6", "#94a3b8", "#ef4444"];

const majorSentiments = [
  { id: "5281827603351460", time: "2026-03-29 15:28:15", platform: "新浪微博", title: "@同程旅行官方微博 请问，你们什么时候退我机票？请问今天已经...", risk: "重大" },
  { id: "5281775823886490", time: "2026-03-29 12:02:30", platform: "新浪微博", title: "我推荐莱，机票又涨价了，不买了不买了，一天一个价，天天不同的...", risk: "重大" },
  { id: "5281775634876466", time: "2026-03-29 12:01:45", platform: "新浪微博", title: "取消飞行计划！上海到大理一天涨500？？不去了不去了🔴🔴🔴...", risk: "重大" },
  { id: "7d3c000000002200", time: "2026-03-28 15:03:24", platform: "小红书", title: "骂机票专用贴", risk: "重大" },
  { id: "5280859097401967", time: "2026-03-26 23:19:45", platform: "新浪微博", title: "3月23日，北京市市场监管局联合市商务局、市文化和旅游局、依法...", risk: "重大" },
];

export default function SentimentOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">舆情概览</h1>
          <p className="text-xs text-muted-foreground mt-1">数据每日8:00点更新</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-md">AI解读</button>
          <button className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-md">品牌声量</button>
          <button className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-md">品牌PK</button>
          <select className="px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
            <option>同程旅行</option>
          </select>
          <select className="px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
            <option>全部业务</option>
          </select>
          <select className="px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
            <option>近7天</option>
            <option>近30天</option>
          </select>
          <button className="px-4 py-1.5 text-xs gradient-primary text-primary-foreground rounded-md font-medium">查询</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="重大舆情" value={192} change={448.57} />
        <StatCard title="舆情数量" value="1,505" subtitle="OTA行业中位数: 966" change={13.41} />
        <StatCard title="全部数量" value="1.1万" subtitle="OTA行业中位数: 1,765" change={89.63} />
      </div>

      {/* Major Sentiments & Trend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">重大舆情</h3>
          <div className="space-y-0">
            <div className="grid grid-cols-[1fr_100px_80px_1fr_60px] gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
              <span>舆情ID</span><span>发布时间</span><span>平台</span><span>标题/正文</span><span>风险等级</span>
            </div>
            {majorSentiments.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_100px_80px_1fr_60px] gap-2 text-xs py-2.5 border-b border-border last:border-0">
                <span className="text-muted-foreground truncate">{item.id}</span>
                <span className="text-muted-foreground text-[11px]">{item.time}</span>
                <span className="text-foreground">{item.platform}</span>
                <span className="text-destructive truncate cursor-pointer hover:underline">{item.title}</span>
                <span className="text-destructive font-medium">{item.risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">舆情数据趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="全部舆情" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="一般舆情" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="重大舆情" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Business Distribution & Sentiment/Content Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">业务类型分布</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={businessData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {businessData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 text-xs">
              {businessData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">情感&内容主题分布</h3>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {sentimentData.map((_, i) => <Cell key={i} fill={SENTIMENT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-xs">
                {sentimentData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: SENTIMENT_COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Negative Issue Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">发布平台分布 (TOP10)</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 text-xs">
              {platformData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">负面舆情问题分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={issueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" unit="%" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="票价计费" stackId="a" fill="#3b82f6" />
              <Bar dataKey="诱导加购" stackId="a" fill="#ef4444" />
              <Bar dataKey="盲盒吐槽" stackId="a" fill="#f59e0b" />
              <Bar dataKey="演出赛事" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="其他" stackId="a" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
