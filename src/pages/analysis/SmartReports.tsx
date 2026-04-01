import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Download, Clock, Eye, Sparkles, Calendar, X, ArrowLeft, Settings2 } from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: string;
  theme: string;
  status: "completed" | "generating" | "scheduled";
  createdAt: string;
  pages: number;
  author: string;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
}

const reports: Report[] = [
  { id: "RPT001", title: "2026年Q1舆情态势分析报告", type: "季度报告", theme: "舆情主题", status: "completed", createdAt: "2026-03-28", pages: 24, author: "系统自动生成", sourceTemplateId: "RT01", sourceTemplateName: "舆情日报" },
  { id: "RPT002", title: "3月第4周行业竞品监测周报", type: "周报", theme: "行业咨询主题", status: "completed", createdAt: "2026-03-29", pages: 12, author: "系统自动生成", sourceTemplateId: "RT02", sourceTemplateName: "竞品周报" },
  { id: "RPT003", title: "热点事件专项分析", type: "专项报告", theme: "热点洞察主题", status: "generating", createdAt: "2026-03-30", pages: 0, author: "AI生成中", sourceTemplateId: "RT03", sourceTemplateName: "热点事件专报" },
  { id: "RPT004", title: "3月产品体验月度报告", type: "月报", theme: "产品体验主题", status: "completed", createdAt: "2026-03-25", pages: 18, author: "系统自动生成", sourceTemplateId: "RT04", sourceTemplateName: "产品体验月报" },
  { id: "RPT005", title: "品牌口碑年度总结", type: "年报", theme: "综合", status: "completed", createdAt: "2026-03-20", pages: 42, author: "李总监" },
  { id: "RPT006", title: "下周竞品动态预测", type: "预测报告", theme: "行业咨询主题", status: "scheduled", createdAt: "2026-03-31", pages: 0, author: "定时生成", sourceTemplateId: "RT02", sourceTemplateName: "竞品周报" },
  { id: "RPT007", title: "3月第3周行业竞品监测周报", type: "周报", theme: "行业咨询主题", status: "completed", createdAt: "2026-03-22", pages: 11, author: "系统自动生成", sourceTemplateId: "RT02", sourceTemplateName: "竞品周报" },
  { id: "RPT008", title: "3月第2周行业竞品监测周报", type: "周报", theme: "行业咨询主题", status: "completed", createdAt: "2026-03-15", pages: 10, author: "系统自动生成", sourceTemplateId: "RT02", sourceTemplateName: "竞品周报" },
  { id: "RPT009", title: "2026-03-31 舆情日报", type: "日报", theme: "舆情主题", status: "completed", createdAt: "2026-03-31", pages: 6, author: "系统自动生成", sourceTemplateId: "RT01", sourceTemplateName: "舆情日报" },
  { id: "RPT010", title: "2026-03-30 舆情日报", type: "日报", theme: "舆情主题", status: "completed", createdAt: "2026-03-30", pages: 5, author: "系统自动生成", sourceTemplateId: "RT01", sourceTemplateName: "舆情日报" },
];

const statusConfig: Record<Report["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  completed: { label: "已完成", variant: "default" },
  generating: { label: "生成中", variant: "secondary" },
  scheduled: { label: "已排期", variant: "outline" },
};

const templates = [
  { name: "舆情日报模板", desc: "自动汇总每日舆情数据与风险预警", icon: FileText },
  { name: "竞品对比模板", desc: "横向对比多品牌各维度表现", icon: Sparkles },
  { name: "热点追踪模板", desc: "追踪热点事件的传播路径与影响", icon: Clock },
  { name: "体验洞察模板", desc: "用户反馈NPS分析与问题归因", icon: Calendar },
];

export default function SmartReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const sourceFilter = searchParams.get("source");
  const sourceName = searchParams.get("name");

  const filteredReports = reports
    .filter(r => filter === "all" || r.status === filter)
    .filter(r => !sourceFilter || r.sourceTemplateId === sourceFilter);

  const clearSourceFilter = () => {
    searchParams.delete("source");
    searchParams.delete("name");
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">智能报告</h1>
          <p className="text-sm text-muted-foreground mt-1">AI驱动的智能报告生成，支持自动化与自定义模板</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/analysis/report-config")}>
            <Settings2 className="w-4 h-4" /> 报告配置
          </Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> 生成报告</Button>
        </div>
      </div>

      {/* Source filter banner */}
      {sourceFilter && sourceName && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSourceFilter}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              来源模板：<span className="text-primary">{decodeURIComponent(sourceName)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              当前展示由「{decodeURIComponent(sourceName)}」配置生成的 {filteredReports.length} 份报告
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={clearSourceFilter}>
            <X className="w-3 h-3" /> 清除筛选
          </Button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">报告总数</p><p className="text-2xl font-bold text-foreground mt-1">{filteredReports.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已完成</p><p className="text-2xl font-bold text-primary mt-1">{filteredReports.filter(r => r.status === "completed").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">生成中</p><p className="text-2xl font-bold text-foreground mt-1">{filteredReports.filter(r => r.status === "generating").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已排期</p><p className="text-2xl font-bold text-amber-500 mt-1">{filteredReports.filter(r => r.status === "scheduled").length}</p></CardContent></Card>
      </div>

      {/* Only show templates section when not filtering by source */}
      {!sourceFilter && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">报告模板</h2>
          <div className="grid grid-cols-4 gap-3">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.name} className="cursor-pointer hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">报告列表</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="generating">生成中</SelectItem>
                <SelectItem value="scheduled">已排期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无报告记录</p>
              </div>
            )}
            {filteredReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{r.type}</span>
                      <span>·</span>
                      <span>{r.theme}</span>
                      <span>·</span>
                      <span>{r.createdAt}</span>
                      {r.pages > 0 && <><span>·</span><span>{r.pages}页</span></>}
                      {r.sourceTemplateName && !sourceFilter && (
                        <>
                          <span>·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            来源: {r.sourceTemplateName}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusConfig[r.status].variant}>{statusConfig[r.status].label}</Badge>
                  {r.status === "completed" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
