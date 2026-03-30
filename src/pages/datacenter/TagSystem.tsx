import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, FolderTree, ChevronRight } from "lucide-react";

interface TagCategory {
  name: string;
  count: number;
  color: string;
  children: { name: string; count: number }[];
}

const tagCategories: TagCategory[] = [
  {
    name: "情感标签", count: 3, color: "bg-rose-500/10 text-rose-500",
    children: [{ name: "正面", count: 45200 }, { name: "负面", count: 12800 }, { name: "中性", count: 67400 }],
  },
  {
    name: "行业标签", count: 8, color: "bg-blue-500/10 text-blue-500",
    children: [{ name: "科技", count: 23400 }, { name: "金融", count: 18900 }, { name: "医疗", count: 15600 }, { name: "教育", count: 12300 }],
  },
  {
    name: "平台标签", count: 6, color: "bg-amber-500/10 text-amber-500",
    children: [{ name: "微博", count: 128450 }, { name: "抖音", count: 85620 }, { name: "小红书", count: 42300 }, { name: "知乎", count: 36780 }],
  },
  {
    name: "主题标签", count: 12, color: "bg-emerald-500/10 text-emerald-500",
    children: [{ name: "品牌口碑", count: 34500 }, { name: "产品体验", count: 28900 }, { name: "竞品对比", count: 19200 }, { name: "市场趋势", count: 15800 }],
  },
  {
    name: "风险标签", count: 4, color: "bg-destructive/10 text-destructive",
    children: [{ name: "高风险", count: 890 }, { name: "中风险", count: 2340 }, { name: "低风险", count: 5670 }, { name: "安全", count: 116500 }],
  },
  {
    name: "自定义标签", count: 15, color: "bg-violet-500/10 text-violet-500",
    children: [{ name: "重点关注", count: 8900 }, { name: "待处理", count: 3200 }, { name: "已归档", count: 45600 }],
  },
];

const stats = [
  { label: "标签分类", value: "6" },
  { label: "标签总数", value: "48" },
  { label: "已标注数据", value: "674,350" },
  { label: "标注覆盖率", value: "94.2%" },
];

export default function TagSystem() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签体系</h1>
          <p className="text-sm text-muted-foreground mt-1">管理和维护数据标签分类与层级结构</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建分类</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tagCategories.map((cat) => (
          <Card key={cat.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center`}>
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{cat.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{cat.count} 个标签</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {cat.children.map((child) => (
                  <div key={child.name} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">{child.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{child.count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
