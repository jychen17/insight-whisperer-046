import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Bell, Plus, Trash2, AlertTriangle, Mail, MessageCircle, Phone,
  ChevronDown, ChevronUp, Settings2, Zap, Clock, RefreshCw, ExternalLink,
  Flame, BarChart3, ThumbsUp, Link2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

/* ───────── types ───────── */

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface PushChannel {
  type: "wechat";
  personal: boolean;
  group: boolean;
  personalTargets: string[];
  groupWebhook: string;
}

type TriggerDimension = "single" | "event";
type PushTiming = "realtime" | "scheduled";
type ConditionLogic = "none" | "any" | "all";

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerDimension: TriggerDimension;
  conditionLogic: ConditionLogic;
  conditions: RuleCondition[];
  pushTiming: PushTiming;
  scheduledInterval?: string;
  channels: PushChannel[];
  eventScope: "current" | "all";
}

/* ───────── constants ───────── */

const EVENT_CONDITION_FIELDS = [
  { value: "event_risk", label: "事件风险", description: "事件内最高风险等级" },
  { value: "event_count", label: "事件规模", description: "事件内舆情条数" },
  { value: "event_comments", label: "事件总评论量", description: "事件内所有舆情评论汇总" },
  { value: "event_likes", label: "事件总点赞量", description: "事件内所有舆情点赞汇总" },
  { value: "event_time", label: "事件首发时间", description: "事件首条舆情发布时间" },
  { value: "event_category", label: "事件分类", description: "事件内舆情问题分类" },
];

const SINGLE_CONDITION_FIELDS = [
  { value: "sentiment_count", label: "文章总量" },
  { value: "comment_count", label: "总评论量" },
  { value: "like_count", label: "总点赞量" },
  { value: "importance", label: "初始风险等级" },
  { value: "category", label: "舆情问题分类" },
  { value: "publish_time", label: "发布时间" },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  event_risk: [{ value: "=", label: "等于" }, { value: ">=", label: "大于等于" }],
  event_count: [{ value: ">=", label: "≥" }, { value: ">", label: ">" }, { value: "=", label: "=" }],
  event_comments: [{ value: ">=", label: "≥" }, { value: ">", label: ">" }],
  event_likes: [{ value: ">=", label: "≥" }, { value: ">", label: ">" }],
  event_time: [{ value: "within", label: "过去几天内" }],
  event_category: [{ value: "in", label: "在集合中" }],
  importance: [{ value: "=", label: "等于" }, { value: ">=", label: "大于等于" }],
  category: [{ value: "in", label: "在集合中" }],
  publish_time: [{ value: "within", label: "过去几天内" }],
  _default: [{ value: ">", label: ">" }, { value: ">=", label: "≥" }, { value: "=", label: "=" }, { value: "<", label: "<" }],
};

const RISK_VALUES = ["重大", "一般"];
const CATEGORY_OPTIONS = ["票价吐槽", "辅营加购", "盲盒吐槽", "演出赛事抢票", "抢票吐槽", "催出票", "舆情跟评", "其他"];

const channelTypes = [
  { type: "wechat" as const, label: "企业微信", icon: MessageCircle },
  { type: "email" as const, label: "邮件", icon: Mail },
  { type: "sms" as const, label: "短信", icon: Phone },
  { type: "phone" as const, label: "电话", icon: Phone },
];

/* ───────── default rules ───────── */

const defaultRules: AlertRule[] = [
  {
    id: "1",
    name: "客服重大舆情推送",
    enabled: true,
    triggerDimension: "event",
    conditionLogic: "all",
    conditions: [
      { field: "event_risk", operator: "=", value: "重大" },
      { field: "event_category", operator: "in", value: "票价吐槽,辅营加购,盲盒吐槽,演出赛事抢票,抢票吐槽,催出票,舆情跟评,其他" },
      { field: "event_time", operator: "within", value: "14" },
    ],
    pushTiming: "realtime",
    channels: [
      { type: "wechat", personal: true, group: true, personalTargets: ["陈佳燕-1227152"], groupWebhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c4ee8b65-b84c-4b38-a529-c5ec7a183..." },
    ],
    eventScope: "all",
  },
  {
    id: "2",
    name: "高互动事件预警",
    enabled: true,
    triggerDimension: "event",
    conditionLogic: "any",
    conditions: [
      { field: "event_comments", operator: ">=", value: "100" },
      { field: "event_likes", operator: ">=", value: "200" },
    ],
    pushTiming: "incremental",
    channels: [
      { type: "wechat", personal: true, group: false, personalTargets: [], groupWebhook: "" },
    ],
    eventScope: "all",
  },
  {
    id: "3",
    name: "每日事件汇总",
    enabled: false,
    triggerDimension: "event",
    conditionLogic: "all",
    conditions: [
      { field: "event_count", operator: ">=", value: "3" },
    ],
    pushTiming: "scheduled",
    scheduledInterval: "day",
    channels: [
      { type: "email", personal: true, group: false, personalTargets: [], groupWebhook: "" },
    ],
    eventScope: "all",
  },
];

/* ───────── helpers ───────── */

function getFieldLabel(field: string, dimension: TriggerDimension) {
  const fields = dimension === "event" ? EVENT_CONDITION_FIELDS : SINGLE_CONDITION_FIELDS;
  return fields.find(f => f.value === field)?.label || field;
}

function getOperators(field: string) {
  return OPERATORS[field] || OPERATORS._default;
}

function isSetField(field: string) {
  return ["event_category", "category"].includes(field);
}

function isRiskField(field: string) {
  return ["event_risk", "importance"].includes(field);
}

function isTimeField(field: string) {
  return ["event_time", "publish_time"].includes(field);
}

function formatConditionDisplay(c: RuleCondition, dimension: TriggerDimension) {
  const label = getFieldLabel(c.field, dimension);
  if (isSetField(c.field)) {
    const tags = c.value.split(",").slice(0, 3);
    const more = c.value.split(",").length > 3 ? `等${c.value.split(",").length}项` : "";
    return `${label} 在 [${tags.join("、")}${more}]`;
  }
  if (isTimeField(c.field)) return `${label} 过去 ${c.value} 天内`;
  const opLabel = getOperators(c.field).find(o => o.value === c.operator)?.label || c.operator;
  return `${label} ${opLabel} ${c.value}`;
}

const timingLabels: Record<PushTiming, string> = { realtime: "实时推送", scheduled: "定时汇总", incremental: "增量推送" };
const timingIcons: Record<PushTiming, React.ReactNode> = {
  realtime: <Zap className="w-3 h-3" />,
  scheduled: <Clock className="w-3 h-3" />,
  incremental: <RefreshCw className="w-3 h-3" />,
};
const logicLabels: Record<ConditionLogic, string> = { none: "不配置", any: "满足任一条件", all: "满足所有条件" };

/* ───────── Component ───────── */

export default function EventAlert() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("eventId");

  const [rules, setRules] = useState<AlertRule[]>(defaultRules);
  const [editOpen, setEditOpen] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // editing state
  const emptyRule = (): AlertRule => ({
    id: `rule-${Date.now()}`,
    name: "",
    enabled: true,
    triggerDimension: "event",
    conditionLogic: "all",
    conditions: [{ field: "event_risk", operator: "=", value: "重大" }],
    pushTiming: "realtime",
    scheduledInterval: "day",
    channels: [{ type: "wechat", personal: true, group: false, personalTargets: [], groupWebhook: "" }],
    eventScope: eventId ? "current" : "all",
  });

  const [editingRule, setEditingRule] = useState<AlertRule>(emptyRule());
  const [editingIsNew, setEditingIsNew] = useState(true);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: "已删除预警规则" });
  };

  const openCreate = () => {
    setEditingRule(emptyRule());
    setEditingIsNew(true);
    setEditOpen(true);
  };

  const openEdit = (rule: AlertRule) => {
    setEditingRule({ ...rule, conditions: rule.conditions.map(c => ({ ...c })), channels: rule.channels.map(ch => ({ ...ch, personalTargets: [...ch.personalTargets] })) });
    setEditingIsNew(false);
    setEditOpen(true);
  };

  const saveRule = () => {
    if (!editingRule.name.trim()) {
      toast({ title: "请输入预警规则名称", variant: "destructive" });
      return;
    }
    if (editingIsNew) {
      setRules(prev => [...prev, editingRule]);
    } else {
      setRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
    }
    setEditOpen(false);
    toast({ title: editingIsNew ? "预警规则已添加" : "预警规则已更新" });
  };

  // condition helpers
  const addCondition = () => {
    const fields = editingRule.triggerDimension === "event" ? EVENT_CONDITION_FIELDS : SINGLE_CONDITION_FIELDS;
    const field = fields[0].value;
    const ops = getOperators(field);
    setEditingRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field, operator: ops[0].value, value: "" }],
    }));
  };

  const updateCondition = (idx: number, patch: Partial<RuleCondition>) => {
    setEditingRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, ...patch };
        // reset operator/value when field changes
        if (patch.field && patch.field !== c.field) {
          const ops = getOperators(patch.field);
          updated.operator = ops[0].value;
          updated.value = isRiskField(patch.field) ? "重大" : "";
        }
        return updated;
      }),
    }));
  };

  const removeCondition = (idx: number) => {
    setEditingRule(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
  };

  // category tag toggle
  const toggleCategoryTag = (idx: number, tag: string) => {
    const c = editingRule.conditions[idx];
    const tags = c.value ? c.value.split(",") : [];
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    updateCondition(idx, { value: next.join(",") });
  };

  // channel helpers
  const toggleChannelType = (type: PushChannel["type"]) => {
    setEditingRule(prev => {
      const exists = prev.channels.find(ch => ch.type === type);
      if (exists) {
        return { ...prev, channels: prev.channels.filter(ch => ch.type !== type) };
      }
      return { ...prev, channels: [...prev.channels, { type, personal: true, group: false, personalTargets: [], groupWebhook: "" }] };
    });
  };

  const updateChannel = (type: PushChannel["type"], patch: Partial<PushChannel>) => {
    setEditingRule(prev => ({
      ...prev,
      channels: prev.channels.map(ch => ch.type === type ? { ...ch, ...patch } : ch),
    }));
  };

  const conditionFields = editingRule.triggerDimension === "event" ? EVENT_CONDITION_FIELDS : SINGLE_CONDITION_FIELDS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">预警设置</h1>
          {eventId && <Badge variant="outline" className="text-xs">事件: {eventId}</Badge>}
        </div>
        <Button size="sm" className="text-xs gap-1" onClick={openCreate}>
          <Plus className="w-3 h-3" /> 新增预警规则
        </Button>
      </div>

      {/* Global toggle */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">是否开启预警</span>
          </div>
          <Switch defaultChecked />
        </CardContent>
      </Card>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map((rule, rIdx) => {
          const expanded = expandedRule === rule.id;
          return (
            <Card key={rule.id} className={`transition-all ${rule.enabled ? "" : "opacity-60"}`}>
              <CardContent className="p-0">
                {/* summary row */}
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedRule(expanded ? null : rule.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">预警规则{rIdx + 1}</span>
                      <span className="text-sm text-muted-foreground">—</span>
                      <span className="text-sm text-foreground">{rule.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {rule.triggerDimension === "event" ? "事件聚合" : "单条舆情"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${rule.pushTiming === "realtime" ? "border-primary/40 text-primary" : ""}`}>
                        {timingIcons[rule.pushTiming]} {timingLabels[rule.pushTiming]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                      <span>规则条件：{logicLabels[rule.conditionLogic]}</span>
                      <span className="text-muted-foreground/50">|</span>
                      {rule.conditions.slice(0, 2).map((c, i) => (
                        <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{formatConditionDisplay(c, rule.triggerDimension)}</span>
                      ))}
                      {rule.conditions.length > 2 && <span className="text-[10px] text-muted-foreground">+{rule.conditions.length - 2}条</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-muted-foreground">通知方式：</span>
                      {rule.channels.map(ch => {
                        const ct = channelTypes.find(c => c.type === ch.type);
                        return ct ? (
                          <Badge key={ch.type} variant="outline" className="text-[10px] gap-0.5">
                            <ct.icon className="w-2.5 h-2.5" />
                            {ct.label}
                            {ch.personal && ch.group ? " 个人+群" : ch.group ? " 群" : " 个人"}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <Switch checked={rule.enabled} onCheckedChange={(e) => { e; toggleRule(rule.id); }} onClick={e => e.stopPropagation()} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(rule); }}>
                      <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); deleteRule(rule.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* expanded detail */}
                {expanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">触发维度</span>
                        <p className="text-foreground mt-0.5">{rule.triggerDimension === "event" ? "事件聚合 — 按合并后的事件触发，一个事件只推1次" : "单条舆情 — 满足条件的单条舆情实时推送"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">推送时机</span>
                        <p className="text-foreground mt-0.5 flex items-center gap-1">{timingIcons[rule.pushTiming]} {timingLabels[rule.pushTiming]}
                          {rule.pushTiming === "scheduled" && rule.scheduledInterval && <span className="text-muted-foreground ml-1">({rule.scheduledInterval === "hour" ? "每小时" : rule.scheduledInterval === "day" ? "每天" : "每周"})</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">触发条件 ({logicLabels[rule.conditionLogic]})</span>
                      <div className="mt-1.5 space-y-1.5">
                        {rule.conditions.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                            <span className="font-medium text-foreground">{getFieldLabel(c.field, rule.triggerDimension)}</span>
                            <span className="text-muted-foreground">{getOperators(c.field).find(o => o.value === c.operator)?.label || c.operator}</span>
                            {isSetField(c.field) ? (
                              <div className="flex gap-1 flex-wrap">
                                {c.value.split(",").map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="font-medium text-foreground">{c.value}{isTimeField(c.field) ? " 天" : ""}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* push content preview */}
                    {rule.triggerDimension === "event" && (
                      <div>
                        <span className="text-xs text-muted-foreground">推送内容预览</span>
                        <div className="mt-1.5 border border-border rounded-lg p-3 bg-muted/30 space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 text-destructive" />
                            <span className="font-semibold text-foreground">【事件预警】中央网信办约谈多家OTA平台整治抢票乱象</span>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">重大</Badge>
                            <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">票价吐槽</Badge>
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">发酵速度：高</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 文章 4 篇</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 评论 55</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 点赞 8</span>
                          </div>
                          <p className="text-muted-foreground">AI摘要：多条舆情涉及OTA平台机票退改及价格问题，用户情绪激烈，已引发社交媒体广泛讨论…</p>
                          <div className="flex items-center gap-1 text-primary text-[10px]">
                            <ExternalLink className="w-3 h-3" /> 查看事件详情
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-lg border border-border">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>暂无预警规则</p>
          <Button size="sm" className="mt-4 text-xs gap-1" onClick={openCreate}>
            <Plus className="w-3 h-3" /> 新增预警规则
          </Button>
        </div>
      )}

      {/* ───────── Edit / Create Dialog ───────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              {editingIsNew ? "新增预警规则" : "编辑预警规则"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Rule name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">预警规则名称</label>
              <input
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                value={editingRule.name}
                onChange={e => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：客服重大舆情推送"
              />
            </div>

            <Separator />

            {/* Trigger dimension */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">预警触发维度</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { val: "event" as const, title: "事件聚合", desc: "按合并后的事件触发推送，一个事件只推1次", recommended: true },
                  { val: "single" as const, title: "单条舆情", desc: "满足条件的单条舆情实时推送", recommended: false },
                ]).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      setEditingRule(prev => ({
                        ...prev,
                        triggerDimension: opt.val,
                        conditions: [{ field: opt.val === "event" ? "event_risk" : "importance", operator: "=", value: "重大" }],
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${editingRule.triggerDimension === opt.val
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{opt.title}</span>
                      {opt.recommended && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">推荐</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Condition logic */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">规则条件</label>
              <div className="flex items-center gap-3 mb-3">
                {(["none", "any", "all"] as const).map(logic => (
                  <label key={logic} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionLogic"
                      checked={editingRule.conditionLogic === logic}
                      onChange={() => setEditingRule(prev => ({ ...prev, conditionLogic: logic }))}
                      className="accent-primary"
                    />
                    <span className="text-xs text-foreground">{logicLabels[logic]}</span>
                  </label>
                ))}
              </div>

              {editingRule.conditionLogic !== "none" && (
                <div className="space-y-2">
                  {editingRule.conditions.map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 border border-border">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          {/* field select */}
                          <select
                            className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[140px]"
                            value={cond.field}
                            onChange={e => updateCondition(idx, { field: e.target.value })}
                          >
                            {conditionFields.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>

                          {/* operator select */}
                          <select
                            className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[100px]"
                            value={cond.operator}
                            onChange={e => updateCondition(idx, { operator: e.target.value })}
                          >
                            {getOperators(cond.field).map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>

                          {/* value input */}
                          {isRiskField(cond.field) ? (
                            <select
                              className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[100px]"
                              value={cond.value}
                              onChange={e => updateCondition(idx, { value: e.target.value })}
                            >
                              {RISK_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : isSetField(cond.field) ? null : (
                            <input
                              className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground w-24"
                              value={cond.value}
                              onChange={e => updateCondition(idx, { value: e.target.value })}
                              placeholder={isTimeField(cond.field) ? "天数" : "数值"}
                            />
                          )}
                        </div>

                        {/* category tags */}
                        {isSetField(cond.field) && (
                          <div className="flex gap-1.5 flex-wrap">
                            {CATEGORY_OPTIONS.map(tag => {
                              const selected = cond.value.split(",").includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleCategoryTag(idx, tag)}
                                  className={`px-2 py-1 text-[11px] rounded border transition-colors ${selected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-foreground hover:border-muted-foreground/40"
                                  }`}
                                >
                                  {tag} {selected && "×"}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs shrink-0 h-7" onClick={() => removeCondition(idx)}>
                        删除
                      </Button>
                    </div>
                  ))}
                  <button
                    onClick={addCondition}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1"
                  >
                    <Plus className="w-3 h-3" /> 添加条件
                  </button>
                </div>
              )}
            </div>

            <Separator />

            {/* Push timing */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">推送时机</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: "realtime" as const, title: "实时推送", desc: "事件合并完成后立刻推送" },
                  { val: "scheduled" as const, title: "定时汇总", desc: "按时间段汇总推送" },
                  { val: "incremental" as const, title: "增量推送", desc: "事件新增舆情时推送1次更新" },
                ]).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setEditingRule(prev => ({ ...prev, pushTiming: opt.val }))}
                    className={`p-2.5 rounded-lg border text-left transition-all ${editingRule.pushTiming === opt.val
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {timingIcons[opt.val]}
                      <span className="text-xs font-medium text-foreground">{opt.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {editingRule.pushTiming === "scheduled" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">汇总频率：</span>
                  {(["hour", "day", "week"] as const).map(interval => (
                    <button
                      key={interval}
                      onClick={() => setEditingRule(prev => ({ ...prev, scheduledInterval: interval }))}
                      className={`px-3 py-1 text-xs rounded border ${editingRule.scheduledInterval === interval
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                      }`}
                    >
                      {interval === "hour" ? "每小时" : interval === "day" ? "每天" : "每周"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Notification channels */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">通知方式</label>
              <div className="space-y-3">
                {channelTypes.map(ct => {
                  const ch = editingRule.channels.find(c => c.type === ct.type);
                  const active = !!ch;
                  return (
                    <div key={ct.type} className={`rounded-lg border p-3 transition-all ${active ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={active} onChange={() => toggleChannelType(ct.type)} className="accent-primary" />
                          <ct.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{ct.label}</span>
                        </label>
                      </div>
                      {active && ct.type === "wechat" && ch && (
                        <div className="mt-3 space-y-2 pl-6">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={ch.personal} onChange={() => updateChannel(ct.type, { personal: !ch.personal })} className="accent-primary" />
                              <span className="text-xs text-foreground">个人</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={ch.group} onChange={() => updateChannel(ct.type, { group: !ch.group })} className="accent-primary" />
                              <span className="text-xs text-foreground">群</span>
                            </label>
                          </div>
                          {ch.personal && (
                            <div>
                              <span className="text-[11px] text-muted-foreground">个人</span>
                              <input
                                className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                                value={ch.personalTargets.join(", ")}
                                onChange={e => updateChannel(ct.type, { personalTargets: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                placeholder="输入人员，逗号分隔"
                              />
                            </div>
                          )}
                          {ch.group && (
                            <div>
                              <span className="text-[11px] text-muted-foreground">群机器人地址</span>
                              <input
                                className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                                value={ch.groupWebhook}
                                onChange={e => updateChannel(ct.type, { groupWebhook: e.target.value })}
                                placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-destructive hover:text-destructive text-xs" onClick={() => {
              if (!editingIsNew) {
                deleteRule(editingRule.id);
                setEditOpen(false);
              } else {
                setEditOpen(false);
              }
            }}>
              {editingIsNew ? "取消" : "删除规则"}
            </Button>
            <Button onClick={saveRule}>{editingIsNew ? "确认添加" : "保存修改"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
