import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Bell, Plus, Trash2, MessageCircle,
  ChevronDown, ChevronUp, Settings2, Zap, Clock, ExternalLink,
  Flame, BarChart3, ThumbsUp, Layers, FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ThemeAlertRuleDialog from "@/components/ThemeAlertRuleDialog";
import {
  themeAlertStore,
  useThemeAlerts,
  type ThemeAlertRule,
  type PushTiming,
  type ConditionLogic,
} from "@/lib/themeAlertStore";
import { defaultThemes } from "@/pages/ThemeSettings";

const timingLabels: Record<PushTiming, string> = { realtime: "实时推送", threshold: "阈值推送", scheduled: "定时汇总" };
const timingIcons: Record<PushTiming, React.ReactNode> = {
  realtime: <Zap className="w-3 h-3" />,
  threshold: <Hash className="w-3 h-3" />,
  scheduled: <Clock className="w-3 h-3" />,
};
const logicLabels: Record<ConditionLogic, string> = { none: "不配置", any: "满足任一条件", all: "满足所有条件" };

const FIELD_LABELS: Record<string, string> = {
  event_risk: "事件风险", event_count: "事件规模", event_comments: "事件总评论",
  event_likes: "事件总点赞", event_time: "事件首发时间", event_category: "事件分类",
  importance: "初始风险等级", category: "舆情问题分类", publish_time: "发布时间",
  sentiment_count: "文章总量", comment_count: "总评论量", like_count: "总点赞量",
};

export default function EventAlert() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("eventId");
  const themeId = params.get("themeId") || "sentiment";
  const themeMeta = defaultThemes.find((t) => t.id === themeId);

  const rules = useThemeAlerts(themeId);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ThemeAlertRule | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const openCreate = () => { setEditingRule(null); setEditOpen(true); };
  const openEdit = (r: ThemeAlertRule) => { setEditingRule(r); setEditOpen(true); };
  const deleteRule = (id: string) => { themeAlertStore.remove(id); toast({ title: "已删除预警规则" }); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">预警设置</h1>
          {themeMeta && <Badge variant="outline" className="text-xs">主题：{themeMeta.icon} {themeMeta.name}</Badge>}
          {eventId && <Badge variant="outline" className="text-xs">事件: {eventId}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/datacenter/themes/rules")}>
            <ExternalLink className="w-3 h-3" /> 数据中心-预警配置
          </Button>
          <Button size="sm" className="text-xs gap-1" onClick={openCreate}>
            <Plus className="w-3 h-3" /> 新增预警规则
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">是否开启预警</span>
            <span className="text-xs text-muted-foreground">该主题下共 {rules.length} 条规则，{rules.filter((r) => r.enabled).length} 条启用中</span>
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
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedRule(expanded ? null : rule.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">预警规则{rIdx + 1}</span>
                      <span className="text-sm text-muted-foreground">—</span>
                      <span className="text-sm text-foreground">{rule.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {rule.triggerDimension === "node" ? <><Layers className="w-2.5 h-2.5 mr-0.5" />节点：{rule.triggerNodeName}</> : "单条文章"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${rule.pushTiming === "realtime" ? "border-primary/40 text-primary" : ""}`}>
                        {timingIcons[rule.pushTiming]} {timingLabels[rule.pushTiming]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                      <span>规则条件：{logicLabels[rule.conditionLogic]}</span>
                      <span className="text-muted-foreground/50">|</span>
                      {rule.conditions.slice(0, 2).map((c, i) => (
                        <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {FIELD_LABELS[c.field] || c.field} {c.operator} {c.value}
                        </span>
                      ))}
                      {rule.conditions.length > 2 && <span className="text-[10px] text-muted-foreground">+{rule.conditions.length - 2}条</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-muted-foreground">通知：</span>
                      {rule.channels.map((ch) => (
                        <Badge key={ch.type} variant="outline" className="text-[10px] gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" /> 企业微信
                          {ch.personal && ch.group ? " 个人+群" : ch.group ? " 群" : " 个人"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <Switch checked={rule.enabled} onCheckedChange={() => themeAlertStore.toggle(rule.id)} onClick={(e) => e.stopPropagation()} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(rule); }}>
                      <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">触发维度</span>
                        <p className="text-foreground mt-0.5">
                          {rule.triggerDimension === "node"
                            ? `主题节点：${rule.triggerNodeName}（按合并节点输出触发）`
                            : "单条文章 — 满足条件的单条原始舆情即推送"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">推送时机</span>
                        <p className="text-foreground mt-0.5 flex items-center gap-1">
                          {timingIcons[rule.pushTiming]} {timingLabels[rule.pushTiming]}
                          {rule.pushTiming === "scheduled" && rule.scheduledInterval && (
                            <span className="text-muted-foreground ml-1">
                              ({rule.scheduledInterval === "hour" ? "每小时" : rule.scheduledInterval === "day" ? "每天" : "每周"} {rule.scheduledTimeStart}-{rule.scheduledTimeEnd})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">触发条件 ({logicLabels[rule.conditionLogic]})</span>
                      <div className="mt-1.5 space-y-1.5">
                        {rule.conditions.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                            <span className="font-medium text-foreground">{FIELD_LABELS[c.field] || c.field}</span>
                            <span className="text-muted-foreground">{c.operator}</span>
                            <span className="font-medium text-foreground">{c.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {rule.triggerDimension === "node" && (
                      <div>
                        <span className="text-xs text-muted-foreground">推送内容预览</span>
                        <div className="mt-1.5 border border-border rounded-lg p-3 bg-muted/30 space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 text-destructive" />
                            <span className="font-semibold text-foreground">【事件预警】中央网信办约谈多家OTA平台整治抢票乱象</span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 文章 4 篇</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 评论 55</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 点赞 8</span>
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
          <p>该主题下暂无预警规则</p>
          <Button size="sm" className="mt-4 text-xs gap-1" onClick={openCreate}>
            <Plus className="w-3 h-3" /> 新增预警规则
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <FileText className="w-3 h-3" /> 此处配置的预警规则会同步至「数据中心 · 预警管理 · 预警配置」。
      </p>

      <ThemeAlertRuleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        themeId={themeId}
        rule={editingRule}
      />
    </div>
  );
}
