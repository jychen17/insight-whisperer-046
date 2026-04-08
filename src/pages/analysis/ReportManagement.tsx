import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Eye, Download, Trash2, Search, Calendar, Share2,
  Copy, ExternalLink, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

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
}

const allReports: Report[] = [
  { id: "RPT001", title: "2026年Q1舆情态势分析报告", type: "季度报告", theme: "舆情主题", status: "completed", createdAt: "2026-03-28 09:00", pages: 24, format: "PDF", author: "系统自动生成", size: "2.4MB" },
  { id: "RPT002", title: "3月第4周行业竞品监测周报", type: "周报", theme: "行业咨询主题", status: "completed", createdAt: "2026-03-29 10:00", pages: 12, format: "PDF+Excel", author: "系统自动生成", size: "1.8MB" },
  { id: "RPT003", title: "热点事件专项分析-清明出行", type: "专项报告", theme: "热点洞察主题", status: "generating", createdAt: "2026-03-30 15:30", pages: 0, format: "PDF", author: "AI生成中", size: "-" },
  { id: "RPT004", title: "3月产品体验月度报告", type: "月报", theme: "产品体验主题", status: "completed", createdAt: "2026-03-25 08:00", pages: 18, format: "PDF+PPT", author: "系统自动生成", size: "5.2MB" },
  { id: "RPT005", title: "品牌口碑年度总结", type: "年报", theme: "综合", status: "completed", createdAt: "2026-03-20 09:00", pages: 42, format: "PPT", author: "李总监", size: "12.6MB" },
  { id: "RPT006", title: "3月第3周行业竞品监测周报", type: "周报", theme: "行业咨询主题", status: "completed", createdAt: "2026-03-22 10:00", pages: 11, format: "PDF+Excel", author: "系统自动生成", size: "1.6MB" },
  { id: "RPT007", title: "2026-03-31 舆情日报", type: "日报", theme: "舆情主题", status: "completed", createdAt: "2026-03-31 09:00", pages: 6, format: "PDF", author: "系统自动生成", size: "0.8MB" },
  { id: "RPT008", title: "2026-03-30 舆情日报", type: "日报", theme: "舆情主题", status: "completed", createdAt: "2026-03-30 09:00", pages: 5, format: "PDF", author: "系统自动生成", size: "0.7MB" },
  { id: "RPT009", title: "XX产品投诉事件深度分析", type: "专项报告", theme: "舆情主题", status: "completed", createdAt: "2026-03-28 16:00", pages: 15, format: "PDF", author: "AI智能生成", size: "3.1MB" },
  { id: "RPT010", title: "一级事件-退款纠纷追踪报告", type: "专项报告", theme: "舆情主题", status: "failed", createdAt: "2026-03-27 11:00", pages: 0, format: "PDF", author: "系统", size: "-" },
];

const statusConfig: Record<Report["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "已完成", variant: "default" },
  generating: { label: "生成中", variant: "secondary" },
  failed: { label: "失败", variant: "destructive" },
};

const typeOptions = ["全部", "日报", "周报", "月报", "季度报告", "年报", "专项报告"];
const themeOptions = ["全部", "舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "综合"];

export default function ReportManagement() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [themeFilter, setThemeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [shareReport, setShareReport] = useState<Report | null>(null);
  const [shareMode, setShareMode] = useState<"internal" | "public">("internal");

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (search && !r.title.includes(search) && !r.id.includes(search)) return false;
      if (typeFilter !== "全部" && r.type !== typeFilter) return false;
      if (themeFilter !== "全部" && r.theme !== themeFilter) return false;
      if (statusFilter !== "全部") {
        const statusMap: Record<string, string> = { "已完成": "completed", "生成中": "generating", "失败": "failed" };
        if (r.status !== statusMap[statusFilter]) return false;
      }
      return true;
    });
  }, [search, typeFilter, themeFilter, statusFilter]);

  const handleDelete = () => {
    if (deleteReport) {
      toast.success(`已删除报告：${deleteReport.title}`);
      setDeleteReport(null);
    }
  };

  const handleExport = (report: Report, format: string) => {
    toast.success(`正在导出 ${report.title}（${format}格式）`);
  };

  const handleShare = () => {
    toast.success(`已生成${shareMode === "internal" ? "内部" : "公开"}分享链接并复制到剪贴板`);
    setShareReport(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">报告管理</h1>
        <p className="text-sm text-muted-foreground mt-1">查看、搜索、导出和管理所有已生成的分析报告</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告总数</p><p className="text-2xl font-bold text-foreground mt-1">{allReports.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已完成</p><p className="text-2xl font-bold text-primary mt-1">{allReports.filter(r => r.status === "completed").length}</p></CardContent></Card>
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
                  <TableHead>类型</TableHead>
                  <TableHead>所属主题</TableHead>
                  <TableHead>格式</TableHead>
                  <TableHead>页数</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>生成时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm text-foreground">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">{r.author}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.type}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{r.theme}</Badge></TableCell>
                    <TableCell className="text-xs">{r.format}</TableCell>
                    <TableCell className="text-xs">{r.pages || "-"}</TableCell>
                    <TableCell className="text-xs">{r.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {r.createdAt}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={statusConfig[r.status].variant} className="text-xs">{statusConfig[r.status].label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="查看" onClick={() => setViewReport(r)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {r.status === "completed" && (
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
