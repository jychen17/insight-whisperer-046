import { useState } from "react";
import { Plus, Trash2, Edit2, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ThemeConfigDialog from "@/components/ThemeConfigDialog";
import ThemeFlowCanvas from "@/components/ThemeFlowCanvas";

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  owner: string;
  type: "builtin" | "custom";
  status: "active" | "inactive";
  icon: string;
  dataSources: DataSourceConfig[];
  tagRules: TagRule[];
  baseFields: string[];
  calcFields: string[];
  dashboardWidgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceConfig {
  taskId: string;
  taskName: string;
  platforms: string[];
  timeRange: string;
  enabled: boolean;
}

export interface TagRule {
  id: string;
  type: "required" | "filter" | "weight";
  tagName: string;
  tagValue: string;
  weight?: number;
}

export interface DashboardWidget {
  id: string;
  type: "statCard" | "lineChart" | "pieChart" | "barChart" | "table";
  title: string;
  metric: string;
  position: number;
}

const defaultThemes: ThemeConfig[] = [
  {
    id: "sentiment",
    name: "舆情主题",
    description: "品牌声誉风险监测与预警",
    owner: "张三",
    type: "builtin",
    status: "active",
    icon: "🛡️",
    dataSources: [
      { taskId: "t1", taskName: "同程-万达", platforms: ["小红书", "微博", "抖音"], timeRange: "近7天", enabled: true },
      { taskId: "t2", taskName: "同程-金服", platforms: ["微博", "黑猫投诉"], timeRange: "近7天", enabled: true },
    ],
    tagRules: [
      { id: "r1", type: "required", tagName: "sentiment", tagValue: "负面" },
      { id: "r2", type: "filter", tagName: "topic", tagValue: "无关" },
    ],
    baseFields: ["sentiment", "risk_level", "platform", "publish_time", "likes", "comments"],
    calcFields: ["risk_score", "ferment_level"],
    dashboardWidgets: [
      { id: "w1", type: "statCard", title: "重大舆情", metric: "重大舆情数", position: 1 },
      { id: "w2", type: "lineChart", title: "舆情趋势", metric: "时间", position: 2 },
      { id: "w3", type: "pieChart", title: "业务分布", metric: "业务分类", position: 3 },
      { id: "w4", type: "table", title: "重大舆情列表", metric: "分页", position: 4 },
    ],
    createdAt: "2025-01-01",
    updatedAt: "2026-03-29",
  },
  {
    id: "industry",
    name: "行业咨询主题",
    description: "行业动态、竞品动向、市场趋势监测",
    owner: "李四",
    type: "builtin",
    status: "active",
    icon: "🌐",
    dataSources: [
      { taskId: "t4", taskName: "OTA行业监控", platforms: ["微博", "抖音", "小红书", "百度"], timeRange: "近30天", enabled: true },
    ],
    tagRules: [
      { id: "r5", type: "required", tagName: "topic", tagValue: "OTA" },
    ],
    baseFields: ["platform", "publish_time", "author", "content"],
    calcFields: ["sov", "growth_rate"],
    dashboardWidgets: [
      { id: "w5", type: "lineChart", title: "品牌声量趋势", metric: "时间", position: 1 },
      { id: "w6", type: "pieChart", title: "SOV份额", metric: "品牌", position: 2 },
    ],
    createdAt: "2026-01-15",
    updatedAt: "2026-03-28",
  },
  {
    id: "hotspot",
    name: "热点洞察主题",
    description: "社媒热点发现、话题趋势追踪",
    owner: "王五",
    type: "builtin",
    status: "active",
    icon: "⚡",
    dataSources: [
      { taskId: "t5", taskName: "全平台热点", platforms: ["微博", "抖音", "小红书", "百度", "快手"], timeRange: "实时", enabled: true },
    ],
    tagRules: [
      { id: "r7", type: "required", tagName: "topic", tagValue: "旅游" },
    ],
    baseFields: ["platform", "publish_time", "content", "likes", "shares"],
    calcFields: ["heat_score", "growth_rate"],
    dashboardWidgets: [
      { id: "w7", type: "table", title: "实时热点榜", metric: "热度", position: 1 },
      { id: "w8", type: "lineChart", title: "热度趋势", metric: "时间", position: 2 },
    ],
    createdAt: "2026-02-01",
    updatedAt: "2026-03-27",
  },
  {
    id: "experience",
    name: "产品体验主题",
    description: "用户反馈收集、产品问题洞察",
    owner: "赵六",
    type: "builtin",
    status: "active",
    icon: "💡",
    dataSources: [
      { taskId: "t6", taskName: "用户反馈监控", platforms: ["小红书", "黑猫投诉", "微博"], timeRange: "近7天", enabled: true },
    ],
    tagRules: [
      { id: "r8", type: "required", tagName: "intent", tagValue: "用户反馈" },
    ],
    baseFields: ["sentiment", "platform", "content", "publish_time"],
    calcFields: ["nps", "risk_score"],
    dashboardWidgets: [
      { id: "w9", type: "statCard", title: "反馈总量", metric: "反馈数", position: 1 },
      { id: "w10", type: "pieChart", title: "问题分类", metric: "问题类型", position: 2 },
    ],
    createdAt: "2026-02-15",
    updatedAt: "2026-03-26",
  },
];

export default function ThemeSettings() {
  const [themes, setThemes] = useState<ThemeConfig[]>(defaultThemes);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);

  const handleCreateTheme = () => { setEditingTheme(null); setDialogOpen(true); };
  const handleEditTheme = (theme: ThemeConfig) => { setEditingTheme(theme); setDialogOpen(true); };
  const handleSaveTheme = (theme: ThemeConfig) => {
    setThemes((prev) => {
      const exists = prev.find((t) => t.id === theme.id);
      return exists ? prev.map((t) => (t.id === theme.id ? theme : t)) : [...prev, theme];
    });
    setSelectedTheme(theme);
    setDialogOpen(false);
  };
  const handleToggleStatus = (id: string) => {
    setThemes((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "active" ? "inactive" : "active" } : t));
  };
  const handleDeleteTheme = (id: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== id));
    if (selectedTheme?.id === id) setSelectedTheme(null);
  };
  const handleDuplicate = (theme: ThemeConfig) => {
    const newTheme: ThemeConfig = {
      ...theme, id: `custom_${Date.now()}`, name: `${theme.name} (副本)`, type: "custom",
      createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10),
    };
    setThemes((prev) => [...prev, newTheme]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">主题配置</h1>
          <p className="text-xs text-muted-foreground mt-1">管理洞察主题，配置数据源、标签规则和看板展示</p>
        </div>
        <button onClick={handleCreateTheme}
          className="flex items-center gap-1.5 px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">
          <Plus className="w-3.5 h-3.5" /> 新建主题
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <div key={theme.id}
            className={`bg-card rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedTheme?.id === theme.id ? "border-primary shadow-sm" : "border-border"
            }`}
            onClick={() => setSelectedTheme(theme)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{theme.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{theme.name}</h3>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      theme.type === "builtin" ? "text-primary border-primary/30" : "text-amber-500 border-amber-500/30"
                    }`}>{theme.type === "builtin" ? "内置" : "自定义"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">负责人：{theme.owner}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(theme.id); }} className="shrink-0">
                {theme.status === "active"
                  ? <ToggleRight className="w-6 h-6 text-primary" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.dataSources.length}</div>
                <div className="text-[10px] text-muted-foreground">数据源</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.tagRules.length}</div>
                <div className="text-[10px] text-muted-foreground">入主题条件</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.dashboardWidgets.length}</div>
                <div className="text-[10px] text-muted-foreground">看板组件</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">更新于 {theme.updatedAt}</span>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleEditTheme(theme); }}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="编辑">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(theme); }}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="复制">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {theme.type === "custom" && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="删除">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTheme && (
        <>
          <ThemeFlowCanvas theme={selectedTheme} />
          <ThemeDetailPanel theme={selectedTheme} onEdit={() => handleEditTheme(selectedTheme)} />
        </>
      )}

      <ThemeConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} theme={editingTheme} onSave={handleSaveTheme} />
    </div>
  );
}

function ThemeDetailPanel({ theme, onEdit }: { theme: ThemeConfig; onEdit: () => void }) {
  const FIELD_LABELS: Record<string, string> = {
    sentiment: "情感倾向", risk_level: "风险等级", topic: "话题分类", intent: "用户意图",
    platform: "平台", publish_time: "发布时间", author: "作者", content: "内容正文",
    likes: "点赞数", comments: "评论数", shares: "分享数", reads: "阅读数",
    heat_score: "热度指数", risk_score: "风险分数", ferment_level: "发酵等级",
    sov: "SOV份额", nps: "NPS评分", growth_rate: "增长率",
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{theme.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{theme.name}</h2>
            <p className="text-xs text-muted-foreground">{theme.description} · 负责人：{theme.owner}</p>
          </div>
        </div>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-accent transition-colors">
          <Edit2 className="w-3 h-3" /> 编辑配置
        </button>
      </div>

      {/* Data Sources */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 数据源配置
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {theme.dataSources.map((ds) => (
            <div key={ds.taskId} className="bg-muted/30 rounded-md p-3 border border-border">
              <span className="text-xs font-medium text-foreground">{ds.taskName}</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ds.platforms.map((p) => (
                  <Badge key={p} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{p}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Rules */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 入主题条件
        </h3>
        <div className="flex flex-wrap gap-2">
          {theme.tagRules.map((rule, i) => (
            <div key={rule.id} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[10px] text-muted-foreground font-medium">AND</span>}
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {FIELD_LABELS[rule.tagName] || rule.tagName} {rule.type === "required" ? "=" : rule.type === "filter" ? "≠" : "∈"} {rule.tagValue}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 基础字段
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {theme.baseFields.map((f) => (
              <Badge key={f} variant="outline" className="text-xs px-2 py-0.5">{FIELD_LABELS[f] || f}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 计算字段
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {theme.calcFields.map((f) => (
              <Badge key={f} className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0">{FIELD_LABELS[f] || f}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 看板组件
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {theme.dashboardWidgets.map((widget) => (
            <div key={widget.id} className="bg-muted/30 rounded-md p-3 border border-border text-center">
              <div className="text-lg mb-1">
                {widget.type === "statCard" ? "📊" : widget.type === "lineChart" ? "📈" :
                 widget.type === "pieChart" ? "🥧" : widget.type === "barChart" ? "📉" : "📋"}
              </div>
              <div className="text-xs font-medium text-foreground">{widget.title}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{widget.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
