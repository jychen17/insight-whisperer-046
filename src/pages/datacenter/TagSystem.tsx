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
import { Plus, Brain, FileText, Calculator, Tag, Search, Eye, Pencil } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  description: string;
  dataType: string;
  source: string;
  status: boolean;
}

const aiTags: TagItem[] = [
  { id: "AI01", name: "业务类型", description: "AI识别内容所属业务线（酒店/机票/度假等）", dataType: "枚举", source: "舆情模型", status: true },
  { id: "AI02", name: "情感类型", description: "NLP模型识别文本正面/负面/中性情感", dataType: "枚举", source: "情感模型", status: true },
  { id: "AI03", name: "内容主题", description: "AI聚类识别内容主题标签", dataType: "多值", source: "主题模型", status: true },
  { id: "AI04", name: "是否负面舆情", description: "综合判断是否构成负面舆情", dataType: "布尔", source: "舆情模型", status: true },
  { id: "AI05", name: "舆情问题类型", description: "识别投诉/曝光/维权等问题类型", dataType: "枚举", source: "舆情模型", status: true },
  { id: "AI06", name: "舆情判断依据", description: "AI输出的舆情判定关键依据文本", dataType: "文本", source: "舆情模型", status: true },
  { id: "AI07", name: "风险等级", description: "AI风控模型识别内容风险级别", dataType: "枚举", source: "风控模型", status: true },
  { id: "AI08", name: "风险判断依据", description: "风控模型输出的判断依据", dataType: "文本", source: "风控模型", status: true },
  { id: "AI09", name: "OTA品牌", description: "识别提及的OTA品牌名称", dataType: "枚举", source: "NER模型", status: true },
  { id: "AI10", name: "所属BG", description: "识别内容对应的业务BG", dataType: "枚举", source: "风控模型", status: false },
];

const rawTags: TagItem[] = [
  { id: "RAW01", name: "标题", description: "原始内容标题", dataType: "文本", source: "采集字段", status: true },
  { id: "RAW02", name: "正文内容", description: "原始正文/帖子内容", dataType: "长文本", source: "采集字段", status: true },
  { id: "RAW03", name: "发布人昵称", description: "内容发布者昵称", dataType: "文本", source: "采集字段", status: true },
  { id: "RAW04", name: "发布人粉丝数", description: "发布者粉丝/关注者数量", dataType: "数值", source: "采集字段", status: true },
  { id: "RAW05", name: "发布时间", description: "内容原始发布时间", dataType: "时间", source: "采集字段", status: true },
  { id: "RAW06", name: "点赞量", description: "内容获得的点赞数", dataType: "数值", source: "采集字段", status: true },
  { id: "RAW07", name: "评论量", description: "内容获得的评论数", dataType: "数值", source: "采集字段", status: true },
  { id: "RAW08", name: "收藏量", description: "内容获得的收藏/保存数", dataType: "数值", source: "采集字段", status: true },
  { id: "RAW09", name: "分享量", description: "内容被分享/转发次数", dataType: "数值", source: "采集字段", status: true },
  { id: "RAW10", name: "平台来源", description: "数据采集来源平台", dataType: "枚举", source: "采集字段", status: true },
];

const calcTags: TagItem[] = [
  { id: "CALC01", name: "发酵等级", description: "低(评论<10)、中(10-50)、快(>50)", dataType: "枚举", source: "评论量", status: true },
  { id: "CALC02", name: "风险分数", description: "(评论+点赞+收藏+分享+阅读)×0.5 + 风险等级×0.5", dataType: "数值", source: "加权计算", status: true },
  { id: "CALC03", name: "互动热度", description: "点赞+评论+收藏+分享的加权综合分", dataType: "数值", source: "加权计算", status: true },
  { id: "CALC04", name: "传播速度", description: "单位时间内互动增量", dataType: "数值", source: "时序计算", status: true },
  { id: "CALC05", name: "影响力指数", description: "发布人粉丝数×互动率的综合评分", dataType: "数值", source: "加权计算", status: false },
];

const typeIcons: Record<string, typeof Brain> = {
  "AI标签": Brain,
  "原始标签": FileText,
  "计算标签": Calculator,
};

interface Filters {
  search: string;
  dataType: string;
  source: string;
  status: string;
}

function TagTable({ tags, category, filters }: { tags: TagItem[]; category: string; filters: Filters }) {
  const Icon = typeIcons[category] || Tag;

  const filtered = useMemo(() => {
    return tags.filter((t) => {
      if (filters.search && !t.name.includes(filters.search) && !t.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.dataType && filters.dataType !== "all" && t.dataType !== filters.dataType) return false;
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
          <TableHead>数据类型</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无匹配的标签</TableCell>
          </TableRow>
        ) : (
          filtered.map((t) => (
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
              <TableCell className="text-sm text-muted-foreground">{t.source}</TableCell>
              <TableCell><Switch checked={t.status} /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="查看">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

const dataTypeOptions: Record<string, string[]> = {
  ai: ["枚举", "多值", "布尔", "文本"],
  raw: ["文本", "长文本", "数值", "时间", "枚举"],
  calc: ["枚举", "数值"],
};

const sourceOptions: Record<string, string[]> = {
  ai: ["舆情模型", "情感模型", "主题模型", "风控模型", "NER模型"],
  raw: ["采集字段"],
  calc: ["加权计算", "时序计算", "规则计算"],
};

const allDataTypes = ["枚举", "多值", "布尔", "文本", "长文本", "数值", "时间"];
const allSources = ["舆情模型", "情感模型", "主题模型", "风控模型", "NER模型", "采集字段", "加权计算", "时序计算", "规则计算", "评论量"];

const emptyForm = { name: "", description: "", category: "ai", dataType: "", source: "" };

export default function TagSystem() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Filters>({ search: "", dataType: "", source: "", status: "" });

  const openDialog = () => {
    setForm({ ...emptyForm });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.dataType) newErrors.dataType = true;
    if (!form.source) newErrors.source = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setDialogOpen(false);
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理AI标签、原始标签与计算标签，构建完整特征体系</p>
        </div>
        <Button className="gap-2" onClick={openDialog}><Plus className="w-4 h-4" /> 新建标签</Button>
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
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="数据类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {allDataTypes.map((dt) => (
                  <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.source} onValueChange={(v) => updateFilter("source", v)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                {allSources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
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
                <Brain className="w-4 h-4 text-primary" />
                AI模型标签
                <Badge variant="secondary" className="ml-2">{aiTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={aiTags} category="AI标签" filters={filters} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                原始采集标签
                <Badge variant="secondary" className="ml-2">{rawTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={rawTags} category="原始标签" filters={filters} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                计算标签
                <Badge variant="secondary" className="ml-2">{calcTags.length} 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent><TagTable tags={calcTags} category="计算标签" filters={filters} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新建标签弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
            <DialogDescription>填写标签基本信息，创建后可在对应分类中管理</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>标签类型 <span className="text-destructive">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, dataType: "", source: "" })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>数据类型 <span className="text-destructive">*</span></Label>
                <Select value={form.dataType} onValueChange={(v) => { setForm({ ...form, dataType: v }); setErrors({ ...errors, dataType: false }); }}>
                  <SelectTrigger className={errors.dataType ? "border-destructive" : ""}>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypeOptions[form.category]?.map((dt) => (
                      <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dataType && <p className="text-xs text-destructive">请选择数据类型</p>}
              </div>
              <div className="space-y-1.5">
                <Label>来源 <span className="text-destructive">*</span></Label>
                <Select value={form.source} onValueChange={(v) => { setForm({ ...form, source: v }); setErrors({ ...errors, source: false }); }}>
                  <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions[form.category]?.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.source && <p className="text-xs text-destructive">请选择来源</p>}
              </div>
            </div>

            {form.category === "calc" && (
              <div className="space-y-1.5">
                <Label>计算公式</Label>
                <Textarea placeholder="例如：(评论+点赞+收藏+分享)×0.5 + 风险等级×0.5" value="" rows={2} />
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>创建标签</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
