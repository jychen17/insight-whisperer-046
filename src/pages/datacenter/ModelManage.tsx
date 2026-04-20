import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Brain, Pencil, Trash2, Search, Cpu } from "lucide-react";

interface ModelItem {
  id: string;
  name: string;
  description: string;
  type: "分类" | "情感" | "聚类" | "命名实体" | "风控" | "其他";
  provider: string;
  version: string;
  outputFields: string[];
  status: boolean;
}

const initialModels: ModelItem[] = [
  { id: "M01", name: "舆情判别模型", description: "判别帖子是否构成负面舆情", type: "分类", provider: "内部算法团队", version: "v2.1.0", outputFields: ["业务类型", "是否负面舆情", "舆情问题类型", "舆情判断依据"], status: true },
  { id: "M02", name: "情感分析模型", description: "识别文本正面/负面/中性情感", type: "情感", provider: "内部算法团队", version: "v3.0.2", outputFields: ["情感类型"], status: true },
  { id: "M03", name: "主题聚类模型", description: "无监督聚类生成内容主题标签", type: "聚类", provider: "内部算法团队", version: "v1.4.0", outputFields: ["内容主题"], status: true },
  { id: "M04", name: "风控判别模型", description: "评估帖子风险等级", type: "风控", provider: "风控中台", version: "v2.0.0", outputFields: ["风险等级", "风险判断依据", "所属BG"], status: true },
  { id: "M05", name: "OTA品牌识别模型", description: "NER 识别提及的 OTA 品牌", type: "命名实体", provider: "内部算法团队", version: "v1.2.0", outputFields: ["OTA品牌"], status: true },
];

const MODEL_TYPES = ["分类", "情感", "聚类", "命名实体", "风控", "其他"] as const;

export default function ModelManage() {
  const [models, setModels] = useState<ModelItem[]>(initialModels);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModelItem | null>(null);
  const [form, setForm] = useState<Partial<ModelItem>>({});

  const filtered = models.filter(m => {
    if (search && !m.name.includes(search) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", type: "分类", provider: "", version: "", outputFields: [], status: true });
    setDialogOpen(true);
  };

  const openEdit = (m: ModelItem) => {
    setEditing(m);
    setForm({ ...m });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return;
    if (editing) {
      setModels(prev => prev.map(m => m.id === editing.id ? { ...editing, ...form } as ModelItem : m));
    } else {
      const id = `M${String(models.length + 1).padStart(2, "0")}`;
      setModels(prev => [...prev, { id, status: true, outputFields: [], ...form } as ModelItem]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  const toggleStatus = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: !m.status } : m));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">模型管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理 AI 标签字段的来源模型，包括模型版本、产出字段与启停状态</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> 新增模型</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">模型总数</p>
                <p className="text-2xl font-bold text-foreground">{models.length}</p>
              </div>
              <Cpu className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">运行中</p>
                <p className="text-2xl font-bold text-foreground">{models.filter(m => m.status).length}</p>
              </div>
              <Brain className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">产出 AI 字段</p>
              <p className="text-2xl font-bold text-foreground">{models.reduce((acc, m) => acc + m.outputFields.length, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">模型类型</p>
              <p className="text-2xl font-bold text-foreground">{new Set(models.map(m => m.type)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索模型名称或ID" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="模型类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {MODEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> 模型列表
            <Badge variant="secondary" className="ml-2">{filtered.length} 个</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">模型ID</TableHead>
                <TableHead>模型名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>提供方</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>产出字段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无匹配的模型</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{m.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{m.type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.provider}</TableCell>
                  <TableCell className="text-xs font-mono">{m.version}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.outputFields.slice(0, 3).map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}
                      {m.outputFields.length > 3 && <Badge variant="outline" className="text-[10px]">+{m.outputFields.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={m.status} onCheckedChange={() => toggleStatus(m.id)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑模型" : "新增模型"}</DialogTitle>
            <DialogDescription>{editing ? "修改模型的基本信息与产出字段" : "登记一个新的 AI 模型，作为 AI 标签字段的来源"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>模型名称 <span className="text-destructive">*</span></Label>
              <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：舆情判别模型" />
            </div>
            <div className="space-y-1.5">
              <Label>模型描述</Label>
              <Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>类型 <span className="text-destructive">*</span></Label>
                <Select value={form.type as string} onValueChange={v => setForm({ ...form, type: v as ModelItem["type"] })}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>{MODEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>版本</Label>
                <Input value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="例如：v2.1.0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>提供方</Label>
              <Input value={form.provider || ""} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="例如：内部算法团队 / 第三方厂商" />
            </div>
            <div className="space-y-1.5">
              <Label>产出字段（用逗号分隔）</Label>
              <Input
                value={(form.outputFields || []).join("、")}
                onChange={e => setForm({ ...form, outputFields: e.target.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean) })}
                placeholder="例如：情感类型、风险等级"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
