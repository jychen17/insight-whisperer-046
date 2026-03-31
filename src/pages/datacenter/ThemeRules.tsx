import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings2, Bell, Trash2, X, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface AlertConfig {
  id: string;
  name: string;
  theme: string;
  triggerField: string;
  triggerOperator: string;
  triggerValue: string;
  level: "warning" | "critical";
  status: boolean;
  triggerCount: number;
  pushChannels: PushChannel[];
  statMode: StatMode;
  statParam: string;
}

interface PushChannel {
  type: "wechat_person" | "wechat_group" | "email" | "phone" | "sms";
  targets: string;
}

type StatMode = "realtime" | "period" | "threshold";

const PUSH_TYPES = [
  { value: "wechat_person" as const, label: "企业微信(个人)" },
  { value: "wechat_group" as const, label: "企业微信(群)" },
  { value: "email" as const, label: "邮件" },
  { value: "phone" as const, label: "电话" },
  { value: "sms" as const, label: "短信" },
];

const STAT_MODES = [
  { value: "realtime" as const, label: "实时推送", desc: "满足条件立即推送" },
  { value: "period" as const, label: "汇总推送", desc: "按时间段汇总后推送" },
  { value: "threshold" as const, label: "阈值推送", desc: "累计达到阈值后推送" },
];

const TRIGGER_FIELDS = [
  "负面舆情数", "重大舆情数", "风险等级", "发酵等级", "热度指数",
  "竞品声量变化", "严重问题数", "采集完整率", "评论量", "互动量",
];

const TRIGGER_OPERATORS = [">", ">=", "<", "<=", "=", "!=", "环比>", "同比>"];

const THEMES = ["舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "全局"];

const mockAlerts: AlertConfig[] = [
  {
    id: "AL01", name: "负面舆情突增预警", theme: "舆情主题",
    triggerField: "负面舆情数", triggerOperator: ">", triggerValue: "50条/小时",
    level: "warning", status: true, triggerCount: 23,
    pushChannels: [
      { type: "wechat_person", targets: "张三、李四" },
      { type: "wechat_group", targets: "舆情预警群" },
      { type: "email", targets: "zhangsan@company.com" },
    ],
    statMode: "threshold", statParam: "50条/小时",
  },
  {
    id: "AL02", name: "重大舆情立即预警", theme: "舆情主题",
    triggerField: "风险等级", triggerOperator: "=", triggerValue: "重大",
    level: "critical", status: true, triggerCount: 5,
    pushChannels: [
      { type: "phone", targets: "张三" },
      { type: "wechat_group", targets: "管理层预警群" },
      { type: "email", targets: "all-managers@company.com" },
    ],
    statMode: "realtime", statParam: "",
  },
  {
    id: "AL03", name: "竞品异常声量预警", theme: "行业咨询主题",
    triggerField: "竞品声量变化", triggerOperator: "环比>", triggerValue: "200%",
    level: "warning", status: true, triggerCount: 12,
    pushChannels: [
      { type: "wechat_group", targets: "行业分析群" },
    ],
    statMode: "period", statParam: "每日09:00汇总",
  },
  {
    id: "AL04", name: "热点话题预警", theme: "热点洞察主题",
    triggerField: "热度指数", triggerOperator: ">", triggerValue: "500",
    level: "warning", status: true, triggerCount: 45,
    pushChannels: [
      { type: "wechat_person", targets: "王五" },
      { type: "wechat_group", targets: "热点监控群" },
    ],
    statMode: "threshold", statParam: "热度>500",
  },
  {
    id: "AL05", name: "严重体验问题预警", theme: "产品体验主题",
    triggerField: "严重问题数", triggerOperator: ">", triggerValue: "10条/日",
    level: "critical", status: true, triggerCount: 8,
    pushChannels: [
      { type: "phone", targets: "赵六" },
      { type: "wechat_group", targets: "产品问题群" },
    ],
    statMode: "realtime", statParam: "",
  },
  {
    id: "AL06", name: "数据质量异常预警", theme: "全局",
    triggerField: "采集完整率", triggerOperator: "<", triggerValue: "95%",
    level: "warning", status: false, triggerCount: 3,
    pushChannels: [
      { type: "wechat_group", targets: "技术运维群" },
    ],
    statMode: "period", statParam: "每小时汇总",
  },
];

const levelColors: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ThemeRules() {
  const [alerts, setAlerts] = useState<AlertConfig[]>(mockAlerts);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const activeCount = alerts.filter((a) => a.status).length;
  const todayTriggers = alerts.reduce((s, a) => s + a.triggerCount, 0);
  const criticalCount = alerts.filter((a) => a.level === "critical" && a.status).length;

  const handleToggle = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: !a.status } : a));
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("预警规则已删除");
  };

  const handleEdit = (alert: AlertConfig) => {
    setEditingAlert({ ...alert });
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingAlert({
      id: `AL_${Date.now()}`, name: "", theme: "舆情主题",
      triggerField: "负面舆情数", triggerOperator: ">", triggerValue: "",
      level: "warning", status: true, triggerCount: 0,
      pushChannels: [], statMode: "realtime", statParam: "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingAlert) return;
    if (!editingAlert.name.trim()) { toast.error("请输入预警名称"); return; }
    if (!editingAlert.triggerValue.trim()) { toast.error("请输入触发值"); return; }
    if (editingAlert.pushChannels.length === 0) { toast.error("请至少选择一个推送渠道"); return; }

    setAlerts((prev) => {
      const exists = prev.find((a) => a.id === editingAlert.id);
      return exists ? prev.map((a) => a.id === editingAlert.id ? editingAlert : a) : [...prev, editingAlert];
    });
    setShowDialog(false);
    toast.success("预警规则已保存");
  };

  const togglePushChannel = (type: PushChannel["type"]) => {
    if (!editingAlert) return;
    const exists = editingAlert.pushChannels.find((c) => c.type === type);
    setEditingAlert({
      ...editingAlert,
      pushChannels: exists
        ? editingAlert.pushChannels.filter((c) => c.type !== type)
        : [...editingAlert.pushChannels, { type, targets: "" }],
    });
  };

  const updatePushTarget = (type: PushChannel["type"], targets: string) => {
    if (!editingAlert) return;
    setEditingAlert({
      ...editingAlert,
      pushChannels: editingAlert.pushChannels.map((c) => c.type === type ? { ...c, targets } : c),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">预警配置</h1>
          <p className="text-sm text-muted-foreground mt-1">各业务主题自主配置预警触发规则、推送方式和统计策略</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}><Plus className="w-4 h-4" /> 新建预警</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">预警总数</p><p className="text-2xl font-bold text-foreground mt-1">{alerts.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃预警</p><p className="text-2xl font-bold text-emerald-500 mt-1">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今日触发</p><p className="text-2xl font-bold text-amber-500 mt-1">{todayTriggers}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">严重预警</p><p className="text-2xl font-bold text-destructive mt-1">{criticalCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> 预警规则列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>预警名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>触发规则</TableHead>
                <TableHead>推送方式</TableHead>
                <TableHead>统计方式</TableHead>
                <TableHead className="text-right">触发次数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.theme}</Badge></TableCell>
                  <TableCell>
                    <Badge className={`text-xs border ${levelColors[a.level]}`}>
                      {a.level === "critical" ? "🔴 严重" : "🟡 警告"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                    {a.triggerField} {a.triggerOperator} {a.triggerValue}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {a.pushChannels.map((c) => (
                        <Badge key={c.type} className="text-[10px] bg-muted text-muted-foreground border-0">
                          {PUSH_TYPES.find((t) => t.value === c.type)?.label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {STAT_MODES.find((m) => m.value === a.statMode)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{a.triggerCount}</TableCell>
                  <TableCell><Switch checked={a.status} onCheckedChange={() => handleToggle(a.id)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Config Dialog */}
      {showDialog && editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-xl border border-border shadow-2xl w-[680px] max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                {alerts.find((a) => a.id === editingAlert.id) ? "编辑预警" : "新建预警"}
              </h2>
              <button onClick={() => setShowDialog(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground">预警名称 *</label>
                  <input value={editingAlert.name} onChange={(e) => setEditingAlert({ ...editingAlert, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="例如：负面舆情突增预警" maxLength={30} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">所属主题</label>
                  <select value={editingAlert.theme} onChange={(e) => setEditingAlert({ ...editingAlert, theme: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground">
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">预警级别</label>
                <div className="flex gap-3 mt-1.5">
                  {(["warning", "critical"] as const).map((level) => (
                    <button key={level} onClick={() => setEditingAlert({ ...editingAlert, level })}
                      className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                        editingAlert.level === level
                          ? level === "critical" ? "border-destructive bg-destructive/10 text-destructive" : "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}>
                      {level === "critical" ? "🔴 严重" : "🟡 警告"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Rule */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />触发规则 *
                </label>
                <div className="flex items-center gap-2">
                  <select value={editingAlert.triggerField} onChange={(e) => setEditingAlert({ ...editingAlert, triggerField: e.target.value })}
                    className="flex-1 px-2 py-2 text-sm border border-border rounded-md bg-card text-foreground">
                    {TRIGGER_FIELDS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                  <select value={editingAlert.triggerOperator} onChange={(e) => setEditingAlert({ ...editingAlert, triggerOperator: e.target.value })}
                    className="w-24 px-2 py-2 text-sm border border-border rounded-md bg-card text-foreground">
                    {TRIGGER_OPERATORS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <input value={editingAlert.triggerValue} onChange={(e) => setEditingAlert({ ...editingAlert, triggerValue: e.target.value })}
                    className="flex-1 px-2 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="如：50条/小时、200%、重大" />
                </div>
              </div>

              {/* Push Channels */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">推送方式 *（可多选）</label>
                <div className="space-y-2">
                  {PUSH_TYPES.map((pt) => {
                    const selected = editingAlert.pushChannels.some((c) => c.type === pt.value);
                    const channel = editingAlert.pushChannels.find((c) => c.type === pt.value);
                    return (
                      <div key={pt.value} className={`border rounded-lg p-3 transition-colors ${selected ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Checkbox checked={selected} onCheckedChange={() => togglePushChannel(pt.value)} />
                          <span className="text-sm text-foreground">{pt.label}</span>
                        </div>
                        {selected && (
                          <input value={channel?.targets || ""} onChange={(e) => updatePushTarget(pt.value, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none ml-6"
                            placeholder={pt.value.includes("wechat_person") ? "输入人员姓名，多人用逗号分隔"
                              : pt.value.includes("wechat_group") ? "输入群名称，多群用逗号分隔"
                              : pt.value === "email" ? "输入邮箱地址，多个用逗号分隔"
                              : pt.value === "phone" ? "输入手机号，多个用逗号分隔"
                              : "输入手机号"} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics Mode */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">统计方式</label>
                <div className="grid grid-cols-3 gap-3">
                  {STAT_MODES.map((mode) => (
                    <button key={mode.value} onClick={() => setEditingAlert({ ...editingAlert, statMode: mode.value })}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        editingAlert.statMode === mode.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}>
                      <p className="text-sm font-medium text-foreground">{mode.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</p>
                    </button>
                  ))}
                </div>
                {editingAlert.statMode !== "realtime" && (
                  <input value={editingAlert.statParam} onChange={(e) => setEditingAlert({ ...editingAlert, statParam: e.target.value })}
                    className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder={editingAlert.statMode === "period" ? "例如：每日09:00汇总、每小时汇总" : "例如：累计50条触发"} />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-border shrink-0">
              <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
