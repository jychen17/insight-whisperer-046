import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Edit2, Tag, Copy } from "lucide-react";
import { toast } from "sonner";

interface KeywordGroup {
  id: string;
  name: string;
  category: "brand" | "competitor" | "industry" | "custom";
  keywords: string[];
  linkedTasks: number;
  status: boolean;
  updatedAt: string;
}

const initialGroups: KeywordGroup[] = [
  { id: "KG01", name: "同程品牌词", category: "brand", keywords: ["同程旅行", "同程旅游", "同程艺龙", "同程生活", "同程"], linkedTasks: 5, status: true, updatedAt: "2026-03-30" },
  { id: "KG02", name: "OTA竞品词", category: "competitor", keywords: ["携程", "飞猪", "去哪儿", "美团旅行", "马蜂窝", "途牛"], linkedTasks: 3, status: true, updatedAt: "2026-03-29" },
  { id: "KG03", name: "酒店行业词", category: "industry", keywords: ["酒店预订", "民宿", "客房服务", "入住体验", "退房", "酒店投诉"], linkedTasks: 4, status: true, updatedAt: "2026-03-28" },
  { id: "KG04", name: "机票行业词", category: "industry", keywords: ["机票退改", "航班延误", "特价机票", "航空公司", "值机"], linkedTasks: 2, status: true, updatedAt: "2026-03-27" },
  { id: "KG05", name: "负面舆情词", category: "custom", keywords: ["投诉", "欺骗", "坑人", "维权", "差评", "举报", "骗局", "陷阱"], linkedTasks: 6, status: true, updatedAt: "2026-03-30" },
  { id: "KG06", name: "度假产品词", category: "industry", keywords: ["跟团游", "自由行", "度假村", "景点门票", "一日游"], linkedTasks: 1, status: false, updatedAt: "2026-03-20" },
];

const categoryMap: Record<string, { label: string; color: string }> = {
  brand: { label: "品牌词", color: "bg-primary/10 text-primary border-primary/20" },
  competitor: { label: "竞品词", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  industry: { label: "行业词", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  custom: { label: "自定义", color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
};

export default function KeywordManage() {
  const [groups, setGroups] = useState(initialGroups);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = groups.filter(g => {
    if (filter !== "all" && g.category !== filter) return false;
    if (search && !g.name.includes(search) && !g.keywords.some(k => k.includes(search))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">关键词管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理品牌词、竞品词、行业词等关键词组，关联采集任务</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> 新建词组</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">词组数量</p><p className="text-2xl font-bold text-foreground mt-1">{groups.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">关键词总数</p><p className="text-2xl font-bold text-primary mt-1">{groups.reduce((s, g) => s + g.keywords.length, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">关联任务</p><p className="text-2xl font-bold text-emerald-500 mt-1">{new Set(groups.flatMap(g => Array(g.linkedTasks).fill(0))).size || groups.reduce((s,g) => Math.max(s, g.linkedTasks), 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">启用词组</p><p className="text-2xl font-bold text-foreground mt-1">{groups.filter(g => g.status).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">词组列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索词组或关键词..." className="pl-8 w-60" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="brand">品牌词</SelectItem>
                  <SelectItem value="competitor">竞品词</SelectItem>
                  <SelectItem value="industry">行业词</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>词组名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>关键词</TableHead>
                <TableHead className="text-right">关联任务</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id} className={!g.status ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs border ${categoryMap[g.category].color}`}>{categoryMap[g.category].label}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="flex flex-wrap gap-1">
                      {g.keywords.slice(0, 4).map(k => (
                        <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                      ))}
                      {g.keywords.length > 4 && <Badge variant="outline" className="text-xs">+{g.keywords.length - 4}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{g.linkedTasks}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建关键词组</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">词组名称</label>
              <Input placeholder="如：同程品牌词" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">分类</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">品牌词</SelectItem>
                  <SelectItem value="competitor">竞品词</SelectItem>
                  <SelectItem value="industry">行业词</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">关键词（每行一个）</label>
              <Textarea placeholder="同程旅行&#10;同程旅游&#10;同程艺龙" rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => { setDialogOpen(false); toast.success("词组创建成功"); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
