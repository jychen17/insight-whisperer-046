import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Globe, Zap, Lightbulb, BarChart3, Settings, ArrowRight, Star, TrendingUp, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const themeModules = [
  {
    key: "sentiment",
    icon: Shield,
    title: "舆情监控",
    desc: "实时监控全网舆情动态，自动识别风险事件，提供智能预警与趋势分析",
    path: "/",
    tags: ["风险预警", "情感分析", "趋势追踪"],
    stats: { today: 1284, risk: 3 },
    gradient: "from-rose-500/20 to-orange-500/20",
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/30",
  },
  {
    key: "industry",
    icon: Globe,
    title: "行业咨询",
    desc: "洞察行业全局，追踪竞品动态，掌握市场趋势与品牌份额变化",
    path: "/industry/overview",
    tags: ["竞品监测", "市场动态", "SOV分析"],
    stats: { today: 856, risk: 0 },
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/30",
  },
  {
    key: "hotspot",
    icon: Zap,
    title: "热点洞察",
    desc: "捕捉全网热点话题，分析传播路径与关键词趋势，助力内容决策",
    path: "/hotspot/discover",
    tags: ["热点发现", "话题分析", "关键词"],
    stats: { today: 2150, risk: 1 },
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-500",
    borderColor: "border-amber-500/30",
  },
  {
    key: "experience",
    icon: Lightbulb,
    title: "产品体验",
    desc: "聚合用户反馈与评价数据，量化满意度与NPS，定位核心体验问题",
    path: "/experience/overview",
    tags: ["用户反馈", "NPS监测", "问题追踪"],
    stats: { today: 673, risk: 2 },
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-500/30",
  },
  {
    key: "brand",
    icon: BarChart3,
    title: "品牌声量",
    desc: "监测品牌在各平台的声量表现，分析品牌热度与口碑趋势",
    path: "/brand/hotlist",
    tags: ["声量排行", "口碑分析", "平台对比"],
    stats: { today: 492, risk: 0 },
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
    borderColor: "border-violet-500/30",
  },
  {
    key: "settings",
    icon: Settings,
    title: "系统设置",
    desc: "配置监测规则、管理爬虫任务、自定义主题与关键词策略",
    path: "/settings/themes",
    tags: ["主题配置", "规则管理", "爬虫任务"],
    stats: { today: 0, risk: 0 },
    gradient: "from-gray-500/20 to-slate-500/20",
    iconColor: "text-muted-foreground",
    borderColor: "border-border",
  },
];

const quickStats = [
  { label: "今日数据总量", value: "5,455", icon: TrendingUp, change: "+12.3%" },
  { label: "活跃主题", value: "5", icon: Star, change: "" },
  { label: "待处理预警", value: "6", icon: Shield, change: "-2" },
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

      {/* Module Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">选择洞察主题</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {themeModules.map((m) => {
            const Icon = m.icon;
            const isHovered = hoveredKey === m.key;
            return (
              <Card
                key={m.key}
                className={`cursor-pointer transition-all duration-200 border ${
                  isHovered ? m.borderColor + " shadow-lg -translate-y-1" : "border-border"
                }`}
                onMouseEnter={() => setHoveredKey(m.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => navigate(m.path)}
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
                    {m.key !== "settings" ? (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>今日 <strong className="text-foreground">{m.stats.today.toLocaleString()}</strong> 条</span>
                        {m.stats.risk > 0 && (
                          <span className="text-destructive">
                            {m.stats.risk} 条预警
                          </span>
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
          })}
        </div>
      </div>
    </div>
  );
}
