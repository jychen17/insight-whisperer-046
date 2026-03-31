import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings2, AlertTriangle, Bell, TrendingUp, Calculator } from "lucide-react";

interface CalcFieldRule {
  id: string;
  name: string;
  theme: string;
  formula: string;
  description: string;
  status: boolean;
  appliedCount: number;
}

interface AlertRule {
  id: string;
  name: string;
  theme: string;
  condition: string;
  threshold: string;
  level: "warning" | "critical";
  status: boolean;
  triggerCount: number;
  notifyChannel: string;
}

const calcRules: CalcFieldRule[] = [
  { id: "CF01", name: "发酵等级计算", theme: "舆情主题", formula: "IF(评论量<10,'低', IF(评论量<=50,'中','快'))", description: "基于评论量划分发酵等级", status: true, appliedCount: 645800 },
  { id: "CF02", name: "风险分数计算", theme: "舆情主题", formula: "(评论+点赞+收藏+分享+阅读)×0.5 + 风险等级×0.5", description: "加权计算综合风险分数", status: true, appliedCount: 635200 },
  { id: "CF03", name: "SOV份额计算", theme: "行业咨询主题", formula: "品牌声量 / 行业总声量 × 100%", description: "品牌在行业中的声量占比", status: true, appliedCount: 128900 },
  { id: "CF04", name: "热度指数计算", theme: "热点洞察主题", formula: "LOG(互动量) × 时间衰减因子 × 话题权重", description: "综合热度评分", status: true, appliedCount: 23400 },
  { id: "CF05", name: "NPS评分计算", theme: "产品体验主题", formula: "(推荐者% - 贬损者%) × 100", description: "净推荐值计算", status: true, appliedCount: 67800 },
];

const alertRules: AlertRule[] = [
  { id: "AL01", name: "负面舆情突增预警", theme: "舆情主题", condition: "负面舆情数 > 阈值", threshold: "50条/小时", level: "warning", status: true, triggerCount: 23, notifyChannel: "企业微信+邮件" },
  { id: "AL02", name: "重大舆情立即预警", theme: "舆情主题", condition: "风险等级=重大 OR 发酵等级=快", threshold: "即时", level: "critical", status: true, triggerCount: 5, notifyChannel: "电话+企微+邮件" },
  { id: "AL03", name: "竞品异常声量预警", theme: "行业咨询主题", condition: "竞品声量突增 > 200%", threshold: "日环比200%", level: "warning", status: true, triggerCount: 12, notifyChannel: "企业微信" },
  { id: "AL04", name: "热点话题预警", theme: "热点洞察主题", condition: "热度指数 > 阈值", threshold: "热度>500", level: "warning", status: true, triggerCount: 45, notifyChannel: "企业微信+邮件" },
  { id: "AL05", name: "严重体验问题预警", theme: "产品体验主题", condition: "严重问题数 > 阈值", threshold: "10条/日", level: "critical", status: true, triggerCount: 8, notifyChannel: "电话+企微" },
  { id: "AL06", name: "数据质量异常预警", theme: "全局", condition: "采集完整率 < 95%", threshold: "95%", level: "warning", status: false, triggerCount: 3, notifyChannel: "企业微信" },
];

const levelColors: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ThemeRules() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">规则配置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置各主题的计算字段规则与预警规则</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建规则</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">计算规则</p><p className="text-2xl font-bold text-foreground mt-1">{calcRules.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">预警规则</p><p className="text-2xl font-bold text-primary mt-1">{alertRules.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今日预警</p><p className="text-2xl font-bold text-amber-500 mt-1">{alertRules.reduce((s, r) => s + r.triggerCount, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">活跃规则</p><p className="text-2xl font-bold text-emerald-500 mt-1">{calcRules.filter(r => r.status).length + alertRules.filter(r => r.status).length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="calc" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calc" className="gap-1.5"><Calculator className="w-3.5 h-3.5" /> 计算字段规则</TabsTrigger>
          <TabsTrigger value="alert" className="gap-1.5"><Bell className="w-3.5 h-3.5" /> 预警规则</TabsTrigger>
        </TabsList>

        <TabsContent value="calc">
          <Card>
            <CardHeader><CardTitle className="text-base">计算字段规则</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>所属主题</TableHead>
                    <TableHead>计算公式</TableHead>
                    <TableHead className="text-right">已应用数据</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calcRules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.theme}</Badge></TableCell>
                      <TableCell className="max-w-[240px]"><code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{r.formula}</code></TableCell>
                      <TableCell className="text-right text-sm">{r.appliedCount.toLocaleString()}</TableCell>
                      <TableCell><Switch checked={r.status} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alert">
          <Card>
            <CardHeader><CardTitle className="text-base">预警规则</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>所属主题</TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>触发条件</TableHead>
                    <TableHead>阈值</TableHead>
                    <TableHead>通知渠道</TableHead>
                    <TableHead className="text-right">触发次数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertRules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.theme}</Badge></TableCell>
                      <TableCell>
                        <Badge className={`text-xs border ${levelColors[r.level]}`}>
                          {r.level === "critical" ? "🔴 严重" : "🟡 警告"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{r.condition}</TableCell>
                      <TableCell className="text-sm">{r.threshold}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.notifyChannel}</TableCell>
                      <TableCell className="text-right font-medium">{r.triggerCount}</TableCell>
                      <TableCell><Switch checked={r.status} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
