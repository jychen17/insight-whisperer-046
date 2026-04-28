import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Edit2, Copy, ToggleLeft, ToggleRight, GitMerge, LayoutDashboard, X, Eye, Shield, UserPlus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
  isSortable?: boolean;
  isDefaultSort?: boolean;
  sortDirection?: "asc" | "desc";
  /** Display order in the theme list — lower values appear first */
  order?: number;
}

export interface MergeDisplayField {
  key: string;
  fieldType: "raw" | "ai" | "calc";
  position: "list" | "detail" | "both";
  isFilter?: boolean;
  filterType?: "enum" | "text";
  hasSystemEnum?: boolean;
  enumValues?: string[];
  isSortable?: boolean;
  isDefaultSort?: boolean;
  sortDirection?: "asc" | "desc";
}

export interface MergeCondition {
  id: string;
  field: string;
  operator: "similarity_gte" | "time_within" | "equals" | "contains";
  value: string;
}

// Merge condition tree - reuses ConditionNode with merge-specific operators
export interface MergeConditionNode {
  id: string;
  type: "condition" | "group";
  field?: string;
  operator?: "similarity_gte" | "time_within" | "equals" | "contains";
  value?: string;
  logic?: "AND" | "OR";
  children?: MergeConditionNode[];
}

export interface MergeNode {
  id: string;
  name: string;
  enabled: boolean;
  mergeConditions: MergeCondition[];
  mergeConditionTree?: MergeConditionNode;
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
  /** Data permission scope: "global" = all users; "selected" = only allowedUsers */
  permissionMode?: "global" | "selected";
  /** Users explicitly granted access when permissionMode === "selected" */
  allowedUsers?: string[];
  /** Theme-level admins who can manage this theme's data permissions */
  themeAdmins?: string[];
}

export interface TaskParamConfig {
  brand?: string;
  platforms: string[];
  topics: string[];
}

export interface ExtendedParamConfig {
  platform: string;
  maxPages?: string;
  maxFetchCount?: string;
  sortBy?: string;
}

export interface DataSourceConfig {
  taskId: string;
  taskName: string;
  taskType: string;
  owner: string;
  executionPeriodStart: string;
  executionPeriodEnd: string;
  scheduleMode: "interval" | "fixed";
  scheduleTimeStart: number;
  scheduleTimeEnd: number;
  intervalHours: number;
  taskParams: TaskParamConfig[];
  extendedParams: ExtendedParamConfig[];
  platforms: string[];
  timeRange: string;
  enabled: boolean;
  conditionTree?: ConditionNode;
  /** Basic include words — exact match against title/body/author nickname */
  includeWords?: string[];
  /** Basic exclude words — exact match against title/body/author nickname */
  excludeWords?: string[];
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
  // ── 热点洞察主题字段（hot_event 数据模型） ──
  { key: "event_name", label: "事件名称", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "event_source", label: "数据源", fieldType: "raw" as const, hasSystemEnum: true, enumValues: ["大麦网", "本地宝", "微博", "抖音", "小红书", "国务院办公厅", "国家公务员局", "研招网", "公考雷达"] },
  { key: "event_type", label: "热点类型", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["考试", "演唱会", "展会", "演出赛事", "节假日", "活动"] },
  { key: "event_subtype", label: "细分类型", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["研究生考试", "公务员考试", "职业资格考试", "事业单位考试", "演唱会", "音乐节", "音乐演出", "车展", "漫展", "科技展", "博览展会", "其他展会", "马拉松", "球赛", "电竞", "体育赛事", "剧场演出", "光影演出", "全国法定", "地域特殊", "民俗活动", "时令活动", "开放活动"] },
  { key: "event_province", label: "省份", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "event_city", label: "城市", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "venue_name", label: "场馆/考点", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "event_start_date", label: "开始日期", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "event_end_date", label: "结束日期", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "heat_level", label: "热度分级", fieldType: "ai" as const, hasSystemEnum: true, enumValues: ["高", "中", "低"] },
  { key: "artist_name", label: "艺人名称", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "ticket_open_time", label: "开票时间", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "want_count", label: "想看人数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "ticket_print_datetime", label: "打印准考证时间", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "recruit_count", label: "招录人数", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "affected_regions", label: "涉及地区", fieldType: "raw" as const, hasSystemEnum: false, enumValues: [] },
  { key: "activity_scale", label: "活动规模", fieldType: "raw" as const, hasSystemEnum: true, enumValues: ["大型", "中型", "小型"] },
  { key: "days_to_start", label: "距离开始天数", fieldType: "calc" as const, hasSystemEnum: false, enumValues: [] },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(ALL_FIELDS.map(f => [f.key, f.label]));

const DISPLAY_POS_LABELS: Record<string, string> = { list: "列表", detail: "详情", both: "列表+详情" };

const defaultDS = (partial: Partial<DataSourceConfig> & { taskId: string; taskName: string; platforms: string[]; }): DataSourceConfig => ({
  taskType: "话题", owner: "张三", executionPeriodStart: "2026-04-01", executionPeriodEnd: "2026-05-01",
  scheduleMode: "interval", scheduleTimeStart: 0, scheduleTimeEnd: 23, intervalHours: 6,
  taskParams: [{ platforms: partial.platforms, topics: [] }],
  extendedParams: partial.platforms.map(p => ({ platform: p })),
  timeRange: "近7天", enabled: true,
  ...partial,
});

export const defaultThemes: ThemeConfig[] = [
  {
    id: "sentiment", name: "舆情主题", description: "品牌声誉风险监测与预警", owner: "张三",
    type: "builtin", status: "active", icon: "🛡️",
    dataSources: [
      defaultDS({ taskId: "t1", taskName: "同程-万达", platforms: ["小红书", "微博", "抖音"],
        conditionTree: {
          id: "root_t1", type: "group", logic: "AND", children: [
            { id: "c1_t1", type: "condition", field: "platform", operator: "equals", value: "小红书" },
            { id: "c2_t1", type: "condition", field: "sentiment", operator: "equals", value: "负面" },
            { id: "g1_t1", type: "group", logic: "OR", children: [
              { id: "c3_t1", type: "condition", field: "risk_level", operator: "equals", value: "高" },
              { id: "c4_t1", type: "condition", field: "risk_level", operator: "equals", value: "中" },
            ]},
          ],
        },
      }),
      defaultDS({ taskId: "t2", taskName: "同程-金服", platforms: ["微博", "黑猫投诉"],
        conditionTree: {
          id: "root_t2", type: "group", logic: "AND", children: [
            { id: "c1_t2", type: "condition", field: "sentiment", operator: "equals", value: "负面" },
            { id: "g1_t2", type: "group", logic: "OR", children: [
              { id: "c2_t2", type: "condition", field: "risk_level", operator: "equals", value: "高" },
              { id: "c3_t2", type: "condition", field: "risk_level", operator: "equals", value: "中" },
            ]},
          ],
        },
      }),
    ],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [] },
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
      { id: "mn1", name: "事件合并", enabled: true, mergeConditions: [
        { id: "mc1", field: "sentiment", operator: "similarity_gte", value: "80" },
        { id: "mc2", field: "publish_time", operator: "time_within", value: "24" },
      ], mergeConditionTree: {
        id: "mct_mn1", type: "group", logic: "AND", children: [
          { id: "mc1t", type: "condition", field: "sentiment", operator: "similarity_gte", value: "80" },
          { id: "mc2t", type: "condition", field: "publish_time", operator: "time_within", value: "24" },
        ],
      }, order: 1, displayFields: [
          { key: "sentiment", fieldType: "ai", position: "list" }, { key: "platform", fieldType: "raw", position: "list" },
          { key: "risk_score", fieldType: "calc", position: "detail" }, { key: "likes", fieldType: "raw", position: "detail" },
        ]},
      { id: "mn2", name: "业务类型合并", enabled: true, mergeConditions: [
        { id: "mc3", field: "topic", operator: "equals", value: "" },
      ], mergeConditionTree: {
        id: "mct_mn2", type: "group", logic: "AND", children: [
          { id: "mc3t", type: "condition", field: "topic", operator: "equals", value: "" },
        ],
      }, order: 2, displayFields: [
          { key: "sentiment", fieldType: "ai", position: "both" }, { key: "platform", fieldType: "raw", position: "list" },
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
    dataSources: [defaultDS({ taskId: "t4", taskName: "OTA行业监控", platforms: ["微博", "抖音", "小红书", "百度"],
      conditionTree: { id: "root", type: "group", logic: "AND", children: [{ id: "c1", type: "condition", field: "topic", operator: "contains", value: "OTA" }] },
    })],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [] },
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
    id: "hotspot", name: "热点洞察主题", description: "覆盖考试/演唱会/展会/演出赛事/节假日/活动 6 大热点类型，融合官方采集源与社媒榜单", owner: "王五",
    type: "builtin", status: "active", icon: "⚡",
    dataSources: [
      // ── 考试 ──
      defaultDS({ taskId: "ho_exam", taskName: "考试热点采集（研招网+公考雷达+本地宝）", taskType: "定向爬取", platforms: ["研招网", "公考雷达", "本地宝", "国家公务员局"],
        intervalHours: 24, timeRange: "未来180天",
        conditionTree: { id: "root_exam", type: "group", logic: "OR", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "考试" },
        ]},
        includeWords: ["研究生", "考研", "国考", "省考", "公务员", "教师资格", "法考", "CPA", "事业单位"],
      }),
      // ── 演唱会 ──
      defaultDS({ taskId: "ho_concert", taskName: "演唱会/音乐节采集（大麦网）", taskType: "定向爬取", platforms: ["大麦网"],
        intervalHours: 6, timeRange: "未来180天",
        conditionTree: { id: "root_concert", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "演唱会" },
        ]},
        includeWords: ["演唱会", "音乐节", "巡演", "Live"],
      }),
      // ── 展会 ──
      defaultDS({ taskId: "ho_expo", taskName: "展会采集（大麦+本地宝）", taskType: "定向爬取", platforms: ["大麦网", "本地宝"],
        intervalHours: 12, timeRange: "未来180天",
        conditionTree: { id: "root_expo", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "展会" },
        ]},
        includeWords: ["车展", "漫展", "ChinaJoy", "博览会", "科技展", "展览"],
      }),
      // ── 演出赛事 ──
      defaultDS({ taskId: "ho_match", taskName: "演出赛事采集（大麦+体育官网+本地宝）", taskType: "定向爬取", platforms: ["大麦网", "本地宝"],
        intervalHours: 12, timeRange: "未来180天",
        conditionTree: { id: "root_match", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "演出赛事" },
        ]},
        includeWords: ["马拉松", "球赛", "电竞", "S赛", "话剧", "剧场", "灯光秀", "喷泉秀"],
      }),
      // ── 节假日 ──
      defaultDS({ taskId: "ho_holiday", taskName: "节假日采集（国务院办公厅+地方文旅）", taskType: "定向爬取", platforms: ["国务院办公厅", "国家统计局", "本地宝"],
        intervalHours: 24, timeRange: "未来365天",
        conditionTree: { id: "root_holiday", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "节假日" },
        ]},
        includeWords: ["春节", "国庆", "五一", "端午", "中秋", "清明", "元旦", "泼水节", "雪顿节"],
      }),
      // ── 活动（本地生活） ──
      defaultDS({ taskId: "ho_activity", taskName: "本地活动采集（城市本地宝集合页）", taskType: "定向爬取", platforms: ["北京本地宝", "上海本地宝", "广州本地宝", "深圳本地宝", "成都本地宝"],
        intervalHours: 12, timeRange: "未来90天",
        conditionTree: { id: "root_activity", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "event_type", operator: "equals", value: "活动" },
        ]},
        includeWords: ["民俗", "时令", "啤酒节", "花节", "灯会", "夜市", "市集", "亲子", "开放"],
        excludeWords: ["招商", "广告", "转让"],
      }),
    ],
    // 入题条件：6 类入题 AND 未来事件 AND 非低热度（详见文档 §5.1）
    conditionTree: { id: "root", type: "group", logic: "AND", children: [
      { id: "qc1", type: "condition", field: "event_type", operator: "in", value: "考试,演唱会,展会,演出赛事,节假日,活动" },
      { id: "qc2", type: "condition", field: "event_start_date", operator: "gte", value: "{T}" },
      { id: "qc3", type: "condition", field: "heat_level", operator: "not_equals", value: "低" },
    ]},
    // 字段配置（详见文档 §4.1 字段配置总表）
    fieldConfigs: [
      { key: "event_name", fieldType: "raw", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "event_source", fieldType: "raw", displayPosition: "detail", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["大麦网", "本地宝", "微博", "抖音", "小红书", "国务院办公厅", "国家公务员局", "研招网", "公考雷达"] },
      { key: "event_type", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["考试", "演唱会", "展会", "演出赛事", "节假日", "活动"] },
      { key: "event_subtype", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["研究生考试", "公务员考试", "演唱会", "音乐节", "车展", "漫展", "马拉松", "电竞", "全国法定", "地域特殊", "民俗活动", "时令活动"] },
      { key: "event_province", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "event_city", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "venue_name", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "event_start_date", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [], isSortable: true, isDefaultSort: true, sortDirection: "asc" },
      { key: "event_end_date", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "heat_level", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["高", "中", "低"] },
      { key: "artist_name", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "ticket_open_time", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "want_count", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "ticket_print_datetime", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "recruit_count", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "affected_regions", fieldType: "raw", displayPosition: "detail", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "activity_scale", fieldType: "raw", displayPosition: "detail", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["大型", "中型", "小型"] },
      { key: "days_to_start", fieldType: "calc", displayPosition: "list", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [] },
    ],
    // 聚类合并管线（详见文档 §6.2：eventType → eventSubType → 省份 → 城市 → 时间）
    mergeNodes: [
      { id: "mn_h1", name: "节点1：按热点类型聚类", enabled: true,
        mergeConditions: [
          { id: "mc1", field: "event_type", operator: "equals", value: "" },
        ],
        mergeConditionTree: { id: "mct_h1", type: "group", logic: "AND", children: [
          { id: "mc1t", type: "condition", field: "event_type", operator: "equals", value: "" },
        ]},
        order: 1,
        displayFields: [
          { key: "event_type", fieldType: "ai", position: "list" },
          { key: "heat_level", fieldType: "ai", position: "list" },
        ],
      },
      { id: "mn_h2", name: "节点2：按细分类型/艺人聚类", enabled: true,
        mergeConditions: [
          { id: "mc2", field: "event_subtype", operator: "equals", value: "" },
          { id: "mc2b", field: "artist_name", operator: "equals", value: "" },
        ],
        mergeConditionTree: { id: "mct_h2", type: "group", logic: "OR", children: [
          { id: "mc2t", type: "condition", field: "event_subtype", operator: "equals", value: "" },
          { id: "mc2tb", type: "condition", field: "artist_name", operator: "equals", value: "" },
        ]},
        order: 2,
        displayFields: [
          { key: "event_subtype", fieldType: "ai", position: "list" },
          { key: "artist_name", fieldType: "raw", position: "list" },
        ],
      },
      { id: "mn_h3", name: "节点3：按省份聚类", enabled: true,
        mergeConditions: [
          { id: "mc3", field: "event_province", operator: "equals", value: "" },
        ],
        mergeConditionTree: { id: "mct_h3", type: "group", logic: "AND", children: [
          { id: "mc3t", type: "condition", field: "event_province", operator: "equals", value: "" },
        ]},
        order: 3,
        displayFields: [
          { key: "event_province", fieldType: "raw", position: "list" },
        ],
      },
      { id: "mn_h4", name: "节点4：按城市聚类", enabled: true,
        mergeConditions: [
          { id: "mc4", field: "event_city", operator: "equals", value: "" },
        ],
        mergeConditionTree: { id: "mct_h4", type: "group", logic: "AND", children: [
          { id: "mc4t", type: "condition", field: "event_city", operator: "equals", value: "" },
        ]},
        order: 4,
        displayFields: [
          { key: "event_city", fieldType: "raw", position: "list" },
          { key: "venue_name", fieldType: "raw", position: "detail" },
        ],
      },
      { id: "mn_h5", name: "节点5：按开始时间聚类", enabled: true,
        mergeConditions: [
          { id: "mc5", field: "event_start_date", operator: "time_within", value: "168" },
        ],
        mergeConditionTree: { id: "mct_h5", type: "group", logic: "AND", children: [
          { id: "mc5t", type: "condition", field: "event_start_date", operator: "time_within", value: "168" },
        ]},
        order: 5,
        displayFields: [
          { key: "event_start_date", fieldType: "raw", position: "list" },
          { key: "days_to_start", fieldType: "calc", position: "list" },
        ],
      },
    ],
    dashboardWidgets: [
      { id: "w7", type: "statCard", title: "未来30天热点活动", metric: "活动数", position: 1, tagField: "event_type" },
      { id: "w8", type: "barChart", title: "按热点类型分布", metric: "事件数", position: 2, tagField: "event_type" },
      { id: "w9", type: "table", title: "高热度事件榜", metric: "热度分级", position: 3, tagField: "heat_level" },
      { id: "w10", type: "pieChart", title: "省份/城市分布", metric: "事件数", position: 4, tagField: "event_city" },
    ],
    createdAt: "2026-02-01", updatedAt: "2026-04-28",
  },
  {
    id: "social-ranking", name: "社媒榜单主题",
    description: "聚合抖音/微博/小红书/百度/快手 社媒实时榜、旅游榜、同城榜、景点榜、酒店榜",
    owner: "王五", type: "builtin", status: "active", icon: "📈",
    dataSources: [
      // ── 实时榜 ──
      defaultDS({ taskId: "sr_dy_rt", taskName: "抖音实时热点榜", taskType: "榜单", platforms: ["抖音"],
        intervalHours: 1, timeRange: "实时",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "platform", operator: "equals", value: "抖音" },
        ]},
      }),
      defaultDS({ taskId: "sr_wb_rt", taskName: "微博实时热搜榜", taskType: "榜单", platforms: ["微博"],
        intervalHours: 1, timeRange: "实时",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "platform", operator: "equals", value: "微博" },
        ]},
      }),
      defaultDS({ taskId: "sr_bd_rt", taskName: "百度实时热搜榜", taskType: "榜单", platforms: ["百度"],
        intervalHours: 1, timeRange: "实时",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "platform", operator: "equals", value: "百度" },
        ]},
      }),
      defaultDS({ taskId: "sr_ks_rt", taskName: "快手实时热点榜", taskType: "榜单", platforms: ["快手"],
        intervalHours: 1, timeRange: "实时",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "platform", operator: "equals", value: "快手" },
        ]},
      }),
      // ── 旅游榜 ──
      defaultDS({ taskId: "sr_wb_travel", taskName: "微博旅游榜单", taskType: "榜单", platforms: ["微博"],
        intervalHours: 24, timeRange: "每日 12:00 当日数据",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "topic", operator: "contains", value: "旅游" },
        ]},
        includeWords: ["旅游", "出行", "景点", "目的地", "民宿", "攻略"],
      }),
      defaultDS({ taskId: "sr_xhs_travel", taskName: "小红书旅游榜单", taskType: "榜单", platforms: ["小红书"],
        intervalHours: 24, timeRange: "每日 12:00 昨日数据",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "topic", operator: "contains", value: "旅游" },
        ]},
        includeWords: ["旅行", "Citywalk", "打卡", "民宿", "种草", "攻略"],
      }),
      defaultDS({ taskId: "sr_dy_travel", taskName: "抖音旅游榜单", taskType: "榜单", platforms: ["抖音"],
        intervalHours: 6, timeRange: "实时",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "topic", operator: "contains", value: "旅游" },
        ]},
        includeWords: ["旅游", "景点", "自驾", "徒步"],
      }),
      // ── 同城榜 ──
      defaultDS({ taskId: "sr_wb_city", taskName: "微博同城榜单",
        taskType: "榜单", platforms: ["微博"], intervalHours: 1, timeRange: "实时",
        taskParams: [{ platforms: ["微博"], topics: ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "西安"] }],
        conditionTree: { id: "root", type: "group", logic: "OR", children: [
          { id: "c1", type: "condition", field: "topic", operator: "contains", value: "同城" },
        ]},
      }),
      defaultDS({ taskId: "sr_dy_city", taskName: "抖音同城榜单",
        taskType: "榜单", platforms: ["抖音"], intervalHours: 1, timeRange: "实时",
        taskParams: [{ platforms: ["抖音"], topics: ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "西安"] }],
      }),
      // ── POI ──
      defaultDS({ taskId: "sr_attractions", taskName: "景点热度榜", taskType: "榜单", platforms: ["微博", "小红书", "抖音"],
        intervalHours: 24, timeRange: "日榜 T-2 / 月榜",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "topic", operator: "equals", value: "旅游" },
        ]},
        includeWords: ["景点", "景区", "打卡", "门票"],
      }),
      defaultDS({ taskId: "sr_hotels", taskName: "酒店热度榜", taskType: "榜单", platforms: ["微博", "小红书", "抖音"],
        intervalHours: 24, timeRange: "日榜 T-2 / 月榜",
        conditionTree: { id: "root", type: "group", logic: "AND", children: [
          { id: "c1", type: "condition", field: "topic", operator: "equals", value: "酒店住宿" },
        ]},
        includeWords: ["酒店", "民宿", "度假", "入住"],
      }),
    ],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [] },
    fieldConfigs: [
      { key: "platform", fieldType: "raw", displayPosition: "list", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["微博", "抖音", "小红书", "百度", "快手"] },
      { key: "publish_time", fieldType: "raw", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "topic", fieldType: "ai", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["明星娱乐", "旅游目的地", "节假出行", "社会民生", "美食", "酒店住宿", "交通出行", "户外活动", "文化展览", "演出活动"] },
      { key: "heat_score", fieldType: "calc", displayPosition: "both", isFilter: true, filterType: "text", hasSystemEnum: false, enumValues: [], isSortable: true, isDefaultSort: true, sortDirection: "desc" },
      { key: "growth_rate", fieldType: "calc", displayPosition: "list", isFilter: false, filterType: "text", hasSystemEnum: false, enumValues: [] },
      { key: "ferment_level", fieldType: "calc", displayPosition: "both", isFilter: true, filterType: "enum", hasSystemEnum: true, enumValues: ["低", "中", "快"] },
    ],
    mergeNodes: [
      { id: "sr_mn1", name: "跨平台同话题聚合", enabled: true,
        mergeConditions: [
          { id: "mc1", field: "content", operator: "similarity_gte", value: "75" },
          { id: "mc2", field: "publish_time", operator: "time_within", value: "12" },
        ],
        mergeConditionTree: {
          id: "mct_sr1", type: "group", logic: "AND", children: [
            { id: "mc1t", type: "condition", field: "content", operator: "similarity_gte", value: "75" },
            { id: "mc2t", type: "condition", field: "publish_time", operator: "time_within", value: "12" },
          ],
        },
        order: 1,
        displayFields: [
          { key: "platform", fieldType: "raw", position: "list" },
          { key: "heat_score", fieldType: "calc", position: "both" },
        ],
      },
      { id: "sr_mn2", name: "POI 名称归并", enabled: true,
        mergeConditions: [
          { id: "mc3", field: "topic", operator: "equals", value: "" },
        ],
        mergeConditionTree: {
          id: "mct_sr2", type: "group", logic: "AND", children: [
            { id: "mc3t", type: "condition", field: "topic", operator: "equals", value: "" },
          ],
        },
        order: 2,
        displayFields: [
          { key: "platform", fieldType: "raw", position: "list" },
        ],
      },
    ],
    dashboardWidgets: [
      { id: "sr_w1", type: "statCard", title: "在榜话题总数", metric: "话题数", position: 1, tagField: "topic" },
      { id: "sr_w2", type: "statCard", title: "旅游业务相关", metric: "旅游话题数", position: 2, tagField: "topic" },
      { id: "sr_w3", type: "lineChart", title: "热度趋势", metric: "时间", position: 3, tagField: "publish_time" },
      { id: "sr_w4", type: "barChart", title: "平台分布", metric: "平台", position: 4, tagField: "platform" },
      { id: "sr_w5", type: "table", title: "热门话题榜", metric: "热度", position: 5, tagField: "heat_score" },
    ],
    createdAt: "2026-04-15", updatedAt: "2026-04-22",
  },
  {
    id: "experience", name: "产品体验主题", description: "用户反馈收集、产品问题洞察", owner: "赵六",
    type: "builtin", status: "active", icon: "💡",
    dataSources: [defaultDS({ taskId: "t6", taskName: "用户反馈监控", platforms: ["小红书", "黑猫投诉", "微博"],
      conditionTree: { id: "root", type: "group", logic: "AND", children: [{ id: "c1", type: "condition", field: "intent", operator: "equals", value: "用户反馈" }] },
    })],
    conditionTree: { id: "root", type: "group", logic: "AND", children: [] },
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
  const location = useLocation();
  const [themes, setThemes] = useState<ThemeConfig[]>(defaultThemes);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  // When navigated from CollectionTasks, optionally jump to a specific step + auto-expand a data source
  const [dialogInitialStep, setDialogInitialStep] = useState<number | undefined>(undefined);
  const [dialogInitialDsId, setDialogInitialDsId] = useState<string | undefined>(undefined);

  // Auto-open edit dialog or focus row when navigated with query params (e.g. from CollectionTasks edit button)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const themeId = params.get("themeId");
    const action = params.get("action");
    const stepParam = params.get("step");
    const dsTaskId = params.get("dsTaskId");
    if (themeId) {
      const target = themes.find(t => t.id === themeId);
      if (target) {
        setSelectedTheme(target);
        if (action === "edit") {
          setEditingTheme(target);
          // step param is 1-indexed in URL for clarity (1=基本信息, 2=数据源, 3=条件字段, 4=合并管线)
          const parsedStep = stepParam ? Math.max(0, parseInt(stepParam, 10) - 1) : undefined;
          setDialogInitialStep(Number.isFinite(parsedStep as number) ? parsedStep : undefined);
          setDialogInitialDsId(dsTaskId || undefined);
          setDialogOpen(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  const [dashboardDialogTheme, setDashboardDialogTheme] = useState<ThemeConfig | null>(null);
  const [permissionDialogTheme, setPermissionDialogTheme] = useState<ThemeConfig | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock current user role — in real app this comes from auth context.
  // Super admin sees all data by default and can manage permissions on every theme.
  const currentUser = { name: "当前用户", isSuperAdmin: true };

  const filteredThemes = themes.filter(t => {
    const matchSearch = !search || t.name.includes(search) || t.description.includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setDialogInitialStep(undefined);
    setDialogInitialDsId(undefined);
    setDialogOpen(true);
  };
  const handleEditTheme = (theme: ThemeConfig) => {
    setEditingTheme(theme);
    setDialogInitialStep(undefined);
    setDialogInitialDsId(undefined);
    setDialogOpen(true);
  };
  const handleSaveTheme = (theme: ThemeConfig) => {
    setThemes(prev => {
      const exists = prev.find(t => t.id === theme.id);
      return exists ? prev.map(t => t.id === theme.id ? theme : t) : [...prev, theme];
    });
    setSelectedTheme(theme);
    setDialogOpen(false);
    setDialogInitialStep(undefined);
    setDialogInitialDsId(undefined);
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索主题名称或描述..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px]">主题名称</TableHead>
              <TableHead className="text-center w-[80px]">数据源</TableHead>
              <TableHead className="text-center w-[80px]">合并节点</TableHead>
              <TableHead className="w-[100px]">负责人</TableHead>
              <TableHead className="w-[100px]">更新人</TableHead>
              <TableHead className="w-[110px]">数据权限</TableHead>
              <TableHead className="w-[90px]">状态</TableHead>
              <TableHead className="w-[110px]">更新时间</TableHead>
              <TableHead className="text-right w-[170px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredThemes.map(theme => {
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
                  <TableCell className="text-center">
                    {activeNodes.length > 0 ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">
                        <GitMerge className="w-2.5 h-2.5 mr-0.5" />{activeNodes.length}
                      </Badge>
                    ) : <span className="text-sm text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{theme.owner}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{theme.owner}</TableCell>
                  <TableCell>
                    {theme.permissionMode === "selected" ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-500/40">
                        <UserPlus className="w-2.5 h-2.5 mr-0.5" />指定 {theme.allowedUsers?.length ?? 0} 人
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                        <Shield className="w-2.5 h-2.5 mr-0.5" />全局开放
                      </Badge>
                    )}
                  </TableCell>
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
                      <button onClick={e => { e.stopPropagation(); setPermissionDialogTheme(theme); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="数据权限管理">
                        <Shield className="w-3.5 h-3.5" />
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

      <ThemeConfigDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) { setDialogInitialStep(undefined); setDialogInitialDsId(undefined); }
        }}
        theme={editingTheme}
        onSave={handleSaveTheme}
        initialStep={dialogInitialStep}
        initialDataSourceId={dialogInitialDsId}
      />
      {dashboardDialogTheme && (
        <DashboardBuilderDialog theme={dashboardDialogTheme} onClose={() => setDashboardDialogTheme(null)}
          onSave={updated => { handleSaveTheme(updated); setDashboardDialogTheme(null); }} />
      )}
      {permissionDialogTheme && (
        <DataPermissionDialog
          theme={permissionDialogTheme}
          currentUser={currentUser}
          onClose={() => setPermissionDialogTheme(null)}
          onSave={updated => { handleSaveTheme(updated); setPermissionDialogTheme(null); }}
        />
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

// ── Data Permission Dialog ──────────────────────────────────

interface OrgUser { name: string; employeeId: string; dept?: string; }

const ALL_ORG_USERS: OrgUser[] = [
  { name: "张三", employeeId: "E001", dept: "舆情中心" },
  { name: "李四", employeeId: "E002", dept: "市场部" },
  { name: "王五", employeeId: "E003", dept: "运营部" },
  { name: "赵六", employeeId: "E004", dept: "产品部" },
  { name: "孙七", employeeId: "E005", dept: "客服部" },
  { name: "周八", employeeId: "E006", dept: "公关部" },
  { name: "吴九", employeeId: "E007", dept: "技术部" },
  { name: "郑十", employeeId: "E008", dept: "数据部" },
  { name: "小张", employeeId: "E101", dept: "客服A组" },
  { name: "小李", employeeId: "E102", dept: "客服B组" },
  { name: "小王", employeeId: "E103", dept: "客服C组" },
  { name: "赵总监", employeeId: "M001", dept: "业务" },
  { name: "孙总监", employeeId: "M002", dept: "公关" },
  { name: "陈经理", employeeId: "M003", dept: "运营" },
  { name: "刘工", employeeId: "E201", dept: "技术" },
  { name: "杨工", employeeId: "E202", dept: "技术" },
  { name: "黄分析师", employeeId: "A001", dept: "数据" },
  { name: "周分析师", employeeId: "A002", dept: "数据" },
];

const findUser = (key: string): OrgUser | undefined =>
  ALL_ORG_USERS.find(u => u.name === key || u.employeeId === key);

const userLabel = (key: string): string => {
  const u = findUser(key);
  return u ? `${u.name} (${u.employeeId})` : key;
};

function UserMultiPicker({
  value, onChange, disabled, placeholder, accentClass,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  accentClass?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = query.trim()
    ? ALL_ORG_USERS.filter(u =>
        !value.includes(u.name) &&
        (u.name.includes(query) || u.employeeId.toLowerCase().includes(query.toLowerCase()) || (u.dept ?? "").includes(query))
      ).slice(0, 8)
    : ALL_ORG_USERS.filter(u => !value.includes(u.name)).slice(0, 8);

  const add = (name: string) => {
    if (!value.includes(name)) onChange([...value, name]);
    setQuery("");
  };
  const remove = (name: string) => onChange(value.filter(v => v !== name));

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      const match = ALL_ORG_USERS.find(u => u.name === query.trim() || u.employeeId.toLowerCase() === query.trim().toLowerCase());
      if (match) add(match.name);
      else if (suggestions[0]) add(suggestions[0].name);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-1.5 min-h-[40px] p-1.5 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
        {value.map(v => (
          <Badge key={v} className={`text-[10px] gap-1 pr-1 ${accentClass ?? "bg-primary/15 text-primary border-0"}`}>
            {userLabel(v)}
            <button type="button" onClick={() => remove(v)} className="hover:text-destructive">
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ))}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          placeholder={value.length === 0 ? (placeholder ?? "输入姓名或工号，回车添加") : ""}
          disabled={disabled}
          className="flex-1 min-w-[140px] bg-transparent text-xs px-1 outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-popover border border-border rounded-md shadow-md">
          {suggestions.map(u => (
            <button
              type="button"
              key={u.employeeId}
              onMouseDown={(e) => { e.preventDefault(); add(u.name); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <span className="text-foreground">{u.name}</span>
              <span className="text-muted-foreground">{u.employeeId} · {u.dept}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md px-3 py-2 text-xs text-muted-foreground">
          未找到匹配的用户
        </div>
      )}
    </div>
  );
}

export function DataPermissionDialog({
  theme, currentUser, onClose, onSave,
}: {
  theme: ThemeConfig;
  currentUser: { name: string; isSuperAdmin: boolean };
  onClose: () => void;
  onSave: (t: ThemeConfig) => void;
}) {
  const [mode, setMode] = useState<"global" | "selected">(theme.permissionMode || "global");
  const [allowedUsers, setAllowedUsers] = useState<string[]>(theme.allowedUsers || []);
  const [themeAdmins, setThemeAdmins] = useState<string[]>(theme.themeAdmins || []);

  const isThemeAdmin = themeAdmins.includes(currentUser.name);
  const canEditAdmins = currentUser.isSuperAdmin;
  const canEditUsers = currentUser.isSuperAdmin || isThemeAdmin;
  const canSave = canEditAdmins || canEditUsers;

  const handleSave = () => {
    if (!canSave) {
      toast({ title: "无权限", description: "仅超管或主题管理员可修改数据权限", variant: "destructive" });
      return;
    }
    onSave({
      ...theme,
      permissionMode: mode,
      allowedUsers: mode === "selected" ? allowedUsers : [],
      themeAdmins: mode === "selected" ? themeAdmins : [],
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    toast({ title: "已保存", description: `「${theme.name}」数据权限已更新` });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> 数据权限管理 — {theme.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            超管默认拥有所有主题的数据权限；选定开放模式下，超管指定主题管理员，主题管理员可为该主题授权用户。
          </DialogDescription>
        </DialogHeader>

        {/* Current user role */}
        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-md text-xs">
          <Crown className={`w-3.5 h-3.5 ${currentUser.isSuperAdmin ? "text-amber-500" : "text-muted-foreground"}`} />
          <span className="text-muted-foreground">当前身份：</span>
          <span className="font-medium text-foreground">{currentUser.name}</span>
          {currentUser.isSuperAdmin && <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-0">超管</Badge>}
          {!currentUser.isSuperAdmin && isThemeAdmin && (
            <Badge className="text-[10px] bg-primary/15 text-primary border-0">主题管理员</Badge>
          )}
          {!canSave && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40">只读</Badge>}
        </div>

        {/* Permission mode */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">数据可见范围</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "global" | "selected")} className="space-y-2">
            <label className="flex items-start gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="global" id="perm-global" className="mt-0.5" disabled={!canEditAdmins} />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 全局开放
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">所有登录用户均可查看本主题数据，无需指定管理员</div>
              </div>
            </label>
            <label className="flex items-start gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="selected" id="perm-selected" className="mt-0.5" disabled={!canEditAdmins} />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> 选定人员开放
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  仅授权用户、主题管理员与超管可查看；由超管指定主题管理员，主题管理员可添加授权用户
                </div>
              </div>
            </label>
          </RadioGroup>
          {!canEditAdmins && (
            <div className="text-[11px] text-muted-foreground">仅超管可切换数据可见范围</div>
          )}
        </div>

        {mode === "selected" && (
          <>
            {/* Theme admins (super admin manages) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" /> 主题管理员（{themeAdmins.length}）
                {!canEditAdmins && <Badge variant="outline" className="text-[10px] ml-1">仅超管可设置</Badge>}
              </Label>
              <div className="text-[11px] text-muted-foreground">由超管指定。主题管理员可为该主题添加/移除授权用户</div>
              <UserMultiPicker
                value={themeAdmins}
                onChange={setThemeAdmins}
                disabled={!canEditAdmins}
                placeholder="输入姓名或工号指定主题管理员"
                accentClass="bg-amber-500/15 text-amber-600 border-0"
              />
            </div>

            {/* Allowed users (theme admin or super admin manages) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">授权用户（{allowedUsers.length}）</Label>
              <div className="text-[11px] text-muted-foreground">
                支持输入姓名或工号，回车确认；可批量添加多个用户
              </div>
              <UserMultiPicker
                value={allowedUsers}
                onChange={setAllowedUsers}
                disabled={!canEditUsers}
                placeholder="输入姓名或工号添加授权用户"
              />
              {!canEditUsers && (
                <div className="text-[11px] text-muted-foreground">仅超管或主题管理员可添加授权用户</div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave}>保存权限</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
