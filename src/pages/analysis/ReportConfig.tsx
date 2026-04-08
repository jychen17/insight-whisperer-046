import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Clock, Settings2, Copy, Mail, Users, User, Send, Zap, Eye, ArrowRight, GripVertical, X, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface ReportTemplate {
  id: string;
  name: string;
  theme: string;
  frequency: string;
  sections: string[];
  format: string;
  recipients: string[];
  status: boolean;
  lastGenerated: string;
  generatedCount: number;
  reportType: "oneoff" | "periodic";
  pushTarget?: "personal" | "group";
}

const templates: ReportTemplate[] = [
  {
    id: "RT01", name: "舆情日报", theme: "舆情主题", frequency: "每日 09:00",
    sections: ["舆情概览", "负面舆情TOP10", "情感趋势", "风险预警汇总"],
    format: "PDF", recipients: ["品牌部", "公关部"], status: true,
    lastGenerated: "2026-03-31 09:00", generatedCount: 89, reportType: "periodic", pushTarget: "group",
  },
  {
    id: "RT02", name: "竞品周报", theme: "行业咨询主题", frequency: "每周一 10:00",
    sections: ["SOV份额变化", "竞品动态汇总", "品牌声量对比", "关键事件分析"],
    format: "PDF+Excel", recipients: ["市场部", "战略部"], status: true,
    lastGenerated: "2026-03-25 10:00", generatedCount: 12, reportType: "periodic", pushTarget: "group",
  },
  {
    id: "RT03", name: "热点事件专报", theme: "热点洞察主题", frequency: "一次性",
    sections: ["事件概述", "传播路径", "舆论走势", "建议措施"],
    format: "PDF", recipients: ["管理层"], status: true,
    lastGenerated: "2026-03-28 15:30", generatedCount: 8, reportType: "oneoff", pushTarget: "personal",
  },
  {
    id: "RT04", name: "产品体验月报", theme: "产品体验主题", frequency: "每月1日 08:00",
    sections: ["NPS趋势", "问题分类统计", "TOP问题详情", "优化建议"],
    format: "PDF+PPT", recipients: ["产品部", "运营部"], status: true,
    lastGenerated: "2026-03-01 08:00", generatedCount: 3, reportType: "periodic", pushTarget: "group",
  },
  {
    id: "RT05", name: "管理层综合报告", theme: "综合", frequency: "每月15日",
    sections: ["平台概览", "各主题摘要", "风险预警回顾", "下期展望"],
    format: "PPT", recipients: ["CEO", "VP"], status: false,
    lastGenerated: "2026-03-15 09:00", generatedCount: 6, reportType: "periodic", pushTarget: "personal",
  },
];

const formatOptions = ["PDF", "Excel", "PPT", "PDF+Excel", "PDF+PPT"];
const themeOptions = ["舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "综合"];
const reportTemplateOptions = [
  { value: "standard", label: "标准报告模板" },
  { value: "executive", label: "管理层摘要模板" },
  { value: "detailed", label: "详细数据分析模板" },
  { value: "comparison", label: "对比分析模板" },
];
const weekDays = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];
const pushChannels = [
  { value: "wechat", label: "企业微信" },
  { value: "email", label: "邮件" },
  { value: "sms", label: "短信" },
];

const allContentModules = [
  "舆情概览", "负面舆情TOP10", "情感趋势", "风险预警汇总",
  "SOV份额变化", "竞品动态汇总", "品牌声量对比", "关键事件分析",
  "事件概述", "传播路径", "舆论走势", "建议措施",
  "NPS趋势", "问题分类统计", "TOP问题详情", "优化建议",
  "平台概览", "各主题摘要", "渠道分布", "人工备注",
];

const chartTypeOptions = ["柱状图", "折线图", "饼图", "网络图", "仪表盘", "表格", "热力图"];

export default function ReportConfig() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<"oneoff" | "periodic">("periodic");
  const [frequency, setFrequency] = useState("");
  const [pushTarget, setPushTarget] = useState<"personal" | "group">("personal");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["wechat"]);

  // New: step-based dialog
  const [configStep, setConfigStep] = useState<"basic" | "content" | "chart" | "advanced">("basic");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [chartConfigs, setChartConfigs] = useState<{ name: string; type: string }[]>([]);

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const resetForm = () => {
    setReportType("periodic");
    setFrequency("");
    setPushTarget("personal");
    setSelectedChannels(["wechat"]);
    setConfigStep("basic");
    setSelectedSections([]);
    setChartConfigs([]);
  };

  const viewReports = (templateId: string, templateName: string) => {
    navigate(`/analysis/reports?source=${templateId}&name=${encodeURIComponent(templateName)}`);
  };

  const toggleSection = (s: string) => {
    setSelectedSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addChartConfig = () => {
    setChartConfigs(prev => [...prev, { name: "", type: "柱状图" }]);
  };

  const updateChartConfig = (idx: number, field: "name" | "type", val: string) => {
    setChartConfigs(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const removeChartConfig = (idx: number) => {
    setChartConfigs(prev => prev.filter((_, i) => i !== idx));
  };

  const stepTabs = [
    { value: "basic", label: "基础配置" },
    { value: "content", label: "内容配置" },
    { value: "chart", label: "图表配置" },
    { value: "advanced", label: "高级设置" },
  ] as const;

  const currentStepIdx = stepTabs.findIndex(s => s.value === configStep);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报告配置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置自动化报告模板、生成频率与分发规则</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/analysis/reports")}>
            <Eye className="w-4 h-4" /> 查看所有报告
          </Button>
          <Button className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="w-4 h-4" /> 新建报告</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告模板</p><p className="text-2xl font-bold text-foreground mt-1">{templates.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">周期报告</p><p className="text-2xl font-bold text-primary mt-1">{templates.filter(t => t.reportType === "periodic").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计生成</p><p className="text-2xl font-bold text-foreground mt-1">{templates.reduce((s, t) => s + t.generatedCount, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">启用中</p><p className="text-2xl font-bold text-foreground mt-1">{templates.filter(t => t.status).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">报告列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>生成频率</TableHead>
                <TableHead>报告章节</TableHead>
                <TableHead>导出格式</TableHead>
                <TableHead>推送方式</TableHead>
                <TableHead className="text-right">已生成</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">上次生成: {t.lastGenerated}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.reportType === "oneoff" ? "outline" : "secondary"} className="text-xs">
                      {t.reportType === "oneoff" ? "一次性" : "周期"}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.theme}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {t.frequency}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {t.sections.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      {t.sections.length > 2 && <Badge variant="outline" className="text-[10px]">+{t.sections.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.format}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t.pushTarget === "group" ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {t.pushTarget === "group" ? "群推送" : "个人推送"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary font-medium"
                      onClick={() => viewReports(t.id, t.name)}
                    >
                      {t.generatedCount}
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </TableCell>
                  <TableCell><Switch checked={t.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="查看已生成报告" onClick={() => viewReports(t.id, t.name)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Report Dialog - Multi-step with tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>新建报告</DialogTitle></DialogHeader>

          {/* Step Tabs */}
          <div className="flex items-center gap-1 border-b border-border mt-2">
            {stepTabs.map((st) => (
              <button
                key={st.value}
                onClick={() => setConfigStep(st.value)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  configStep === st.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Step: 基础配置 */}
          {configStep === "basic" && (
            <Tabs value={reportType} onValueChange={(v) => setReportType(v as "oneoff" | "periodic")} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oneoff" className="gap-1.5"><Zap className="w-3.5 h-3.5" />一次性报告</TabsTrigger>
                <TabsTrigger value="periodic" className="gap-1.5"><Clock className="w-3.5 h-3.5" />周期报告</TabsTrigger>
              </TabsList>

              <TabsContent value="oneoff" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">从某个主题中选定数据，立即生成一份报告。</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">报告名称</Label>
                  <Input placeholder="如：3月热点事件专报" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">所属主题</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择主题" /></SelectTrigger>
                      <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">数据范围</Label>
                    <div className="flex gap-2">
                      <Input type="date" className="flex-1" />
                      <span className="self-center text-muted-foreground text-sm">至</span>
                      <Input type="date" className="flex-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">报告模板</Label>
                  <Select><SelectTrigger><SelectValue placeholder="选择报告模板" /></SelectTrigger>
                    <SelectContent>{reportTemplateOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">导出格式</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择格式" /></SelectTrigger>
                      <SelectContent>{formatOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">数据筛选条件（可选）</Label>
                    <Input placeholder="如：情感=负面, 来源=微博" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="periodic" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">设置日报、周报、月报等定期自动生成并推送的报告。</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">报告名称</Label>
                  <Input placeholder="如：竞品周报" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">所属主题</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择主题" /></SelectTrigger>
                      <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">报告模板</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择报告模板" /></SelectTrigger>
                      <SelectContent>{reportTemplateOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-md border border-border p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />生成频率</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">周期类型</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger><SelectValue placeholder="选择周期" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">日报</SelectItem>
                          <SelectItem value="weekly">周报</SelectItem>
                          <SelectItem value="monthly">月报</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {frequency === "weekly" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">起始日</Label>
                        <Select><SelectTrigger><SelectValue placeholder="选择起始日" /></SelectTrigger>
                          <SelectContent>{weekDays.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    {frequency === "monthly" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">生成日期</Label>
                        <Select><SelectTrigger><SelectValue placeholder="每月几号" /></SelectTrigger>
                          <SelectContent>{[1, 5, 10, 15, 20, 25].map(d => <SelectItem key={d} value={String(d)}>每月{d}日</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">生成时间</Label>
                      <Input type="time" defaultValue="09:00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">导出格式</Label>
                      <Select><SelectTrigger><SelectValue placeholder="选择格式" /></SelectTrigger>
                        <SelectContent>{formatOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Step: 内容配置 */}
          {configStep === "content" && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">内容配置</h3>
                <p className="text-xs text-muted-foreground mt-1">拖拽调整模块顺序，+添加/×删除</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">已选模块</p>
                {selectedSections.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂未选择内容模块，请从下方添加</p>
                )}
                {selectedSections.map((s) => (
                  <div key={s} className="flex items-center gap-2 p-2.5 rounded border border-border bg-muted/30">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm flex-1">{s}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSection(s)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">可选模块</p>
                <div className="flex flex-wrap gap-1.5">
                  {allContentModules.filter(m => !selectedSections.includes(m)).map(m => (
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
          )}

          {/* Step: 图表配置 */}
          {configStep === "chart" && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">图表配置</h3>
                  <p className="text-xs text-muted-foreground mt-1">默认自动生成，支持切换类型/编辑样式</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addChartConfig}>
                  <Plus className="w-3 h-3" /> 添加图表
                </Button>
              </div>

              {chartConfigs.length === 0 && selectedSections.length > 0 && (
                <div className="space-y-3">
                  {selectedSections.filter(s => !["人工备注", "建议措施", "优化建议", "下期展望"].includes(s)).map(s => (
                    <div key={s} className="flex items-center justify-between p-3 rounded border border-border">
                      <span className="text-sm font-medium">{s}</span>
                      <div className="flex items-center gap-2">
                        <Select defaultValue="柱状图">
                          <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{chartTypeOptions.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="link" size="sm" className="text-xs text-primary h-8">编辑样式</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chartConfigs.length === 0 && selectedSections.length === 0 && (
                <p className="text-xs text-muted-foreground py-6 text-center">请先在「内容配置」中选择模块，图表将自动关联</p>
              )}

              {chartConfigs.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded border border-border">
                  <div className="flex-1">
                    <Input
                      value={c.name}
                      onChange={e => updateChartConfig(i, "name", e.target.value)}
                      placeholder="图表名称"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Select value={c.type} onValueChange={v => updateChartConfig(i, "type", v)}>
                    <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{chartTypeOptions.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="link" size="sm" className="text-xs text-primary h-8">编辑样式</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChartConfig(i)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Step: 高级设置 (推送设置) */}
          {configStep === "advanced" && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">高级设置</h3>
                <p className="text-xs text-muted-foreground mt-1">配置报告章节文本与推送分发</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">报告章节（每行一个，可调整）</Label>
                <Textarea
                  placeholder={"事件概述\n传播路径分析\n舆论走势\n建议措施"}
                  rows={4}
                  defaultValue={selectedSections.join("\n")}
                />
              </div>

              <div className="rounded-md border border-border p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-primary" />推送设置</p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">推送渠道</Label>
                  <div className="flex gap-3">
                    {pushChannels.map(ch => (
                      <label key={ch.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox checked={selectedChannels.includes(ch.value)} onCheckedChange={() => toggleChannel(ch.value)} />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">推送对象</Label>
                  <RadioGroup value={pushTarget} onValueChange={(v) => setPushTarget(v as "personal" | "group")} className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="personal" id="adv-personal" />
                      <Label htmlFor="adv-personal" className="text-sm cursor-pointer flex items-center gap-1"><User className="w-3 h-3" />个人</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="group" id="adv-group" />
                      <Label htmlFor="adv-group" className="text-sm cursor-pointer flex items-center gap-1"><Users className="w-3 h-3" />群组</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{pushTarget === "group" ? "群名称（逗号分隔）" : "推送人员（逗号分隔）"}</Label>
                  <Input placeholder={pushTarget === "group" ? "品牌舆情群, 管理层群" : "张三, 李四"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">推送时间</Label>
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="推送时机" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">生成后立即推送</SelectItem>
                        <SelectItem value="delay">延迟推送</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="time" className="w-[120px]" placeholder="延迟至" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {currentStepIdx > 0 && (
                <Button variant="outline" onClick={() => setConfigStep(stepTabs[currentStepIdx - 1].value)}>
                  上一步
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              {currentStepIdx < stepTabs.length - 1 ? (
                <Button onClick={() => setConfigStep(stepTabs[currentStepIdx + 1].value)}>
                  下一步
                </Button>
              ) : (
                <Button onClick={() => { setDialogOpen(false); toast.success(reportType === "oneoff" ? "报告已提交生成" : "周期报告创建成功"); }}>
                  {reportType === "oneoff" ? "立即生成" : "保存"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
