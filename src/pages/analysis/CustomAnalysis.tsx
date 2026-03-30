import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, Save, Clock, BarChart3, PieChart, TrendingUp, Table2 } from "lucide-react";

const savedAnalyses = [
  { id: "A01", name: "品牌情感趋势对比", type: "趋势分析", lastRun: "2小时前", chart: "折线图", dataSource: "舆情数据" },
  { id: "A02", name: "各平台声量占比", type: "分布分析", lastRun: "1天前", chart: "饼图", dataSource: "全量数据" },
  { id: "A03", name: "竞品NPS评分对比", type: "对比分析", lastRun: "3天前", chart: "柱状图", dataSource: "体验数据" },
  { id: "A04", name: "热点传播路径追踪", type: "路径分析", lastRun: "5天前", chart: "桑基图", dataSource: "热点数据" },
  { id: "A05", name: "用户反馈关键词云", type: "文本分析", lastRun: "1周前", chart: "词云图", dataSource: "体验数据" },
];

const chartTypes = [
  { icon: TrendingUp, name: "折线图", desc: "趋势变化" },
  { icon: BarChart3, name: "柱状图", desc: "对比分析" },
  { icon: PieChart, name: "饼图", desc: "占比分布" },
  { icon: Table2, name: "数据表", desc: "明细数据" },
];

const analysisTypes = ["趋势分析", "分布分析", "对比分析", "路径分析", "文本分析", "关联分析"];

export default function CustomAnalysis() {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">自定义分析</h1>
          <p className="text-sm text-muted-foreground mt-1">灵活构建分析看板，自由选择数据维度与可视化方式</p>
        </div>
        <Button className="gap-2" onClick={() => setShowBuilder(!showBuilder)}><Plus className="w-4 h-4" /> 新建分析</Button>
      </div>

      {showBuilder && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">分析构建器</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">分析名称</label>
                <Input placeholder="输入分析名称..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">分析类型</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择分析类型" /></SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">数据源</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sentiment">舆情数据</SelectItem>
                    <SelectItem value="industry">行业数据</SelectItem>
                    <SelectItem value="hotspot">热点数据</SelectItem>
                    <SelectItem value="experience">体验数据</SelectItem>
                    <SelectItem value="all">全量数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">时间范围</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择时间范围" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">最近7天</SelectItem>
                    <SelectItem value="30d">最近30天</SelectItem>
                    <SelectItem value="90d">最近90天</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">分析描述（可选）</label>
              <Textarea placeholder="描述分析目的和要求..." className="h-20" />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">可视化类型</label>
              <div className="grid grid-cols-4 gap-3">
                {chartTypes.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.name} className="p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors text-center">
                      <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBuilder(false)}>取消</Button>
              <Button variant="outline" className="gap-1"><Save className="w-4 h-4" /> 保存</Button>
              <Button className="gap-1"><Play className="w-4 h-4" /> 运行分析</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">已保存的分析</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savedAnalyses.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{a.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{a.type}</span>
                      <span>·</span>
                      <span>{a.dataSource}</span>
                      <span>·</span>
                      <span>{a.chart}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{a.lastRun}</span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1"><Play className="w-3 h-3" /> 运行</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
