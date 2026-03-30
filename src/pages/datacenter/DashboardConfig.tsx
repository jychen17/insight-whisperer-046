import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutDashboard, BarChart3, PieChart, TrendingUp, Table2, GripVertical, Eye, Settings2 } from "lucide-react";

interface DashboardItem {
  id: string;
  name: string;
  theme: string;
  widgets: number;
  lastModified: string;
  status: "published" | "draft";
}

const dashboards: DashboardItem[] = [
  { id: "D01", name: "舆情大盘看板", theme: "舆情主题", widgets: 8, lastModified: "2小时前", status: "published" },
  { id: "D02", name: "行业趋势看板", theme: "行业咨询主题", widgets: 6, lastModified: "1天前", status: "published" },
  { id: "D03", name: "热点实时看板", theme: "热点洞察主题", widgets: 5, lastModified: "3小时前", status: "published" },
  { id: "D04", name: "产品体验看板", theme: "产品体验主题", widgets: 7, lastModified: "5小时前", status: "published" },
  { id: "D05", name: "管理层周报看板", theme: "综合", widgets: 10, lastModified: "2天前", status: "draft" },
  { id: "D06", name: "竞品分析看板", theme: "行业咨询主题", widgets: 4, lastModified: "1周前", status: "draft" },
];

const widgetTypes = [
  { icon: BarChart3, name: "柱状图", count: 12 },
  { icon: TrendingUp, name: "趋势图", count: 9 },
  { icon: PieChart, name: "饼图", count: 6 },
  { icon: Table2, name: "数据表", count: 8 },
];

export default function DashboardConfig() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">看板配置</h1>
          <p className="text-sm text-muted-foreground mt-1">管理和自定义各主题数据看板的布局与组件</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建看板</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">看板总数</p><p className="text-2xl font-bold text-foreground mt-1">6</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已发布</p><p className="text-2xl font-bold text-emerald-500 mt-1">4</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">组件总数</p><p className="text-2xl font-bold text-primary mt-1">35</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">草稿</p><p className="text-2xl font-bold text-amber-500 mt-1">2</p></CardContent></Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">可用组件类型</h2>
        <div className="grid grid-cols-4 gap-3">
          {widgetTypes.map((w) => {
            const Icon = w.icon;
            return (
              <Card key={w.name} className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.name}</p>
                    <p className="text-xs text-muted-foreground">已使用 {w.count} 个</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">看板列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-foreground">{d.name}</h3>
                  </div>
                  <Badge variant={d.status === "published" ? "default" : "secondary"}>
                    {d.status === "published" ? "已发布" : "草稿"}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  <p>所属主题：{d.theme}</p>
                  <p>包含 {d.widgets} 个组件</p>
                  <p>最后修改：{d.lastModified}</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1 flex-1"><Eye className="w-3 h-3" /> 预览</Button>
                  <Button variant="outline" size="sm" className="gap-1 flex-1"><Settings2 className="w-3 h-3" /> 编辑</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><GripVertical className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
