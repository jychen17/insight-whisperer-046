import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { CheckCircle, AlertTriangle, Target, Layers } from "lucide-react";

const stats = [
  { label: "标注覆盖率", value: "94.2%", icon: Target, color: "text-primary" },
  { label: "标注一致性", value: "91.8%", icon: CheckCircle, color: "text-emerald-500" },
  { label: "待审核标注", value: "1,234", icon: AlertTriangle, color: "text-amber-500" },
  { label: "标签冲突数", value: "56", icon: Layers, color: "text-destructive" },
];

const categoryQuality = [
  { category: "情感标签", coverage: 98.5, consistency: 94.2, conflicts: 8, pending: 120 },
  { category: "行业标签", coverage: 92.3, consistency: 91.5, conflicts: 12, pending: 340 },
  { category: "平台标签", coverage: 99.9, consistency: 99.8, conflicts: 0, pending: 5 },
  { category: "主题标签", coverage: 88.6, consistency: 87.2, conflicts: 24, pending: 560 },
  { category: "风险标签", coverage: 96.1, consistency: 93.4, conflicts: 8, pending: 145 },
  { category: "自定义标签", coverage: 78.4, consistency: 82.6, conflicts: 4, pending: 64 },
];

const chartData = [
  { name: "情感", coverage: 98.5, consistency: 94.2 },
  { name: "行业", coverage: 92.3, consistency: 91.5 },
  { name: "平台", coverage: 99.9, consistency: 99.8 },
  { name: "主题", coverage: 88.6, consistency: 87.2 },
  { name: "风险", coverage: 96.1, consistency: 93.4 },
  { name: "自定义", coverage: 78.4, consistency: 82.6 },
];

const chartConfig = {
  coverage: { label: "覆盖率", color: "hsl(var(--primary))" },
  consistency: { label: "一致性", color: "hsl(142 76% 36%)" },
};

export default function TagQuality() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">标签质量</h1>
        <p className="text-sm text-muted-foreground mt-1">监控标签标注质量，发现冲突与异常</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">各分类质量对比</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis domain={[70, 100]} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="coverage" fill="var(--color-coverage)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consistency" fill="var(--color-consistency)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">分类质量详情</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标签分类</TableHead>
                <TableHead>覆盖率</TableHead>
                <TableHead>一致性</TableHead>
                <TableHead className="text-right">冲突数</TableHead>
                <TableHead className="text-right">待审核</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryQuality.map((c) => (
                <TableRow key={c.category}>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.coverage} className="w-20 h-2" />
                      <span className="text-sm">{c.coverage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.consistency} className="w-20 h-2" />
                      <span className="text-sm">{c.consistency}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={c.conflicts > 15 ? "destructive" : "secondary"}>{c.conflicts}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.pending.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
