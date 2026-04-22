import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Plus, Zap, Clock, MessageCircle, Layers, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  themeAlertStore,
  newRuleId,
  type ThemeAlertRule,
  type RuleCondition,
  type PushChannel,
  type ConditionLogic,
  type PushTiming,
} from "@/lib/themeAlertStore";
import { defaultThemes } from "@/pages/ThemeSettings";

/* ───────── condition catalogs ───────── */

const EVENT_CONDITION_FIELDS = [
  { value: "event_risk", label: "事件风险" },
  { value: "event_count", label: "事件规模(条数)" },
  { value: "event_comments", label: "事件总评论量" },
  { value: "event_likes", label: "事件总点赞量" },
  { value: "event_time", label: "事件首发时间" },
  { value: "event_category", label: "事件分类" },
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

const isSetField = (f: string) => ["event_category", "category"].includes(f);
const isRiskField = (f: string) => ["event_risk", "importance"].includes(f);
const isTimeField = (f: string) => ["event_time", "publish_time"].includes(f);
const getOperators = (f: string) => OPERATORS[f] || OPERATORS._default;

const logicLabels: Record<ConditionLogic, string> = { none: "不配置", any: "满足任一条件", all: "满足所有条件" };
const timingLabels: Record<PushTiming, string> = { realtime: "实时推送", scheduled: "定时汇总" };
const timingIcons: Record<PushTiming, React.ReactNode> = {
  realtime: <Zap className="w-3 h-3" />,
  scheduled: <Clock className="w-3 h-3" />,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Theme to attach the rule to. If undefined, dialog shows a theme picker first. */
  themeId?: string;
  /** Existing rule to edit; null/undefined means create. */
  rule?: ThemeAlertRule | null;
  /** Optional callback after save. */
  onSaved?: (r: ThemeAlertRule) => void;
}

const emptyRule = (themeId: string, themeName: string): ThemeAlertRule => ({
  id: newRuleId(),
  themeId,
  themeName,
  name: "",
  enabled: true,
  triggerDimension: "single",
  conditionLogic: "all",
  conditions: [{ field: "importance", operator: "=", value: "重大" }],
  pushTiming: "realtime",
  scheduledInterval: "day",
  scheduledTimeStart: "08:00",
  scheduledTimeEnd: "20:00",
  channels: [{ type: "wechat", personal: true, group: false, personalTargets: [], groupWebhook: "" }],
  level: "warning",
  triggerCount: 0,
  createdAt: new Date().toISOString().slice(0, 10),
});

export default function ThemeAlertRuleDialog({ open, onOpenChange, themeId, rule, onSaved }: Props) {
  const isEdit = !!rule;
  const [pickedThemeId, setPickedThemeId] = useState<string>(themeId || rule?.themeId || "");
  const themeMeta = useMemo(
    () => defaultThemes.find((t) => t.id === pickedThemeId),
    [pickedThemeId]
  );
  const mergeNodes = themeMeta?.mergeNodes || [];

  const [draft, setDraft] = useState<ThemeAlertRule | null>(null);

  useEffect(() => {
    if (!open) return;
    if (rule) {
      setDraft({ ...rule, conditions: rule.conditions.map((c) => ({ ...c })), channels: rule.channels.map((c) => ({ ...c, personalTargets: [...c.personalTargets] })) });
      setPickedThemeId(rule.themeId);
    } else if (themeId) {
      const t = defaultThemes.find((x) => x.id === themeId);
      setDraft(emptyRule(themeId, t?.name || themeId));
      setPickedThemeId(themeId);
    } else {
      setDraft(null);
      setPickedThemeId("");
    }
  }, [open, rule, themeId]);

  // When user picks theme in standalone mode, init draft
  useEffect(() => {
    if (open && !rule && !themeId && pickedThemeId && !draft) {
      const t = defaultThemes.find((x) => x.id === pickedThemeId);
      setDraft(emptyRule(pickedThemeId, t?.name || pickedThemeId));
    }
  }, [pickedThemeId, open, rule, themeId, draft]);

  // Theme picker step (only for "新建预警" from datacenter without a preset theme)
  const showThemePicker = !themeId && !rule && !pickedThemeId;

  const setDraftField = <K extends keyof ThemeAlertRule>(k: K, v: ThemeAlertRule[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const conditionFields = draft?.triggerDimension === "node" ? EVENT_CONDITION_FIELDS : SINGLE_CONDITION_FIELDS;

  const updateCondition = (idx: number, patch: Partial<RuleCondition>) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        conditions: d.conditions.map((c, i) => {
          if (i !== idx) return c;
          const next = { ...c, ...patch };
          if (patch.field && patch.field !== c.field) {
            next.operator = getOperators(patch.field)[0].value;
            next.value = isRiskField(patch.field) ? "重大" : "";
          }
          return next;
        }),
      };
    });
  };

  const addCondition = () => {
    if (!draft) return;
    const f = conditionFields[0].value;
    setDraft({ ...draft, conditions: [...draft.conditions, { field: f, operator: getOperators(f)[0].value, value: "" }] });
  };

  const removeCondition = (idx: number) =>
    setDraft((d) => (d ? { ...d, conditions: d.conditions.filter((_, i) => i !== idx) } : d));

  const toggleCategoryTag = (idx: number, tag: string) => {
    if (!draft) return;
    const c = draft.conditions[idx];
    const tags = c.value ? c.value.split(",") : [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    updateCondition(idx, { value: next.join(",") });
  };

  const updateChannel = (type: PushChannel["type"], patch: Partial<PushChannel>) =>
    setDraft((d) => (d ? { ...d, channels: d.channels.map((c) => (c.type === type ? { ...c, ...patch } : c)) } : d));

  const handleDimensionChange = (kind: "single" | "node", nodeId?: string) => {
    if (!draft) return;
    const node = nodeId ? mergeNodes.find((n) => n.id === nodeId) : undefined;
    setDraft({
      ...draft,
      triggerDimension: kind,
      triggerNodeId: kind === "node" ? nodeId : undefined,
      triggerNodeName: kind === "node" ? node?.name : undefined,
      conditions: [{ field: kind === "node" ? "event_risk" : "importance", operator: "=", value: "重大" }],
    });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.themeId) {
      toast({ title: "请选择所属主题", variant: "destructive" });
      return;
    }
    if (!draft.name.trim()) {
      toast({ title: "请输入预警规则名称", variant: "destructive" });
      return;
    }
    if (draft.triggerDimension === "node" && !draft.triggerNodeId) {
      toast({ title: "请选择触发节点", variant: "destructive" });
      return;
    }
    themeAlertStore.upsert(draft);
    toast({ title: isEdit ? "预警规则已更新" : "预警规则已添加" });
    onSaved?.(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            {isEdit ? "编辑预警规则" : "新增预警规则"}
            {draft?.themeName && <Badge variant="outline" className="ml-2 text-[10px]">{draft.themeName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {showThemePicker ? (
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">请选择该预警规则要绑定的洞察主题：</p>
            <div className="grid grid-cols-2 gap-3">
              {defaultThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPickedThemeId(t.id)}
                  className="p-3 rounded-lg border border-border text-left hover:border-primary hover:bg-primary/5 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Layers className="w-3 h-3" /> {(t.mergeNodes || []).length} 个节点
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : draft ? (
          <div className="space-y-5 py-2">
            {/* Theme readonly hint */}
            {!themeId && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20 text-xs">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground">所属主题：</span>
                <span className="font-medium text-primary">{draft.themeName}</span>
                {!isEdit && (
                  <Button variant="ghost" size="sm" className="ml-auto h-6 text-[11px]" onClick={() => { setPickedThemeId(""); setDraft(null); }}>
                    切换主题
                  </Button>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">预警规则名称 *</label>
              <input
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                value={draft.name}
                onChange={(e) => setDraftField("name", e.target.value)}
                placeholder="如：客服重大舆情推送"
              />
            </div>

            <Separator />

            {/* Trigger dimension */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">预警触发维度 *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDimensionChange("single")}
                  className={`p-3 rounded-lg border text-left transition ${draft.triggerDimension === "single" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <div className="text-sm font-medium text-foreground">单条文章</div>
                  <p className="text-[11px] text-muted-foreground mt-1">满足条件的单条原始舆情即推送</p>
                </button>
                <div className={`p-3 rounded-lg border ${draft.triggerDimension === "node" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">主题节点</span>
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">推荐</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-2">基于该主题下任一合并节点触发</p>
                  {mergeNodes.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">该主题暂未配置合并节点</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {mergeNodes.map((n, i) => {
                        const active = draft.triggerDimension === "node" && draft.triggerNodeId === n.id;
                        return (
                          <button
                            key={n.id}
                            onClick={() => handleDimensionChange("node", n.id)}
                            className={`px-2 py-1 text-[11px] rounded-md border transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}
                          >
                            节点{i + 1}：{n.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Condition logic + builder */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">规则条件 *</label>
              <div className="flex items-center gap-3 mb-3">
                {(["any", "all"] as const).map((logic) => (
                  <label key={logic} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={draft.conditionLogic === logic} onChange={() => setDraftField("conditionLogic", logic)} className="accent-primary" />
                    <span className="text-xs text-foreground">{logicLabels[logic]}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                {draft.conditions.map((cond, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 border border-border">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <select className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[140px]" value={cond.field} onChange={(e) => updateCondition(idx, { field: e.target.value })}>
                          {conditionFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <select className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[100px]" value={cond.operator} onChange={(e) => updateCondition(idx, { operator: e.target.value })}>
                          {getOperators(cond.field).map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                        {isRiskField(cond.field) ? (
                          <select className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[100px]" value={cond.value} onChange={(e) => updateCondition(idx, { value: e.target.value })}>
                            {RISK_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        ) : isSetField(cond.field) ? null : (
                          <input className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground w-28" value={cond.value} onChange={(e) => updateCondition(idx, { value: e.target.value })} placeholder={isTimeField(cond.field) ? "天数" : "数值"} />
                        )}
                      </div>
                      {isSetField(cond.field) && (
                        <div className="flex gap-1.5 flex-wrap">
                          {CATEGORY_OPTIONS.map((tag) => {
                            const sel = cond.value.split(",").includes(tag);
                            return (
                              <button key={tag} onClick={() => toggleCategoryTag(idx, tag)} className={`px-2 py-1 text-[11px] rounded border ${sel ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-muted-foreground/40"}`}>
                                {tag} {sel && "×"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => removeCondition(idx)}>删除</Button>
                  </div>
                ))}
                <button onClick={addCondition} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                  <Plus className="w-3 h-3" /> 添加条件
                </button>
              </div>
            </div>

            <Separator />

            {/* Push timing (推送事件) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">推送事件 / 推送时机</label>
              <div className="grid grid-cols-2 gap-2">
                {(["realtime", "scheduled"] as const).map((opt) => (
                  <button key={opt} onClick={() => setDraftField("pushTiming", opt)} className={`p-2.5 rounded-lg border text-left transition ${draft.pushTiming === opt ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className="flex items-center gap-1.5">
                      {timingIcons[opt]}
                      <span className="text-xs font-medium text-foreground">{timingLabels[opt]}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt === "realtime" ? "满足条件立即推送" : "按时间段汇总后推送"}</p>
                  </button>
                ))}
              </div>
              {draft.pushTiming === "scheduled" && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">汇总频率：</span>
                    {(["hour", "day", "week"] as const).map((iv) => (
                      <button key={iv} onClick={() => setDraftField("scheduledInterval", iv)} className={`px-3 py-1 text-xs rounded border ${draft.scheduledInterval === iv ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>
                        {iv === "hour" ? "每小时" : iv === "day" ? "每天" : "每周"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">推送时段：</span>
                    <input type="time" className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground" value={draft.scheduledTimeStart || "08:00"} onChange={(e) => setDraftField("scheduledTimeStart", e.target.value)} />
                    <span className="text-xs text-muted-foreground">至</span>
                    <input type="time" className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground" value={draft.scheduledTimeEnd || "20:00"} onChange={(e) => setDraftField("scheduledTimeEnd", e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notification */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">通知方式（企业微信）</label>
              {draft.channels.map((ch) => (
                <div key={ch.type} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">企业微信</span>
                  </div>
                  <div className="mt-3 space-y-2 pl-6">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={ch.personal} onChange={() => updateChannel(ch.type, { personal: !ch.personal })} className="accent-primary" />
                        <span className="text-xs text-foreground">个人</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={ch.group} onChange={() => updateChannel(ch.type, { group: !ch.group })} className="accent-primary" />
                        <span className="text-xs text-foreground">群</span>
                      </label>
                    </div>
                    {ch.personal && (
                      <div>
                        <span className="text-[11px] text-muted-foreground">个人（姓名/工号，逗号分隔）</span>
                        <input className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={ch.personalTargets.join(", ")} onChange={(e) => updateChannel(ch.type, { personalTargets: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="如：张三, 1227152" />
                      </div>
                    )}
                    {ch.group && (
                      <div>
                        <span className="text-[11px] text-muted-foreground">群机器人 webhook</span>
                        <input className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={ch.groupWebhook} onChange={(e) => updateChannel(ch.type, { groupWebhook: e.target.value })} placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!showThemePicker && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleSave}>{isEdit ? "保存修改" : "确认添加"}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
