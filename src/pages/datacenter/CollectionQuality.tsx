import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const qualityStats = [
  { label: "数据完整率", value: "98.2%", icon: CheckCircle, color: "text-emerald-500", desc: "较昨日 +0.3%" },
  { label: "数据准确率", value: "96.7%", icon: TrendingUp, color: "text-primary", desc: "较昨日 +0.1%" },
  { label: "重复数据率", value: "1.8%", icon: AlertTriangle, color: "text-amber-500", desc: "较昨日 -0.2%" },
  { label: "异常数据量", value: "234", icon: XCircle, color: "text-destructive", desc: "需要处理" },
];

const trendData = [
  { date: "03-24", completeness: 97.5, accuracy: 96.2 },
  { date: "03-25", completeness: 97.8, accuracy: 96.4 },
  { date: "03-26", completeness: 98.0, accuracy: 96.5 },
  { date: "03-27", completeness: 97.6, accuracy: 96.3 },
  { date: "03-28", completeness: 98.1, accuracy: 96.6 },
  { date: "03-29", completeness: 97.9, accuracy: 96.8 },
  { date: "03-30", completeness: 98.2, accuracy: 96.7 },
];

const sourceQuality = [
  { source: "微博", completeness: 98.5, accuracy: 97.2, duplicate: 1.2, anomaly: 45 },
  { source: "抖音", completeness: 97.8, accuracy: 96.5, duplicate: 2.1, anomaly: 62 },
  { source: "知乎", completeness: 99.1, accuracy: 98.0, duplicate: 0.8, anomaly: 12 },
  { source: "B站", completeness: 96.2, accuracy: 95.8, duplicate: 3.4, anomaly: 89 },
  { source: "新闻媒体", completeness: 99.5, accuracy: 97.8, duplicate: 0.5, anomaly: 18 },
  { source: "电商平台", completeness: 97.0, accuracy: 95.5, duplicate: 2.8, anomaly: 8 },
];

const chartConfig = {
  completeness: { label: "完整率", color: "hsl(var(--primary))" },
  accuracy: { label: "准确率", color: "hsl(142 76% 36%)" },
};

export default function CollectionQuality() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">采集质量监控</h1>
        <p className="text-sm text-muted-foreground mt-1">实时监控数据采集质量指标，确保数据可靠性</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {qualityStats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">质量趋势（近7日）</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis domain={[95, 100]} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="completeness" stroke="var(--color-completeness)" fill="var(--color-completeness)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" fill="var(--color-accuracy)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">各数据源质量详情</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据源</TableHead>
                <TableHead>完整率</TableHead>
                <TableHead>准确率</TableHead>
                <TableHead>重复率</TableHead>
                <TableHead className="text-right">异常数据量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceQuality.map((s) => (
                <TableRow key={s.source}>
                  <TableCell className="font-medium">{s.source}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.completeness} className="w-20 h-2" />
                      <span className="text-sm">{s.completeness}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.accuracy} className="w-20 h-2" />
                      <span className="text-sm">{s.accuracy}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.duplicate > 2.5 ? "destructive" : "secondary"}>{s.duplicate}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">{s.anomaly}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
