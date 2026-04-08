import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Sparkles, FileText, RefreshCw, Download, ArrowRight,
  AlertTriangle, TrendingUp, ChevronRight,
} from "lucide-react";

const hotTags = [
  "#近7天全局舆情简报",
  "#315专项报告",
  "#一级事件XX深度分析",
  "#竞品对比报告",
  "#本月NPS趋势分析",
  "#热点事件传播路径",
];

interface BriefItem {
  id: string;
  title: string;
  summary: string;
  time: string;
  level?: "一级" | "二级";
}

const aiBriefs: BriefItem[] = [
  {
    id: "B001",
    title: "全局舆情简报（2026-03-12）",
    summary: "舆情总量1200条 | 一级事件2起 | 二级事件5起",
    time: "2026-03-12 09:00",
  },
  {
    id: "B002",
    title: "XX产品投诉事件简报",
    summary: "投诉数158条 | 下降趋势 | 涉及退款、服务态度",
    time: "2026-03-11 18:30",
    level: "一级",
  },
  {
    id: "B003",
    title: "竞品动态周报（第11周）",
    summary: "携程新品发布 | 飞猪促销活动 | 去哪儿口碑回升",
    time: "2026-03-10 10:00",
  },
  {
    id: "B004",
    title: "清明假期出行舆情预测",
    summary: "预计声量上涨40% | 重点关注退改签话题",
    time: "2026-03-09 14:00",
    level: "二级",
  },
  {
    id: "B005",
    title: "品牌正面口碑专题分析",
    summary: "正面声量占比68% | 亲子游好评突出 | 小红书为主渠道",
    time: "2026-03-08 09:00",
  },
];

export default function AnalysisHome() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!query.trim()) return;
    // TODO: integrate with AI generation
    console.log("Generate report for:", query);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Analysis Input */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">AI 智能分析小助手</h2>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder='请输入舆情分析需求，如"生成同程旅行近3天舆情报告"'
                className="h-12 text-sm pl-4 pr-4 rounded-lg border-border"
              />
            </div>
            <Button
              className="h-12 px-6 gap-2 text-sm font-medium"
              onClick={handleGenerate}
            >
              <Sparkles className="w-4 h-4" />
              生成报告
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">热门需求：</span>
            {hotTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Briefing Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">AI 舆情简报</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-primary"
                onClick={() => navigate("/analysis/reports")}
              >
                更多 <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiBriefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {brief.level ? (
                  <Badge
                    variant={brief.level === "一级" ? "destructive" : "secondary"}
                    className="mt-0.5 shrink-0 text-[10px] px-1.5"
                  >
                    {brief.level}
                  </Badge>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{brief.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{brief.summary}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    生成时间：{brief.time}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">本周报告</span>
            </div>
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-[11px] text-muted-foreground mt-1">较上周 +3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">一级事件</span>
            </div>
            <p className="text-2xl font-bold text-destructive">2</p>
            <p className="text-[11px] text-muted-foreground mt-1">需要关注</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">舆情趋势</span>
            </div>
            <p className="text-2xl font-bold text-foreground">↑15%</p>
            <p className="text-[11px] text-muted-foreground mt-1">声量同比上升</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">AI分析次数</span>
            </div>
            <p className="text-2xl font-bold text-foreground">86</p>
            <p className="text-[11px] text-muted-foreground mt-1">本月累计</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
