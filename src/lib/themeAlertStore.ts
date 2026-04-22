// Shared in-memory store for theme alert rules.
// Bridges 洞察主题预警设置 (e.g. SentimentDetail → EventAlert) and 数据中心-预警管理-预警配置 (ThemeRules).
// Uses a tiny pub/sub so React hook `useThemeAlerts` re-renders subscribers when rules change.

import { useEffect, useState } from "react";

export type TriggerDimensionKind = "single" | "node";

export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface PushChannel {
  type: "wechat";
  personal: boolean;
  group: boolean;
  personalTargets: string[];
  groupWebhook: string;
}

export type PushTiming = "realtime" | "scheduled" | "threshold";
export type ConditionLogic = "none" | "any" | "all";

export interface ThemeAlertRule {
  id: string;
  themeId: string;
  themeName: string;
  name: string;
  enabled: boolean;
  triggerDimension: TriggerDimensionKind;
  /** When triggerDimension === "node", references a mergeNode id within the theme. */
  triggerNodeId?: string;
  triggerNodeName?: string;
  conditionLogic: ConditionLogic;
  conditions: RuleCondition[];
  /** 推送时机：realtime 实时 / threshold 文章数阈值 / scheduled 定时汇总 */
  pushTiming: PushTiming;
  /** 当 pushTiming === "threshold" 时生效：节点下文章数达到阈值才推送 */
  articleThreshold?: number;
  /** 节点维度下：同一事件只推送一次（后续新增文章不重复推） */
  pushOnce?: boolean;
  scheduledInterval?: "hour" | "day" | "week";
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  channels: PushChannel[];
  level: "warning" | "critical";
  /** 累计触发次数（保留用于历史统计） */
  triggerCount: number;
  /** 昨天触发次数 */
  yesterdayTriggerCount?: number;
  /** 近 7 天触发次数 */
  weekTriggerCount?: number;
  createdAt: string;
}

const seed: ThemeAlertRule[] = [
  {
    id: "tar-1",
    themeId: "sentiment",
    themeName: "舆情主题",
    name: "客服重大舆情推送",
    enabled: true,
    triggerDimension: "node",
    triggerNodeId: "mn1",
    triggerNodeName: "事件合并",
    conditionLogic: "all",
    conditions: [
      { field: "event_risk", operator: "=", value: "重大" },
      { field: "event_time", operator: "within", value: "14" },
    ],
    pushTiming: "realtime",
    pushOnce: true,
    channels: [
      { type: "wechat", personal: true, group: true, personalTargets: ["陈佳燕-1227152"], groupWebhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c4ee8b65..." },
    ],
    level: "critical",
    triggerCount: 5,
    yesterdayTriggerCount: 2,
    weekTriggerCount: 9,
    createdAt: "2026-03-20",
  },
  {
    id: "tar-2",
    themeId: "sentiment",
    themeName: "舆情主题",
    name: "高互动事件预警",
    enabled: true,
    triggerDimension: "node",
    triggerNodeId: "mn1",
    triggerNodeName: "事件合并",
    conditionLogic: "any",
    conditions: [
      { field: "event_comments", operator: ">=", value: "100" },
      { field: "event_likes", operator: ">=", value: "200" },
    ],
    pushTiming: "threshold",
    articleThreshold: 10,
    pushOnce: true,
    channels: [{ type: "wechat", personal: true, group: false, personalTargets: ["张三"], groupWebhook: "" }],
    level: "warning",
    triggerCount: 23,
    yesterdayTriggerCount: 4,
    weekTriggerCount: 18,
    createdAt: "2026-03-15",
  },
  {
    id: "tar-3",
    themeId: "sentiment",
    themeName: "舆情主题",
    name: "单条负面舆情即时预警",
    enabled: true,
    triggerDimension: "single",
    conditionLogic: "all",
    conditions: [{ field: "importance", operator: "=", value: "重大" }],
    pushTiming: "realtime",
    channels: [{ type: "wechat", personal: true, group: false, personalTargets: ["王五"], groupWebhook: "" }],
    level: "critical",
    triggerCount: 12,
    yesterdayTriggerCount: 1,
    weekTriggerCount: 7,
    createdAt: "2026-03-10",
  },
  {
    id: "tar-4",
    themeId: "hotspot",
    themeName: "热点洞察主题",
    name: "热点事件聚合预警",
    enabled: true,
    triggerDimension: "node",
    triggerNodeId: "mn3",
    triggerNodeName: "热点事件聚合",
    conditionLogic: "all",
    conditions: [{ field: "event_count", operator: ">=", value: "5" }],
    pushTiming: "scheduled",
    scheduledInterval: "day",
    scheduledTimeStart: "09:00",
    scheduledTimeEnd: "18:00",
    pushOnce: true,
    channels: [{ type: "wechat", personal: false, group: true, personalTargets: [], groupWebhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=hotspot..." }],
    level: "warning",
    triggerCount: 45,
    yesterdayTriggerCount: 6,
    weekTriggerCount: 28,
    createdAt: "2026-03-01",
  },
  {
    id: "tar-5",
    themeId: "experience",
    themeName: "产品体验主题",
    name: "严重体验问题预警",
    enabled: false,
    triggerDimension: "single",
    conditionLogic: "all",
    conditions: [{ field: "importance", operator: "=", value: "重大" }],
    pushTiming: "realtime",
    channels: [{ type: "wechat", personal: true, group: true, personalTargets: ["赵六"], groupWebhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=exp..." }],
    level: "critical",
    triggerCount: 8,
    yesterdayTriggerCount: 0,
    weekTriggerCount: 3,
    createdAt: "2026-03-05",
  },
];

let rules: ThemeAlertRule[] = [...seed];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const themeAlertStore = {
  getAll(): ThemeAlertRule[] {
    return rules;
  },
  getByTheme(themeId: string): ThemeAlertRule[] {
    return rules.filter((r) => r.themeId === themeId);
  },
  upsert(rule: ThemeAlertRule) {
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) rules = rules.map((r) => (r.id === rule.id ? rule : r));
    else rules = [...rules, rule];
    emit();
  },
  remove(id: string) {
    rules = rules.filter((r) => r.id !== id);
    emit();
  },
  toggle(id: string) {
    rules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

/** React hook returning all rules (or filtered by themeId) and re-rendering on change. */
export function useThemeAlerts(themeId?: string): ThemeAlertRule[] {
  const [, setTick] = useState(0);
  useEffect(() => themeAlertStore.subscribe(() => setTick((t) => t + 1)), []);
  return themeId ? themeAlertStore.getByTheme(themeId) : themeAlertStore.getAll();
}

export const newRuleId = () => `tar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
