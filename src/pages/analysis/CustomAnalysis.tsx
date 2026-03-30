import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Play, Save, Clock, BarChart3, PieChart, TrendingUp, Table2, Trash2, Edit2, Copy, Eye, X, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Analysis {
  id: string;
  name: string;
  type: string;
  lastRun: string;
  chart: string;
  dataSource: string;
  timeRange?: string;
  description?: string;
  status?: "idle" | "running" | "done";
}

const defaultAnalyses: Analysis[] = [
  { id: "A01", name: "品牌情感趋势对比", type: "趋势分析", lastRun: "2小时前", chart: "折线图", dataSource: "舆情数据", status: "done" },
  { id: "A02", name: "各平台声量占比", type: "分布分析", lastRun: "1天前", chart: "饼图", dataSource: "全量数据", status: "done" },
  { id: "A03", name: "竞品NPS评分对比", type: "对比分析", lastRun: "3天前", chart: "柱状图", dataSource: "体验数据", status: "done" },
  { id: "A04", name: "热点传播路径追踪", type: "路径分析", lastRun: "5天前", chart: "桑基图", dataSource: "热点数据", status: "done" },
  { id: "A05", name: "用户反馈关键词云", type: "文本分析", lastRun: "1周前", chart: "词云图", dataSource: "体验数据", status: "done" },
];

const chartTypes = [
  { icon: TrendingUp, name: "折线图", desc: "趋势变化" },
  { icon: BarChart3, name: "柱状图", desc: "对比分析" },
  { icon: PieChart, name: "饼图", desc: "占比分布" },
  { icon: Table2, name: "数据表", desc: "明细数据" },
];

const analysisTypes = ["趋势分析", "分布分析", "对比分析", "路径分析", "文本分析", "关联分析"];
const dataSources = [
  { value: "sentiment", label: "舆情数据" },
  { value: "industry", label: "行业数据" },
  { value: "hotspot", label: "热点数据" },
  { value: "experience", label: "体验数据" },
  { value: "all", label: "全量数据" },
];
const timeRanges = [
  { value: "7d", label: "最近7天" },
  { value: "30d", label: "最近30天" },
  { value: "90d", label: "最近90天" },
  { value: "custom", label: "自定义" },
];

const dataSourceLabelMap: Record<string, string> = {
  sentiment: "舆情数据", industry: "行业数据", hotspot: "热点数据", experience: "体验数据", all: "全量数据",
};
const timeRangeLabelMap: Record<string, string> = {
  "7d": "最近7天", "30d": "最近30天", "90d": "最近90天", custom: "自定义",
};

interface FormState {
  name: string;
  type: string;
  dataSource: string;
  timeRange: string;
  description: string;
  chart: string;
}

const emptyForm: FormState = { name: "", type: "", dataSource: "", timeRange: "", description: "", chart: "" };

export default function CustomAnalysis() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>(defaultAnalyses);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openBuilder = () => { resetForm(); setShowBuilder(true); };

  const handleEdit = (a: Analysis) => {
    setForm({
      name: a.name, type: a.type, chart: a.chart, description: a.description || "",
      dataSource: Object.entries(dataSourceLabelMap).find(([, v]) => v === a.dataSource)?.[0] || "",
      timeRange: Object.entries(timeRangeLabelMap).find(([, v]) => v === a.lastRun)?.[0] || "30d",
    });
    setEditingId(a.id);
    setShowBuilder(true);
  };

  const handleSave = () => {
    if (!form.name || !form.type || !form.chart) {
      toast.error("请填写分析名称、类型并选择图表类型");
      return;
    }
    const entry: Analysis = {
      id: editingId || `A${String(analyses.length + 1).padStart(2, "0")}`,
      name: form.name, type: form.type, chart: form.chart,
      dataSource: dataSourceLabelMap[form.dataSource] || "全量数据",
      timeRange: form.timeRange, description: form.description,
      lastRun: "刚刚", status: "idle",
    };
    if (editingId) {
      setAnalyses(prev => prev.map(a => a.id === editingId ? entry : a));
      toast.success("分析已更新");
    } else {
      setAnalyses(prev => [entry, ...prev]);
      toast.success("分析已保存");
    }
    setShowBuilder(false);
    resetForm();
  };

  const handleRun = (id?: string) => {
    const targetId = id || (editingId ? editingId : null);
    if (!targetId && !form.name) {
      handleSave();
      return;
    }
    if (!targetId) {
      handleSave();
    }
    const runId = targetId || `A${String(analyses.length + 1).padStart(2, "0")}`;
    setRunningId(runId);
    setAnalyses(prev => prev.map(a => a.id === runId ? { ...a, status: "running" as const } : a));
    setTimeout(() => {
      setAnalyses(prev => prev.map(a => a.id === runId ? { ...a, status: "done" as const, lastRun: "刚刚" } : a));
      setRunningId(null);
      toast.success("分析运行完成");
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
    setDeleteDialog(null);
    toast.success("分析已删除");
  };

  const handleDuplicate = (a: Analysis) => {
    const copy: Analysis = {
      ...a, id: `A${String(analyses.length + 1).padStart(2, "0")}`,
      name: `${a.name}（副本）`, lastRun: "未运行", status: "idle",
    };
    setAnalyses(prev => [copy, ...prev]);
    toast.success("已复制分析");
  };

  const previewAnalysis = analyses.find(a => a.id === previewId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">自定义分析</h1>
          <p className="text-sm text-muted-foreground mt-1">灵活构建分析看板，自由选择数据维度与可视化方式</p>
        </div>
        <Button className="gap-2" onClick={openBuilder}><Plus className="w-4 h-4" /> 新建分析</Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "分析总数", value: analyses.length, color: "text-primary" },
          { label: "已完成", value: analyses.filter(a => a.status === "done").length, color: "text-green-500" },
          { label: "运行中", value: analyses.filter(a => a.status === "running").length, color: "text-amber-500" },
          { label: "分析类型", value: new Set(analyses.map(a => a.type)).size, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分析构建器 */}
      {showBuilder && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? "编辑分析" : "分析构建器"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowBuilder(false); resetForm(); }}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">分析名称 *</label>
                <Input placeholder="输入分析名称..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">分析类型 *</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择分析类型" /></SelectTrigger>
                  <SelectContent>{analysisTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">数据源</label>
                <Select value={form.dataSource} onValueChange={v => setForm(f => ({ ...f, dataSource: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                  <SelectContent>{dataSources.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">时间范围</label>
                <Select value={form.timeRange} onValueChange={v => setForm(f => ({ ...f, timeRange: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择时间范围" /></SelectTrigger>
                  <SelectContent>{timeRanges.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">分析描述（可选）</label>
              <Textarea placeholder="描述分析目的和要求..." className="h-20" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">可视化类型 *</label>
              <div className="grid grid-cols-4 gap-3">
                {chartTypes.map(c => {
                  const Icon = c.icon;
                  const selected = form.chart === c.name;
                  return (
                    <div key={c.name} onClick={() => setForm(f => ({ ...f, chart: c.name }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors text-center ${selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"}`}>
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowBuilder(false); resetForm(); }}>取消</Button>
              <Button variant="outline" className="gap-1" onClick={handleSave}><Save className="w-4 h-4" /> 保存</Button>
              <Button className="gap-1" onClick={() => { handleSave(); handleRun(editingId || `A${String(analyses.length + 1).padStart(2, "0")}`); }}><Play className="w-4 h-4" /> 保存并运行</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已保存的分析列表 */}
      <Card>
        <CardHeader><CardTitle className="text-base">已保存的分析（{analyses.length}）</CardTitle></CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无分析，点击「新建分析」开始</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {a.status === "running" ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <BarChart3 className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{a.name}</p>
                        <Badge variant={a.status === "running" ? "default" : a.status === "done" ? "secondary" : "outline"} className="text-xs">
                          {a.status === "running" ? "运行中" : a.status === "done" ? "已完成" : "待运行"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{a.type}</span><span>·</span><span>{a.dataSource}</span><span>·</span><span>{a.chart}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                      <Clock className="w-3 h-3" /><span>{a.lastRun}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewId(a.id)} title="预览"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)} title="编辑"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(a)} title="复制"><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteDialog(a.id)} title="删除"><Trash2 className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="gap-1 ml-1" disabled={runningId === a.id} onClick={() => handleRun(a.id)}>
                      {runningId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} 运行
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认 */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">删除后不可恢复，确定要删除该分析吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览弹窗 */}
      <Dialog open={!!previewId} onOpenChange={() => setPreviewId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{previewAnalysis?.name}</DialogTitle></DialogHeader>
          {previewAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "分析类型", value: previewAnalysis.type },
                  { label: "数据源", value: previewAnalysis.dataSource },
                  { label: "图表类型", value: previewAnalysis.chart },
                ].map(i => (
                  <div key={i.label} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{i.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{i.value}</p>
                  </div>
                ))}
              </div>
              {/* 模拟图表预览区 */}
              <div className="h-64 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">图表预览区</p>
                  <p className="text-xs mt-1">运行分析后将在此展示{previewAnalysis.chart}结果</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> 上次运行：{previewAnalysis.lastRun}</div>
                <Badge variant={previewAnalysis.status === "done" ? "secondary" : "outline"}>
                  {previewAnalysis.status === "done" ? "已完成" : "待运行"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
