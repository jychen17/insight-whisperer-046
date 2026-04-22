import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Eye, Download, Trash2, Search, Calendar, Share2,
  Copy, ExternalLink, AlertTriangle, Settings2, ChevronRight,
  Repeat, Zap, ArrowLeft, Pencil, Check, Plus, Database, LayoutTemplate, Sparkles,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ScheduleType = "once" | "recurring";
type RecurringFrequency = "daily" | "weekly" | "monthly";

interface ReportIssue {
  id: string;
  period: string;
  createdAt: string;
  status: "completed" | "generating" | "failed";
  pages: number;
  size: string;
}

interface Report {
  id: string;
  title: string;
  type: string;
  theme: string;
  status: "completed" | "generating" | "failed";
  createdAt: string;
  pages: number;
  format: string;
  author: string;
  size: string;
  scheduleType: ScheduleType;
  frequency?: RecurringFrequency;
  templateId?: string;
  templateName?: string;
  issues?: ReportIssue[];
}

const allReports: Report[] = [
  {
    id: "RPT001", title: "Q1舆情态势分析报告", type: "季度报告", theme: "舆情主题",
    status: "completed", createdAt: "2026-03-28 09:00", pages: 24, format: "PDF",
    author: "李总监", size: "2.4MB", scheduleType: "once",
    templateId: "TPL01", templateName: "舆情日报模板",
  },
  {
    id: "RPT002", title: "行业竞品监测周报", type: "周报", theme: "行业咨询主题",
    status: "completed", createdAt: "2026-03-29 10:00", pages: 12, format: "PDF+Excel",
    author: "系统自动生成", size: "1.8MB", scheduleType: "recurring", frequency: "weekly",
    templateId: "TPL02", templateName: "竞品对比模板",
    issues: [
      { id: "RPT002-W14", period: "2026-W14（03/30-04/05）", createdAt: "2026-04-05 10:00", status: "completed", pages: 13, size: "1.9MB" },
      { id: "RPT002-W13", period: "2026-W13（03/23-03/29）", createdAt: "2026-03-29 10:00", status: "completed", pages: 12, size: "1.8MB" },
      { id: "RPT002-W12", period: "2026-W12（03/16-03/22）", createdAt: "2026-03-22 10:00", status: "completed", pages: 11, size: "1.6MB" },
      { id: "RPT002-W11", period: "2026-W11（03/09-03/15）", createdAt: "2026-03-15 10:00", status: "completed", pages: 12, size: "1.7MB" },
    ],
  },
  {
    id: "RPT003", title: "热点事件专项分析-清明出行", type: "专项报告", theme: "热点洞察主题",
    status: "generating", createdAt: "2026-03-30 15:30", pages: 0, format: "PDF",
    author: "AI生成中", size: "-", scheduleType: "once",
    templateId: "TPL03", templateName: "热点追踪模板",
  },
  {
    id: "RPT004", title: "产品体验月度报告", type: "月报", theme: "产品体验主题",
    status: "completed", createdAt: "2026-03-25 08:00", pages: 18, format: "PDF+PPT",
    author: "系统自动生成", size: "5.2MB", scheduleType: "recurring", frequency: "monthly",
    templateId: "TPL04", templateName: "体验洞察模板",
    issues: [
      { id: "RPT004-202603", period: "2026年3月", createdAt: "2026-04-01 08:00", status: "completed", pages: 18, size: "5.2MB" },
      { id: "RPT004-202602", period: "2026年2月", createdAt: "2026-03-01 08:00", status: "completed", pages: 17, size: "4.8MB" },
      { id: "RPT004-202601", period: "2026年1月", createdAt: "2026-02-01 08:00", status: "completed", pages: 16, size: "4.5MB" },
    ],
  },
  {
    id: "RPT005", title: "品牌口碑年度总结", type: "年报", theme: "综合",
    status: "completed", createdAt: "2026-03-20 09:00", pages: 42, format: "PPT",
    author: "李总监", size: "12.6MB", scheduleType: "once",
  },
  {
    id: "RPT007", title: "舆情日报", type: "日报", theme: "舆情主题",
    status: "completed", createdAt: "2026-03-31 09:00", pages: 6, format: "PDF",
    author: "系统自动生成", size: "0.8MB", scheduleType: "recurring", frequency: "daily",
    templateId: "TPL01", templateName: "舆情日报模板",
    issues: [
      { id: "RPT007-0331", period: "2026-03-31", createdAt: "2026-03-31 09:00", status: "completed", pages: 6, size: "0.8MB" },
      { id: "RPT007-0330", period: "2026-03-30", createdAt: "2026-03-30 09:00", status: "completed", pages: 5, size: "0.7MB" },
      { id: "RPT007-0329", period: "2026-03-29", createdAt: "2026-03-29 09:00", status: "completed", pages: 6, size: "0.8MB" },
      { id: "RPT007-0328", period: "2026-03-28", createdAt: "2026-03-28 09:00", status: "completed", pages: 5, size: "0.7MB" },
      { id: "RPT007-0327", period: "2026-03-27", createdAt: "2026-03-27 09:00", status: "failed", pages: 0, size: "-" },
    ],
  },
  {
    id: "RPT009", title: "XX产品投诉事件深度分析", type: "专项报告", theme: "舆情主题",
    status: "completed", createdAt: "2026-03-28 16:00", pages: 15, format: "PDF",
    author: "AI智能生成", size: "3.1MB", scheduleType: "once",
  },
  {
    id: "RPT010", title: "一级事件-退款纠纷追踪报告", type: "专项报告", theme: "舆情主题",
    status: "failed", createdAt: "2026-03-27 11:00", pages: 0, format: "PDF",
    author: "系统", size: "-", scheduleType: "once",
  },
];

const statusConfig: Record<Report["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "已完成", variant: "default" },
  generating: { label: "生成中", variant: "secondary" },
  failed: { label: "失败", variant: "destructive" },
};

const frequencyLabel: Record<RecurringFrequency, string> = {
  daily: "每日", weekly: "每周", monthly: "每月",
};

const typeOptions = ["全部", "日报", "周报", "月报", "季度报告", "年报", "专项报告"];
const themeOptions = ["全部", "舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "综合"];

export default function ReportManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [themeFilter, setThemeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | ScheduleType>("all");
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [shareReport, setShareReport] = useState<Report | null>(null);
  const [shareMode, setShareMode] = useState<"internal" | "public">("internal");
  const [drillReport, setDrillReport] = useState<Report | null>(null);

  // Config wizard
  const [configOpen, setConfigOpen] = useState(false);
  const [wizStep, setWizStep] = useState(1);
  const [wizSchedule, setWizSchedule] = useState<ScheduleType>("recurring");
  const [wizFrequency, setWizFrequency] = useState<RecurringFrequency>("daily");
  const [wizTheme, setWizTheme] = useState<string>("");
  const [wizQueryId, setWizQueryId] = useState<string>("");
  const [wizTemplateId, setWizTemplateId] = useState<string>("");
  const [wizName, setWizName] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (search && !r.title.includes(search) && !r.id.includes(search)) return false;
      if (typeFilter !== "全部" && r.type !== typeFilter) return false;
      if (themeFilter !== "全部" && r.theme !== themeFilter) return false;
      if (scheduleFilter !== "all" && r.scheduleType !== scheduleFilter) return false;
      if (statusFilter !== "全部") {
        const statusMap: Record<string, string> = { "已完成": "completed", "生成中": "generating", "失败": "failed" };
        if (r.status !== statusMap[statusFilter]) return false;
      }
      return true;
    });
  }, [search, typeFilter, themeFilter, statusFilter, scheduleFilter]);

  const configList = useMemo(() => {
    return allReports.filter(r => {
      if (configScheduleFilter !== "all" && r.scheduleType !== configScheduleFilter) return false;
      if (configFreqFilter !== "all" && r.frequency !== configFreqFilter) return false;
      if (configThemeFilter !== "全部" && r.theme !== configThemeFilter) return false;
      if (configSearch && !r.title.includes(configSearch)) return false;
      return true;
    });
  }, [configScheduleFilter, configFreqFilter, configThemeFilter, configSearch]);

  const handleDelete = () => {
    if (deleteReport) {
      toast.success(`已删除报告：${deleteReport.title}`);
      setDeleteReport(null);
    }
  };

  const handleExport = (report: { title: string }, format: string) => {
    toast.success(`正在导出 ${report.title}（${format}格式）`);
  };

  const handleShare = () => {
    toast.success(`已生成${shareMode === "internal" ? "内部" : "公开"}分享链接并复制到剪贴板`);
    setShareReport(null);
  };

  const goEditTemplate = (templateId?: string) => {
    setConfigOpen(false);
    if (templateId) {
      navigate(`/analysis/report-templates?templateId=${templateId}`);
    } else {
      navigate("/analysis/report-templates");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报告管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看、搜索、导出和管理所有已生成的分析报告</p>
        </div>
        <Button className="gap-2" onClick={() => setConfigOpen(true)}>
          <Settings2 className="w-4 h-4" /> 报告配置
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告总数</p><p className="text-2xl font-bold text-foreground mt-1">{allReports.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">周期报告</p><p className="text-2xl font-bold text-primary mt-1">{allReports.filter(r => r.scheduleType === "recurring").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">生成中</p><p className="text-2xl font-bold text-foreground mt-1">{allReports.filter(r => r.status === "generating").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">失败</p><p className="text-2xl font-bold text-destructive mt-1">{allReports.filter(r => r.status === "failed").length}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索报告名称或ID..."
                className="pl-9 h-9"
              />
            </div>
            <Select value={scheduleFilter} onValueChange={(v) => setScheduleFilter(v as "all" | ScheduleType)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部调度</SelectItem>
                <SelectItem value="once">一次性报告</SelectItem>
                <SelectItem value="recurring">周期报告</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部状态</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
                <SelectItem value="生成中">生成中</SelectItem>
                <SelectItem value="失败">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">报告列表（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无匹配的报告</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告ID</TableHead>
                  <TableHead>报告名称</TableHead>
                  <TableHead>调度类型</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>所属主题</TableHead>
                  <TableHead>格式</TableHead>
                  <TableHead>最近生成时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className={r.scheduleType === "recurring" ? "cursor-pointer hover:bg-muted/40" : ""}
                    onClick={r.scheduleType === "recurring" ? () => setDrillReport(r) : undefined}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm text-foreground">{r.title}</p>
                        {r.scheduleType === "recurring" && (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {r.author}
                        {r.scheduleType === "recurring" && r.issues && ` · 共 ${r.issues.length} 期`}
                      </p>
                    </TableCell>
                    <TableCell>
                      {r.scheduleType === "recurring" ? (
                        <Badge className="text-xs gap-1"><Repeat className="w-3 h-3" />周期 · {frequencyLabel[r.frequency!]}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1"><Zap className="w-3 h-3" />一次性</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.type}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{r.theme}</Badge></TableCell>
                    <TableCell className="text-xs">{r.format}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {r.createdAt}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={statusConfig[r.status].variant} className="text-xs">{statusConfig[r.status].label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={r.scheduleType === "recurring" ? "查看各期" : "查看"} onClick={() => r.scheduleType === "recurring" ? setDrillReport(r) : setViewReport(r)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {r.status === "completed" && r.scheduleType === "once" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="导出" onClick={() => handleExport(r, r.format)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="分享" onClick={() => setShareReport(r)}>
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="删除" onClick={() => setDeleteReport(r)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>报告详情</DialogTitle></DialogHeader>
          {viewReport && (
            <div className="space-y-3">
              <DetailRow label="报告ID" value={viewReport.id} />
              <DetailRow label="报告名称" value={viewReport.title} />
              <DetailRow label="调度类型" value={viewReport.scheduleType === "once" ? "一次性报告" : `周期报告（${frequencyLabel[viewReport.frequency!]}）`} />
              <DetailRow label="报告类型" value={viewReport.type} />
              <DetailRow label="所属主题" value={viewReport.theme} />
              <DetailRow label="导出格式" value={viewReport.format} />
              <DetailRow label="页数" value={viewReport.pages > 0 ? `${viewReport.pages} 页` : "-"} />
              <DetailRow label="文件大小" value={viewReport.size} />
              <DetailRow label="生成时间" value={viewReport.createdAt} />
              <DetailRow label="生成方式" value={viewReport.author} />
              <DetailRow label="状态" value={statusConfig[viewReport.status].label} />
              {viewReport.status === "completed" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" className="gap-1.5 flex-1" onClick={() => handleExport(viewReport, "PDF")}>
                    <Download className="w-4 h-4" /> 导出 PDF
                  </Button>
                  <Button variant="outline" className="gap-1.5 flex-1" onClick={() => handleExport(viewReport, "Excel")}>
                    <Download className="w-4 h-4" /> 导出 Excel
                  </Button>
                  <Button variant="outline" className="gap-1.5 flex-1" onClick={() => handleExport(viewReport, "HTML")}>
                    <ExternalLink className="w-4 h-4" /> 在线查看
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Drill-down Dialog: recurring report periods */}
      <Dialog open={!!drillReport} onOpenChange={() => setDrillReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDrillReport(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {drillReport?.title}
              {drillReport?.frequency && (
                <Badge className="text-xs gap-1"><Repeat className="w-3 h-3" />{frequencyLabel[drillReport.frequency]}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {drillReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">所属主题</p>
                  <p className="font-medium mt-1">{drillReport.theme}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">使用模板</p>
                  <p className="font-medium mt-1">{drillReport.templateName ?? "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">导出格式</p>
                  <p className="font-medium mt-1">{drillReport.format}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">各期报告（{drillReport.issues?.length ?? 0}）</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => goEditTemplate(drillReport.templateId)}>
                  <Pencil className="w-3.5 h-3.5" /> 编辑模板
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>期次</TableHead>
                    <TableHead>生成时间</TableHead>
                    <TableHead>页数</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillReport.issues?.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{issue.period}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{issue.id}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{issue.createdAt}</TableCell>
                      <TableCell className="text-xs">{issue.pages || "-"}</TableCell>
                      <TableCell className="text-xs">{issue.size}</TableCell>
                      <TableCell><Badge variant={statusConfig[issue.status].variant} className="text-xs">{statusConfig[issue.status].label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="查看">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {issue.status === "completed" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="导出" onClick={() => handleExport({ title: `${drillReport.title} ${issue.period}` }, drillReport.format)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteReport} onOpenChange={() => setDeleteReport(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-foreground">确定要删除以下报告吗？此操作不可恢复。</p>
                <p className="text-xs text-muted-foreground mt-1">{deleteReport?.title}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteReport(null)}>取消</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>确认删除</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareReport} onOpenChange={() => setShareReport(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>分享报告</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{shareReport?.title}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">分享权限</p>
              <div className="flex gap-2">
                <Button
                  variant={shareMode === "internal" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setShareMode("internal")}
                >
                  内部分享
                </Button>
                <Button
                  variant={shareMode === "public" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setShareMode("public")}
                >
                  公开链接
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {shareMode === "internal" ? "仅组织内成员可通过链接访问" : "任何获得链接的人都可以查看"}
              </p>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted border border-border">
              <Input
                readOnly
                value={`https://app.lingquan.com/reports/${shareReport?.id}`}
                className="h-8 text-xs border-0 bg-transparent"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleShare}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={handleShare}>
                <Share2 className="w-3 h-3" /> 复制链接
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Configuration Sheet */}
      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> 报告配置
            </SheetTitle>
            <SheetDescription>
              管理一次性报告与周期报告的生成配置，可直接跳转到对应模板编辑页
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            {/* Filter chips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">调度类型：</span>
                {([
                  { v: "all", l: "全部" },
                  { v: "once", l: "一次性" },
                  { v: "recurring", l: "周期报告" },
                ] as const).map(o => (
                  <Badge
                    key={o.v}
                    variant={configScheduleFilter === o.v ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setConfigScheduleFilter(o.v)}
                  >
                    {o.l}
                  </Badge>
                ))}
              </div>

              {(configScheduleFilter === "all" || configScheduleFilter === "recurring") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground shrink-0">周期频率：</span>
                  {([
                    { v: "all", l: "全部" },
                    { v: "daily", l: "日报" },
                    { v: "weekly", l: "周报" },
                    { v: "monthly", l: "月报" },
                  ] as const).map(o => (
                    <Badge
                      key={o.v}
                      variant={configFreqFilter === o.v ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setConfigFreqFilter(o.v)}
                    >
                      {o.l}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select value={configThemeFilter} onValueChange={setConfigThemeFilter}>
                  <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={configSearch}
                    onChange={(e) => setConfigSearch(e.target.value)}
                    placeholder="搜索报告配置..."
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">共 {configList.length} 个配置</p>
              {configList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无匹配的报告配置</p>
                </div>
              ) : (
                configList.map(r => (
                  <Card key={r.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            {r.scheduleType === "recurring" ? (
                              <Badge className="text-[10px] h-5 gap-1"><Repeat className="w-3 h-3" />{frequencyLabel[r.frequency!]}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] h-5 gap-1"><Zap className="w-3 h-3" />一次性</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] h-5">{r.theme}</Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {r.templateName ? `模板：${r.templateName}` : "未关联模板"}
                            {r.scheduleType === "recurring" && r.issues && ` · 已生成 ${r.issues.length} 期`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 shrink-0 h-8"
                          onClick={() => goEditTemplate(r.templateId)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          编辑模板
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <Button variant="outline" className="w-full gap-2" onClick={() => goEditTemplate()}>
                <Settings2 className="w-4 h-4" /> 前往报告模板管理
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
