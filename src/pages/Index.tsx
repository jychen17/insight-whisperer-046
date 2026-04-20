import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Globe, Zap, Lightbulb, ArrowRight, TrendingUp, Eye, Database, BarChart3, Settings, Monitor, FolderOpen, Bell, ChevronRight } from "lucide-react";
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
    tags: ["舆情大盘", "舆情列表"],
    stats: { today: 1284, risk: 3 },
    gradient: "from-rose-500/20 to-orange-500/20",
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/30",
  },
  {
    key: "industry",
    icon: Globe,
    title: "行业资讯主题",
    desc: "洞察行业全局，追踪竞品动态，掌握市场趋势与品牌份额变化",
    path: "/industry/overview",
    tags: ["行业资讯大盘", "行业资讯列表"],
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
    tags: ["热点洞察大盘", "热点洞察列表"],
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
    tags: ["产品体验大盘", "产品体验列表"],
    stats: { today: 673, risk: 2 },
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-500/30",
  },
];

const utilModules = [
  {
    key: "monitor",
    icon: Monitor,
    title: "专项监控",
    desc: "针对内容、账户与话题进行专项监控，及时发现异常与风险",
    path: "/monitor/content",
    tags: ["内容监控", "账户监控", "话题监控"],
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/30",
  },
  {
    key: "analysis",
    icon: BarChart3,
    title: "分析工具",
    desc: "智能报告生成与配置，灵活满足多样化分析需求",
    path: "/analysis/reports",
    tags: ["智能报告", "报告配置", "报告模板"],
    gradient: "from-sky-500/20 to-indigo-500/20",
    iconColor: "text-sky-500",
    borderColor: "border-sky-500/30",
  },
];

const quickStats = [
  { label: "今日数据总量", value: "4,963", icon: TrendingUp, change: "+12.3%" },
  { label: "活跃洞察主题", value: "4", icon: Eye, change: "" },
  { label: "待处理预警", value: "6", icon: Bell, change: "-2" },
  { label: "专项监控任务", value: "3", icon: Monitor, change: "" },
];

export default function Index() {
  const navigate = useNavigate();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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
        <div className="flex gap-6 mt-6 flex-wrap">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">洞察主题</h2>
          <button
            onClick={() => navigate("/themes/list")}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-accent transition-colors"
          >
            更多主题
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {themeModules.map((m) => (
            <ThemeCard key={m.key} module={m} isHovered={hoveredKey === m.key} onHover={setHoveredKey} onNavigate={navigate} />
          ))}
        </div>
      </div>

      {/* Utility Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">工具与管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {utilModules.map((m) => (
            <UtilCard key={m.key} module={m} isHovered={hoveredKey === m.key} onHover={setHoveredKey} onNavigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>今日 <strong className="text-foreground">{m.stats.today.toLocaleString()}</strong> 条</span>
            {m.stats.risk > 0 && (
              <span className="text-destructive">{m.stats.risk} 条预警</span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            进入 <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UtilCard({
  module: m,
  isHovered,
  onHover,
  onNavigate,
}: {
  module: (typeof utilModules)[number];
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
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${m.iconColor}`} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {m.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
