import StatCard from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const issueCategories = [
  { name: "预订流程", value: 28 },
  { name: "退改政策", value: 25 },
  { name: "客服服务", value: 20 },
  { name: "支付问题", value: 12 },
  { name: "产品质量", value: 10 },
  { name: "其他", value: 5 },
];

const satisfactionTrend = [
  { date: "03-23", 满意度: 72, NPS: 35 },
  { date: "03-24", 满意度: 68, NPS: 30 },
  { date: "03-25", 满意度: 70, NPS: 32 },
  { date: "03-26", 满意度: 65, NPS: 28 },
  { date: "03-27", 满意度: 71, NPS: 33 },
  { date: "03-28", 满意度: 73, NPS: 36 },
  { date: "03-29", 满意度: 69, NPS: 31 },
];

const topIssues = [
  { issue: "机票退改手续费过高", count: 342, severity: "严重", product: "国内机票" },
  { issue: "酒店噪音问题未提前告知", count: 218, severity: "中等", product: "国内酒店" },
  { issue: "客服响应慢", count: 195, severity: "中等", product: "全部" },
  { issue: "支付后价格变动", count: 156, severity: "严重", product: "国内机票" },
  { issue: "行程取消退款慢", count: 134, severity: "中等", product: "旅游" },
  { issue: "盲盒活动规则不透明", count: 98, severity: "轻微", product: "国内酒店" },
];

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"];

export default function ExperienceOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">体验概览</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="用户反馈总量" value="2,847" change={12.5} />
        <StatCard title="负面反馈率" value="32%" change={5.8} />
        <StatCard title="NPS估算" value="31" subtitle="行业均值: 38" change={-3.2} />
        <StatCard title="问题解决率" value="76%" change={4.1} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">满意度与NPS趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="满意度" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="NPS" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">问题分类分布</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={250}>
              <PieChart>
                <Pie data={issueCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={2} label={({ value }) => `${value}%`}>
                  {issueCategories.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-xs">
              {issueCategories.map((item, i) => (
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
        <h3 className="text-sm font-medium text-foreground mb-4">TOP问题排行</h3>
        <div className="space-y-0">
          <div className="grid grid-cols-[1fr_80px_60px_80px] gap-4 text-xs text-muted-foreground pb-2 border-b border-border font-medium">
            <span>问题描述</span><span>反馈量</span><span>严重程度</span><span>涉及产品</span>
          </div>
          {topIssues.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_60px_80px] gap-4 text-sm py-3 border-b border-border last:border-0 items-center">
              <span className="text-foreground">{item.issue}</span>
              <span className="text-muted-foreground text-xs">{item.count}</span>
              <span className={`text-xs ${
                item.severity === "严重" ? "text-destructive" : item.severity === "中等" ? "text-warning" : "text-muted-foreground"
              }`}>{item.severity}</span>
              <span className="text-xs text-muted-foreground">{item.product}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
