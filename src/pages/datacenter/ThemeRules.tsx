import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings2, Bell, Trash2, ExternalLink, Layers, MessageCircle, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import ThemeAlertRuleDialog from "@/components/ThemeAlertRuleDialog";
import {
  themeAlertStore,
  useThemeAlerts,
  type ThemeAlertRule,
} from "@/lib/themeAlertStore";
import { defaultThemes } from "@/pages/ThemeSettings";

const FIELD_LABELS: Record<string, string> = {
  event_risk: "事件风险", event_count: "事件规模", event_comments: "事件总评论",
  event_likes: "事件总点赞", event_time: "事件首发时间", event_category: "事件分类",
  importance: "初始风险等级", category: "舆情问题分类", publish_time: "发布时间",
};

const formatCondition = (c: { field: string; operator: string; value: string }) =>
  `${FIELD_LABELS[c.field] || c.field} ${c.operator} ${c.value}`;

export default function ThemeRules() {
  const navigate = useNavigate();
  const allRules = useThemeAlerts();
  const [editOpen, setEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ThemeAlertRule | null>(null);
  const [presetThemeId, setPresetThemeId] = useState<string | undefined>(undefined);
  const [themeFilter, setThemeFilter] = useState<string>("all");

  const filteredRules = useMemo(
    () => themeFilter === "all" ? allRules : allRules.filter((r) => r.themeId === themeFilter),
    [allRules, themeFilter]
  );

  const activeCount = allRules.filter((a) => a.enabled).length;
  const totalTriggers = allRules.reduce((s, a) => s + a.triggerCount, 0);
  const criticalCount = allRules.filter((a) => a.level === "critical" && a.enabled).length;

  const openCreate = () => {
    setEditingRule(null);
    setPresetThemeId(undefined); // dialog will show theme picker first
    setEditOpen(true);
  };

  const openEdit = (rule: ThemeAlertRule) => {
    setEditingRule(rule);
    setPresetThemeId(rule.themeId);
    setEditOpen(true);
  };

  const handleDelete = (id: string) => {
    themeAlertStore.remove(id);
    toast.success("预警规则已删除");
  };

  const goToTheme = (themeId: string) => {
    // Sentiment theme has a dedicated page; others fall back to the list
    if (themeId === "sentiment") navigate(`/sentiment/event-alert?themeId=${themeId}`);
    else navigate(`/sentiment/event-alert?themeId=${themeId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">预警配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            汇总各洞察主题下的预警规则，可在此新建预警并指定主题；与「洞察主题 · 预警设置」双向联动
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> 新建预警
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">预警总数</p><p className="text-2xl font-bold text-foreground mt-1">{allRules.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃预警</p><p className="text-2xl font-bold text-emerald-500 mt-1">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计触发</p><p className="text-2xl font-bold text-amber-500 mt-1">{totalTriggers}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">严重预警</p><p className="text-2xl font-bold text-destructive mt-1">{criticalCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> 预警规则列表</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">按主题筛选：</span>
            <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)} className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground">
              <option value="all">全部主题</option>
              {defaultThemes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>预警名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>触发维度</TableHead>
                <TableHead>触发条件</TableHead>
                <TableHead>推送方式</TableHead>
                <TableHead>推送时机</TableHead>
                <TableHead className="text-right">触发次数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell>
                    <button onClick={() => goToTheme(a.themeId)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Badge variant="outline" className="text-xs">{a.themeName}</Badge>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </TableCell>
                  <TableCell>
                    {a.triggerDimension === "node" ? (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Layers className="w-2.5 h-2.5" /> 节点：{a.triggerNodeName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">单条文章</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                    <div className="flex flex-wrap gap-1">
                      {a.conditions.slice(0, 2).map((c, i) => (
                        <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{formatCondition(c)}</span>
                      ))}
                      {a.conditions.length > 2 && <span className="text-[10px]">+{a.conditions.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {a.channels.map((c) => (
                        <Badge key={c.type} className="text-[10px] bg-muted text-muted-foreground border-0 gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" /> 企业微信{c.personal && c.group ? " 个人+群" : c.group ? " 群" : " 个人"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {a.pushTiming === "realtime" ? <Zap className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {a.pushTiming === "realtime" ? "实时推送" : "定时汇总"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{a.triggerCount}</TableCell>
                  <TableCell><Switch checked={a.enabled} onCheckedChange={() => themeAlertStore.toggle(a.id)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                    暂无预警规则
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ThemeAlertRuleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        themeId={presetThemeId}
        rule={editingRule}
      />
    </div>
  );
}
