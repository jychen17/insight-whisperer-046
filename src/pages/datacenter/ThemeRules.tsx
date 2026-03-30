import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings2 } from "lucide-react";

const rules = [
  { id: 1, name: "舆情风险识别规则", theme: "舆情主题", type: "触发规则", conditions: "负面情感 > 70% 且 传播量 > 1000", action: "触发预警通知", status: true, triggerCount: 23 },
  { id: 2, name: "行业热点捕获规则", theme: "行业咨询主题", type: "采集规则", conditions: "热度指数 > 80 且 涉及行业关键词", action: "自动加入监测列表", status: true, triggerCount: 156 },
  { id: 3, name: "竞品动态追踪规则", theme: "行业咨询主题", type: "追踪规则", conditions: "提及竞品品牌名称 且 包含产品发布/价格关键词", action: "自动归类至竞品板块", status: true, triggerCount: 89 },
  { id: 4, name: "用户负面反馈规则", theme: "产品体验主题", type: "触发规则", conditions: "NPS < 6 或 包含投诉关键词", action: "标记为待处理问题", status: true, triggerCount: 342 },
  { id: 5, name: "热点话题归并规则", theme: "热点洞察主题", type: "归并规则", conditions: "主题相似度 > 85%", action: "合并为同一话题", status: false, triggerCount: 67 },
  { id: 6, name: "数据质量过滤规则", theme: "全局", type: "过滤规则", conditions: "文本长度 < 10 或 重复率 > 90%", action: "自动标记为低质量数据", status: true, triggerCount: 1890 },
];

const typeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "触发规则": "default",
  "采集规则": "secondary",
  "追踪规则": "outline",
  "归并规则": "secondary",
  "过滤规则": "destructive",
};

export default function ThemeRules() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">规则配置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置各主题下的数据处理规则与自动化逻辑</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建规则</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃规则</p><p className="text-2xl font-bold text-foreground mt-1">5</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今日触发次数</p><p className="text-2xl font-bold text-primary mt-1">2,567</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">规则总数</p><p className="text-2xl font-bold text-foreground mt-1">6</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">规则列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>触发条件</TableHead>
                <TableHead>执行动作</TableHead>
                <TableHead className="text-right">触发次数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.theme}</TableCell>
                  <TableCell><Badge variant={typeColors[r.type] || "secondary"}>{r.type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.conditions}</TableCell>
                  <TableCell className="text-sm">{r.action}</TableCell>
                  <TableCell className="text-right">{r.triggerCount.toLocaleString()}</TableCell>
                  <TableCell><Switch checked={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
