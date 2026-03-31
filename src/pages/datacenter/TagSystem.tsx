import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Brain, FileText, Calculator, Tag, Settings2, ChevronRight } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  description: string;
  dataType: string;
  source: string;
  status: boolean;
  coverage: number;
  taggedCount: number;
}

const aiTags: TagItem[] = [
  { id: "AI01", name: "业务类型", description: "AI识别内容所属业务线（酒店/机票/度假等）", dataType: "枚举", source: "舆情模型", status: true, coverage: 96.2, taggedCount: 245800 },
  { id: "AI02", name: "情感类型", description: "NLP模型识别文本正面/负面/中性情感", dataType: "枚举", source: "情感模型", status: true, coverage: 98.5, taggedCount: 312400 },
  { id: "AI03", name: "内容主题", description: "AI聚类识别内容主题标签", dataType: "多值", source: "主题模型", status: true, coverage: 88.3, taggedCount: 198500 },
  { id: "AI04", name: "是否负面舆情", description: "综合判断是否构成负面舆情", dataType: "布尔", source: "舆情模型", status: true, coverage: 97.8, taggedCount: 305200 },
  { id: "AI05", name: "舆情问题类型", description: "识别投诉/曝光/维权等问题类型", dataType: "枚举", source: "舆情模型", status: true, coverage: 91.4, taggedCount: 156800 },
  { id: "AI06", name: "舆情判断依据", description: "AI输出的舆情判定关键依据文本", dataType: "文本", source: "舆情模型", status: true, coverage: 89.6, taggedCount: 142300 },
  { id: "AI07", name: "风险等级", description: "AI风控模型识别内容风险级别", dataType: "枚举", source: "风控模型", status: true, coverage: 95.1, taggedCount: 287600 },
  { id: "AI08", name: "风险判断依据", description: "风控模型输出的判断依据", dataType: "文本", source: "风控模型", status: true, coverage: 93.2, taggedCount: 265400 },
  { id: "AI09", name: "OTA品牌", description: "识别提及的OTA品牌名称", dataType: "枚举", source: "NER模型", status: true, coverage: 94.6, taggedCount: 234500 },
  { id: "AI10", name: "所属BG", description: "识别内容对应的业务BG", dataType: "枚举", source: "风控模型", status: false, coverage: 72.3, taggedCount: 89200 },
];

const rawTags: TagItem[] = [
  { id: "RAW01", name: "标题", description: "原始内容标题", dataType: "文本", source: "采集字段", status: true, coverage: 99.9, taggedCount: 674350 },
  { id: "RAW02", name: "正文内容", description: "原始正文/帖子内容", dataType: "长文本", source: "采集字段", status: true, coverage: 99.8, taggedCount: 674350 },
  { id: "RAW03", name: "发布人昵称", description: "内容发布者昵称", dataType: "文本", source: "采集字段", status: true, coverage: 98.2, taggedCount: 662100 },
  { id: "RAW04", name: "发布人粉丝数", description: "发布者粉丝/关注者数量", dataType: "数值", source: "采集字段", status: true, coverage: 85.6, taggedCount: 577200 },
  { id: "RAW05", name: "发布时间", description: "内容原始发布时间", dataType: "时间", source: "采集字段", status: true, coverage: 99.9, taggedCount: 674350 },
  { id: "RAW06", name: "点赞量", description: "内容获得的点赞数", dataType: "数值", source: "采集字段", status: true, coverage: 96.4, taggedCount: 650200 },
  { id: "RAW07", name: "评论量", description: "内容获得的评论数", dataType: "数值", source: "采集字段", status: true, coverage: 95.8, taggedCount: 645800 },
  { id: "RAW08", name: "收藏量", description: "内容获得的收藏/保存数", dataType: "数值", source: "采集字段", status: true, coverage: 78.3, taggedCount: 528100 },
  { id: "RAW09", name: "分享量", description: "内容被分享/转发次数", dataType: "数值", source: "采集字段", status: true, coverage: 82.1, taggedCount: 553600 },
  { id: "RAW10", name: "平台来源", description: "数据采集来源平台", dataType: "枚举", source: "采集字段", status: true, coverage: 100, taggedCount: 674350 },
];

const calcTags: TagItem[] = [
  { id: "CALC01", name: "发酵等级", description: "低(评论<10)、中(10-50)、快(>50)", dataType: "枚举", source: "评论量", status: true, coverage: 95.8, taggedCount: 645800 },
  { id: "CALC02", name: "风险分数", description: "(评论+点赞+收藏+分享+阅读)×0.5 + 风险等级×0.5", dataType: "数值", source: "加权计算", status: true, coverage: 94.2, taggedCount: 635200 },
  { id: "CALC03", name: "互动热度", description: "点赞+评论+收藏+分享的加权综合分", dataType: "数值", source: "加权计算", status: true, coverage: 93.5, taggedCount: 630800 },
  { id: "CALC04", name: "传播速度", description: "单位时间内互动增量", dataType: "数值", source: "时序计算", status: true, coverage: 88.1, taggedCount: 594200 },
  { id: "CALC05", name: "影响力指数", description: "发布人粉丝数×互动率的综合评分", dataType: "数值", source: "加权计算", status: false, coverage: 76.4, taggedCount: 515200 },
];

const typeIcons: Record<string, typeof Brain> = {
  "AI标签": Brain,
  "原始标签": FileText,
  "计算标签": Calculator,
};

const stats = [
  { label: "AI标签", value: aiTags.length.toString(), desc: "模型自动识别" },
  { label: "原始标签", value: rawTags.length.toString(), desc: "采集原始字段" },
  { label: "计算标签", value: calcTags.length.toString(), desc: "加权/规则计算" },
  { label: "标注覆盖率", value: "94.2%" },
];

function TagTable({ tags, category }: { tags: TagItem[]; category: string }) {
  const Icon = typeIcons[category] || Tag;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标签名称</TableHead>
          <TableHead>数据类型</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>覆盖率</TableHead>
          <TableHead className="text-right">已标注数</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tags.map((t) => (
          <TableRow key={t.id}>
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
            <TableCell>
              <span className={t.coverage >= 95 ? "text-emerald-500" : t.coverage >= 85 ? "text-amber-500" : "text-destructive"}>
                {t.coverage}%
              </span>
            </TableCell>
            <TableCell className="text-right text-sm">{t.taggedCount.toLocaleString()}</TableCell>
            <TableCell><Switch checked={t.status} /></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TagSystem() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理AI标签、原始标签与计算标签，构建完整特征体系</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建标签</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              {s.desc && <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

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
            <CardContent><TagTable tags={aiTags} category="AI标签" /></CardContent>
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
            <CardContent><TagTable tags={rawTags} category="原始标签" /></CardContent>
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
            <CardContent><TagTable tags={calcTags} category="计算标签" /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
