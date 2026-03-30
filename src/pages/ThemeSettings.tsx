import { useState } from "react";
import { Plus, Settings, Trash2, Edit2, ChevronRight, Check, X, Copy, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ThemeConfigDialog from "@/components/ThemeConfigDialog";

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  type: "builtin" | "custom";
  status: "active" | "inactive";
  icon: string;
  dataSources: DataSourceConfig[];
  tagRules: TagRule[];
  analysisConfig: AnalysisConfig;
  alertRules: AlertRule[];
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

export interface AnalysisConfig {
  dimensions: string[];
  metrics: { name: string; formula: string; condition?: string }[];
}

export interface AlertRule {
  id: string;
  condition: string;
  threshold: number;
  level: "warning" | "critical";
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
    type: "builtin",
    status: "active",
    icon: "🛡️",
    dataSources: [
      { taskId: "t1", taskName: "同程-万达", platforms: ["小红书", "微博", "抖音"], timeRange: "近7天", enabled: true },
      { taskId: "t2", taskName: "同程-金服", platforms: ["微博", "黑猫投诉"], timeRange: "近7天", enabled: true },
      { taskId: "t3", taskName: "同程-基础监控", platforms: ["百度", "今日头条"], timeRange: "近7天", enabled: true },
    ],
    tagRules: [
      { id: "r1", type: "required", tagName: "情感", tagValue: "负面" },
      { id: "r2", type: "filter", tagName: "业务分类", tagValue: "无关" },
      { id: "r3", type: "weight", tagName: "风险等级", tagValue: "重大", weight: 10 },
      { id: "r4", type: "weight", tagName: "风险等级", tagValue: "一般", weight: 5 },
    ],
    analysisConfig: {
      dimensions: ["情感", "业务", "平台", "时间"],
      metrics: [
        { name: "舆情总量", formula: "COUNT", condition: "" },
        { name: "负面占比", formula: "RATIO", condition: "情感=负面" },
        { name: "趋势变化", formula: "TREND", condition: "时间窗口:1天" },
      ],
    },
    alertRules: [
      { id: "a1", condition: "负面舆情数", threshold: 50, level: "warning" },
      { id: "a2", condition: "重大舆情数", threshold: 5, level: "critical" },
    ],
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
    type: "builtin",
    status: "active",
    icon: "🌐",
    dataSources: [
      { taskId: "t4", taskName: "OTA行业监控", platforms: ["微博", "抖音", "小红书", "百度"], timeRange: "近30天", enabled: true },
    ],
    tagRules: [
      { id: "r5", type: "required", tagName: "行业", tagValue: "OTA" },
      { id: "r6", type: "weight", tagName: "品牌提及", tagValue: "竞品", weight: 8 },
    ],
    analysisConfig: {
      dimensions: ["品牌", "平台", "时间", "话题"],
      metrics: [
        { name: "声量总量", formula: "COUNT" },
        { name: "SOV份额", formula: "RATIO", condition: "品牌=同程旅行" },
      ],
    },
    alertRules: [
      { id: "a3", condition: "竞品异常声量", threshold: 200, level: "warning" },
    ],
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
    type: "builtin",
    status: "active",
    icon: "⚡",
    dataSources: [
      { taskId: "t5", taskName: "全平台热点", platforms: ["微博", "抖音", "小红书", "百度", "快手"], timeRange: "实时", enabled: true },
    ],
    tagRules: [
      { id: "r7", type: "required", tagName: "话题相关", tagValue: "旅游" },
    ],
    analysisConfig: {
      dimensions: ["话题", "平台", "时间", "关键词"],
      metrics: [
        { name: "热度值", formula: "HEAT_SCORE" },
        { name: "上升速度", formula: "GROWTH_RATE" },
      ],
    },
    alertRules: [
      { id: "a4", condition: "热度突增", threshold: 500, level: "warning" },
    ],
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
    type: "builtin",
    status: "active",
    icon: "💡",
    dataSources: [
      { taskId: "t6", taskName: "用户反馈监控", platforms: ["小红书", "黑猫投诉", "微博"], timeRange: "近7天", enabled: true },
    ],
    tagRules: [
      { id: "r8", type: "required", tagName: "内容类型", tagValue: "用户反馈" },
      { id: "r9", type: "weight", tagName: "问题严重度", tagValue: "严重", weight: 10 },
    ],
    analysisConfig: {
      dimensions: ["问题类型", "产品线", "时间", "严重程度"],
      metrics: [
        { name: "反馈总量", formula: "COUNT" },
        { name: "负面率", formula: "RATIO", condition: "情感=负面" },
        { name: "NPS", formula: "NPS_SCORE" },
      ],
    },
    alertRules: [
      { id: "a5", condition: "严重问题数", threshold: 10, level: "critical" },
    ],
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

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setDialogOpen(true);
  };

  const handleEditTheme = (theme: ThemeConfig) => {
    setEditingTheme(theme);
    setDialogOpen(true);
  };

  const handleSaveTheme = (theme: ThemeConfig) => {
    setThemes((prev) => {
      const exists = prev.find((t) => t.id === theme.id);
      if (exists) {
        return prev.map((t) => (t.id === theme.id ? theme : t));
      }
      return [...prev, theme];
    });
    setSelectedTheme(theme);
    setDialogOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setThemes((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "active" ? "inactive" : "active" } : t
      )
    );
  };

  const handleDeleteTheme = (id: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== id));
    if (selectedTheme?.id === id) setSelectedTheme(null);
  };

  const handleDuplicate = (theme: ThemeConfig) => {
    const newTheme: ThemeConfig = {
      ...theme,
      id: `custom_${Date.now()}`,
      name: `${theme.name} (副本)`,
      type: "custom",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setThemes((prev) => [...prev, newTheme]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">主题配置</h1>
          <p className="text-xs text-muted-foreground mt-1">管理洞察主题，配置数据源、分析规则和看板展示</p>
        </div>
        <button
          onClick={handleCreateTheme}
          className="flex items-center gap-1.5 px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> 新建主题
        </button>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`bg-card rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedTheme?.id === theme.id ? "border-primary shadow-sm" : "border-border"
            }`}
            onClick={() => setSelectedTheme(theme)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{theme.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{theme.name}</h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        theme.type === "builtin"
                          ? "text-primary border-primary/30"
                          : "text-warning border-warning/30"
                      }`}
                    >
                      {theme.type === "builtin" ? "内置" : "自定义"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(theme.id);
                }}
                className="shrink-0"
              >
                {theme.status === "active" ? (
                  <ToggleRight className="w-6 h-6 text-primary" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.dataSources.length}</div>
                <div className="text-[10px] text-muted-foreground">数据源</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.tagRules.length}</div>
                <div className="text-[10px] text-muted-foreground">标签规则</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-center">
                <div className="text-lg font-bold text-foreground">{theme.alertRules.length}</div>
                <div className="text-[10px] text-muted-foreground">预警规则</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">更新于 {theme.updatedAt}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditTheme(theme); }}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(theme); }}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="复制"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {theme.type === "custom" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedTheme && <ThemeDetailPanel theme={selectedTheme} onEdit={() => handleEditTheme(selectedTheme)} />}

      {/* Config Dialog */}
      <ThemeConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        theme={editingTheme}
        onSave={handleSaveTheme}
      />
    </div>
  );
}

function ThemeDetailPanel({ theme, onEdit }: { theme: ThemeConfig; onEdit: () => void }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{theme.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{theme.name}</h2>
            <p className="text-xs text-muted-foreground">{theme.description}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-accent transition-colors"
        >
          <Edit2 className="w-3 h-3" /> 编辑配置
        </button>
      </div>

      {/* Data Sources */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
          数据源配置
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {theme.dataSources.map((ds) => (
            <div key={ds.taskId} className="bg-muted/30 rounded-md p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{ds.taskName}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ds.enabled ? "text-success border-success/30" : "text-muted-foreground"}`}>
                  {ds.enabled ? "启用" : "禁用"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {ds.platforms.map((p) => (
                  <Badge key={p} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{p}</Badge>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">时间范围: {ds.timeRange}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Rules */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
          标签规则
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">规则类型</th>
                <th className="text-left py-2 px-3 font-medium">标签名称</th>
                <th className="text-left py-2 px-3 font-medium">标签值</th>
                <th className="text-left py-2 px-3 font-medium">权重</th>
              </tr>
            </thead>
            <tbody>
              {theme.tagRules.map((rule) => (
                <tr key={rule.id} className="border-b border-border last:border-0">
                  <td className="py-2 px-3">
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                      rule.type === "required" ? "bg-primary/15 text-primary" :
                      rule.type === "filter" ? "bg-destructive/15 text-destructive" :
                      "bg-warning/15 text-warning"
                    }`}>
                      {rule.type === "required" ? "必需" : rule.type === "filter" ? "过滤" : "权重"}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-foreground">{rule.tagName}</td>
                  <td className="py-2 px-3 text-foreground">{rule.tagValue}</td>
                  <td className="py-2 px-3 text-muted-foreground">{rule.weight ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Config */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
            分析维度
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {theme.analysisConfig.dimensions.map((d) => (
              <Badge key={d} variant="outline" className="text-xs px-2 py-0.5">{d}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
            指标配置
          </h3>
          <div className="space-y-1.5">
            {theme.analysisConfig.metrics.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-foreground font-medium">{m.name}</span>
                <span className="text-muted-foreground">= {m.formula}</span>
                {m.condition && <span className="text-primary text-[10px]">({m.condition})</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Rules */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
          预警规则
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {theme.alertRules.map((rule) => (
            <div key={rule.id} className={`rounded-md p-3 border ${
              rule.level === "critical" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">{rule.condition} &gt; {rule.threshold}</span>
                <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                  rule.level === "critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                }`}>
                  {rule.level === "critical" ? "严重" : "警告"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" />
          看板组件
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {theme.dashboardWidgets.map((widget) => (
            <div key={widget.id} className="bg-muted/30 rounded-md p-3 border border-border text-center">
              <div className="text-lg mb-1">
                {widget.type === "statCard" ? "📊" :
                 widget.type === "lineChart" ? "📈" :
                 widget.type === "pieChart" ? "🥧" :
                 widget.type === "barChart" ? "📉" : "📋"}
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
