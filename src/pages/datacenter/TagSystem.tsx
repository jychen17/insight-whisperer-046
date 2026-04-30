import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Brain, FileText, Calculator, Tag, Search, Eye, Pencil, Settings2, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type DataType = "数字" | "字符串" | "时间";
type EntityType = "文章" | "账户" | "话题" | "评论" | "榜单";

interface EnumPair {
  key: string;
  label: string;
}

interface TagItem {
  id: string;
  name: string;
  description: string;
  dataType: DataType;
  entityType: EntityType;
  source: string;
  status: boolean;
  category: string;
  enumValues?: EnumPair[];
  otherLabel?: string;
}

const aiTags: TagItem[] = [
  { id: "AI01", name: "业务类型", description: "AI识别内容所属业务线（酒店/机票/度假等）", dataType: "字符串", entityType: "文章", source: "舆情模型", status: true, category: "ai", enumValues: [{key:"1",label:"酒店"},{key:"2",label:"机票"},{key:"3",label:"度假"},{key:"4",label:"门票"},{key:"5",label:"用车"}], otherLabel: "其他业务" },
  { id: "AI02", name: "情感类型", description: "NLP模型识别文本正面/负面/中性情感", dataType: "字符串", entityType: "文章", source: "情感模型", status: true, category: "ai", enumValues: [{key:"1",label:"正面"},{key:"0",label:"中性"},{key:"-1",label:"负面"}] },
  { id: "AI03", name: "内容主题", description: "AI聚类识别内容主题标签", dataType: "字符串", entityType: "文章", source: "主题模型", status: true, category: "ai" },
  { id: "AI04", name: "是否负面舆情", description: "综合判断是否构成负面舆情", dataType: "字符串", entityType: "文章", source: "舆情模型", status: true, category: "ai", enumValues: [{key:"1",label:"是"},{key:"0",label:"否"}] },
  { id: "AI05", name: "舆情问题类型", description: "识别投诉/曝光/维权等问题类型", dataType: "字符串", entityType: "文章", source: "舆情模型", status: true, category: "ai", enumValues: [{key:"1",label:"投诉"},{key:"2",label:"曝光"},{key:"3",label:"维权"},{key:"4",label:"咨询"}] },
  { id: "AI06", name: "舆情判断依据", description: "AI输出的舆情判定关键依据文本", dataType: "字符串", entityType: "文章", source: "舆情模型", status: true, category: "ai" },
  { id: "AI07", name: "风险等级", description: "AI风控模型识别内容风险级别", dataType: "字符串", entityType: "文章", source: "风控模型", status: true, category: "ai", enumValues: [{key:"5",label:"极高风险"},{key:"4",label:"高风险"},{key:"3",label:"中风险"},{key:"2",label:"中低风险"},{key:"1",label:"低风险"}], otherLabel: "低风险" },
  { id: "AI08", name: "风险判断依据", description: "风控模型输出的判断依据", dataType: "字符串", entityType: "文章", source: "风控模型", status: true, category: "ai" },
  { id: "AI09", name: "OTA品牌", description: "识别提及的OTA品牌名称", dataType: "字符串", entityType: "文章", source: "NER模型", status: true, category: "ai" },
  { id: "AI10", name: "所属BG", description: "识别内容对应的业务BG", dataType: "字符串", entityType: "账户", source: "风控模型", status: false, category: "ai", enumValues: [{key:"1",label:"大住宿BG"},{key:"2",label:"大交通BG"},{key:"3",label:"度假BG"},{key:"4",label:"国际业务BG"}] },
];

const rawTags: TagItem[] = [
  { id: "RAW01", name: "标题", description: "原始内容标题", dataType: "字符串", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW02", name: "正文内容", description: "原始正文/帖子内容", dataType: "字符串", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW03", name: "发布人昵称", description: "内容发布者昵称", dataType: "字符串", entityType: "账户", source: "采集字段", status: true, category: "raw" },
  { id: "RAW04", name: "发布人粉丝数", description: "发布者粉丝/关注者数量", dataType: "数字", entityType: "账户", source: "采集字段", status: true, category: "raw" },
  { id: "RAW05", name: "发布时间", description: "内容原始发布时间", dataType: "时间", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW06", name: "点赞量", description: "内容获得的点赞数", dataType: "数字", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW07", name: "评论量", description: "内容获得的评论数", dataType: "数字", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW08", name: "收藏量", description: "内容获得的收藏/保存数", dataType: "数字", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW09", name: "分享量", description: "内容被分享/转发次数", dataType: "数字", entityType: "文章", source: "采集字段", status: true, category: "raw" },
  { id: "RAW10", name: "平台来源", description: "数据采集来源平台", dataType: "字符串", entityType: "文章", source: "采集字段", status: true, category: "raw", enumValues: [{key:"xhs",label:"小红书"},{key:"wb",label:"微博"},{key:"dy",label:"抖音"},{key:"zh",label:"知乎"},{key:"wx",label:"微信公众号"}] },
];

const calcTags: TagItem[] = [
  { id: "CALC01", name: "发酵等级", description: "低(评论<10)、中(10-50)、快(>50)", dataType: "字符串", entityType: "文章", source: "评论量", status: true, category: "calc", enumValues: [{key:"1",label:"低"},{key:"2",label:"中"},{key:"3",label:"快"}] },
  { id: "CALC02", name: "风险分数", description: "(评论+点赞+收藏+分享+阅读)×0.5 + 风险等级×0.5", dataType: "数字", entityType: "文章", source: "加权计算", status: true, category: "calc" },
  { id: "CALC03", name: "互动热度", description: "点赞+评论+收藏+分享的加权综合分", dataType: "数字", entityType: "文章", source: "加权计算", status: true, category: "calc" },
  { id: "CALC04", name: "传播速度", description: "单位时间内互动增量", dataType: "数字", entityType: "话题", source: "时序计算", status: true, category: "calc" },
  { id: "CALC05", name: "影响力指数", description: "发布人粉丝数×互动率的综合评分", dataType: "数字", entityType: "账户", source: "加权计算", status: false, category: "calc" },
];

const typeIcons: Record<string, typeof Brain> = {
  "AI标签": Brain,
  "原始标签": FileText,
  "计算标签": Calculator,
};

const categoryLabels: Record<string, string> = {
  ai: "AI标签",
  raw: "原始标签",
  calc: "计算标签",
};

const ALL_DATA_TYPES: DataType[] = ["数字", "字符串", "时间"];
const ALL_ENTITY_TYPES: EntityType[] = ["文章", "账户", "话题", "评论", "榜单"];

interface Filters {
  search: string;
  dataType: string;
  entityType: string;
  source: string;
  status: string;
}

function TagTable({
  tags, category, filters, onView, onEdit, onConfigEnum,
}: {
  tags: TagItem[]; category: string; filters: Filters;
  onView: (tag: TagItem) => void; onEdit: (tag: TagItem) => void; onConfigEnum: (tag: TagItem) => void;
}) {
  const Icon = typeIcons[category] || Tag;

  const filtered = useMemo(() => {
    return tags.filter((t) => {
      if (filters.search && !t.name.includes(filters.search) && !t.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.dataType && filters.dataType !== "all" && t.dataType !== filters.dataType) return false;
      if (filters.entityType && filters.entityType !== "all" && t.entityType !== filters.entityType) return false;
      if (filters.source && filters.source !== "all" && t.source !== filters.source) return false;
      if (filters.status === "enabled" && !t.status) return false;
      if (filters.status === "disabled" && t.status) return false;
      return true;
    });
  }, [tags, filters]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">标签ID</TableHead>
          <TableHead>标签名称</TableHead>
          <TableHead>值类型</TableHead>
          <TableHead>数据类型</TableHead>
          <TableHead>枚举值</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无匹配的标签</TableCell>
          </TableRow>
        ) : (
          filtered.map((t) => {
            const canHaveEnum = t.dataType === "字符串";
            const hasEnum = (t.enumValues?.length ?? 0) > 0;
            return (
              <TableRow key={t.id}>
                <TableCell className="text-xs text-muted-foreground font-mono">{t.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{t.dataType}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{t.entityType}</Badge></TableCell>
                <TableCell>
                  {!canHaveEnum ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : hasEnum ? (
                    <Badge variant="secondary" className="text-xs">已配置 · {t.enumValues!.length} 项</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">未配置</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.source}</TableCell>
                <TableCell><Switch checked={t.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="查看" onClick={() => onView(t)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑" onClick={() => onEdit(t)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {canHaveEnum && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="配置枚举值" onClick={() => onConfigEnum(t)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

const sourceOptions: Record<string, string[]> = {
  ai: ["舆情模型", "情感模型", "主题模型", "风控模型", "NER模型"],
  raw: ["采集字段"],
  calc: ["加权计算", "时序计算", "规则计算"],
};

const allSources = ["舆情模型", "情感模型", "主题模型", "风控模型", "NER模型", "采集字段", "加权计算", "时序计算", "规则计算", "评论量"];

const emptyForm: { name: string; description: string; category: string; dataType: DataType | ""; entityType: EntityType | ""; source: string; enableEnum: boolean; enumValues: EnumPair[]; otherLabel: string } = {
  name: "", description: "", category: "ai", dataType: "", entityType: "", source: "", enableEnum: false, enumValues: [], otherLabel: "",
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm text-foreground flex-1">{children}</span>
    </div>
  );
}

function EnumValuesEditor({
  enabled, onEnabledChange, values, onChange, otherLabel, onOtherLabelChange,
}: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  values: EnumPair[];
  onChange: (v: EnumPair[]) => void;
  otherLabel: string;
  onOtherLabelChange: (v: string) => void;
}) {
  const updateRow = (idx: number, patch: Partial<EnumPair>) => {
    onChange(values.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeRow = (idx: number) => onChange(values.filter((_, i) => i !== idx));
  const addRow = () => onChange([...values, { key: "", label: "" }]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm">是否设置枚举值：</span>
        <RadioGroup
          value={enabled ? "yes" : "no"}
          onValueChange={(v) => onEnabledChange(v === "yes")}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="enum-yes" />
            <Label htmlFor="enum-yes" className="text-sm font-normal cursor-pointer">是</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="enum-no" />
            <Label htmlFor="enum-no" className="text-sm font-normal cursor-pointer">否</Label>
          </div>
        </RadioGroup>
      </div>

      {enabled && (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Label className="w-16 shrink-0 pt-2 text-sm">枚举值：</Label>
            <div className="flex-1 space-y-2">
              {values.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => updateRow(idx, { key: e.target.value })}
                    placeholder="值"
                    className="h-9 flex-1"
                  />
                  <Input
                    value={row.label}
                    onChange={(e) => updateRow(idx, { label: e.target.value })}
                    placeholder="显示名称"
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeRow(idx)}
                    aria-label="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="w-full border-dashed h-9 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 添加枚举值
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Label className="w-24 shrink-0 text-sm">
              <span className="text-destructive">*</span> 其它枚举值：
            </Label>
            <Input
              value={otherLabel}
              onChange={(e) => onOtherLabelChange(e.target.value)}
              placeholder="未匹配上述枚举时的默认显示名称"
              className="h-9 flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TagSystem() {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [enumOpen, setEnumOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [enumDraft, setEnumDraft] = useState<EnumPair[]>([]);
  const [enumDraftEnabled, setEnumDraftEnabled] = useState(false);
  const [enumDraftOther, setEnumDraftOther] = useState("");
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Filters>({ search: "", dataType: "", entityType: "", source: "", status: "" });

  const openCreate = () => {
    setForm({ ...emptyForm });
    setErrors({});
    setCreateOpen(true);
  };

  const openView = (tag: TagItem) => {
    setSelectedTag(tag);
    setViewOpen(true);
  };

  const openEdit = (tag: TagItem) => {
    setSelectedTag(tag);
    const enumVals = tag.enumValues ?? [];
    setForm({
      name: tag.name,
      description: tag.description,
      category: tag.category,
      dataType: tag.dataType,
      entityType: tag.entityType,
      source: tag.source,
      enableEnum: enumVals.length > 0,
      enumValues: enumVals,
      otherLabel: tag.otherLabel ?? "",
    });
    setErrors({});
    setEditOpen(true);
  };

  const openConfigEnum = (tag: TagItem) => {
    setSelectedTag(tag);
    const enumVals = tag.enumValues ?? [];
    setEnumDraft(enumVals);
    setEnumDraftEnabled(enumVals.length > 0);
    setEnumDraftOther(tag.otherLabel ?? "");
    setEnumOpen(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.dataType) newErrors.dataType = true;
    if (!form.entityType) newErrors.entityType = true;
    if (!form.source) newErrors.source = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setCreateOpen(false);
  };

  const handleEditSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.dataType) newErrors.dataType = true;
    if (!form.entityType) newErrors.entityType = true;
    if (!form.source) newErrors.source = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setEditOpen(false);
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const tableProps = { filters, onView: openView, onEdit: openEdit, onConfigEnum: openConfigEnum };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理AI标签、原始标签与计算标签，构建完整特征体系</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> 新建标签</Button>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签名称或ID"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={filters.dataType} onValueChange={(v) => updateFilter("dataType", v)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="值类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {ALL_DATA_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.entityType} onValueChange={(v) => updateFilter("entityType", v)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="数据类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部实体</SelectItem>
                {ALL_ENTITY_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.source} onValueChange={(v) => updateFilter("source", v)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="来源" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                {allSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="enabled">已启用</SelectItem>
                <SelectItem value="disabled">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai" className="gap-1.5"><Brain className="w-3.5 h-3.5" /> AI标签</TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> 原始标签</TabsTrigger>
          <TabsTrigger value="calc" className="gap-1.5"><Calculator className="w-3.5 h-3.5" /> 计算标签</TabsTrigger>
        </TabsList>
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> AI模型标签
                <Badge variant="secondary" className="ml-2">{aiTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={aiTags} category="AI标签" {...tableProps} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> 原始采集标签
                <Badge variant="secondary" className="ml-2">{rawTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={rawTags} category="原始标签" {...tableProps} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> 计算标签
                <Badge variant="secondary" className="ml-2">{calcTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={calcTags} category="计算标签" {...tableProps} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 查看标签详情弹窗 */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>标签详情</DialogTitle>
            <DialogDescription>查看标签的基本信息</DialogDescription>
          </DialogHeader>
          {selectedTag && (
            <div className="py-2">
              <DetailRow label="标签ID">{selectedTag.id}</DetailRow>
              <DetailRow label="标签名称">{selectedTag.name}</DetailRow>
              <DetailRow label="标签类型">
                <Badge variant="secondary">{categoryLabels[selectedTag.category]}</Badge>
              </DetailRow>
              <DetailRow label="描述">{selectedTag.description || "—"}</DetailRow>
              <DetailRow label="值类型">
                <Badge variant="outline">{selectedTag.dataType}</Badge>
              </DetailRow>
              <DetailRow label="数据类型">
                <Badge variant="secondary">{selectedTag.entityType}</Badge>
              </DetailRow>
              {selectedTag.dataType === "字符串" && (
                <DetailRow label="枚举值">
                  {(selectedTag.enumValues?.length ?? 0) === 0 ? (
                    <span className="text-xs text-muted-foreground">未配置</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTag.enumValues!.map((v) => (
                        <Badge key={v.key} variant="secondary" className="text-xs">{v.key} · {v.label}</Badge>
                      ))}
                      {selectedTag.otherLabel && (
                        <Badge variant="outline" className="text-xs">其它：{selectedTag.otherLabel}</Badge>
                      )}
                    </div>
                  )}
                </DetailRow>
              )}
              <DetailRow label="来源">{selectedTag.source}</DetailRow>
              <DetailRow label="状态">
                <Badge variant={selectedTag.status ? "default" : "secondary"}>
                  {selectedTag.status ? "已启用" : "已停用"}
                </Badge>
              </DetailRow>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>关闭</Button>
            <Button onClick={() => { setViewOpen(false); if (selectedTag) openEdit(selectedTag); }}>编辑</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑标签弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>修改标签「{selectedTag?.name}」的信息（ID: {selectedTag?.id}）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>标签类型</Label>
              <Select value={form.category} disabled>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai">AI标签</SelectItem>
                  <SelectItem value="raw">原始标签</SelectItem>
                  <SelectItem value="calc">计算标签</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">标签类型创建后不可修改</p>
            </div>
            <div className="space-y-1.5">
              <Label>标签名称 <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: false }); }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">请输入标签名称</p>}
            </div>
            <div className="space-y-1.5">
              <Label>标签描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>值类型 <span className="text-destructive">*</span></Label>
                <Select
                  value={form.dataType}
                  onValueChange={(v) => {
                    const next = v as DataType;
                    setForm({ ...form, dataType: next, enumValues: next === "字符串" ? form.enumValues : [] });
                    setErrors({ ...errors, dataType: false });
                  }}
                >
                  <SelectTrigger className={errors.dataType ? "border-destructive" : ""}>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_DATA_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.dataType && <p className="text-xs text-destructive">请选择值类型</p>}
              </div>
              <div className="space-y-1.5">
                <Label>数据类型 <span className="text-destructive">*</span></Label>
                <Select
                  value={form.entityType}
                  onValueChange={(v) => { setForm({ ...form, entityType: v as EntityType }); setErrors({ ...errors, entityType: false }); }}
                >
                  <SelectTrigger className={errors.entityType ? "border-destructive" : ""}>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ENTITY_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.entityType && <p className="text-xs text-destructive">请选择数据类型</p>}
              </div>
              <div className="space-y-1.5">
                <Label>来源 <span className="text-destructive">*</span></Label>
                <Select value={form.source} onValueChange={(v) => { setForm({ ...form, source: v }); setErrors({ ...errors, source: false }); }}>
                  <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions[form.category]?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.source && <p className="text-xs text-destructive">请选择来源</p>}
              </div>
            </div>
            {form.category === "calc" && (
              <div className="space-y-1.5">
                <Label>计算公式</Label>
                <Textarea placeholder="例如：(评论+点赞+收藏+分享)×0.5 + 风险等级×0.5" rows={2} />
              </div>
            )}
            {form.category === "ai" && (
              <div className="space-y-1.5">
                <Label>模型版本</Label>
                <Input placeholder="例如：v2.1.0" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEditSave}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建标签弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
            <DialogDescription>填写标签基本信息，创建后可在对应分类中管理</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>标签类型 <span className="text-destructive">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, source: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai"><span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> AI标签</span></SelectItem>
                  <SelectItem value="raw"><span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> 原始标签</span></SelectItem>
                  <SelectItem value="calc"><span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" /> 计算标签</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>标签名称 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="例如：业务类型、风险等级"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: false }); }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">请输入标签名称</p>}
            </div>
            <div className="space-y-1.5">
              <Label>标签描述</Label>
              <Textarea
                placeholder="描述标签的含义和用途"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>值类型 <span className="text-destructive">*</span></Label>
                <Select
                  value={form.dataType}
                  onValueChange={(v) => {
                    const next = v as DataType;
                    setForm({ ...form, dataType: next, enumValues: next === "字符串" ? form.enumValues : [] });
                    setErrors({ ...errors, dataType: false });
                  }}
                >
                  <SelectTrigger className={errors.dataType ? "border-destructive" : ""}><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {ALL_DATA_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.dataType && <p className="text-xs text-destructive">请选择值类型</p>}
              </div>
              <div className="space-y-1.5">
                <Label>数据类型 <span className="text-destructive">*</span></Label>
                <Select
                  value={form.entityType}
                  onValueChange={(v) => { setForm({ ...form, entityType: v as EntityType }); setErrors({ ...errors, entityType: false }); }}
                >
                  <SelectTrigger className={errors.entityType ? "border-destructive" : ""}><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {ALL_ENTITY_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.entityType && <p className="text-xs text-destructive">请选择数据类型</p>}
              </div>
              <div className="space-y-1.5">
                <Label>来源 <span className="text-destructive">*</span></Label>
                <Select value={form.source} onValueChange={(v) => { setForm({ ...form, source: v }); setErrors({ ...errors, source: false }); }}>
                  <SelectTrigger className={errors.source ? "border-destructive" : ""}><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions[form.category]?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.source && <p className="text-xs text-destructive">请选择来源</p>}
              </div>
            </div>
            {form.dataType === "字符串" && (
              <div className="space-y-1.5">
                <Label>枚举值配置</Label>
                <EnumValuesEditor
                  enabled={form.enableEnum}
                  onEnabledChange={(b) => setForm({ ...form, enableEnum: b })}
                  values={form.enumValues}
                  onChange={(v) => setForm({ ...form, enumValues: v })}
                  otherLabel={form.otherLabel}
                  onOtherLabelChange={(v) => setForm({ ...form, otherLabel: v })}
                />
              </div>
            )}
            {form.category === "calc" && (
              <div className="space-y-1.5">
                <Label>计算公式</Label>
                <Textarea placeholder="例如：(评论+点赞+收藏+分享)×0.5 + 风险等级×0.5" rows={2} />
              </div>
            )}
            {form.category === "ai" && (
              <div className="space-y-1.5">
                <Label>模型版本</Label>
                <Input placeholder="例如：v2.1.0" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleSave}>创建标签</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 配置枚举值弹窗 */}
      <Dialog open={enumOpen} onOpenChange={setEnumOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>配置枚举值</DialogTitle>
            <DialogDescription>
              为标签「{selectedTag?.name}」配置可选的枚举取值，便于下游字段校验和筛选
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <EnumValuesEditor
              enabled={enumDraftEnabled}
              onEnabledChange={setEnumDraftEnabled}
              values={enumDraft}
              onChange={setEnumDraft}
              otherLabel={enumDraftOther}
              onOtherLabelChange={setEnumDraftOther}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnumOpen(false)}>取消</Button>
            <Button onClick={() => setEnumOpen(false)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
