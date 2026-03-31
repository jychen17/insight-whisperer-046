import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Clock, Settings2, Copy, Trash2, Calendar, Mail } from "lucide-react";
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
}

const templates: ReportTemplate[] = [
  {
    id: "RT01", name: "舆情日报", theme: "舆情主题", frequency: "每日 09:00",
    sections: ["舆情概览", "负面舆情TOP10", "情感趋势", "风险预警汇总"],
    format: "PDF", recipients: ["品牌部", "公关部"], status: true,
    lastGenerated: "2026-03-31 09:00", generatedCount: 89,
  },
  {
    id: "RT02", name: "竞品周报", theme: "行业咨询主题", frequency: "每周一 10:00",
    sections: ["SOV份额变化", "竞品动态汇总", "品牌声量对比", "关键事件分析"],
    format: "PDF+Excel", recipients: ["市场部", "战略部"], status: true,
    lastGenerated: "2026-03-25 10:00", generatedCount: 12,
  },
  {
    id: "RT03", name: "热点事件专报", theme: "热点洞察主题", frequency: "事件触发",
    sections: ["事件概述", "传播路径", "舆论走势", "建议措施"],
    format: "PDF", recipients: ["管理层"], status: true,
    lastGenerated: "2026-03-28 15:30", generatedCount: 8,
  },
  {
    id: "RT04", name: "产品体验月报", theme: "产品体验主题", frequency: "每月1日 08:00",
    sections: ["NPS趋势", "问题分类统计", "TOP问题详情", "优化建议"],
    format: "PDF+PPT", recipients: ["产品部", "运营部"], status: true,
    lastGenerated: "2026-03-01 08:00", generatedCount: 3,
  },
  {
    id: "RT05", name: "管理层综合报告", theme: "综合", frequency: "每月15日",
    sections: ["平台概览", "各主题摘要", "风险预警回顾", "下期展望"],
    format: "PPT", recipients: ["CEO", "VP"], status: false,
    lastGenerated: "2026-03-15 09:00", generatedCount: 6,
  },
];

const frequencyOptions = ["每日", "每周", "每月", "事件触发", "手动"];
const formatOptions = ["PDF", "Excel", "PPT", "PDF+Excel", "PDF+PPT"];
const themeOptions = ["舆情主题", "行业咨询主题", "热点洞察主题", "产品体验主题", "综合"];

export default function ReportConfig() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报告配置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置自动化报告模板、生成频率与分发规则</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> 新建模板</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告模板</p><p className="text-2xl font-bold text-foreground mt-1">{templates.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">自动化模板</p><p className="text-2xl font-bold text-primary mt-1">{templates.filter(t => t.frequency !== "手动").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计生成</p><p className="text-2xl font-bold text-emerald-500 mt-1">{templates.reduce((s, t) => s + t.generatedCount, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">启用中</p><p className="text-2xl font-bold text-foreground mt-1">{templates.filter(t => t.status).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">报告模板列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>生成频率</TableHead>
                <TableHead>报告章节</TableHead>
                <TableHead>导出格式</TableHead>
                <TableHead>分发对象</TableHead>
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
                      <Mail className="w-3 h-3" />
                      {t.recipients.join(", ")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{t.generatedCount}</TableCell>
                  <TableCell><Switch checked={t.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新建报告模板</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">模板名称</label>
              <Input placeholder="如：舆情日报" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">所属主题</label>
                <Select><SelectTrigger><SelectValue placeholder="选择主题" /></SelectTrigger>
                  <SelectContent>{themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">导出格式</label>
                <Select><SelectTrigger><SelectValue placeholder="选择格式" /></SelectTrigger>
                  <SelectContent>{formatOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">生成频率</label>
              <Select><SelectTrigger><SelectValue placeholder="选择频率" /></SelectTrigger>
                <SelectContent>{frequencyOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">报告章节（每行一个）</label>
              <Textarea placeholder="舆情概览&#10;负面舆情TOP10&#10;情感趋势" rows={4} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">分发对象（逗号分隔）</label>
              <Input placeholder="品牌部, 公关部" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => { setDialogOpen(false); toast.success("报告模板创建成功"); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
