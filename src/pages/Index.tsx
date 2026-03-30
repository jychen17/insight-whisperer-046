import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Globe, Zap, Lightbulb, ArrowRight, TrendingUp, Eye, Database, BarChart3, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const themeModules = [
  {
    key: "sentiment",
    icon: Shield,
    title: "舆情主题",
    desc: "实时监控全网舆情动态，自动识别风险事件，提供智能预警与趋势分析",
    path: "/sentiment/overview",
    tags: ["舆情大盘", "舆情预警", "舆情报告"],
    stats: { today: 1284, risk: 3 },
    gradient: "from-rose-500/20 to-orange-500/20",
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/30",
  },
  {
    key: "industry",
    icon: Globe,
    title: "行业咨询主题",
    desc: "洞察行业全局，追踪竞品动态，掌握市场趋势与品牌份额变化",
    path: "/industry/overview",
    tags: ["行业大盘", "竞品监测", "趋势分析"],
    stats: { today: 856, risk: 0 },
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/30",
  },
  {
    key: "hotspot",
    icon: Zap,
    title: "热点洞察主题",
    desc: "捕捉全网热点话题，分析传播路径与关键词趋势，助力内容决策",
    path: "/hotspot/discover",
    tags: ["热点发现", "话题分析", "内容洞察"],
    stats: { today: 2150, risk: 1 },
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-500",
    borderColor: "border-amber-500/30",
  },
  {
    key: "experience",
    icon: Lightbulb,
    title: "产品体验主题",
    desc: "聚合用户反馈与评价数据，量化满意度与NPS，定位核心体验问题",
    path: "/experience/overview",
    tags: ["体验概览", "用户反馈", "优化建议"],
    stats: { today: 673, risk: 2 },
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-500/30",
  },
  {
    key: "datacenter",
    icon: Database,
    title: "数据中心",
    desc: "管理数据采集任务、标签体系与主题配置，保障数据质量与规范",
    path: "/datacenter/tasks",
    tags: ["数据采集", "标签管理", "主题配置"],
    stats: { today: 0, risk: 0 },
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
    borderColor: "border-violet-500/30",
    isUtil: true,
  },
  {
    key: "analysis",
    icon: BarChart3,
    title: "分析工具",
    desc: "智能报告生成、数据导出与自定义分析，灵活满足多样化分析需求",
    path: "/analysis/reports",
    tags: ["智能报告", "数据导出", "自定义分析"],
    stats: { today: 0, risk: 0 },
    gradient: "from-sky-500/20 to-indigo-500/20",
    iconColor: "text-sky-500",
    borderColor: "border-sky-500/30",
    isUtil: true,
  },
];

const quickStats = [
  { label: "今日数据总量", value: "4,963", icon: TrendingUp, change: "+12.3%" },
  { label: "活跃洞察主题", value: "4", icon: Eye, change: "" },
  { label: "待处理预警", value: "6", icon: Shield, change: "-2" },
];

export default function Index() {
  const navigate = useNavigate();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const insightModules = themeModules.filter((m) => !m.isUtil);
  const utilModules = themeModules.filter((m) => m.isUtil);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">外部洞察平台</h1>
            <p className="text-sm text-muted-foreground">全方位数据洞察，驱动业务决策</p>
          </div>
        </div>
        <div className="flex gap-6 mt-6">
          {quickStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 bg-card/80 backdrop-blur rounded-lg px-5 py-3 border border-border">
              <s.icon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">{s.value}</span>
                  {s.change && <span className="text-xs text-emerald-500">{s.change}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight Theme Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">选择洞察主题</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {insightModules.map((m) => (
            <ModuleCard key={m.key} module={m} isHovered={hoveredKey === m.key} onHover={setHoveredKey} onNavigate={navigate} />
          ))}
        </div>
      </div>

      {/* Utility Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">工具与管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {utilModules.map((m) => (
            <ModuleCard key={m.key} module={m} isHovered={hoveredKey === m.key} onHover={setHoveredKey} onNavigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  module: m,
  isHovered,
  onHover,
  onNavigate,
}: {
  module: (typeof themeModules)[number];
  isHovered: boolean;
  onHover: (key: string | null) => void;
  onNavigate: (path: string) => void;
}) {
  const Icon = m.icon;
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 border ${
        isHovered ? m.borderColor + " shadow-lg -translate-y-1" : "border-border"
      }`}
      onMouseEnter={() => onHover(m.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onNavigate(m.path)}
    >
      <CardContent className="p-6">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${m.iconColor}`} />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{m.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.desc}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {m.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {m.stats.today > 0 ? (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>今日 <strong className="text-foreground">{m.stats.today.toLocaleString()}</strong> 条</span>
              {m.stats.risk > 0 && (
                <span className="text-destructive">{m.stats.risk} 条预警</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">管理与配置</span>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            进入 <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
