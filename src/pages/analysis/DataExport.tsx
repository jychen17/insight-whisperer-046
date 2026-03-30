import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, FileText, Database, Clock, CheckCircle, Loader2 } from "lucide-react";

const exportHistory = [
  { id: "E001", name: "舆情数据_2026Q1", format: "CSV", size: "12.4 MB", rows: 128450, status: "completed", date: "2026-03-28 14:30" },
  { id: "E002", name: "行业竞品分析数据", format: "Excel", size: "8.2 MB", rows: 45600, status: "completed", date: "2026-03-27 10:15" },
  { id: "E003", name: "用户反馈原始数据", format: "JSON", size: "24.1 MB", rows: 67200, status: "completed", date: "2026-03-26 16:00" },
  { id: "E004", name: "热点话题汇总", format: "Excel", size: "3.6 MB", rows: 15800, status: "completed", date: "2026-03-25 09:45" },
  { id: "E005", name: "全量标签数据", format: "CSV", size: "—", rows: 674350, status: "processing", date: "2026-03-30 08:00" },
];

const dataModules = [
  { name: "舆情数据", desc: "包含情感、来源、传播等字段", fields: 24, records: "128,450" },
  { name: "行业数据", desc: "行业分类、竞品、趋势指标", fields: 18, records: "96,800" },
  { name: "热点数据", desc: "热度、传播路径、关键词", fields: 16, records: "85,620" },
  { name: "体验数据", desc: "NPS、反馈分类、问题标签", fields: 20, records: "67,200" },
  { name: "标签数据", desc: "所有标签标注结果", fields: 8, records: "674,350" },
];

const formatIcons: Record<string, typeof FileText> = {
  CSV: FileSpreadsheet,
  Excel: FileSpreadsheet,
  JSON: Database,
};

export default function DataExport() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">数据导出</h1>
          <p className="text-sm text-muted-foreground mt-1">选择数据模块与字段，导出为多种格式</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计导出次数</p><p className="text-2xl font-bold text-foreground mt-1">5</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计导出数据</p><p className="text-2xl font-bold text-primary mt-1">48.3 MB</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">进行中</p><p className="text-2xl font-bold text-amber-500 mt-1">1</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">新建导出</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {dataModules.map((m) => (
              <div
                key={m.name}
                onClick={() => setSelectedModule(m.name === selectedModule ? null : m.name)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedModule === m.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <p className="font-medium text-sm text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{m.fields} 个字段</span>
                  <span>{m.records} 条</span>
                </div>
              </div>
            ))}
          </div>
          {selectedModule && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <Select defaultValue="csv">
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" className="w-40" defaultValue="2026-03-01" />
              <span className="text-sm text-muted-foreground">至</span>
              <Input type="date" className="w-40" defaultValue="2026-03-30" />
              <Button className="gap-2 ml-auto"><Download className="w-4 h-4" /> 开始导出</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">导出历史</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exportHistory.map((e) => {
              const Icon = formatIcons[e.format] || FileText;
              return (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.format} · {e.rows.toLocaleString()} 条 · {e.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {e.status === "completed" ? (
                      <>
                        <span className="text-sm text-muted-foreground">{e.size}</span>
                        <Button variant="outline" size="sm" className="gap-1"><Download className="w-3 h-3" /> 下载</Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 处理中</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
