import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, FileText, Copy, Trash2, Settings2,
  GripVertical, X, Upload, Globe, User,
} from "lucide-react";
import { toast } from "sonner";

interface ReportTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "global" | "custom";
  sections: string[];
  charts: { name: string; type: string }[];
  format: string;
  status: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  uploadedFileName?: string;
}

const mockTemplates: ReportTemplateItem[] = [
  {
    id: "TPL01", name: "舆情日报模板", description: "自动汇总每日舆情数据与风险预警",
    category: "舆情", type: "global", sections: ["舆情概览", "负面舆情TOP10", "情感趋势", "风险预警汇总"],
    charts: [{ name: "舆情概览", type: "柱状图" }, { name: "情感趋势", type: "折线图" }],
    format: "PDF", status: true, usageCount: 89, createdAt: "2026-01-15", updatedAt: "2026-03-28",
  },
  {
    id: "TPL02", name: "竞品对比模板", description: "横向对比多品牌各维度表现",
    category: "行业", type: "global", sections: ["SOV份额变化", "竞品动态汇总", "品牌声量对比", "关键事件分析"],
    charts: [{ name: "SOV份额", type: "饼图" }, { name: "声量对比", type: "柱状图" }],
    format: "PDF+Excel", status: true, usageCount: 45, createdAt: "2026-02-01", updatedAt: "2026-03-25",
  },
  {
    id: "TPL03", name: "热点追踪模板", description: "追踪热点事件的传播路径与影响",
    category: "热点", type: "global", sections: ["事件概述", "传播路径", "舆论走势", "建议措施"],
    charts: [{ name: "传播路径", type: "网络图" }, { name: "舆论走势", type: "折线图" }],
    format: "PDF", status: true, usageCount: 32, createdAt: "2026-02-10", updatedAt: "2026-03-20",
  },
  {
    id: "TPL04", name: "体验洞察模板", description: "用户反馈NPS分析与问题归因",
    category: "体验", type: "global", sections: ["NPS趋势", "问题分类统计", "TOP问题详情", "优化建议"],
    charts: [{ name: "NPS趋势", type: "折线图" }, { name: "问题分类", type: "饼图" }],
    format: "PDF+PPT", status: true, usageCount: 18, createdAt: "2026-01-20", updatedAt: "2026-03-15",
  },
  {
    id: "TPL05", name: "事件分析报告模板", description: "围绕单一事件，从概况、时间线、核心问题、风险评估到应对建议的全景分析",
    category: "事件", type: "global",
    sections: ["事件概况", "事件时间线", "核心问题分析", "风险等级评估", "应对建议", "总结"],
    charts: [
      { name: "舆情概览KPI", type: "卡片" },
      { name: "事件时间线", type: "时间轴" },
      { name: "核心问题分布", type: "饼图" },
      { name: "风险等级矩阵", type: "热力图" },
    ],
    format: "HTML+PDF", status: true, usageCount: 24, createdAt: "2026-04-10", updatedAt: "2026-04-14",
  },
  {
    id: "TPL06", name: "管理层摘要模板", description: "面向管理层的精简汇报模板",
    category: "综合", type: "custom", sections: ["平台概览", "各主题摘要", "风险预警回顾", "下期展望"],
    charts: [{ name: "平台概览", type: "仪表盘" }],
    format: "PPT", status: false, usageCount: 6, createdAt: "2026-03-01", updatedAt: "2026-03-15",
    uploadedFileName: "管理层摘要-v2.pptx",
  },
];

const categoryOptions = ["全部", "舆情", "行业", "热点", "体验", "事件", "综合"];

const allModules = [
  "舆情概览", "负面舆情TOP10", "情感趋势", "风险预警汇总",
  "SOV份额变化", "竞品动态汇总", "品牌声量对比", "关键事件分析",
  "事件概况", "事件时间线", "核心问题分析", "风险等级评估", "应对建议", "总结",
  "事件概述", "传播路径", "舆论走势", "建议措施",
  "NPS趋势", "问题分类统计", "TOP问题详情", "优化建议",
  "平台概览", "各主题摘要", "渠道分布", "人工备注",
];

const chartTypes = ["柱状图", "折线图", "饼图", "网络图", "仪表盘", "表格", "热力图"];

export default function ReportTemplates() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [typeFilter, setTypeFilter] = useState<"all" | "global" | "custom">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplateItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formFormat, setFormFormat] = useState("");
  const [formType, setFormType] = useState<"global" | "custom">("custom");
  const [formSections, setFormSections] = useState<string[]>([]);
  const [formCharts, setFormCharts] = useState<{ name: string; type: string }[]>([]);
  const [formUploadedFile, setFormUploadedFile] = useState<string>("");

  const filtered = templates.filter(t => {
    const matchSearch = !searchTerm || t.name.includes(searchTerm) || t.description.includes(searchTerm);
    const matchCat = categoryFilter === "全部" || t.category === categoryFilter;
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchCat && matchType;
  });

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName(""); setFormDesc(""); setFormCategory("舆情"); setFormFormat("PDF");
    setFormType("custom"); setFormUploadedFile("");
    setFormSections([]); setFormCharts([]);
    setDialogOpen(true);
  };

  const openEdit = (t: ReportTemplateItem) => {
    setEditingTemplate(t);
    setFormName(t.name); setFormDesc(t.description); setFormCategory(t.category); setFormFormat(t.format);
    setFormType(t.type); setFormUploadedFile(t.uploadedFileName ?? "");
    setFormSections([...t.sections]); setFormCharts([...t.charts]);
    setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormUploadedFile(file.name);
    toast.success(`已上传：${file.name}`);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error("请输入模板名称"); return; }
    if (formType === "custom" && !formUploadedFile && !editingTemplate) {
      toast.error("自定义模板请先上传模板文件");
      return;
    }
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t, name: formName, description: formDesc, category: formCategory,
        type: formType, format: formFormat, sections: formSections, charts: formCharts,
        uploadedFileName: formType === "custom" ? formUploadedFile : undefined,
        updatedAt: new Date().toISOString().slice(0, 10),
      } : t));
      toast.success("模板已更新");
    } else {
      const newT: ReportTemplateItem = {
        id: `TPL${String(templates.length + 1).padStart(2, "0")}`,
        name: formName, description: formDesc, category: formCategory,
        type: formType,
        sections: formSections, charts: formCharts, format: formFormat,
        status: true, usageCount: 0,
        uploadedFileName: formType === "custom" ? formUploadedFile : undefined,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setTemplates(prev => [...prev, newT]);
      toast.success("模板创建成功");
    }
    setDialogOpen(false);
  };

  const handleDuplicate = (t: ReportTemplateItem) => {
    const dup: ReportTemplateItem = {
      ...t,
      id: `TPL${String(templates.length + 1).padStart(2, "0")}`,
      name: t.name + " (副本)",
      usageCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setTemplates(prev => [...prev, dup]);
    toast.success("模板已复制");
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("模板已删除");
  };

  const toggleStatus = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: !t.status } : t));
  };

  const toggleSection = (s: string) => {
    setFormSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addChart = () => {
    setFormCharts(prev => [...prev, { name: "", type: "柱状图" }]);
  };

  const updateChart = (idx: number, field: "name" | "type", val: string) => {
    setFormCharts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const removeChart = (idx: number) => {
    setFormCharts(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报告模板管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理和配置报告模板，定义内容模块与图表样式</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> 新建模板</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">模板总数</p><p className="text-2xl font-bold text-foreground mt-1">{templates.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">全局模板</p><p className="text-2xl font-bold text-primary mt-1">{templates.filter(t => t.type === "global").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">自定义模板</p><p className="text-2xl font-bold text-foreground mt-1">{templates.filter(t => t.type === "custom").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计使用</p><p className="text-2xl font-bold text-foreground mt-1">{templates.reduce((s, t) => s + t.usageCount, 0)}</p></CardContent></Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">模板列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-52 h-8 text-sm" placeholder="搜索模板..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "global" | "custom")}>
                <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="global">全局模板</SelectItem>
                  <SelectItem value="custom">自定义模板</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>内容模块</TableHead>
                <TableHead>图表数</TableHead>
                <TableHead>格式</TableHead>
                <TableHead className="text-right">使用次数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无模板</TableCell></TableRow>
              )}
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      {t.uploadedFileName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                          <Upload className="w-3 h-3" /> {t.uploadedFileName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.type === "global" ? (
                      <Badge className="text-xs gap-1"><Globe className="w-3 h-3" />全局</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1"><User className="w-3 h-3" />自定义</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                  <TableCell className="max-w-[180px]">
                    <div className="flex flex-wrap gap-1">
                      {t.sections.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      {t.sections.length > 2 && <Badge variant="outline" className="text-[10px]">+{t.sections.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm">{t.charts.length}</span></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.format}</Badge></TableCell>
                  <TableCell className="text-right text-sm">{t.usageCount}</TableCell>
                  <TableCell><Switch checked={t.status} onCheckedChange={() => toggleStatus(t.id)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} title="编辑"><Settings2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(t)} title="复制"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)} title="删除"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "编辑模板" : "新建模板"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label className="text-sm">模板类型</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType("global")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formType === "global"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">全局模板</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">系统预置，可被所有用户复用</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("custom")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formType === "custom"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">自定义模板</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">上传模板文件定义报告逻辑</p>
                </button>
              </div>
            </div>

            {/* Basic */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">基础信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">模板名称</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="如：舆情日报模板" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">分类</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["舆情", "行业", "热点", "体验", "综合"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">模板描述</Label>
                <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="描述模板用途..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">导出格式</Label>
                <Select value={formFormat} onValueChange={setFormFormat}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{["PDF", "Excel", "PPT", "PDF+Excel", "PDF+PPT"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom file upload */}
            {formType === "custom" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">模板文件</h3>
                <p className="text-xs text-muted-foreground">上传 .docx / .pptx / .xlsx 模板文件，系统按其中的占位符与样式生成报告</p>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {formUploadedFile || "尚未上传模板文件"}
                  </span>
                  <Button asChild variant="outline" size="sm" className="gap-1 text-xs h-7">
                    <label className="cursor-pointer">
                      {formUploadedFile ? "重新上传" : "选择文件"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".docx,.pptx,.xlsx,.doc,.ppt,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            )}

            {/* Content Modules */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">内容配置</h3>
              <p className="text-xs text-muted-foreground">选择要包含的内容模块，可拖拽调整顺序</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">已选模块</p>
                {formSections.length === 0 && <p className="text-xs text-muted-foreground py-2">暂未选择模块</p>}
                {formSections.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{s}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSection(s)}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">可选模块</p>
                <div className="flex flex-wrap gap-1.5">
                  {allModules.filter(m => !formSections.includes(m)).map(m => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                      onClick={() => toggleSection(m)}
                    >
                      + {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Config */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">图表配置</h3>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addChart}>
                  <Plus className="w-3 h-3" /> 添加图表
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">为内容模块配置图表类型与样式</p>
              {formCharts.length === 0 && <p className="text-xs text-muted-foreground py-2">暂无图表配置</p>}
              {formCharts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded border border-border">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={c.name}
                      onChange={e => updateChart(i, "name", e.target.value)}
                      placeholder="图表名称（如：舆情概览）"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Select value={c.type} onValueChange={v => updateChart(i, "type", v)}>
                    <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{chartTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChart(i)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingTemplate ? "保存更改" : "创建模板"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
