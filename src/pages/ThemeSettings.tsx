import { useState } from "react";
import { Plus, Trash2, Edit2, Copy, ToggleLeft, ToggleRight, Search, Filter, Layers, ChevronRight, GitMerge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ThemeConfigDialog from "@/components/ThemeConfigDialog";
import ThemeFlowCanvas from "@/components/ThemeFlowCanvas";

export interface FieldConfig {
  key: string;
  isFilter: boolean;
  filterType: "enum" | "text";
  enumValues: string[];
}

export interface MergeNode {
  id: string;
  name: string;
  enabled: boolean;
  type: "text_similarity" | "field_group" | "time_window" | "custom";
  // text_similarity params
  similarityThreshold?: number;
  timeWindowHours?: number;
  // field_group params
  groupByField?: string;
  // custom params
  customRule?: string;
  order: number;
}

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
  fieldConfigs: FieldConfig[];
  mergeNodes: MergeNode[];
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

const MERGE_TYPE_LABELS: Record<string, string> = {
  text_similarity: "文本相似度合并",
  field_group: "字段分组合并",
  time_window: "时间窗口合并",
  custom: "自定义规则合并",
};

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
    fieldConfigs: [
      { key: "sentiment", isFilter: true, filterType: "enum", enumValues: ["正面", "负面", "中性"] },
      { key: "risk_level", isFilter: true, filterType: "enum", enumValues: ["高", "中", "低"] },
      { key: "platform", isFilter: true, filterType: "enum", enumValues: ["微博", "小红书", "抖音", "黑猫投诉"] },
      { key: "publish_time", isFilter: false, filterType: "text", enumValues: [] },
      { key: "likes", isFilter: false, filterType: "text", enumValues: [] },
      { key: "comments", isFilter: false, filterType: "text", enumValues: [] },
    ],
    mergeNodes: [
      { id: "mn1", name: "事件合并", enabled: true, type: "text_similarity", similarityThreshold: 80, timeWindowHours: 24, order: 1 },
      { id: "mn2", name: "业务类型合并", enabled: true, type: "field_group", groupByField: "topic", order: 2 },
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
    fieldConfigs: [
      { key: "platform", isFilter: true, filterType: "enum", enumValues: ["微博", "抖音", "小红书", "百度"] },
      { key: "publish_time", isFilter: false, filterType: "text", enumValues: [] },
      { key: "author", isFilter: true, filterType: "text", enumValues: [] },
      { key: "content", isFilter: false, filterType: "text", enumValues: [] },
    ],
    mergeNodes: [],
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
    fieldConfigs: [
      { key: "platform", isFilter: true, filterType: "enum", enumValues: ["微博", "抖音", "小红书", "百度", "快手"] },
      { key: "likes", isFilter: false, filterType: "text", enumValues: [] },
    ],
    mergeNodes: [
      { id: "mn3", name: "热点事件聚合", enabled: true, type: "text_similarity", similarityThreshold: 85, timeWindowHours: 12, order: 1 },
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
    fieldConfigs: [
      { key: "sentiment", isFilter: true, filterType: "enum", enumValues: ["正面", "负面", "中性"] },
      { key: "platform", isFilter: true, filterType: "enum", enumValues: ["小红书", "黑猫投诉", "微博"] },
    ],
    mergeNodes: [],
    dashboardWidgets: [
      { id: "w9", type: "statCard", title: "反馈总量", metric: "反馈数", position: 1 },
      { id: "w10", type: "pieChart", title: "问题分类", metric: "问题类型", position: 2 },
    ],
    createdAt: "2026-02-15",
    updatedAt: "2026-03-26",
  },
];

// Mock data
const MOCK_POSTS = [
  { id: "p1", title: "万达酒店服务太差了，前台态度恶劣", platform: "微博", sentiment: "负面", author: "用户A", time: "2026-03-30 14:22", likes: 342, comments: 89, topic: "服务质量" },
  { id: "p2", title: "同程金服贷款利率不透明，感觉被坑了", platform: "黑猫投诉", sentiment: "负面", author: "用户B", time: "2026-03-30 12:10", likes: 56, comments: 23, topic: "金融服务" },
  { id: "p3", title: "入住万达还行吧，中规中矩", platform: "小红书", sentiment: "中性", author: "用户C", time: "2026-03-30 10:05", likes: 128, comments: 15, topic: "服务质量" },
  { id: "p4", title: "同程旅行APP闪退严重，客服找不到人", platform: "抖音", sentiment: "负面", author: "用户D", time: "2026-03-29 22:30", likes: 890, comments: 234, topic: "产品问题" },
  { id: "p5", title: "万达乐园亲子游体验不错，推荐", platform: "小红书", sentiment: "正面", author: "用户E", time: "2026-03-29 18:15", likes: 1205, comments: 67, topic: "服务质量" },
  { id: "p6", title: "万达酒店隔音差，被隔壁吵了一晚上", platform: "微博", sentiment: "负面", author: "用户F", time: "2026-03-30 09:00", likes: 210, comments: 45, topic: "服务质量" },
  { id: "p7", title: "同程金服提前还款手续费太高", platform: "黑猫投诉", sentiment: "负面", author: "用户G", time: "2026-03-29 16:00", likes: 78, comments: 34, topic: "金融服务" },
];

// Node 1 mock: text similarity merged events
const MOCK_NODE1_EVENTS = [
  { id: "e1", title: "万达酒店服务质量问题", postCount: 3, posts: ["p1", "p3", "p6"], platforms: ["微博", "小红书"], sentiment: "负面", firstTime: "2026-03-30 09:00", lastTime: "2026-03-30 14:22", totalLikes: 680, totalComments: 149 },
  { id: "e2", title: "同程金服贷款争议", postCount: 2, posts: ["p2", "p7"], platforms: ["黑猫投诉"], sentiment: "负面", firstTime: "2026-03-29 16:00", lastTime: "2026-03-30 12:10", totalLikes: 134, totalComments: 57 },
  { id: "e3", title: "万达乐园亲子游好评", postCount: 1, posts: ["p5"], platforms: ["小红书"], sentiment: "正面", firstTime: "2026-03-29 18:15", lastTime: "2026-03-29 18:15", totalLikes: 1205, totalComments: 67 },
  { id: "e4", title: "同程旅行APP技术问题", postCount: 1, posts: ["p4"], platforms: ["抖音"], sentiment: "负面", firstTime: "2026-03-29 22:30", lastTime: "2026-03-29 22:30", totalLikes: 890, totalComments: 234 },
];

// Node 2 mock: field_group by topic (on top of node 1 results)
const MOCK_NODE2_GROUPS = [
  { id: "g1", title: "服务质量", eventCount: 2, postCount: 4, events: ["e1", "e3"], platforms: ["微博", "小红书"], mainSentiment: "负面", totalLikes: 1885, totalComments: 216 },
  { id: "g2", title: "金融服务", eventCount: 1, postCount: 2, events: ["e2"], platforms: ["黑猫投诉"], mainSentiment: "负面", totalLikes: 134, totalComments: 57 },
  { id: "g3", title: "产品问题", eventCount: 1, postCount: 1, events: ["e4"], platforms: ["抖音"], mainSentiment: "负面", totalLikes: 890, totalComments: 234 },
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

  const enabledNodes = (selectedTheme?.mergeNodes || []).filter(n => n.enabled).sort((a, b) => a.order - b.order);

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
        {themes.map((theme) => {
          const activeNodes = (theme.mergeNodes || []).filter(n => n.enabled);
          return (
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
                      {activeNodes.length > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">
                          <GitMerge className="w-2.5 h-2.5 mr-0.5" />{activeNodes.length}级合并
                        </Badge>
                      )}
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
                  <div className="text-lg font-bold text-foreground">{activeNodes.length}</div>
                  <div className="text-[10px] text-muted-foreground">合并节点</div>
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
          );
        })}
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

const FIELD_LABELS: Record<string, string> = {
  sentiment: "情感倾向", risk_level: "风险等级", topic: "话题分类", intent: "用户意图",
  platform: "平台", publish_time: "发布时间", author: "作者", content: "内容正文",
  likes: "点赞数", comments: "评论数", shares: "分享数", reads: "阅读数",
  heat_score: "热度指数", risk_score: "风险分数", ferment_level: "发酵等级",
  sov: "SOV份额", nps: "NPS评分", growth_rate: "增长率",
};

function ThemeDetailPanel({ theme, onEdit }: { theme: ThemeConfig; onEdit: () => void }) {
  const enabledNodes = (theme.mergeNodes || []).filter(n => n.enabled).sort((a, b) => a.order - b.order);
  const [activeTab, setActiveTab] = useState("posts");

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

      {/* Fields with filter config */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 展示字段与筛选条件
        </h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">字段名</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">类型</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">作为筛选条件</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">筛选方式</th>
              </tr>
            </thead>
            <tbody>
              {[...theme.baseFields, ...theme.calcFields].map((f) => {
                const fc = (theme.fieldConfigs || []).find(c => c.key === f);
                const isCalc = theme.calcFields.includes(f);
                return (
                  <tr key={f} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{FIELD_LABELS[f] || f}</td>
                    <td className="px-3 py-2">
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${isCalc ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {isCalc ? "计算字段" : "基础字段"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {fc?.isFilter ? (
                        <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                          <Filter className="w-2.5 h-2.5 mr-0.5" />是
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {fc?.isFilter ? (
                        fc.filterType === "enum" ? (
                          <span className="text-foreground">下拉选择 · <span className="text-muted-foreground">{fc.enumValues.join(", ")}</span></span>
                        ) : (
                          <span className="text-foreground flex items-center gap-1"><Search className="w-3 h-3 text-muted-foreground" />模糊搜索</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merge Pipeline */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 合并管线
        </h3>
        {enabledNodes.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-muted/50 rounded-md px-3 py-2 border border-border text-xs font-medium text-foreground">
              全部帖子
            </div>
            {enabledNodes.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className="bg-primary/5 rounded-md px-3 py-2 border border-primary/20">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <GitMerge className="w-3 h-3 text-primary" />
                    <span>第{i + 1}级：{node.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {MERGE_TYPE_LABELS[node.type] || node.type}
                    {node.type === "text_similarity" && ` · 阈值${node.similarityThreshold}% · ${node.timeWindowHours}h窗口`}
                    {node.type === "field_group" && ` · 按${FIELD_LABELS[node.groupByField || ""] || node.groupByField}分组`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">未配置合并节点，仅展示原始入库帖子</span>
            </div>
          </div>
        )}
      </div>

      {/* Posts / Merge Node Tabs */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 数据展示
        </h3>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts">
              全部帖子
              <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{MOCK_POSTS.length}</Badge>
            </TabsTrigger>
            {enabledNodes.map((node, i) => (
              <TabsTrigger key={node.id} value={`node_${node.id}`}>
                第{i + 1}级：{node.name}
                <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                  {i === 0 ? MOCK_NODE1_EVENTS.length : MOCK_NODE2_GROUPS.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="posts">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-3 mt-1">
              {(theme.fieldConfigs || []).filter(fc => fc.isFilter).map(fc => (
                <div key={fc.key}>
                  {fc.filterType === "enum" ? (
                    <select className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                      <option value="">{FIELD_LABELS[fc.key] || fc.key}（全部）</option>
                      {fc.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center border border-border rounded-md bg-card px-2">
                      <Search className="w-3 h-3 text-muted-foreground" />
                      <input className="px-1.5 py-1.5 text-xs bg-transparent text-foreground outline-none w-24" placeholder={`搜索${FIELD_LABELS[fc.key] || fc.key}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">标题</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">平台</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">情感</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">作者</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">时间</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">互动</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_POSTS.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-foreground font-medium max-w-[240px] truncate">{p.title}</td>
                      <td className="px-3 py-2.5"><Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{p.platform}</Badge></td>
                      <td className="px-3 py-2.5">
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                          p.sentiment === "负面" ? "bg-destructive/10 text-destructive" :
                          p.sentiment === "正面" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>{p.sentiment}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.author}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.time}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">👍 {p.likes} · 💬 {p.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Render a tab for each enabled merge node */}
          {enabledNodes.map((node, nodeIndex) => (
            <TabsContent key={node.id} value={`node_${node.id}`}>
              <div className="bg-muted/20 rounded-lg p-3 mb-3 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">{node.name}</span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    {MERGE_TYPE_LABELS[node.type]}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {node.type === "text_similarity" && `相似度 ≥ ${node.similarityThreshold}% · ${node.timeWindowHours}h窗口`}
                  {node.type === "field_group" && `按「${FIELD_LABELS[node.groupByField || ""] || node.groupByField}」字段分组`}
                  {nodeIndex > 0 && " · 基于上一级合并结果"}
                </span>
              </div>

              {nodeIndex === 0 ? (
                /* Node 1: text similarity events */
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">事件名称</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">合并帖子数</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">涉及平台</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">情感</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">时间范围</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">总互动</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_NODE1_EVENTS.map(e => (
                        <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-foreground font-medium">{e.title}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{e.postCount} 篇</Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">{e.platforms.map(p => (
                              <Badge key={p} className="text-[10px] px-1 py-0 bg-muted text-muted-foreground border-0">{p}</Badge>
                            ))}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                              e.sentiment === "负面" ? "bg-destructive/10 text-destructive" :
                              e.sentiment === "正面" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>{e.sentiment}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{e.firstTime.slice(5)} ~ {e.lastTime.slice(5)}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">👍 {e.totalLikes} · 💬 {e.totalComments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Node 2+: grouped results */
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">分组名称</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">包含事件</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">原始帖子</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">涉及平台</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">主要情感</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">总互动</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_NODE2_GROUPS.map(g => (
                        <tr key={g.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <GitMerge className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-foreground font-medium">{g.title}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">{g.eventCount} 个</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{g.postCount} 篇</Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">{g.platforms.map(p => (
                              <Badge key={p} className="text-[10px] px-1 py-0 bg-muted text-muted-foreground border-0">{p}</Badge>
                            ))}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                              g.mainSentiment === "负面" ? "bg-destructive/10 text-destructive" :
                              g.mainSentiment === "正面" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>{g.mainSentiment}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">👍 {g.totalLikes} · 💬 {g.totalComments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
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
