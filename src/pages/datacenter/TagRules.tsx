import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GitBranch, ArrowRight, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface ThemeRoutingRule {
  id: string;
  name: string;
  targetTheme: string;
  conditions: RuleCondition[];
  logic: "AND" | "OR";
  priority: number;
  status: boolean;
  matchedCount: number;
  description: string;
}

const initialRules: ThemeRoutingRule[] = [
  {
    id: "TR01", name: "舆情主题分流规则", targetTheme: "舆情主题",
    conditions: [
      { field: "情感类型", operator: "=", value: "负面" },
      { field: "是否舆情", operator: "=", value: "true" },
      { field: "内容类型", operator: "≠", value: "灌水贴" },
    ],
    logic: "AND", priority: 1, status: true, matchedCount: 45620,
    description: "负面情感 且 是舆情 且 非灌水贴 → 进入舆情主题",
  },
  {
    id: "TR02", name: "行业咨询分流规则", targetTheme: "行业咨询主题",
    conditions: [
      { field: "行业", operator: "=", value: "OTA" },
      { field: "品牌提及", operator: "包含", value: "竞品" },
    ],
    logic: "AND", priority: 2, status: true, matchedCount: 128900,
    description: "OTA行业 且 提及竞品品牌 → 进入行业咨询主题",
  },
  {
    id: "TR03", name: "热点洞察分流规则", targetTheme: "热点洞察主题",
    conditions: [
      { field: "互动热度", operator: "≥", value: "500" },
      { field: "话题相关", operator: "=", value: "旅游" },
    ],
    logic: "AND", priority: 3, status: true, matchedCount: 23400,
    description: "互动热度≥500 且 旅游相关话题 → 进入热点洞察主题",
  },
  {
    id: "TR04", name: "产品体验分流规则", targetTheme: "产品体验主题",
    conditions: [
      { field: "内容类型", operator: "=", value: "用户反馈" },
      { field: "情感类型", operator: "∈", value: "负面,中性" },
    ],
    logic: "AND", priority: 4, status: true, matchedCount: 67800,
    description: "用户反馈 且 非正面情感 → 进入产品体验主题",
  },
  {
    id: "TR05", name: "高风险内容拦截", targetTheme: "舆情主题",
    conditions: [
      { field: "风险等级", operator: "=", value: "重大" },
      { field: "传播速度", operator: "≥", value: "100" },
    ],
    logic: "OR", priority: 0, status: true, matchedCount: 890,
    description: "重大风险 或 传播速度≥100 → 优先进入舆情主题",
  },
];

const availableFields = ["情感类型", "是否舆情", "业务类型", "内容类型", "风险等级", "行业", "品牌提及", "互动热度", "传播速度", "话题相关", "发酵等级", "OTA品牌", "所属BG", "评论量", "点赞量"];
const operators = ["=", "≠", ">", "≥", "<", "≤", "包含", "不包含", "∈"];
const themes = ["舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题"];

const themeColors: Record<string, string> = {
  "舆情主题": "bg-destructive/10 text-destructive border-destructive/20",
  "行业咨询主题": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "热点洞察主题": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "产品体验主题": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function TagRules() {
  const [rules, setRules] = useState(initialRules);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签规则（主题分流）</h1>
          <p className="text-sm text-muted-foreground mt-1">通过标签表达式组合，定义数据进入各洞察主题的规则</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> 新建分流规则</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃规则</p><p className="text-2xl font-bold text-foreground mt-1">{rules.filter(r => r.status).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">覆盖主题</p><p className="text-2xl font-bold text-primary mt-1">{new Set(rules.map(r => r.targetTheme)).size}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今日命中</p><p className="text-2xl font-bold text-emerald-500 mt-1">{rules.reduce((s, r) => s + r.matchedCount, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">规则总数</p><p className="text-2xl font-bold text-foreground mt-1">{rules.length}</p></CardContent></Card>
      </div>

      {/* Decision Flow Visual */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> 分流决策流</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <div className="shrink-0 px-4 py-3 rounded-lg bg-muted border border-border text-center">
              <p className="text-xs text-muted-foreground">采集数据</p>
              <p className="text-sm font-medium text-foreground">原始数据池</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="shrink-0 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">AI标签</p>
              <p className="text-sm font-medium text-foreground">特征提取</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="shrink-0 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-xs text-muted-foreground">标签规则</p>
              <p className="text-sm font-medium text-foreground">表达式匹配</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex gap-2 shrink-0">
              {themes.map(t => (
                <div key={t} className={`px-3 py-2 rounded-lg border text-center ${themeColors[t]}`}>
                  <p className="text-xs font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">分流规则列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优先级</TableHead>
                <TableHead>规则名称</TableHead>
                <TableHead>目标主题</TableHead>
                <TableHead>匹配逻辑</TableHead>
                <TableHead>表达式</TableHead>
                <TableHead className="text-right">命中量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.sort((a, b) => a.priority - b.priority).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.priority === 0 ? "最高" : `P${r.priority}`}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border ${themeColors[r.targetTheme] || ""}`}>{r.targetTheme}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{r.logic}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                  </TableCell>
                  <TableCell className="text-right font-medium">{r.matchedCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Switch checked={r.status} onCheckedChange={(checked) => {
                      setRules(prev => prev.map(rule => rule.id === r.id ? { ...rule, status: checked } : rule));
                    }} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新建分流规则</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">规则名称</label>
              <Input placeholder="如：舆情主题分流规则" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">目标主题</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择目标主题" /></SelectTrigger>
                <SelectContent>
                  {themes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">匹配条件</label>
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-32"><SelectValue placeholder="字段" /></SelectTrigger><SelectContent>{availableFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                  <Select><SelectTrigger className="w-20"><SelectValue placeholder="运算" /></SelectTrigger><SelectContent>{operators.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                  <Input placeholder="值" className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs"><Plus className="w-3 h-3" /> 添加条件</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">逻辑关系</label>
              <Select defaultValue="AND">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND（全部满足）</SelectItem>
                  <SelectItem value="OR">OR（任一满足）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => { setDialogOpen(false); toast.success("分流规则创建成功"); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
