// In-memory store for alert messages that have actually been pushed out.
// These are the receipts/history records — different from rules in themeAlertStore.

import { useEffect, useState } from "react";

export type AlertStatus = "pushed" | "failed" | "pending" | "read";
export type AlertChannelType = "wechat_personal" | "wechat_group";

export interface AlertMessage {
  id: string;
  ruleId: string;
  ruleName: string;
  themeId: string;
  themeName: string;
  /** 触发对象：节点维度时为事件，单条维度时为文章 */
  triggerType: "event" | "article";
  triggerTitle: string;
  triggerSubject?: string;
  triggerNodeName?: string;
  level: "warning" | "critical";
  /** 命中条件摘要，例如 "事件风险=重大；文章数≥10" */
  hitConditions: string;
  /** 推送渠道明细 */
  channels: { type: AlertChannelType; target: string }[];
  status: AlertStatus;
  /** 推送时间 ISO */
  pushedAt: string;
  /** 文章数（节点维度） */
  articleCount?: number;
  /** 备注/失败原因 */
  remark?: string;
}

const seed: AlertMessage[] = [
  {
    id: "am-1001",
    ruleId: "tar-1",
    ruleName: "客服重大舆情推送",
    themeId: "sentiment",
    themeName: "舆情主题",
    triggerType: "event",
    triggerTitle: "中央网信办约谈多家OTA平台整治抢票乱象",
    triggerNodeName: "事件合并",
    level: "critical",
    hitConditions: "事件风险=重大；事件首发时间 within 14",
    channels: [
      { type: "wechat_personal", target: "陈佳燕-1227152" },
      { type: "wechat_group", target: "客服重大舆情群" },
    ],
    status: "pushed",
    pushedAt: "2026-04-22 09:32:15",
    articleCount: 12,
  },
  {
    id: "am-1002",
    ruleId: "tar-2",
    ruleName: "高互动事件预警",
    themeId: "sentiment",
    themeName: "舆情主题",
    triggerType: "event",
    triggerTitle: "演唱会抢票黄牛代抢被曝光",
    triggerNodeName: "事件合并",
    level: "warning",
    hitConditions: "事件总评论 ≥ 100；文章数 ≥ 10",
    channels: [{ type: "wechat_personal", target: "张三" }],
    status: "pushed",
    pushedAt: "2026-04-22 08:10:42",
    articleCount: 14,
  },
  {
    id: "am-1003",
    ruleId: "tar-3",
    ruleName: "单条负面舆情即时预警",
    themeId: "sentiment",
    themeName: "舆情主题",
    triggerType: "article",
    triggerTitle: "用户投诉APP退款流程繁琐",
    level: "critical",
    hitConditions: "初始风险等级 = 重大",
    channels: [{ type: "wechat_personal", target: "王五" }],
    status: "read",
    pushedAt: "2026-04-21 22:48:11",
  },
  {
    id: "am-1004",
    ruleId: "tar-4",
    ruleName: "热点事件聚合预警",
    themeId: "hotspot",
    themeName: "热点洞察主题",
    triggerType: "event",
    triggerTitle: "AI模型新版本发布引发行业讨论",
    triggerNodeName: "热点事件聚合",
    level: "warning",
    hitConditions: "事件规模 ≥ 5",
    channels: [{ type: "wechat_group", target: "热点洞察周报群" }],
    status: "pushed",
    pushedAt: "2026-04-21 18:05:00",
    articleCount: 23,
  },
  {
    id: "am-1005",
    ruleId: "tar-1",
    ruleName: "客服重大舆情推送",
    themeId: "sentiment",
    themeName: "舆情主题",
    triggerType: "event",
    triggerTitle: "购票系统短时故障引发投诉",
    triggerNodeName: "事件合并",
    level: "critical",
    hitConditions: "事件风险=重大",
    channels: [
      { type: "wechat_personal", target: "陈佳燕-1227152" },
      { type: "wechat_group", target: "客服重大舆情群" },
    ],
    status: "failed",
    pushedAt: "2026-04-21 14:22:09",
    articleCount: 8,
    remark: "群机器人 webhook 请求超时",
  },
  {
    id: "am-1006",
    ruleId: "tar-2",
    ruleName: "高互动事件预警",
    themeId: "sentiment",
    themeName: "舆情主题",
    triggerType: "event",
    triggerTitle: "明星演唱会改期引发退票潮",
    triggerNodeName: "事件合并",
    level: "warning",
    hitConditions: "事件总点赞 ≥ 200；文章数 ≥ 10",
    channels: [{ type: "wechat_personal", target: "张三" }],
    status: "pushed",
    pushedAt: "2026-04-20 16:40:33",
    articleCount: 26,
  },
  {
    id: "am-1007",
    ruleId: "tar-4",
    ruleName: "热点事件聚合预警",
    themeId: "hotspot",
    themeName: "热点洞察主题",
    triggerType: "event",
    triggerTitle: "新能源汽车补贴政策调整",
    triggerNodeName: "热点事件聚合",
    level: "warning",
    hitConditions: "事件规模 ≥ 5",
    channels: [{ type: "wechat_group", target: "热点洞察周报群" }],
    status: "pending",
    pushedAt: "2026-04-22 10:00:00",
    articleCount: 6,
    remark: "等待下一汇总时段推送",
  },
];

let messages: AlertMessage[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const alertMessageStore = {
  getAll(): AlertMessage[] {
    return messages;
  },
  markRead(id: string) {
    messages = messages.map((m) => (m.id === id ? { ...m, status: "read" as AlertStatus } : m));
    emit();
  },
  remove(id: string) {
    messages = messages.filter((m) => m.id !== id);
    emit();
  },
  resend(id: string) {
    messages = messages.map((m) => (m.id === id ? { ...m, status: "pushed" as AlertStatus, pushedAt: new Date().toISOString().replace("T", " ").slice(0, 19), remark: undefined } : m));
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export function useAlertMessages(): AlertMessage[] {
  const [, setTick] = useState(0);
  useEffect(() => alertMessageStore.subscribe(() => setTick((t) => t + 1)), []);
  return alertMessageStore.getAll();
}

/** 工具：判断时间戳是否落在昨天/近七天 */
export const isYesterday = (ts: string) => {
  const d = new Date(ts.replace(" ", "T"));
  const now = new Date();
  const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return d.getFullYear() === yest.getFullYear() && d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate();
};
export const isWithin7Days = (ts: string) => {
  const d = new Date(ts.replace(" ", "T")).getTime();
  return Date.now() - d <= 7 * 24 * 3600 * 1000;
};
