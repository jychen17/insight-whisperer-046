import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText, Eye, Download, Trash2, Search, Calendar,
  AlertTriangle, Settings2, ChevronRight,
  Repeat, Zap, ArrowLeft, Pencil, Check, Plus, LayoutTemplate, Sparkles, X, Clock,
  Bell, Users, User as UserIcon, Layers, Link2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

type ScheduleType = "once" | "recurring";
type RecurringFrequency = "daily" | "weekly" | "monthly";
type ConditionLogic = "any" | "all" | "none";

type PushTarget =
  | { id: string; type: "person"; name: string; empId: string }
  | { id: string; type: "group"; name: string; webhook: string };
type PushTiming =
  | { mode: "realtime" }
  | { mode: "scheduled"; time: string }; // HH:mm for daily/weekly/monthly

interface PushConfig {
  enabled: boolean;
  channel: "wecom"; // 当前仅支持企业微信
  targets: PushTarget[];
  timing: PushTiming;
}

interface ReportIssue {
  id: string;
  period: string;
  createdAt: string;
  status: "completed" | "generating" | "failed";
  pages: number;
  size: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  values: string[];   // for include/exclude lists (chips)
  value?: string;     // single-value (e.g., 等于 业务类型)
  numValue?: number;  // for "过去几天内"
}

interface ReportConfigDetail {
  scheduleType: ScheduleType;
  frequency?: RecurringFrequency;
  weeklyStartDay?: number; // 1=Mon ... 7=Sun
  timeField?: string;      // 发布时间 / 收录时间
  themeName: string;
  conditionLogic: ConditionLogic;
  conditions: RuleCondition[];
  templateId: string;
  templateName: string;
  push?: PushConfig;
}

interface Report {
  id: string;
  title: string;
  type: string;
  theme: string;
  status: "completed" | "generating" | "failed";
  configCreatedAt: string;
  createdAt: string;
  pages: number;
  format: string;
  author: string;
  size: string;
  scheduleType: ScheduleType;
  frequency?: RecurringFrequency;
  templateId?: string;
  templateName?: string;
  issues?: ReportIssue[];
  config?: ReportConfigDetail;
}

// ------- Field catalog for condition builder -------
type FieldDef = { key: string; label: string; type: "text" | "enum" | "time" | "lockset"; options?: string[] };
const FIELD_CATALOG: FieldDef[] = [
  { key: "business", label: "业务类型", type: "enum", options: ["机票", "酒店", "金服", "度假", "火车票", "用车"] },
  { key: "scope", label: "业务范围", type: "enum", options: ["国内", "国际", "港澳台"] },
  { key: "title", label: "标题", type: "text" },
  { key: "content", label: "内容", type: "text" },
  { key: "emotion", label: "情感", type: "enum", options: ["正面", "中性", "负面"] },
  { key: "platform", label: "平台", type: "enum", options: ["微博", "小红书", "抖音", "新闻", "App Store"] },
  { key: "publishTime", label: "发布时间", type: "time" },
  { key: "collectTime", label: "收录时间", type: "time" },
  // 数据集锁定（来自外部预填）
  { key: "eventSet", label: "事件集合", type: "lockset" },
  { key: "articleSet", label: "文章集合", type: "lockset" },
];
const TIME_FIELD_KEYS = ["publishTime", "collectTime"];
const LOCKSET_FIELD_KEYS = ["eventSet", "articleSet"];

const OPERATORS_BY_TYPE: Record<FieldDef["type"], { value: string; label: string; mode: "single" | "chips" | "days" | "lockset" }[]> = {
  enum: [
    { value: "eq", label: "等于", mode: "single" },
    { value: "neq", label: "不等于", mode: "single" },
    { value: "in", label: "包含任意", mode: "chips" },
    { value: "nin", label: "不包含任意", mode: "chips" },
  ],
  text: [
    { value: "contains", label: "包含任意", mode: "chips" },
    { value: "ncontains", label: "不包含任意", mode: "chips" },
  ],
  time: [
    { value: "lastNDays", label: "过去几天内", mode: "days" },
    { value: "lastNHours", label: "过去几小时内", mode: "days" },
  ],
  lockset: [
    { value: "in_set", label: "属于已选集合", mode: "lockset" },
  ],
};

const fieldDef = (key: string) => FIELD_CATALOG.find(f => f.key === key);
const operatorMode = (fkey: string, opval: string) => {
  const f = fieldDef(fkey); if (!f) return "single";
  return OPERATORS_BY_TYPE[f.type].find(o => o.value === opval)?.mode ?? "single";
};
const operatorLabel = (fkey: string, opval: string) => {
  const f = fieldDef(fkey); if (!f) return opval;
  return OPERATORS_BY_TYPE[f.type].find(o => o.value === opval)?.label ?? opval;
};
const defaultOperator = (fkey: string) => {
  const f = fieldDef(fkey); if (!f) return "eq";
  return OPERATORS_BY_TYPE[f.type][0].value;
};

const formatCondition = (c: RuleCondition): string => {
  const f = fieldDef(c.field);
  if (!f) return "";
  const op = operatorLabel(c.field, c.operator);
  const mode = operatorMode(c.field, c.operator);
  if (mode === "lockset") return `${f.label} ${op} {${c.values.length} 项}`;
  if (mode === "days") return `${f.label} ${op} ${c.numValue ?? 0}`;
  if (mode === "chips") return `${f.label} ${op} [${c.values.join(", ")}]`;
  return `${f.label} ${op} ${c.value ?? ""}`;
};

const conditionLogicJoin: Record<ConditionLogic, string> = { any: " OR ", all: " AND ", none: "" };
const formatExpression = (logic: ConditionLogic, conds: RuleCondition[]) => {
  if (logic === "none" || conds.length === 0) return "—";
  return conds.map(formatCondition).join(conditionLogicJoin[logic]);
};

// ------- Sample data -------
const buildSentimentConfig = (): ReportConfigDetail => ({
  scheduleType: "recurring",
  frequency: "daily",
  timeField: "publishTime",
  themeName: "舆情主题",
  conditionLogic: "all",
  conditions: [
    { id: "c1", field: "business", operator: "eq", values: [], value: "机票" },
    { id: "c2", field: "scope", operator: "eq", values: [], value: "国内" },
    { id: "c3", field: "emotion", operator: "eq", values: [], value: "负面" },
    { id: "c4", field: "publishTime", operator: "lastNDays", values: [], numValue: 1 },
  ],
  templateId: "TPL01",
  templateName: "舆情通用模板",
  push: {
    enabled: true,
    channel: "wecom",
    targets: [
      { id: "t1", type: "group", name: "舆情应急群", webhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=e16d2b41-e0d0-4b9d-ba5d-7d63ca6a5f01" },
      { id: "t2", type: "person", name: "张敏", empId: "P10231" },
    ],
    timing: { mode: "scheduled", time: "09:00" },
  },
});

const allReports: Report[] = [
  {
    id: "RPT001", title: "Q1舆情态势分析报告", type: "季度报告", theme: "舆情主题",
    status: "completed", configCreatedAt: "2026-03-28 08:50", createdAt: "2026-03-28 09:00", pages: 24, format: "HTML",
    author: "李总监", size: "2.4MB", scheduleType: "once",
    templateId: "TPL01", templateName: "舆情日报模板",
    config: { ...buildSentimentConfig(), scheduleType: "once", frequency: undefined },
  },
  {
    id: "RPT002", title: "行业竞品监测周报", type: "周报", theme: "行业咨询主题",
    status: "completed", configCreatedAt: "2026-03-01 10:00", createdAt: "2026-04-05 10:00", pages: 12, format: "HTML",
    author: "系统自动生成", size: "1.8MB", scheduleType: "recurring", frequency: "weekly",
    templateId: "TPL02", templateName: "竞品对比模板",
    config: {
      scheduleType: "recurring", frequency: "weekly", weeklyStartDay: 1, timeField: "publishTime",
      themeName: "行业咨询主题", conditionLogic: "all",
      conditions: [
        { id: "c1", field: "platform", operator: "in", values: ["携程", "飞猪", "去哪儿", "同程", "美团"] },
        { id: "c2", field: "publishTime", operator: "lastNDays", values: [], numValue: 7 },
      ],
      templateId: "TPL02", templateName: "竞品对比模板",
    },
    issues: [
      { id: "RPT002-W14", period: "2026-W14（03/30-04/05）", createdAt: "2026-04-05 10:00", status: "completed", pages: 13, size: "1.9MB" },
      { id: "RPT002-W13", period: "2026-W13（03/23-03/29）", createdAt: "2026-03-29 10:00", status: "completed", pages: 12, size: "1.8MB" },
      { id: "RPT002-W12", period: "2026-W12（03/16-03/22）", createdAt: "2026-03-22 10:00", status: "completed", pages: 11, size: "1.6MB" },
      { id: "RPT002-W11", period: "2026-W11（03/09-03/15）", createdAt: "2026-03-15 10:00", status: "completed", pages: 12, size: "1.7MB" },
    ],
  },
  {
    id: "RPT003", title: "热点事件专项分析-清明出行", type: "专项报告", theme: "热点洞察主题",
    status: "generating", configCreatedAt: "2026-03-30 15:30", createdAt: "", pages: 0, format: "HTML",
    author: "AI生成中", size: "-", scheduleType: "once",
    templateId: "TPL03", templateName: "热点追踪模板",
  },
  {
    id: "RPT004", title: "产品体验月度报告", type: "月报", theme: "产品体验主题",
    status: "completed", configCreatedAt: "2026-01-10 08:00", createdAt: "2026-04-01 08:00", pages: 18, format: "HTML",
    author: "系统自动生成", size: "5.2MB", scheduleType: "recurring", frequency: "monthly",
    templateId: "TPL04", templateName: "体验洞察模板",
    issues: [
      { id: "RPT004-202603", period: "2026年3月", createdAt: "2026-04-01 08:00", status: "completed", pages: 18, size: "5.2MB" },
      { id: "RPT004-202602", period: "2026年2月", createdAt: "2026-03-01 08:00", status: "completed", pages: 17, size: "4.8MB" },
      { id: "RPT004-202601", period: "2026年1月", createdAt: "2026-02-01 08:00", status: "completed", pages: 16, size: "4.5MB" },
    ],
  },
  {
    id: "RPT007", title: "国内机票负面舆情日报", type: "日报", theme: "舆情主题",
    status: "completed", configCreatedAt: "2026-03-20 09:00", createdAt: "2026-03-31 09:00", pages: 6, format: "HTML",
    author: "系统自动生成", size: "0.8MB", scheduleType: "recurring", frequency: "daily",
    templateId: "TPL01", templateName: "舆情通用模板",
    config: buildSentimentConfig(),
    issues: [
      { id: "RPT007-0331", period: "2026-03-31", createdAt: "2026-03-31 09:00", status: "completed", pages: 6, size: "0.8MB" },
      { id: "RPT007-0330", period: "2026-03-30", createdAt: "2026-03-30 09:00", status: "completed", pages: 5, size: "0.7MB" },
      { id: "RPT007-0329", period: "2026-03-29", createdAt: "2026-03-29 09:00", status: "completed", pages: 6, size: "0.8MB" },
      { id: "RPT007-0328", period: "2026-03-28", createdAt: "2026-03-28 09:00", status: "completed", pages: 5, size: "0.7MB" },
      { id: "RPT007-0327", period: "2026-03-27", createdAt: "2026-03-27 09:00", status: "failed", pages: 0, size: "-" },
    ],
  },
  {
    id: "RPT009", title: "XX产品投诉事件深度分析", type: "专项报告", theme: "舆情主题",
    status: "completed", configCreatedAt: "2026-03-28 15:30", createdAt: "2026-03-28 16:00", pages: 15, format: "HTML",
    author: "AI智能生成", size: "3.1MB", scheduleType: "once",
  },
  {
    id: "RPT010", title: "一级事件-退款纠纷追踪报告", type: "专项报告", theme: "舆情主题",
    status: "failed", configCreatedAt: "2026-03-27 10:50", createdAt: "2026-03-27 11:00", pages: 0, format: "HTML",
    author: "系统", size: "-", scheduleType: "once",
  },
];

const statusConfig: Record<Report["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "已完成", variant: "default" },
  generating: { label: "生成中", variant: "secondary" },
  failed: { label: "失败", variant: "destructive" },
};

const frequencyLabel: Record<RecurringFrequency, string> = {
  daily: "每日", weekly: "每周", monthly: "每月",
};

const weekDayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 周报起始日 -> "周X 至 下周X(前一天)"
const weeklyRangeHint = (startDay: number) => {
  const start = weekDayLabels[(startDay - 1 + 7) % 7];
  const endIdx = (startDay - 1 + 6) % 7; // 上一天
  const end = weekDayLabels[endIdx];
  return `每期统计：${start} 至 下${end}`;
};

// 推送目标候选 — 个人花名册（姓名 + 工号）
type Employee = { name: string; empId: string; dept: string };
const employeeDirectory: Employee[] = [
  { name: "张敏", empId: "P10231", dept: "产品" },
  { name: "李伟", empId: "P10458", dept: "运营" },
  { name: "王芳", empId: "P10672", dept: "市场" },
  { name: "陈强", empId: "P10889", dept: "客服" },
  { name: "刘涛", empId: "P11023", dept: "技术" },
  { name: "赵磊", empId: "P11156", dept: "公关" },
  { name: "孙丽", empId: "P11287", dept: "数据" },
  { name: "周杰", empId: "P11342", dept: "产品" },
];

const themeOptions = ["全部", "舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "综合"];
const themeChoices = ["舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题"];

type ReportTplChoice = { id: string; name: string; desc: string; tags: string[] };
const reportTemplates: ReportTplChoice[] = [
  { id: "TPL01", name: "舆情通用模板", desc: "总览·核心事件·风险预警·应对建议", tags: ["通用", "舆情"] },
  { id: "TPL02", name: "竞品对比模板", desc: "声量·情感·渠道·话题对比", tags: ["竞品"] },
  { id: "TPL03", name: "热点追踪模板", desc: "事件脉络·传播路径·关键观点", tags: ["热点"] },
  { id: "TPL04", name: "体验洞察模板", desc: "功能·体验维度·NPS·用户声音", tags: ["体验"] },
];

const newCondition = (field = "business"): RuleCondition => {
  const op = defaultOperator(field);
  return { id: Math.random().toString(36).slice(2, 9), field, operator: op, values: [], value: "", numValue: undefined };
};

interface ReportPrefill {
  theme?: string;
  scope: "articles" | "events";
  ids: string[];
  titles?: string[];
  source?: string; // 来源页（用于提示）
}

export default function ReportManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | ScheduleType>("all");
  const [configDetailReport, setConfigDetailReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [drillReport, setDrillReport] = useState<Report | null>(null);

  // Config wizard
  const [configOpen, setConfigOpen] = useState(false);
  const [wizStep, setWizStep] = useState(1);
  const [wizSchedule, setWizSchedule] = useState<ScheduleType>("recurring");
  const [wizFrequency, setWizFrequency] = useState<RecurringFrequency>("daily");
  const [wizWeeklyStartDay, setWizWeeklyStartDay] = useState<number>(1);
  const [wizTimeField, setWizTimeField] = useState<string>("publishTime");
  const [wizTheme, setWizTheme] = useState<string>("");
  const [wizLogic, setWizLogic] = useState<ConditionLogic>("all");
  const [wizConditions, setWizConditions] = useState<RuleCondition[]>([newCondition("business")]);
  const [wizTemplateId, setWizTemplateId] = useState<string>("");
  const [wizName, setWizName] = useState<string>("");
  const [wizPrefill, setWizPrefill] = useState<ReportPrefill | null>(null);
  // Push config
  const [wizPushEnabled, setWizPushEnabled] = useState<boolean>(true);
  const [wizPushChannels, setWizPushChannels] = useState<{ person: boolean; group: boolean }>({ person: false, group: true });
  const [wizPushPersons, setWizPushPersons] = useState<Employee[]>([]);
  const [wizPersonSearch, setWizPersonSearch] = useState<string>("");
  const [wizPersonOpen, setWizPersonOpen] = useState<boolean>(false);
  const [wizPushWebhooks, setWizPushWebhooks] = useState<string[]>([""]);
  const [wizPushTimingMode, setWizPushTimingMode] = useState<"realtime" | "scheduled">("scheduled");
  const [wizPushTime, setWizPushTime] = useState<string>("09:00");

  // 派生：组装 PushTarget[]
  const wizPushTargets: PushTarget[] = useMemo(() => {
    const arr: PushTarget[] = [];
    if (wizPushChannels.person) {
      wizPushPersons.forEach(p => arr.push({ id: `p-${p.empId}`, type: "person", name: p.name, empId: p.empId }));
    }
    if (wizPushChannels.group) {
      wizPushWebhooks.filter(w => w.trim()).forEach((w, i) => arr.push({ id: `g-${i}`, type: "group", name: `群机器人 ${i + 1}`, webhook: w.trim() }));
    }
    return arr;
  }, [wizPushChannels, wizPushPersons, wizPushWebhooks]);

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (search && !r.title.includes(search) && !r.id.includes(search)) return false;
      if (themeFilter !== "全部" && r.theme !== themeFilter) return false;
      if (scheduleFilter !== "all" && r.scheduleType !== scheduleFilter) return false;
      if (statusFilter !== "全部") {
        const statusMap: Record<string, string> = { "已完成": "completed", "生成中": "generating", "失败": "failed" };
        if (r.status !== statusMap[statusFilter]) return false;
      }
      return true;
    });
  }, [search, themeFilter, statusFilter, scheduleFilter]);

  const wizFreqLabel = wizSchedule === "recurring" ? frequencyLabel[wizFrequency] : "一次性";
  const wizTemplate = reportTemplates.find(t => t.id === wizTemplateId);
  const hasTimeCondition = wizConditions.some(c => TIME_FIELD_KEYS.includes(c.field));

  // 一次性报告默认实时推送；周期报告默认定时
  const effectivePushTiming: PushTiming = wizSchedule === "once" && wizPushTimingMode === "realtime"
    ? { mode: "realtime" }
    : { mode: "scheduled", time: wizPushTime };

  const pushTimingLabel = (timing: PushTiming) =>
    timing.mode === "realtime" ? "实时推送" : `定时推送 · ${timing.time}`;

  const resetWizard = () => {
    setWizStep(1);
    setWizSchedule("recurring");
    setWizFrequency("daily");
    setWizWeeklyStartDay(1);
    setWizTimeField("publishTime");
    setWizTheme("");
    setWizLogic("all");
    setWizConditions([newCondition("business")]);
    setWizTemplateId("");
    setWizName("");
    setWizPrefill(null);
    setWizPushEnabled(true);
    setWizPushChannels({ person: false, group: true });
    setWizPushPersons([]);
    setWizPersonSearch("");
    setWizPushWebhooks([""]);
    setWizPushTimingMode("scheduled");
    setWizPushTime("09:00");
  };

  // 从外部页面（如舆情列表/事件详情）携带 prefill 跳转过来时，自动打开向导并预填
  useEffect(() => {
    const state = location.state as { reportPrefill?: ReportPrefill } | null;
    const pf = state?.reportPrefill;
    if (!pf || pf.ids.length === 0) return;
    resetWizard();
    setWizPrefill(pf);
    if (pf.theme) setWizTheme(pf.theme);
    setWizSchedule("once"); // 选定数据范围 → 默认一次性
    // 把锁定的数据集回填为一条「集合」条件 + 一条默认时间条件
    const lockField = pf.scope === "events" ? "eventSet" : "articleSet";
    const lockedCondition: RuleCondition = {
      id: "lockset",
      field: lockField,
      operator: "in_set",
      values: (pf.titles && pf.titles.length === pf.ids.length)
        ? pf.titles.map((t, i) => `${t}（#${pf.ids[i]}）`)
        : pf.ids.map(id => `#${id}`),
    };
    const timeCondition: RuleCondition = {
      id: "lockset-time",
      field: "publishTime",
      operator: "lastNDays",
      values: [],
      numValue: 7,
    };
    setWizLogic("all");
    setWizConditions([lockedCondition, timeCondition]);
    setWizStep(2);
    setConfigOpen(true);
    // 清掉 state，避免再次切回时重复触发
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoName = () => {
    if (!wizTemplate || !wizTheme) return "";
    const freq = wizSchedule === "recurring" ? frequencyLabel[wizFrequency].replace("每", "") + "报" : "专项报告";
    return `${wizTheme} ${freq}`;
  };

  const handleDelete = () => {
    if (deleteReport) {
      toast.success(`已删除报告：${deleteReport.title}`);
      setDeleteReport(null);
    }
  };

  const goEditTemplate = (templateId?: string) => {
    setConfigOpen(false);
    setConfigDetailReport(null);
    if (templateId) navigate(`/analysis/report-templates?templateId=${templateId}`);
    else navigate("/analysis/report-templates");
  };

  const openReportView = (r: Report, issue?: ReportIssue) => {
    const t = encodeURIComponent(r.title);
    const id = issue?.id ?? r.id;
    const period = issue ? `&period=${encodeURIComponent(issue.period)}` : "";
    navigate(`/analysis/report-view/${id}?title=${t}${period}`);
  };

  const handleDownload = (title: string) => toast.success(`正在下载 ${title}（HTML）`);

  // ------- Wizard validators -------
  const conditionsValid = (conds: RuleCondition[]) => conds.every(c => {
    const mode = operatorMode(c.field, c.operator);
    if (mode === "lockset") return c.values.length > 0;
    if (mode === "days") return typeof c.numValue === "number" && c.numValue > 0;
    if (mode === "chips") return c.values.length > 0;
    return !!c.value;
  });
  const step2Valid = wizTheme && (wizPrefill ? true : (wizConditions.length > 0 && conditionsValid(wizConditions) && hasTimeCondition && (wizSchedule === "once" || !!wizTimeField)));
  const step1Valid = wizSchedule === "once" || !!wizFrequency;
  const step4Valid = !wizPushEnabled || (wizPushTargets.length > 0 && (effectivePushTiming.mode === "realtime" || /^\d{2}:\d{2}$/.test(wizPushTime)));

  const updateCondition = (id: string, patch: Partial<RuleCondition>) => {
    setWizConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };
  const removeCondition = (id: string) => setWizConditions(prev => {
    const target = prev.find(c => c.id === id);
    if (target && LOCKSET_FIELD_KEYS.includes(target.field)) setWizPrefill(null);
    return prev.filter(c => c.id !== id);
  });

  const togglePerson = (emp: Employee) => {
    setWizPushPersons(prev => prev.find(p => p.empId === emp.empId)
      ? prev.filter(p => p.empId !== emp.empId)
      : [...prev, emp]);
  };
  const removePerson = (empId: string) => setWizPushPersons(prev => prev.filter(p => p.empId !== empId));
  const updateWebhook = (idx: number, val: string) => setWizPushWebhooks(prev => prev.map((w, i) => i === idx ? val : w));
  const addWebhook = () => setWizPushWebhooks(prev => [...prev, ""]);
  const removeWebhook = (idx: number) => setWizPushWebhooks(prev => prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx));

  const personMatches = useMemo(() => {
    const q = wizPersonSearch.trim().toLowerCase();
    if (!q) return employeeDirectory;
    return employeeDirectory.filter(e =>
      e.name.toLowerCase().includes(q) || e.empId.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)
    );
  }, [wizPersonSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报告管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看、搜索、下载和管理所有已生成的分析报告</p>
        </div>
        <Button className="gap-2" onClick={() => { setWizPrefill(null); setConfigOpen(true); }}>
          <Settings2 className="w-4 h-4" /> 报告配置
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告总数</p><p className="text-2xl font-bold text-foreground mt-1">{allReports.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">周期报告</p><p className="text-2xl font-bold text-primary mt-1">{allReports.filter(r => r.scheduleType === "recurring").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">生成中</p><p className="text-2xl font-bold text-foreground mt-1">{allReports.filter(r => r.status === "generating").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">失败</p><p className="text-2xl font-bold text-destructive mt-1">{allReports.filter(r => r.status === "failed").length}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索报告名称或ID..." className="pl-9 h-9" />
            </div>
            <Select value={scheduleFilter} onValueChange={(v) => setScheduleFilter(v as "all" | ScheduleType)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部调度</SelectItem>
                <SelectItem value="once">一次性报告</SelectItem>
                <SelectItem value="recurring">周期报告</SelectItem>
              </SelectContent>
            </Select>
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部状态</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
                <SelectItem value="生成中">生成中</SelectItem>
                <SelectItem value="失败">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">报告列表（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无匹配的报告</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告ID</TableHead>
                  <TableHead>报告名称</TableHead>
                  <TableHead>调度类型</TableHead>
                  <TableHead>所属主题</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最近生成时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const isRecurring = r.scheduleType === "recurring";
                  return (
                    <TableRow
                      key={r.id}
                      className={isRecurring ? "cursor-pointer hover:bg-muted/40" : ""}
                      onClick={isRecurring ? () => setDrillReport(r) : undefined}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm text-foreground">{r.title}</p>
                          {isRecurring && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {r.author}
                          {isRecurring && r.issues && ` · 共 ${r.issues.length} 期`}
                        </p>
                      </TableCell>
                      <TableCell>
                        {isRecurring ? (
                          <Badge className="text-xs gap-1"><Repeat className="w-3 h-3" />周期 · {frequencyLabel[r.frequency!]}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1"><Zap className="w-3 h-3" />一次性</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{r.theme}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />{r.createdAt}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={statusConfig[r.status].variant} className="text-xs">{statusConfig[r.status].label}</Badge></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="报告配置详情" onClick={() => setConfigDetailReport(r)}>
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          {isRecurring ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="查看各期" onClick={() => setDrillReport(r)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8" title="查看报告"
                                disabled={r.status !== "completed"}
                                onClick={() => openReportView(r)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8" title="下载报告"
                                disabled={r.status !== "completed"}
                                onClick={() => handleDownload(r.title)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="删除" onClick={() => setDeleteReport(r)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={!!drillReport} onOpenChange={() => setDrillReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDrillReport(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {drillReport?.title}
              {drillReport?.frequency && (
                <Badge className="text-xs gap-1"><Repeat className="w-3 h-3" />{frequencyLabel[drillReport.frequency]}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {drillReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">所属主题</p>
                  <p className="font-medium mt-1">{drillReport.theme}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">使用模板</p>
                  <p className="font-medium mt-1">{drillReport.templateName ?? "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">期次总数</p>
                  <p className="font-medium mt-1">{drillReport.issues?.length ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">各期报告</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfigDetailReport(drillReport)}>
                    <Settings2 className="w-3.5 h-3.5" /> 配置详情
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => goEditTemplate(drillReport.templateId)}>
                    <Pencil className="w-3.5 h-3.5" /> 编辑模板
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>期次</TableHead>
                    <TableHead>生成时间</TableHead>
                    <TableHead>页数</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillReport.issues?.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{issue.period}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{issue.id}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{issue.createdAt}</TableCell>
                      <TableCell className="text-xs">{issue.pages || "-"}</TableCell>
                      <TableCell className="text-xs">{issue.size}</TableCell>
                      <TableCell><Badge variant={statusConfig[issue.status].variant} className="text-xs">{statusConfig[issue.status].label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="查看报告"
                            disabled={issue.status !== "completed"}
                            onClick={() => openReportView(drillReport, issue)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="下载报告"
                            disabled={issue.status !== "completed"}
                            onClick={() => handleDownload(`${drillReport.title} ${issue.period}`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Config Detail Dialog */}
      <Dialog open={!!configDetailReport} onOpenChange={() => setConfigDetailReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> 报告配置详情
            </DialogTitle>
          </DialogHeader>
          {configDetailReport && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2">
                <ConfirmRow label="报告ID" value={configDetailReport.id} mono />
                <ConfirmRow label="报告名称" value={configDetailReport.title} />
                <ConfirmRow label="调度类型" value={configDetailReport.scheduleType === "recurring"
                  ? `周期报告（${frequencyLabel[configDetailReport.frequency!]}${configDetailReport.config?.weeklyStartDay && configDetailReport.frequency === "weekly" ? `，${weekDayLabels[configDetailReport.config.weeklyStartDay - 1]}起` : ""}）`
                  : "一次性报告"} />
                {configDetailReport.frequency === "weekly" && configDetailReport.config?.weeklyStartDay && (
                  <ConfirmRow
                    label="周报统计周期"
                    value={weeklyRangeHint(configDetailReport.config.weeklyStartDay).replace("每期统计：", "")}
                  />
                )}
                <ConfirmRow label="所属主题" value={configDetailReport.theme} />
                <ConfirmRow label="使用模板" value={configDetailReport.templateName ?? "-"} />
                {configDetailReport.config?.timeField && (
                  <ConfirmRow label="时间字段" value={fieldDef(configDetailReport.config.timeField)?.label ?? "-"} />
                )}
              </div>
              {configDetailReport.config && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">查询条件</Label>
                  <div className="rounded-lg border border-border p-3 bg-background space-y-2">
                    <p className="text-xs text-muted-foreground">
                      规则关系：{configDetailReport.config.conditionLogic === "all" ? "满足所有条件" : configDetailReport.config.conditionLogic === "any" ? "满足任一条件" : "不配置"}
                    </p>
                    <div className="space-y-1.5">
                      {configDetailReport.config.conditions.map((c, idx) => (
                        <div key={c.id} className="flex items-center gap-2">
                          {idx > 0 && (
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                              {configDetailReport.config!.conditionLogic === "all" ? "AND" : "OR"}
                            </Badge>
                          )}
                          <div className={`flex-1 text-xs font-mono bg-muted/40 rounded px-2 py-1.5 ${idx === 0 ? "ml-[42px]" : ""}`}>
                            {formatCondition(c)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {configDetailReport.config?.push?.enabled && (
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> 推送配置
                  </Label>
                  <div className="rounded-lg border border-border p-3 bg-background space-y-2">
                    <ConfirmRow label="渠道" value="企业微信" />
                    <ConfirmRow label="推送时机" value={
                      configDetailReport.config.push.timing.mode === "realtime"
                        ? "实时推送"
                        : `定时推送 · ${configDetailReport.config.push.timing.time}`
                    } />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">推送对象（{configDetailReport.config.push.targets.length}）</p>
                      <div className="flex flex-wrap gap-1.5">
                        {configDetailReport.config.push.targets.map(t => (
                          <Badge key={t.id} variant="secondary" className="gap-1 text-[11px] max-w-full">
                            {t.type === "group" ? <Users className="w-3 h-3 shrink-0" /> : <UserIcon className="w-3 h-3 shrink-0" />}
                            <span className="truncate">
                              {t.type === "person" ? `${t.name} · ${t.empId}` : t.name}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => goEditTemplate(configDetailReport.templateId)}>
                  <Pencil className="w-3.5 h-3.5" /> 编辑模板
                </Button>
                <Button size="sm" onClick={() => setConfigDetailReport(null)}>关闭</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteReport} onOpenChange={() => setDeleteReport(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-foreground">确定要删除以下报告吗？此操作不可恢复。</p>
                <p className="text-xs text-muted-foreground mt-1">{deleteReport?.title}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteReport(null)}>取消</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>确认删除</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Configuration Wizard Sheet */}
      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent side="right" className="w-[720px] sm:max-w-[720px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> 报告配置
            </SheetTitle>
            <SheetDescription>
              配置一次性或周期报告：选择类型、自定义查询条件、选择模板，确认后立即生成
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            {/* Stepper */}
            <div className="flex items-center gap-1">
              {[{ n: 1, l: "类型" }, { n: 2, l: "数据" }, { n: 3, l: "模板" }, { n: 4, l: "推送" }, { n: 5, l: "确认" }].map((s, i, arr) => (
                <div key={s.n} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 ${wizStep >= s.n ? "text-primary" : "text-muted-foreground"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${wizStep > s.n ? "bg-primary text-primary-foreground border-primary" : wizStep === s.n ? "border-primary text-primary" : "border-border"}`}>
                      {wizStep > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
                    </div>
                    <span className="text-xs font-medium">{s.l}</span>
                  </div>
                  {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${wizStep > s.n ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {wizStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">报告类型</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className={`text-left rounded-lg border p-4 transition ${wizSchedule === "once" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => setWizSchedule("once")}>
                      <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-primary" /><span className="font-medium text-sm">一次性报告</span></div>
                      <p className="text-xs text-muted-foreground">基于查询条件立即生成单期报告</p>
                    </button>
                    <button type="button" className={`text-left rounded-lg border p-4 transition ${wizSchedule === "recurring" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => setWizSchedule("recurring")}>
                      <div className="flex items-center gap-2 mb-2"><Repeat className="w-4 h-4 text-primary" /><span className="font-medium text-sm">周期报告</span></div>
                      <p className="text-xs text-muted-foreground">按日/周/月自动生成，可下钻各期</p>
                    </button>
                  </div>
                </div>

                {wizSchedule === "recurring" && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">周期频率</Label>
                      <div className="flex gap-2">
                        {(["daily", "weekly", "monthly"] as RecurringFrequency[]).map(f => (
                          <Button key={f} variant={wizFrequency === f ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setWizFrequency(f)}>
                            {frequencyLabel[f]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {wizFrequency === "weekly" && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">周报开始于</Label>
                        <div className="grid grid-cols-7 gap-1.5">
                          {weekDayLabels.map((d, idx) => (
                            <Button
                              key={d}
                              size="sm"
                              variant={wizWeeklyStartDay === idx + 1 ? "default" : "outline"}
                              onClick={() => setWizWeeklyStartDay(idx + 1)}
                              className="h-8 text-xs"
                            >
                              {d}
                            </Button>
                          ))}
                        </div>
                        <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {weeklyRangeHint(wizWeeklyStartDay)}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 周期统计依据时间字段
                      </Label>
                      <RadioGroup value={wizTimeField} onValueChange={setWizTimeField} className="grid grid-cols-2 gap-2">
                        {FIELD_CATALOG.filter(f => f.type === "time").map(f => (
                          <label key={f.key} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${wizTimeField === f.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                            <RadioGroupItem value={f.key} />
                            <span className="text-sm">{f.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <p className="text-[11px] text-muted-foreground mt-1.5">周期报告将按该时间字段切分各期数据</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2 */}
            {wizStep === 2 && (
              <div className="space-y-4">
                {wizPrefill && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        {wizPrefill.scope === "events"
                          ? <Layers className="w-4 h-4 text-primary" />
                          : <FileText className="w-4 h-4 text-primary" />}
                        <span className="font-medium text-foreground">已锁定数据范围</span>
                        {wizTheme && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Sparkles className="w-3 h-3" /> 主题：{wizTheme}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          {wizPrefill.scope === "events" ? <Layers className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {wizPrefill.scope === "events" ? "事件" : "文章"} · {wizPrefill.ids.length} 条
                        </Badge>
                        {wizPrefill.source && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Link2 className="w-3 h-3" /> 来源：{wizPrefill.source}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWizPrefill(null);
                          setWizConditions(prev => prev.filter(c => !LOCKSET_FIELD_KEYS.includes(c.field)));
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="清除锁定范围"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      已自动回填到下方"查询条件"中（{wizPrefill.scope === "events" ? "事件集合" : "文章集合"} · 属于已选集合）。可在条件区追加其他筛选与时间范围；移除该锁定条件等同于清除范围。
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium mb-2 block">所属主题</Label>
                  <Select value={wizTheme} onValueChange={setWizTheme}>
                    <SelectTrigger><SelectValue placeholder="请选择主题" /></SelectTrigger>
                    <SelectContent>{themeChoices.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">查询条件</Label>
                    <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded transition ${wizLogic === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setWizLogic("all")}
                      >满足所有条件</button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded transition ${wizLogic === "any" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setWizLogic("any")}
                      >满足任一条件</button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                    {wizConditions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">暂无条件，点击下方按钮添加</p>
                    )}
                    {wizConditions.map((c, idx) => (
                      <div key={c.id} className="flex items-start gap-2">
                        {idx > 0 && (
                          <div className="pt-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {wizLogic === "all" ? "AND" : "OR"}
                            </Badge>
                          </div>
                        )}
                        <div className={`flex-1 ${idx > 0 ? "" : "ml-[52px]"}`}>
                          <ConditionRow
                            condition={c}
                            onChange={(patch) => updateCondition(c.id, patch)}
                            onRemove={() => removeCondition(c.id)}
                          />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/40" onClick={() => setWizConditions(prev => [...prev, newCondition("business")])}>
                      <Plus className="w-3.5 h-3.5" /> 添加条件
                    </Button>
                    {!hasTimeCondition && (
                      <p className="text-[11px] text-warning flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> 请添加至少一个时间字段条件（发布时间 / 收录时间）
                      </p>
                    )}
                  </div>
                </div>

                {wizConditions.length > 0 && (
                  <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> 实时表达式预览
                    </p>
                    <p className="text-xs font-mono text-foreground break-all leading-relaxed">{formatExpression(wizLogic, wizConditions)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 */}
            {wizStep === 3 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium block">选择报告模板</Label>
                {reportTemplates.map(t => (
                  <button type="button" key={t.id} className={`w-full text-left rounded-lg border p-3 transition ${wizTemplateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => setWizTemplateId(t.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <LayoutTemplate className="w-4 h-4 text-primary shrink-0" />
                          <p className="font-medium text-sm">{t.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                        <div className="flex gap-1 mt-2">
                          {t.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                        </div>
                      </div>
                      {wizTemplateId === t.id && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
                    </div>
                  </button>
                ))}
                <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => goEditTemplate()}>
                  <Plus className="w-3.5 h-3.5" /> 没有合适模板？前往模板管理
                </Button>
              </div>
            )}

            {/* Step 4 — Push */}
            {wizStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">报告推送</p>
                      <p className="text-[11px] text-muted-foreground">报告生成后自动通过企业微信推送</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={wizPushEnabled}
                    onClick={() => setWizPushEnabled(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${wizPushEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-all ${wizPushEnabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                {wizPushEnabled && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">推送渠道</Label>
                      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-[#07C160] flex items-center justify-center text-white text-[10px] font-bold shrink-0">微</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">企业微信</p>
                          <p className="text-[11px] text-muted-foreground">当前仅支持企业微信推送</p>
                        </div>
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium w-20 shrink-0">通知方式</Label>
                        <div className="flex items-center gap-5">
                          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={wizPushChannels.person}
                              onChange={(e) => setWizPushChannels(c => ({ ...c, person: e.target.checked }))}
                              className="w-4 h-4 accent-primary"
                            />
                            <UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> 个人
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={wizPushChannels.group}
                              onChange={(e) => setWizPushChannels(c => ({ ...c, group: e.target.checked }))}
                              className="w-4 h-4 accent-primary"
                            />
                            <Users className="w-3.5 h-3.5 text-muted-foreground" /> 群
                          </label>
                        </div>
                      </div>

                      {wizPushChannels.person && (
                        <div className="flex items-start gap-4">
                          <Label className="text-sm w-20 shrink-0 pt-2 text-muted-foreground">个人</Label>
                          <div className="flex-1 space-y-1.5">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <Input
                                value={wizPersonSearch}
                                onChange={(e) => { setWizPersonSearch(e.target.value); setWizPersonOpen(true); }}
                                onFocus={() => setWizPersonOpen(true)}
                                onBlur={() => setTimeout(() => setWizPersonOpen(false), 150)}
                                placeholder="请输入姓名或工号进行搜索（可多选）"
                                className="h-9 pl-8 text-sm"
                              />
                              {wizPersonOpen && (
                                <div className="absolute z-20 mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-md max-h-56 overflow-y-auto">
                                  {personMatches.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-muted-foreground">无匹配人员</p>
                                  ) : personMatches.map(emp => {
                                    const selected = !!wizPushPersons.find(p => p.empId === emp.empId);
                                    return (
                                      <button
                                        key={emp.empId}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => togglePerson(emp)}
                                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-muted transition ${selected ? "bg-primary/5" : ""}`}
                                      >
                                        <span className="flex items-center gap-2">
                                          <UserIcon className="w-3 h-3 text-muted-foreground" />
                                          <span className="font-medium text-foreground">{emp.name}</span>
                                          <span className="text-muted-foreground">{emp.empId}</span>
                                          <span className="text-muted-foreground">· {emp.dept}</span>
                                        </span>
                                        {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {wizPushPersons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {wizPushPersons.map(p => (
                                  <Badge key={p.empId} variant="secondary" className="gap-1 text-[11px] pl-2 pr-1">
                                    <UserIcon className="w-3 h-3" /> {p.name} · {p.empId}
                                    <button
                                      type="button"
                                      onClick={() => removePerson(p.empId)}
                                      className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {wizPushChannels.group && (
                        <div className="flex items-start gap-4">
                          <Label className="text-sm w-20 shrink-0 pt-2 text-muted-foreground">群机器人地址</Label>
                          <div className="flex-1 space-y-2">
                            {wizPushWebhooks.map((w, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={w}
                                  onChange={(e) => updateWebhook(idx, e.target.value)}
                                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx"
                                  className="h-9 text-sm font-mono"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeWebhook(idx)}
                                  disabled={wizPushWebhooks.length === 1 && !w}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={addWebhook}>
                              <Plus className="w-3.5 h-3.5" /> 添加群机器人
                            </Button>
                          </div>
                        </div>
                      )}

                      {!wizPushChannels.person && !wizPushChannels.group && (
                        <p className="text-[11px] text-muted-foreground pl-24">请至少选择一种通知方式</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 推送时机
                      </Label>
                      {wizSchedule === "once" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWizPushTimingMode("realtime")}
                            className={`text-left rounded-lg border p-3 transition ${wizPushTimingMode === "realtime" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <p className="font-medium text-sm flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> 实时推送</p>
                            <p className="text-[11px] text-muted-foreground mt-1">报告生成完成后立即推送</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizPushTimingMode("scheduled")}
                            className={`text-left rounded-lg border p-3 transition ${wizPushTimingMode === "scheduled" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <p className="font-medium text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> 定时推送</p>
                            <p className="text-[11px] text-muted-foreground mt-1">指定时间点推送</p>
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border p-3 bg-muted/20">
                          <p className="text-[11px] text-muted-foreground mb-2">
                            {wizFrequency === "daily" ? "每日推送时间" : wizFrequency === "weekly" ? `每周${weekDayLabels[wizWeeklyStartDay - 1]}推送时间` : "每月首日推送时间"}
                          </p>
                          <Input
                            type="time"
                            value={wizPushTime}
                            onChange={(e) => setWizPushTime(e.target.value)}
                            className="h-9 w-32 text-sm"
                          />
                        </div>
                      )}
                      {wizSchedule === "once" && wizPushTimingMode === "scheduled" && (
                        <div className="rounded-lg border border-border p-3 bg-muted/20 mt-2">
                          <p className="text-[11px] text-muted-foreground mb-2">推送时间点</p>
                          <Input
                            type="time"
                            value={wizPushTime}
                            onChange={(e) => setWizPushTime(e.target.value)}
                            className="h-9 w-32 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5 — Confirm */}
            {wizStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">报告名称</Label>
                  <Input value={wizName || autoName()} onChange={(e) => setWizName(e.target.value)} placeholder="请输入报告名称" />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                  <ConfirmRow label="报告类型" value={wizFreqLabel} />
                  {wizSchedule === "recurring" && wizFrequency === "weekly" && (
                    <>
                      <ConfirmRow label="周报起始" value={weekDayLabels[wizWeeklyStartDay - 1]} />
                      <ConfirmRow label="统计周期" value={weeklyRangeHint(wizWeeklyStartDay).replace("每期统计：", "")} />
                    </>
                  )}
                  {wizSchedule === "recurring" && (
                    <ConfirmRow label="时间字段" value={fieldDef(wizTimeField)?.label ?? "-"} />
                  )}
                  <ConfirmRow label="所属主题" value={wizTheme} />
                  <ConfirmRow label="规则关系" value={wizLogic === "all" ? "满足所有条件" : "满足任一条件"} />
                  <ConfirmRow label="查询表达式" value={formatExpression(wizLogic, wizConditions)} mono />
                  <ConfirmRow label="报告模板" value={wizTemplate?.name ?? "-"} />
                  <ConfirmRow
                    label="推送配置"
                    value={
                      wizPushEnabled
                        ? `企业微信 · ${wizPushTargets.length} 个对象 · ${pushTimingLabel(effectivePushTiming)}`
                        : "未开启"
                    }
                  />
                  <ConfirmRow label="导出格式" value="HTML（当前仅支持）" />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20 text-xs text-foreground">
                  <Sparkles className="w-4 h-4 text-info shrink-0 mt-0.5" />
                  <p>确认后将立即生成首期报告，{wizSchedule === "recurring" ? `并按${frequencyLabel[wizFrequency]}自动生成后续期次` : "本次为一次性生成"}。{wizPushEnabled && wizPushTargets.length > 0 ? `生成后将通过企业微信推送给 ${wizPushTargets.length} 个对象。` : ""}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" disabled={wizStep === 1} onClick={() => setWizStep(s => Math.max(1, s - 1))}>上一步</Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setConfigOpen(false); resetWizard(); }}>取消</Button>
                {wizStep < 5 ? (
                  <Button
                    size="sm"
                    disabled={
                      (wizStep === 1 && !step1Valid) ||
                      (wizStep === 2 && !step2Valid) ||
                      (wizStep === 3 && !wizTemplateId) ||
                      (wizStep === 4 && !step4Valid)
                    }
                    onClick={() => setWizStep(s => Math.min(5, s + 1))}
                  >下一步</Button>
                ) : (
                  <Button
                    size="sm" className="gap-1.5"
                    onClick={() => {
                      const name = wizName || autoName();
                      toast.success(`已创建报告配置「${name}」并开始生成首期报告`);
                      setConfigOpen(false);
                      resetWizard();
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 确认并生成报告
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============ Sub-components ============

function ConditionRow({ condition, onChange, onRemove }: {
  condition: RuleCondition;
  onChange: (patch: Partial<RuleCondition>) => void;
  onRemove: () => void;
}) {
  const f = fieldDef(condition.field);
  if (!f) return null;
  const operators = OPERATORS_BY_TYPE[f.type];
  const mode = operatorMode(condition.field, condition.operator);
  const isLockset = mode === "lockset";

  const handleFieldChange = (newField: string) => {
    const newOp = defaultOperator(newField);
    onChange({ field: newField, operator: newOp, values: [], value: "", numValue: undefined });
  };

  // 锁定数据集 — 只读展示，不允许更改字段/算子，由外部预填驱动
  if (isLockset) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
        <Badge variant="secondary" className="h-7 text-[11px] gap-1 shrink-0">
          {f.key === "eventSet" ? <Layers className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          {f.label}
        </Badge>
        <Badge variant="outline" className="h-7 text-[11px] shrink-0">{operatorLabel(condition.field, condition.operator)}</Badge>
        <div className="flex-1 min-w-0 flex flex-wrap gap-1">
          {condition.values.length === 0 && (
            <span className="text-xs text-muted-foreground">（未选定项）</span>
          )}
          {condition.values.slice(0, 8).map((v, i) => (
            <Badge key={i} variant="outline" className="text-[10px] max-w-[260px] bg-background">
              <span className="truncate">{v}</span>
            </Badge>
          ))}
          {condition.values.length > 8 && (
            <Badge variant="outline" className="text-[10px] bg-background">+{condition.values.length - 8}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove} title="移除锁定数据集">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Field */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FIELD_CATALOG.filter(o => !LOCKSET_FIELD_KEYS.includes(o.key)).map(opt => (
            <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Operator */}
      <Select value={condition.operator} onValueChange={(v) => onChange({ operator: v, values: [], value: "", numValue: undefined })}>
        <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      {/* Value control */}
      <div className="flex-1 min-w-0">
        {mode === "single" && f.type === "enum" && (
          <Select value={condition.value || ""} onValueChange={(v) => onChange({ value: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="请选择" /></SelectTrigger>
            <SelectContent>{f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {mode === "single" && f.type === "text" && (
          <Input value={condition.value || ""} onChange={(e) => onChange({ value: e.target.value })} placeholder="请输入值" className="h-9 text-xs" />
        )}
        {mode === "chips" && (
          <ChipsInput
            values={condition.values}
            onChange={(values) => onChange({ values })}
            options={f.type === "enum" ? f.options : undefined}
            placeholder={f.type === "enum" ? "选择或输入值" : "采用包含形式匹配参数"}
          />
        )}
        {mode === "days" && (
          <div className="flex items-center gap-2">
            <Input type="number" min={1} value={condition.numValue ?? ""} onChange={(e) => onChange({ numValue: parseInt(e.target.value) || 0 })} className="h-9 text-xs w-24" />
            <span className="text-xs text-muted-foreground">{condition.operator === "lastNHours" ? "小时" : "天"}</span>
          </div>
        )}
      </div>
      <Button variant="ghost" size="sm" className="h-9 px-2 text-destructive hover:text-destructive shrink-0" onClick={onRemove}>
        删除
      </Button>
    </div>
  );
}

function ChipsInput({ values, onChange, options, placeholder }: {
  values: string[]; onChange: (v: string[]) => void; options?: string[]; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const addValue = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
  };
  const removeValue = (v: string) => onChange(values.filter(x => x !== v));

  return (
    <div className="min-h-9 px-2 py-1 rounded-md border border-input bg-background flex flex-wrap items-center gap-1">
      {values.map(v => (
        <Badge key={v} variant="secondary" className="gap-1 text-[11px] h-6 px-1.5">
          {v}
          <button type="button" onClick={() => removeValue(v)} className="hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {options ? (
        <Select value="" onValueChange={addValue}>
          <SelectTrigger className="h-7 border-0 text-xs flex-1 min-w-[120px] focus:ring-0 shadow-none px-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.filter(o => !values.includes(o)).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              addValue(input);
              setInput("");
            }
            if (e.key === "Backspace" && !input && values.length) {
              removeValue(values[values.length - 1]);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-xs px-1 py-1 placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

function ConfirmRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-foreground text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}
