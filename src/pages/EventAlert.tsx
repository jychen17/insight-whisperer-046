import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Plus, Trash2, AlertTriangle, Mail, MessageCircle, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  channels: string[];
  enabled: boolean;
  eventScope: "current" | "all";
}

const defaultRules: AlertRule[] = [
  { id: "1", name: "重大事件即时预警", condition: "事件等级为「重大」时", channels: ["企业微信", "邮件"], enabled: true, eventScope: "all" },
  { id: "2", name: "高发酵速度预警", condition: "发酵速度为「高」时", channels: ["企业微信"], enabled: true, eventScope: "all" },
  { id: "3", name: "评论量突增预警", condition: "单事件评论量 > 100 时", channels: ["企业微信", "短信"], enabled: false, eventScope: "all" },
];

const channelIcons: Record<string, React.ReactNode> = {
  "企业微信": <MessageCircle className="w-3 h-3" />,
  "邮件": <Mail className="w-3 h-3" />,
  "短信": <Phone className="w-3 h-3" />,
  "电话": <Phone className="w-3 h-3" />,
};

const channelOptions = ["企业微信", "邮件", "短信", "电话"];

export default function EventAlert() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("eventId");
  const [rules, setRules] = useState<AlertRule[]>(defaultRules);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCondition, setNewCondition] = useState("sentiment_count");
  const [newOperator, setNewOperator] = useState(">");
  const [newValue, setNewValue] = useState("50");
  const [newChannels, setNewChannels] = useState<string[]>(["企业微信"]);
  const [newScope, setNewScope] = useState<"current" | "all">(eventId ? "current" : "all");

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: "已删除预警规则" });
  };

  const conditionOptions = [
    { value: "sentiment_count", label: "文章总量" },
    { value: "comment_count", label: "总评论量" },
    { value: "like_count", label: "总点赞量" },
    { value: "importance", label: "事件等级" },
    { value: "ferment_speed", label: "发酵速度" },
    { value: "negative_ratio", label: "负向占比(%)" },
  ];

  const addRule = () => {
    const condLabel = conditionOptions.find(c => c.value === newCondition)?.label || newCondition;
    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newName || `${condLabel} ${newOperator} ${newValue} 预警`,
      condition: `${condLabel} ${newOperator} ${newValue} 时`,
      channels: newChannels,
      enabled: true,
      eventScope: newScope,
    };
    setRules(prev => [...prev, rule]);
    setAddOpen(false);
    setNewName("");
    toast({ title: "预警规则已添加" });
  };

  const toggleChannel = (ch: string) => {
    setNewChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">事件预警设置</h1>
          {eventId && <Badge variant="outline" className="text-xs">事件: {eventId}</Badge>}
        </div>
        <Button size="sm" className="text-xs gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="w-3 h-3" /> 新增预警规则
        </Button>
      </div>

      {/* Alert rules list */}
      <div className="space-y-3">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${rule.enabled ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                    <Badge variant="outline" className="text-[10px]">{rule.eventScope === "current" ? "当前事件" : "全部事件"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">触发条件：{rule.condition}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground">推送渠道：</span>
                    {rule.channels.map(ch => (
                      <Badge key={ch} variant="outline" className="text-[10px] gap-1">
                        {channelIcons[ch]} {ch}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-lg border border-border">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>暂无预警规则</p>
          <Button size="sm" className="mt-4 text-xs gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3 h-3" /> 新增预警规则
          </Button>
        </div>
      )}

      {/* Add rule dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> 新增预警规则</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground">规则名称</label>
              <input className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground" value={newName} onChange={e => setNewName(e.target.value)} placeholder="如：评论量突增预警" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">触发条件</label>
              <div className="flex gap-2">
                <select className="flex-1 px-2 py-2 text-xs border border-border rounded-md bg-card text-foreground" value={newCondition} onChange={e => setNewCondition(e.target.value)}>
                  {conditionOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select className="w-16 px-2 py-2 text-xs border border-border rounded-md bg-card text-foreground" value={newOperator} onChange={e => setNewOperator(e.target.value)}>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="=">=</option>
                  <option value="<">&lt;</option>
                </select>
                <input className="w-20 px-2 py-2 text-xs border border-border rounded-md bg-card text-foreground" value={newValue} onChange={e => setNewValue(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">适用范围</label>
              <div className="flex gap-2">
                {([["current", "当前事件"], ["all", "全部事件"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setNewScope(val)} className={`px-3 py-1.5 text-xs rounded-md border ${newScope === val ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">推送渠道</label>
              <div className="flex gap-2 flex-wrap">
                {channelOptions.map(ch => (
                  <button key={ch} onClick={() => toggleChannel(ch)} className={`px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 ${newChannels.includes(ch) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>
                    {channelIcons[ch]} {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={addRule} disabled={newChannels.length === 0}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
