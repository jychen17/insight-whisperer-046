import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Sparkles, FileText, Settings2,
  AlertTriangle, TrendingUp, FolderOpen, ArrowRight,
} from "lucide-react";

const hotTags = [
  "#近7天全局舆情简报",
  "#315专项报告",
  "#一级事件XX深度分析",
  "#竞品对比报告",
  "#本月NPS趋势分析",
  "#热点事件传播路径",
];

const quickEntries = [
  {
    icon: Settings2,
    title: "报告配置",
    desc: "配置自动化报告模板、生成频率与分发规则",
    path: "/analysis/report-config",
  },
  {
    icon: FolderOpen,
    title: "报告管理",
    desc: "查看、搜索、导出所有已生成的报告",
    path: "/analysis/report-manage",
  },
];

export default function AnalysisHome() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!query.trim()) return;
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
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder='请输入舆情分析需求，如"生成同程旅行近3天舆情报告"'
                className="h-12 text-sm pl-4 pr-4 rounded-lg border-border"
              />
            </div>
            <Button className="h-12 px-6 gap-2 text-sm font-medium" onClick={handleGenerate}>
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

      {/* Quick Entry Cards */}
      <div className="grid grid-cols-2 gap-4">
        {quickEntries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Card
              key={entry.title}
              className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
              onClick={() => navigate(entry.path)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{entry.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          );
        })}
      </div>

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
