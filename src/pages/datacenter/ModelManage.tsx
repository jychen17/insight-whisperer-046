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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Brain, Pencil, Trash2, Search, Cpu, ChevronDown, ChevronRight,
  ArrowDown, ArrowUp, Workflow, Code2, Globe2, ArrowRightLeft, X, Check,
} from "lucide-react";

// ====== Types ======
type ProcessorType = "http" | "formula";
type InterfaceType = "Dify平台接口" | "通用HTTP接口" | "OpenAI兼容接口";

interface HeaderPair { id: string; key: string; value: string; }
interface ParamMapping { id: string; inputField: string; paramKey: string; }
interface EnumPair { key: string; label: string; }
interface ResultMapping {
  id: string;
  responseKey: string;       // e.g. risk_level
  outputField: string;       // 标签字段（产出 AI 字段）
  outputAlias: string;       // 显示名/别名
  useAsFilter: boolean;      // 用于过滤（仅当目标字段为索引字段时可启用）
  useEnumMapping: boolean;   // 使用枚举映射
  enumValues: EnumPair[];
  otherLabel?: string;
}

interface HttpProcessor {
  id: string;
  type: "http";
  interfaceType: InterfaceType;
  timeout: number;
  url: string;
  headers: HeaderPair[];
  paramMappings: ParamMapping[];
  resultMappings: ResultMapping[];
}
interface FormulaProcessor {
  id: string;
  type: "formula";
  expression: string;        // 公式表达式
  outputField: string;
  outputAlias: string;
}
type Processor = HttpProcessor | FormulaProcessor;

interface ModelItem {
  id: string;
  name: string;
  description: string;
  category: "分类" | "情感" | "聚类" | "命名实体" | "风控" | "其他";
  inputFields: string[];     // 输入字段（来自标签体系）
  processors: Processor[];   // 处理流程（多个串行）
  status: boolean;
}

// ====== Mock catalogs ======
// 输入字段：源自采集字段，按分组管理，方便后续持续扩展
const INPUT_FIELD_GROUPS: { group: string; fields: string[] }[] = [
  { group: "内容", fields: ["标题", "内容", "视频内容", "内容类型", "原文链接"] },
  { group: "时间", fields: ["发布时间", "收录时间"] },
  { group: "互动指标", fields: ["点赞量", "收藏量", "分享量", "阅读量"] },
  { group: "发布人", fields: ["发布人粉丝量", "发布人认证类型"] },
];
const INPUT_FIELD_OPTIONS = INPUT_FIELD_GROUPS.flatMap(g => g.fields);

// 已存在的 AI 字段（标签体系中的索引字段会标记为 isIndex）
const AI_FIELD_CATALOG: { key: string; label: string; isIndex: boolean }[] = [
  { key: "business_type",   label: "业务类型",     isIndex: true },
  { key: "sentiment",       label: "情感类型",     isIndex: true },
  { key: "topic",           label: "内容主题",     isIndex: false },
  { key: "is_negative",     label: "是否负面舆情", isIndex: true },
  { key: "issue_type",      label: "舆情问题类型", isIndex: true },
  { key: "judge_basis",     label: "舆情判断依据", isIndex: false },
  { key: "risk_level",      label: "风险等级",     isIndex: true },
  { key: "risk_basis",      label: "风险判断依据", isIndex: false },
  { key: "ota_brand",       label: "OTA品牌",      isIndex: true },
  { key: "bg",              label: "所属BG",       isIndex: true },
];

const MODEL_CATEGORIES = ["分类", "情感", "聚类", "命名实体", "风控", "其他"] as const;
const INTERFACE_TYPES: InterfaceType[] = ["Dify平台接口", "通用HTTP接口", "OpenAI兼容接口"];

// ====== Helpers ======
const uid = () => Math.random().toString(36).slice(2, 9);

const makeHttpProcessor = (): HttpProcessor => ({
  id: uid(),
  type: "http",
  interfaceType: "Dify平台接口",
  timeout: 3,
  url: "http://difyapi.example.com/v1/workflows/run",
  headers: [],
  paramMappings: [],
  resultMappings: [],
});
const makeFormulaProcessor = (): FormulaProcessor => ({
  id: uid(),
  type: "formula",
  expression: "",
  outputField: "",
  outputAlias: "",
});

// ====== Initial mock models ======
const initialModels: ModelItem[] = [
  {
    id: "M01",
    name: "舆情判别模型",
    description: "基于标题+正文判断帖子是否构成负面舆情，产出多个 AI 字段",
    category: "分类",
    inputFields: ["标题", "内容", "视频内容"],
    status: true,
    processors: [
      {
        id: uid(),
        type: "http",
        interfaceType: "Dify平台接口",
        timeout: 3,
        url: "http://difyapi.example.com/v1/workflows/run",
        headers: [{ id: uid(), key: "Authorization", value: "app-xxxxxxxx" }],
        paramMappings: [
          { id: uid(), inputField: "标题", paramKey: "title" },
          { id: uid(), inputField: "内容", paramKey: "content" },
          { id: uid(), inputField: "视频内容", paramKey: "videoContent" },
        ],
        resultMappings: [
          {
            id: uid(),
            responseKey: "risk_level",
            outputField: "risk_level",
            outputAlias: "风险等级",
            useAsFilter: true,
            useEnumMapping: true,
            enumValues: [
              { key: "1", label: "极高风险" },
              { key: "2", label: "高风险" },
              { key: "3", label: "中风险" },
              { key: "4", label: "中低风险" },
              { key: "5", label: "低风险" },
            ],
            otherLabel: "低风险",
          },
          {
            id: uid(),
            responseKey: "is_negative",
            outputField: "is_negative",
            outputAlias: "是否负面舆情",
            useAsFilter: true,
            useEnumMapping: true,
            enumValues: [{ key: "1", label: "是" }, { key: "0", label: "否" }],
          },
        ],
      },
    ],
  },
  {
    id: "M02",
    name: "情感分析模型",
    description: "对正文进行情感判别（正/负/中性）",
    category: "情感",
    inputFields: ["内容"],
    status: true,
    processors: [
      {
        id: uid(),
        type: "http",
        interfaceType: "OpenAI兼容接口",
        timeout: 3,
        url: "http://nlpapi.example.com/v1/sentiment",
        headers: [],
        paramMappings: [{ id: uid(), inputField: "内容", paramKey: "text" }],
        resultMappings: [
          {
            id: uid(),
            responseKey: "sentiment",
            outputField: "sentiment",
            outputAlias: "情感类型",
            useAsFilter: true,
            useEnumMapping: true,
            enumValues: [
              { key: "1", label: "正面" },
              { key: "0", label: "中性" },
              { key: "-1", label: "负面" },
            ],
          },
        ],
      },
    ],
  },
];

// ====== Component ======
export default function ModelManage() {
  const [models, setModels] = useState<ModelItem[]>(initialModels);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModelItem | null>(null);
  const [form, setForm] = useState<ModelItem>(emptyForm());

  function emptyForm(): ModelItem {
    return {
      id: "",
      name: "",
      description: "",
      category: "分类",
      inputFields: [],
      processors: [makeHttpProcessor()],
      status: true,
    };
  }

  const filtered = models.filter(m => {
    if (search && !m.name.includes(search) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    return true;
  });

  const totalOutputFields = (m: ModelItem) =>
    m.processors.reduce((acc, p) => acc + (p.type === "http" ? p.resultMappings.length : 1), 0);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (m: ModelItem) => { setEditing(m); setForm(JSON.parse(JSON.stringify(m))); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setModels(prev => prev.map(m => m.id === editing.id ? { ...form, id: editing.id } : m));
    } else {
      const id = `M${String(models.length + 1).padStart(2, "0")}`;
      setModels(prev => [...prev, { ...form, id }]);
    }
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => setModels(prev => prev.filter(m => m.id !== id));
  const toggleStatus = (id: string) => setModels(prev => prev.map(m => m.id === id ? { ...m, status: !m.status } : m));

  // ===== Processor helpers (operate on form) =====
  const addHttpProcessor = () => setForm(f => ({ ...f, processors: [...f.processors, makeHttpProcessor()] }));
  const addFormulaProcessor = () => setForm(f => ({ ...f, processors: [...f.processors, makeFormulaProcessor()] }));
  const removeProcessor = (id: string) => setForm(f => ({ ...f, processors: f.processors.filter(p => p.id !== id) }));
  const moveProcessor = (id: string, dir: -1 | 1) => setForm(f => {
    const idx = f.processors.findIndex(p => p.id === id);
    const next = [...f.processors];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return f;
    [next[idx], next[target]] = [next[target], next[idx]];
    return { ...f, processors: next };
  });
  const updateProcessor = (id: string, patch: Partial<Processor>) =>
    setForm(f => ({ ...f, processors: f.processors.map(p => p.id === id ? ({ ...p, ...patch } as Processor) : p) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">模型管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理 AI 标签字段的来源模型：定义输入字段、处理流程（HTTP/公式，可串行多步），以及产出 AI 字段的映射与枚举
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> 新增模型</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="模型总数" value={models.length} icon={Cpu} />
        <StatTile label="运行中" value={models.filter(m => m.status).length} icon={Brain} />
        <StatTile label="处理流程数" value={models.reduce((a, m) => a + m.processors.length, 0)} icon={Workflow} />
        <StatTile label="产出 AI 字段" value={models.reduce((a, m) => a + totalOutputFields(m), 0)} icon={ArrowRightLeft} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索模型名称或ID" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="模型分类" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {MODEL_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
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
                <TableHead>分类</TableHead>
                <TableHead>输入字段</TableHead>
                <TableHead>处理流程</TableHead>
                <TableHead>产出字段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无匹配的模型</TableCell></TableRow>
              ) : filtered.map(m => {
                const outputs = m.processors.flatMap(p =>
                  p.type === "http"
                    ? p.resultMappings.map(r => r.outputAlias || r.outputField)
                    : [p.outputAlias || p.outputField || "公式产出"]
                );
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{m.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.category}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {m.inputFields.slice(0, 3).map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}
                        {m.inputFields.length > 3 && <Badge variant="outline" className="text-[10px]">+{m.inputFields.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Workflow className="w-3.5 h-3.5" />
                        {m.processors.length} 步
                        <span className="ml-1 flex gap-0.5">
                          {m.processors.map(p => (
                            <span key={p.id} title={p.type === "http" ? "HTTP" : "公式"}
                              className={`inline-block w-1.5 h-1.5 rounded-full ${p.type === "http" ? "bg-primary" : "bg-accent-foreground/60"}`} />
                          ))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {outputs.slice(0, 3).map((f, i) => <Badge key={`${f}-${i}`} variant="secondary" className="text-[10px]">{f}</Badge>)}
                        {outputs.length > 3 && <Badge variant="outline" className="text-[10px]">+{outputs.length - 3}</Badge>}
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑模型" : "新增模型"}</DialogTitle>
            <DialogDescription>
              定义模型的基本信息、输入字段，以及多步处理流程（HTTP接口 / 公式），由处理器的「结果映射」产出 AI 标签字段
            </DialogDescription>
          </DialogHeader>

          {/* Basic */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>模型名称 <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：舆情判别模型" />
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as ModelItem["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODEL_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>模型描述</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="该模型的用途、输入与输出说明" />
            </div>

            {/* Input fields */}
            <div className="space-y-1.5">
              <Label>输入字段 <span className="text-xs text-muted-foreground font-normal">（来自采集字段，作为处理流程参数映射的可选项）</span></Label>
              <InputFieldsPicker
                value={form.inputFields}
                onChange={(v) => setForm(s => ({ ...s, inputFields: v }))}
              />
            </div>

            {/* Processors */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-primary" />
                  处理器配置
                  <span className="text-xs text-muted-foreground font-normal">（按顺序串行执行；多个处理器可产出同一字段）</span>
                </Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-primary" onClick={addHttpProcessor}>
                    <Plus className="w-3.5 h-3.5" /> 添加HTTP处理器
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-primary" onClick={addFormulaProcessor}>
                    <Plus className="w-3.5 h-3.5" /> 添加公式处理器
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {form.processors.map((p, idx) => {
                  const upstreamHttpKeys = form.processors
                    .slice(0, idx)
                    .filter(pr => pr.type === "http")
                    .flatMap(pr => (pr as HttpProcessor).resultMappings.map(rm => ({
                      key: rm.responseKey || rm.outputField,
                      label: rm.outputAlias || rm.responseKey || rm.outputField,
                    })))
                    .filter(x => x.key);
                  return (
                    <ProcessorCard
                      key={p.id}
                      index={idx}
                      processor={p}
                      inputFields={form.inputFields}
                      upstreamHttpKeys={upstreamHttpKeys}
                      onMoveUp={() => moveProcessor(p.id, -1)}
                      onMoveDown={() => moveProcessor(p.id, 1)}
                      onRemove={() => removeProcessor(p.id)}
                      onUpdate={(patch) => updateProcessor(p.id, patch)}
                    />
                  );
                })}
                {form.processors.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground border border-dashed border-border rounded py-6">
                    暂无处理器，请添加一个 HTTP 或公式处理器
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Sub components ============

function StatTile({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Icon className="w-8 h-8 text-primary opacity-60" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessorCard({
  index, processor, inputFields, upstreamHttpKeys, onMoveUp, onMoveDown, onRemove, onUpdate,
}: {
  index: number;
  processor: Processor;
  inputFields: string[];
  upstreamHttpKeys: { key: string; label: string }[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<Processor>) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const isHttp = processor.type === "http";
  const Icon = isHttp ? Globe2 : Code2;
  const title = isHttp ? `处理器 #${index + 1} - HTTP接口` : `处理器 #${index + 1} - 公式`;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border rounded-md bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </CollapsibleTrigger>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={onMoveUp}><ArrowUp className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={onMoveDown}><ArrowDown className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
          {isHttp
            ? <HttpProcessorEditor processor={processor as HttpProcessor} inputFields={inputFields} onUpdate={onUpdate as (p: Partial<HttpProcessor>) => void} />
            : <FormulaProcessorEditor
                processor={processor as FormulaProcessor}
                inputFields={inputFields}
                upstreamHttpKeys={upstreamHttpKeys}
                onUpdate={onUpdate as (p: Partial<FormulaProcessor>) => void}
              />}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function HttpProcessorEditor({
  processor, inputFields, onUpdate,
}: {
  processor: HttpProcessor;
  inputFields: string[];
  onUpdate: (patch: Partial<HttpProcessor>) => void;
}) {
  const update = (patch: Partial<HttpProcessor>) => onUpdate(patch);

  // headers
  const addHeader = () => update({ headers: [...processor.headers, { id: uid(), key: "", value: "" }] });
  const updateHeader = (id: string, patch: Partial<HeaderPair>) =>
    update({ headers: processor.headers.map(h => h.id === id ? { ...h, ...patch } : h) });
  const removeHeader = (id: string) => update({ headers: processor.headers.filter(h => h.id !== id) });

  // params
  const addParam = () => update({ paramMappings: [...processor.paramMappings, { id: uid(), inputField: "", paramKey: "" }] });
  const updateParam = (id: string, patch: Partial<ParamMapping>) =>
    update({ paramMappings: processor.paramMappings.map(p => p.id === id ? { ...p, ...patch } : p) });
  const removeParam = (id: string) => update({ paramMappings: processor.paramMappings.filter(p => p.id !== id) });

  // results
  const addResult = () => update({
    resultMappings: [...processor.resultMappings, {
      id: uid(), responseKey: "", outputField: "", outputAlias: "",
      useAsFilter: false, useEnumMapping: false, enumValues: [],
    }]
  });
  const updateResult = (id: string, patch: Partial<ResultMapping>) =>
    update({ resultMappings: processor.resultMappings.map(r => r.id === id ? { ...r, ...patch } : r) });
  const removeResult = (id: string) => update({ resultMappings: processor.resultMappings.filter(r => r.id !== id) });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">接口类型</Label>
          <Select value={processor.interfaceType} onValueChange={v => update({ interfaceType: v as InterfaceType })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{INTERFACE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">读取超时(秒)</Label>
          <Input type="number" min={1} value={processor.timeout} onChange={e => update({ timeout: Number(e.target.value) || 0 })} className="h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input value={processor.url} onChange={e => update({ url: e.target.value })} className="h-9" />
      </div>

      {/* Headers */}
      <SectionHeader
        title="请求头配置"
        actionLabel="添加请求头"
        onAdd={addHeader}
      />
      {processor.headers.length === 0 ? (
        <EmptyHint text="暂无请求头配置" />
      ) : (
        <div className="space-y-2">
          {processor.headers.map(h => (
            <div key={h.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input placeholder="Header Key（如 Authorization）" className="h-9" value={h.key} onChange={e => updateHeader(h.id, { key: e.target.value })} />
              <Input placeholder="Header Value" className="h-9" value={h.value} onChange={e => updateHeader(h.id, { value: e.target.value })} />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeHeader(h.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* Param mappings */}
      <SectionHeader
        title="参数映射配置"
        subtitle="将输入字段映射为请求体的参数 key"
        actionLabel="添加参数映射"
        onAdd={addParam}
      />
      {processor.paramMappings.length === 0 ? (
        <EmptyHint text="暂无参数映射配置" />
      ) : (
        <div className="space-y-2">
          {processor.paramMappings.map(p => (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Select value={p.inputField} onValueChange={v => updateParam(p.id, { inputField: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="选择输入字段" /></SelectTrigger>
                <SelectContent>
                  {inputFields.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">请先在上方选择输入字段</div>}
                  {inputFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="参数 key（如 title）" className="h-9" value={p.paramKey} onChange={e => updateParam(p.id, { paramKey: e.target.value })} />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeParam(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* Result mappings */}
      <SectionHeader
        title="结果映射配置"
        subtitle="将接口返回字段映射到 AI 标签字段；可启用过滤（仅索引字段）和枚举映射"
        actionLabel="添加结果映射"
        onAdd={addResult}
      />
      {processor.resultMappings.length === 0 ? (
        <EmptyHint text="暂无结果映射配置" />
      ) : (
        <div className="space-y-3">
          {processor.resultMappings.map(r => {
            const target = AI_FIELD_CATALOG.find(f => f.key === r.outputField);
            const filterDisabled = !target?.isIndex;
            return (
              <div key={r.id} className="space-y-2 border border-border rounded p-3 bg-muted/20">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">响应字段 key</Label>
                    <Input placeholder="如 risk_level" className="h-9" value={r.responseKey} onChange={e => updateResult(r.id, { responseKey: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">目标 AI 字段</Label>
                    <Select
                      value={r.outputField}
                      onValueChange={v => {
                        const t = AI_FIELD_CATALOG.find(f => f.key === v);
                        updateResult(r.id, {
                          outputField: v,
                          outputAlias: r.outputAlias || t?.label || "",
                          useAsFilter: t?.isIndex ? r.useAsFilter : false,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="选择标签字段" /></SelectTrigger>
                      <SelectContent>
                        {AI_FIELD_CATALOG.map(f => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">显示别名</Label>
                    <Input placeholder="如 风险等级" className="h-9" value={r.outputAlias} onChange={e => updateResult(r.id, { outputAlias: e.target.value })} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeResult(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className={`flex items-center gap-2 text-xs ${filterDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={filterDisabled ? "目标字段非索引字段，不可开启" : ""}>
                    <Switch
                      checked={r.useAsFilter}
                      disabled={filterDisabled}
                      onCheckedChange={v => updateResult(r.id, { useAsFilter: v })}
                    />
                    用于过滤
                    {filterDisabled && r.outputField && <span className="text-[10px] text-muted-foreground">（非索引字段）</span>}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={r.useEnumMapping} onCheckedChange={v => updateResult(r.id, { useEnumMapping: v })} />
                    使用枚举映射
                  </label>
                </div>

                {r.useEnumMapping && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground">枚举映射</Label>
                      <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-primary"
                        onClick={() => updateResult(r.id, { enumValues: [...r.enumValues, { key: "", label: "" }] })}>
                        <Plus className="w-3 h-3" /> 添加枚举
                      </Button>
                    </div>
                    {r.enumValues.length === 0 && <EmptyHint text="暂无枚举映射" />}
                    <div className="space-y-1.5">
                      {r.enumValues.map((ev, i) => (
                        <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                          <Input placeholder="原始值" className="h-8" value={ev.key}
                            onChange={e => {
                              const next = [...r.enumValues]; next[i] = { ...next[i], key: e.target.value };
                              updateResult(r.id, { enumValues: next });
                            }} />
                          <Input placeholder="显示标签" className="h-8" value={ev.label}
                            onChange={e => {
                              const next = [...r.enumValues]; next[i] = { ...next[i], label: e.target.value };
                              updateResult(r.id, { enumValues: next });
                            }} />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => updateResult(r.id, { enumValues: r.enumValues.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-2 pt-1">
                      <Label className="text-[11px] text-muted-foreground">未匹配时</Label>
                      <Input placeholder="未匹配枚举的兜底标签（可选）" className="h-8"
                        value={r.otherLabel || ""} onChange={e => updateResult(r.id, { otherLabel: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function FormulaProcessorEditor({
  processor, inputFields, upstreamHttpKeys, onUpdate,
}: {
  processor: FormulaProcessor;
  inputFields: string[];
  upstreamHttpKeys: { key: string; label: string }[];
  onUpdate: (patch: Partial<FormulaProcessor>) => void;
}) {
  const OPERATORS = ["+", "-", "*", "/", "(", ")"];

  const insertToken = (token: string) => {
    const cur = processor.expression || "";
    const needsSpace = cur && !cur.endsWith(" ") && !cur.endsWith("(");
    onUpdate({ expression: cur + (needsSpace ? " " : "") + token });
  };
  const backspace = () => {
    const cur = (processor.expression || "").trimEnd();
    // 删除最后一个 token（按空格切分，整体删除）
    const idx = cur.lastIndexOf(" ");
    onUpdate({ expression: idx === -1 ? "" : cur.slice(0, idx) });
  };
  const clearAll = () => onUpdate({ expression: "" });

  // 编译后表达式：把字段名替换为安全的标识符（仅展示用）
  const compiled = (processor.expression || "")
    .replace(/[\u4e00-\u9fa5_a-zA-Z][\u4e00-\u9fa5_a-zA-Z0-9]*/g, (m) => {
      if (OPERATORS.includes(m)) return m;
      return m.replace(/[^a-zA-Z0-9_]/g, "_");
    });

  return (
    <>
      <div className="grid grid-cols-[1fr_220px] gap-4">
        {/* 左侧：表达式输入 + 编译预览 + 输出 */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">表达式</Label>
            <Textarea
              rows={3}
              placeholder="请输入表达式，如：(点赞量 * 0.6 + 评论量 * 0.3 + 分享量 * 0.1) * 风险等级"
              value={processor.expression}
              onChange={e => onUpdate({ expression: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">编译后表达式</Label>
            <Input className="h-9 font-mono text-xs bg-muted/30" value={compiled} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">目标 AI 字段</Label>
              <Select value={processor.outputField} onValueChange={v => {
                const t = AI_FIELD_CATALOG.find(f => f.key === v);
                onUpdate({ outputField: v, outputAlias: processor.outputAlias || t?.label || "" });
              }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="选择标签字段" /></SelectTrigger>
                <SelectContent>
                  {AI_FIELD_CATALOG.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">显示别名</Label>
              <Input className="h-9" value={processor.outputAlias} onChange={e => onUpdate({ outputAlias: e.target.value })} />
            </div>
          </div>
        </div>

        {/* 右侧：可点击的字段、HTTP结果、运算符 */}
        <div className="space-y-3 border-l border-border pl-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">原始字段</p>
            {inputFields.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">请先在上方选择输入字段</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {inputFields.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => insertToken(f)}
                    className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">HTTP结果映射</p>
            {upstreamHttpKeys.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">无上游 HTTP 处理器输出</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {upstreamHttpKeys.map(k => (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => insertToken(k.label)}
                    className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">运算符</p>
            <div className="flex flex-wrap gap-1.5">
              {OPERATORS.map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertToken(op)}
                  className="text-xs w-8 h-8 rounded border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors font-mono"
                >
                  {op}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={backspace}
                className="text-xs px-3 h-8 rounded border border-border bg-background hover:bg-muted transition-colors"
              >
                退格
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs px-3 h-8 rounded border border-destructive/40 text-destructive bg-background hover:bg-destructive/10 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({
  title, subtitle, actionLabel, onAdd,
}: { title: string; subtitle?: string; actionLabel: string; onAdd: () => void; }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-primary" onClick={onAdd}>
        <Plus className="w-3.5 h-3.5" /> {actionLabel}
      </Button>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground py-2 px-3 bg-muted/30 border border-dashed border-border rounded">{text}</p>;
}

function InputFieldsPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const toggle = (f: string) =>
    onChange(value.includes(f) ? value.filter(x => x !== f) : [...value, f]);
  const remove = (f: string) => onChange(value.filter(x => x !== f));
  const clearAll = () => onChange([]);

  const filteredGroups = INPUT_FIELD_GROUPS.map(g => ({
    ...g,
    fields: g.fields.filter(f => !keyword.trim() || f.includes(keyword.trim())),
  })).filter(g => g.fields.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 p-2 border border-border rounded bg-muted/30 min-h-[42px]">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {value.length === 0 ? (
            <span className="text-xs text-muted-foreground py-1 px-1">未选择，点击右侧按钮添加输入字段</span>
          ) : value.map(f => (
            <Badge key={f} variant="secondary" className="text-xs gap-1 pr-1">
              {f}
              <button type="button" onClick={() => remove(f)} className="rounded hover:bg-background/60">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          {value.length > 0 && (
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={clearAll}>
              清空
            </Button>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-primary text-xs">
                <Plus className="w-3.5 h-3.5" /> 添加字段
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索字段名"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>已选 {value.length} 个</span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => onChange(Array.from(new Set([...value, ...INPUT_FIELD_OPTIONS])))}
                  >
                    全选
                  </button>
                </div>
              </div>
              <ScrollArea className="h-72">
                <div className="p-2 space-y-3">
                  {filteredGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">无匹配字段</p>
                  )}
                  {filteredGroups.map(g => (
                    <div key={g.group} className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-medium text-muted-foreground">{g.group}</span>
                        <button
                          type="button"
                          className="text-[11px] text-primary hover:underline"
                          onClick={() => onChange(Array.from(new Set([...value, ...g.fields])))}
                        >
                          组内全选
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {g.fields.map(f => {
                          const active = value.includes(f);
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => toggle(f)}
                              className={`text-xs px-2 py-1 rounded border transition flex items-center gap-1 ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {active && <Check className="w-3 h-3" />}
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
