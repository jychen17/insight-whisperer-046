import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Zap, BookOpen, Brain } from "lucide-react";

const rules = [
  { id: "R001", name: "情感分析自动标注", type: "AI模型", category: "情感标签", status: true, accuracy: 94.5, processed: 128450, description: "基于NLP模型自动识别文本情感倾向" },
  { id: "R002", name: "关键词行业分类", type: "规则引擎", category: "行业标签", status: true, accuracy: 97.2, processed: 96800, description: "根据预设关键词库匹配行业分类" },
  { id: "R003", name: "平台来源识别", type: "规则引擎", category: "平台标签", status: true, accuracy: 99.9, processed: 674350, description: "根据数据源自动标注平台来源" },
  { id: "R004", name: "风险内容检测", type: "AI模型", category: "风险标签", status: true, accuracy: 91.8, processed: 674350, description: "AI识别敏感、负面、高风险内容" },
  { id: "R005", name: "主题聚类标注", type: "AI模型", category: "主题标签", status: false, accuracy: 88.3, processed: 45600, description: "基于文本聚类自动生成主题标签" },
  { id: "R006", name: "品牌实体识别", type: "NER模型", category: "自定义标签", status: true, accuracy: 93.6, processed: 234500, description: "命名实体识别提取品牌、产品名称" },
];

const typeIcon: Record<string, typeof Zap> = {
  "AI模型": Brain,
  "规则引擎": Zap,
  "NER模型": BookOpen,
};

export default function TagRules() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签规则</h1>
          <p className="text-sm text-muted-foreground mt-1">配置自动标注规则，支持AI模型与规则引擎</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建规则</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃规则</p><p className="text-2xl font-bold text-foreground mt-1">5</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">平均准确率</p><p className="text-2xl font-bold text-emerald-500 mt-1">95.4%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今日处理量</p><p className="text-2xl font-bold text-primary mt-1">52,340</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">规则列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>目标分类</TableHead>
                <TableHead>准确率</TableHead>
                <TableHead className="text-right">已处理</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => {
                const Icon = typeIcon[r.type] || Zap;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{r.type}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                    <TableCell>
                      <span className={r.accuracy >= 95 ? "text-emerald-500" : r.accuracy >= 90 ? "text-amber-500" : "text-destructive"}>
                        {r.accuracy}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{r.processed.toLocaleString()}</TableCell>
                    <TableCell><Switch checked={r.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
