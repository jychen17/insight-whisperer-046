import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit2, Copy, ToggleLeft, ToggleRight, GitMerge, LayoutDashboard, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import ThemeConfigDialog from "@/components/ThemeConfigDialog";

// ── Data Model ──────────────────────────────────────────────

export interface FieldConfig {
  key: string;
  fieldType: "raw" | "ai" | "calc";
  displayPosition: "list" | "detail" | "both";
  isFilter: boolean;
  filterType: "enum" | "text";
  hasSystemEnum: boolean;
  enumValues: string[];
}

export interface MergeDisplayField {
  key: string;
  position: "list" | "detail" | "both";
}

export interface MergeNode {
  id: string;
  name: string;
  enabled: boolean;
  type: "text_similarity" | "field_group" | "time_window" | "custom";
  similarityThreshold?: number;
  timeWindowHours?: number;
  groupByFields?: string[];
  customRule?: string;
  order: number;
  displayFields?: MergeDisplayField[];
}

export interface ConditionNode {
  id: string;
  type: "condition" | "group";
  field?: string;
  operator?: string;
  value?: string;
  logic?: "AND" | "OR";
  children?: ConditionNode[];
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
  conditionTree: ConditionNode;
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
  tagField?: string;
}

// ── Constants ───────────────────────────────────────────────

const MERGE_TYPE_LABELS: Record<string, string> = {
  text_similarity: "文本相似度合并",
  field_group: "字段分组合并",
  time_window: "时间窗口合并",
  custom: "自定义规则合并",
};

export const ALL_FIELDS = [
  { key: "sentiment", label: "情感倾向", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["正面", "负面", "中性"] },
  { key: "risk_level", label: "风险等级", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["高", "中", "低"] },
  { key: "topic", label: "话题分类", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["服务质量", "金融服务", "产品问题", "旅游", "OTA"] },
  { key: "intent", label: "用户意图", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["投诉", "咨询", "推荐", "用户反馈"] },
  { key: "platform", label: "平台", fieldType: "raw" as const, hasSystemEnum: true, enumValues: ["微博", "小红书", "抖音", "黑猫投诉", "百度", "快手", "今日头条"] },
  { key: "publish_time", label: "发布时间", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "author", label: "作者", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "content", label: "内容正文", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "likes", label: "点赞数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "comments", label: "评论数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "shares", label: "分享数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "reads", label: "阅读数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "heat_score", label: "热度指数", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
  { key: "risk_score", label: "风险分数", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
  { key: "ferment_level", label: "发酵等级", fieldType: "calc" as const, hasSystemEnum: true, enumValues: ["低", "中", "快"] },
  { key: "sov", label: "SOV份额", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
  { key: "nps", label: "NPS评分", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
  { key: "growth_rate", label: "增长率", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(ALL_FIELDS.map(f => [f.key, f.label]));

const DISPLAY_POS_LABELS: Record<string, string> = { list: "列表", detail: "详情", both: "列表+详情" };

// ── Mock Data ───────────────────────────────────────────────

const defaultThemes: ThemeConfig[] = [
  {
    id: "sentiment", name: "舆情主题", description: "品牌声誉风险监测与预警", owner: "张三",
    type: "builtin", status: "active", icon: "🛡️",
    dataSources: [
      { taskId: "t1", taskName: "同程-万达", platforms: ["小红书", "微博", "抖音"], timeRange: "近7天", enabled: true },
      { taskId: "t2", taskName: "同程-金服", platforms: ["微博", "黑猫投诉"], timeRange: "近7天", enabled: true },
    ],
    conditionTree: {
      id: "root", type: "group", logic: "AND", children: [
        { id: "c1", type: "condition", field: "sentiment", operator: "equals", value: "负面" },
        { id: "g1", type: "group", logic: "OR", children: [
          { id: "c2", type: "condition", field: "risk_level", operator: "equals", value: "高" },
          { id: "c3", type: "condition", field: "risk_level", operator: "equals", value: "中" },
        ]},
      ],
    },
    fieldConfigs: [
      { key: "sentiment", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["正面", "负面", "中性"] },
      { key: "risk_level", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["高", "中", "低"] },
      { key: "platform", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["微博", "小红书", "抖音", "黑猫投诉"] },
      { key: "publish_time", fieldType: "raw", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "likes", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "comments", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "risk_score", fieldType: "calc", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "ferment_level", fieldType: "calc", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["低", "中", "快"] },
    ],
    mergeNodes: [
      { id: "mn1", name: "事件合并", enabled: true, type: "text_similarity", similarityThreshold: 80, timeWindowHours: 24, order: 1,
        displayFields: [
          { key: "sentiment", position: "list" }, { key: "platform", position: "list" },
          { key: "risk_score", position: "detail" }, { key: "likes", position: "detail" },
        ]},
      { id: "mn2", name: "业务类型合并", enabled: true, type: "field_group", groupByFields: ["topic"], order: 2,
        displayFields: [
          { key: "sentiment", position: "both" }, { key: "platform", position: "list" },
        ]},
    ],
    dashboardWidgets: [
      { id: "w1", type: "statCard", title: "重大舆情", metric: "重大舆情数", position: 1, tagField: "risk_level" },
      { id: "w2", type: "lineChart", title: "舆情趋势", metric: "时间", position: 2, tagField: "publish_time" },
      { id: "w3", type: "pieChart", title: "业务分布", metric: "业务分类", position: 3, tagField: "topic" },
      { id: "w4", type: "table", title: "重大舆情列表", metric: "分页", position: 4, tagField: "risk_level" },
    ],
    createdAt: "2025-01-01", updatedAt: "2026-03-29",
  },
  {
    id: "industry", name: "行业咨询主题", description: "行业动态、竞品动向、市场趋势监测", owner: "李四",
    type: "builtin", status: "active", icon: "🌐",
    dataSources: [{ taskId: "t4", taskName: "OTA行业监控", platforms: ["微博", "抖音", "小红书", "百度"], timeRange: "近30天", enabled: true }],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [{ id: "c1", type: "condition", field: "topic", operator: "contains", value: "OTA" }] },
    fieldConfigs: [
      { key: "platform", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["微博", "抖音", "小红书", "百度"] },
      { key: "publish_time", fieldType: "raw", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "author", fieldType: "raw", displayPosition: "detail", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "content", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "sov", fieldType: "calc", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "growth_rate", fieldType: "calc", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
    ],
    mergeNodes: [],
    dashboardWidgets: [
      { id: "w5", type: "lineChart", title: "品牌声量趋势", metric: "时间", position: 1, tagField: "publish_time" },
      { id: "w6", type: "pieChart", title: "SOV份额", metric: "品牌", position: 2, tagField: "sov" },
    ],
    createdAt: "2026-01-15", updatedAt: "2026-03-28",
  },
  {
    id: "hotspot", name: "热点洞察主题", description: "社媒热点发现、话题趋势追踪", owner: "王五",
    type: "builtin", status: "active", icon: "⚡",
    dataSources: [{ taskId: "t5", taskName: "全平台热点", platforms: ["微博", "抖音", "小红书", "百度", "快手"], timeRange: "实时", enabled: true }],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [{ id: "c1", type: "condition", field: "topic", operator: "contains", value: "旅游" }] },
    fieldConfigs: [
      { key: "platform", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["微博", "抖音", "小红书", "百度", "快手"] },
      { key: "likes", fieldType: "raw", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "heat_score", fieldType: "calc", displayPosition: "both", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
    ],
    mergeNodes: [{ id: "mn3", name: "热点事件聚合", enabled: true, type: "text_similarity", similarityThreshold: 85, timeWindowHours: 12, order: 1, displayFields: [] }],
    dashboardWidgets: [{ id: "w7", type: "table", title: "实时热点榜", metric: "热度", position: 1, tagField: "heat_score" }],
    createdAt: "2026-02-01", updatedAt: "2026-03-27",
  },
  {
    id: "experience", name: "产品体验主题", description: "用户反馈收集、产品问题洞察", owner: "赵六",
    type: "builtin", status: "active", icon: "💡",
    dataSources: [{ taskId: "t6", taskName: "用户反馈监控", platforms: ["小红书", "黑猫投诉", "微博"], timeRange: "近7天", enabled: true }],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [{ id: "c1", type: "condition", field: "intent", operator: "equals", value: "用户反馈" }] },
    fieldConfigs: [
      { key: "sentiment", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["正面", "负面", "中性"] },
      { key: "platform", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["小红书", "黑猫投诉", "微博"] },
      { key: "nps", fieldType: "calc", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
    ],
    mergeNodes: [],
    dashboardWidgets: [{ id: "w9", type: "statCard", title: "反馈总量", metric: "反馈数", position: 1, tagField: "sentiment" }],
    createdAt: "2026-02-15", updatedAt: "2026-03-26",
  },
];

// Mock posts and merge results
const MOCK_POSTS = [
  { id: "p1", title: "万达酒店服务太差了，前台态度恶劣", platform: "微博", sentiment: "负面", author: "用户A", time: "2026-03-30 14:22", likes: 342, comments: 89, topic: "服务质量", content: "入住万达酒店，前台态度非常差，反映问题也不解决，差评！" },
  { id: "p2", title: "同程金服贷款利率不透明，感觉被坑了", platform: "黑猫投诉", sentiment: "负面", author: "用户B", time: "2026-03-30 12:10", likes: 56, comments: 23, topic: "金融服务", content: "申请了同程金服贷款，利率说明不清楚，实际利率比宣传高出很多。" },
  { id: "p3", title: "入住万达还行吧，中规中矩", platform: "小红书", sentiment: "中性", author: "用户C", time: "2026-03-30 10:05", likes: 128, comments: 15, topic: "服务质量", content: "万达酒店住了一晚，设施还行但没有惊喜。" },
  { id: "p4", title: "同程旅行APP闪退严重，客服找不到人", platform: "抖音", sentiment: "负面", author: "用户D", time: "2026-03-29 22:30", likes: 890, comments: 234, topic: "产品问题", content: "同程旅行APP最近一周频繁闪退，联系客服也没人回应。" },
  { id: "p5", title: "万达乐园亲子游体验不错，推荐", platform: "小红书", sentiment: "正面", author: "用户E", time: "2026-03-29 18:15", likes: 1205, comments: 67, topic: "服务质量", content: "带孩子去万达乐园玩了一天，设施很新，工作人员态度不错。" },
  { id: "p6", title: "万达酒店隔音差，被隔壁吵了一晚上", platform: "微博", sentiment: "负面", author: "用户F", time: "2026-03-30 09:00", likes: 210, comments: 45, topic: "服务质量", content: "万达酒店隔音太差了，隔壁声音全部能听到。" },
  { id: "p7", title: "同程金服提前还款手续费太高", platform: "黑猫投诉", sentiment: "负面", author: "用户G", time: "2026-03-29 16:00", likes: 78, comments: 34, topic: "金融服务", content: "提前还款需要收取高额手续费，不合理。" },
];

const MOCK_NODE1_EVENTS = [
  { id: "e1", title: "万达酒店服务质量问题", postCount: 3, posts: ["p1", "p3", "p6"], platforms: ["微博", "小红书"], sentiment: "负面", firstTime: "2026-03-30 09:00", lastTime: "2026-03-30 14:22", totalLikes: 680, totalComments: 149 },
  { id: "e2", title: "同程金服贷款争议", postCount: 2, posts: ["p2", "p7"], platforms: ["黑猫投诉"], sentiment: "负面", firstTime: "2026-03-29 16:00", lastTime: "2026-03-30 12:10", totalLikes: 134, totalComments: 57 },
  { id: "e3", title: "万达乐园亲子游好评", postCount: 1, posts: ["p5"], platforms: ["小红书"], sentiment: "正面", firstTime: "2026-03-29 18:15", lastTime: "2026-03-29 18:15", totalLikes: 1205, totalComments: 67 },
  { id: "e4", title: "同程旅行APP技术问题", postCount: 1, posts: ["p4"], platforms: ["抖音"], sentiment: "负面", firstTime: "2026-03-29 22:30", lastTime: "2026-03-29 22:30", totalLikes: 890, totalComments: 234 },
];

const MOCK_NODE2_GROUPS = [
  { id: "g1", title: "服务质量", eventCount: 2, postCount: 4, events: ["e1", "e3"], platforms: ["微博", "小红书"], mainSentiment: "负面", totalLikes: 1885, totalComments: 216 },
  { id: "g2", title: "金融服务", eventCount: 1, postCount: 2, events: ["e2"], platforms: ["黑猫投诉"], mainSentiment: "负面", totalLikes: 134, totalComments: 57 },
  { id: "g3", title: "产品问题", eventCount: 1, postCount: 1, events: ["e4"], platforms: ["抖音"], mainSentiment: "负面", totalLikes: 890, totalComments: 234 },
];

// ── Helper: render condition tree as text ────────────────────

function conditionToText(node: ConditionNode): string {
  if (node.type === "condition") {
    const opLabel = node.operator === "equals" ? "=" : node.operator === "not_equals" ? "≠" : node.operator === "contains" ? "∈" : node.operator || "=";
    return `${FIELD_LABELS[node.field || ""] || node.field} ${opLabel} ${node.value}`;
  }
  const childTexts = (node.children || []).map(c => conditionToText(c));
  const joined = childTexts.join(` ${node.logic} `);
  return node.children && node.children.length > 1 ? `(${joined})` : joined;
}

// ── Main Component ──────────────────────────────────────────

export default function ThemeSettings() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<ThemeConfig[]>(defaultThemes);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [dashboardDialogTheme, setDashboardDialogTheme] = useState<ThemeConfig | null>(null);

  const handleCreateTheme = () => { setEditingTheme(null); setDialogOpen(true); };
  const handleEditTheme = (theme: ThemeConfig) => { setEditingTheme(theme); setDialogOpen(true); };
  const handleSaveTheme = (theme: ThemeConfig) => {
    setThemes(prev => {
      const exists = prev.find(t => t.id === theme.id);
      return exists ? prev.map(t => t.id === theme.id ? theme : t) : [...prev, theme];
    });
    setSelectedTheme(theme);
    setDialogOpen(false);
  };
  const handleToggleStatus = (id: string) => setThemes(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "active" ? "inactive" : "active" } : t));
  const handleDeleteTheme = (id: string) => { setThemes(prev => prev.filter(t => t.id !== id)); if (selectedTheme?.id === id) setSelectedTheme(null); };
  const handleDuplicate = (theme: ThemeConfig) => {
    const n: ThemeConfig = { ...theme, id: `custom_${Date.now()}`, name: `${theme.name} (副本)`, type: "custom", createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
    setThemes(prev => [...prev, n]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">主题配置</h1>
          <p className="text-xs text-muted-foreground mt-1">管理洞察主题，配置数据源、入主题条件、展示字段和合并管线</p>
        </div>
        <button onClick={handleCreateTheme} className="flex items-center gap-1.5 px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">
          <Plus className="w-3.5 h-3.5" /> 新建主题
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px]">主题名称</TableHead>
              <TableHead className="text-center w-[80px]">数据源</TableHead>
              <TableHead className="text-center w-[80px]">展示字段</TableHead>
              <TableHead className="text-center w-[80px]">合并节点</TableHead>
              <TableHead className="w-[100px]">负责人</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[110px]">更新时间</TableHead>
              <TableHead className="text-right w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {themes.map(theme => {
              const activeNodes = (theme.mergeNodes || []).filter(n => n.enabled);
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <TableRow key={theme.id}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedTheme(theme)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{theme.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">{theme.name}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${theme.type === "builtin" ? "text-primary border-primary/30" : "text-amber-500 border-amber-500/30"}`}>
                            {theme.type === "builtin" ? "内置" : "自定义"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{theme.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium text-foreground">{theme.dataSources.length}</TableCell>
                  <TableCell className="text-center text-sm font-medium text-foreground">{theme.fieldConfigs.length}</TableCell>
                  <TableCell className="text-center">
                    {activeNodes.length > 0 ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">
                        <GitMerge className="w-2.5 h-2.5 mr-0.5" />{activeNodes.length}
                      </Badge>
                    ) : <span className="text-sm text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{theme.owner}</TableCell>
                  <TableCell>
                    <button onClick={e => { e.stopPropagation(); handleToggleStatus(theme.id); }} className="shrink-0">
                      {theme.status === "active" ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{theme.updatedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={e => { e.stopPropagation(); navigate("/datacenter/themes/detail", { state: { theme } }); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="查看详情">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleEditTheme(theme); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="编辑配置">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDashboardDialogTheme(theme); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="看板搭建">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDuplicate(theme); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="复制">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {theme.type === "custom" && (
                        <button onClick={e => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ThemeConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} theme={editingTheme} onSave={handleSaveTheme} />
      {dashboardDialogTheme && (
        <DashboardBuilderDialog theme={dashboardDialogTheme} onClose={() => setDashboardDialogTheme(null)}
          onSave={updated => { handleSaveTheme(updated); setDashboardDialogTheme(null); }} />
      )}
    </div>
  );
}

// ── Dashboard Builder Dialog ────────────────────────────────

function DashboardBuilderDialog({ theme, onClose, onSave }: { theme: ThemeConfig; onClose: () => void; onSave: (t: ThemeConfig) => void }) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(theme.dashboardWidgets || []);
  const WIDGET_TYPES = [
    { value: "statCard", label: "统计卡片", icon: "📊" },
    { value: "lineChart", label: "折线图", icon: "📈" },
    { value: "pieChart", label: "饼图", icon: "🥧" },
    { value: "barChart", label: "柱状图", icon: "📉" },
    { value: "table", label: "数据表格", icon: "📋" },
  ];
  const addWidget = (type: string) => setWidgets(w => [...w, { id: `w_${Date.now()}`, type: type as DashboardWidget["type"], title: "", metric: "", position: w.length + 1 }]);
  const updateWidget = (i: number, u: Partial<DashboardWidget>) => setWidgets(w => w.map((x, j) => j === i ? { ...x, ...u } : x));
  const removeWidget = (i: number) => setWidgets(w => w.filter((_, j) => j !== i));

  const availableFields = theme.fieldConfigs.map(fc => ({ key: fc.key, label: FIELD_LABELS[fc.key] || fc.key }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[900px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">看板搭建 · {theme.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Drag palette */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">拖拽组件到看板（点击添加）</label>
            <div className="flex gap-2 flex-wrap">
              {WIDGET_TYPES.map(wt => (
                <button key={wt.value} onClick={() => addWidget(wt.value)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs hover:bg-muted/50 transition-colors cursor-grab">
                  <span>{wt.icon}</span> {wt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Widget list */}
          <div className="space-y-2">
            {widgets.map((w, i) => (
              <div key={w.id} className="border border-border rounded-lg p-3 flex items-center gap-3 bg-card">
                <span className="text-sm cursor-grab">≡</span>
                <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0 shrink-0">
                  {WIDGET_TYPES.find(t => t.value === w.type)?.icon} {WIDGET_TYPES.find(t => t.value === w.type)?.label}
                </Badge>
                <input value={w.title} onChange={e => updateWidget(i, { title: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="组件标题" />
                <select value={w.tagField || ""} onChange={e => updateWidget(i, { tagField: e.target.value })}
                  className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                  <option value="">关联标签字段</option>
                  {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <input value={w.metric} onChange={e => updateWidget(i, { metric: e.target.value })}
                  className="w-28 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="指标逻辑" />
                <button onClick={() => removeWidget(i)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {widgets.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">点击上方组件类型添加到看板</p>}
          </div>

          {/* Preview */}
          {widgets.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">看板预览</label>
              <div className="grid grid-cols-2 gap-3 border border-border rounded-lg p-4 bg-muted/20">
                {widgets.map(w => (
                  <div key={w.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{WIDGET_TYPES.find(t => t.value === w.type)?.icon}</span>
                      <span className="text-xs font-medium text-foreground">{w.title || "未命名"}</span>
                      {w.tagField && <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-0">{FIELD_LABELS[w.tagField] || w.tagField}</Badge>}
                    </div>
                    <div className="h-16 bg-muted/30 rounded-md flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">{WIDGET_TYPES.find(t => t.value === w.type)?.label} · {w.metric || "未配置"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted">取消</button>
          <button onClick={() => onSave({ ...theme, dashboardWidgets: widgets, updatedAt: new Date().toISOString().slice(0, 10) })}
            className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">保存看板</button>
        </div>
      </div>
    </div>
  );
}
