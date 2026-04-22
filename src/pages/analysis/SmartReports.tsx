import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Sparkles, FileText, FolderOpen, ArrowRight,
  Clock, Calendar, BarChart3, Layout, Settings2,
  AlertTriangle, TrendingUp,
} from "lucide-react";

const hotTags = [
  "#近7天全局舆情简报",
  "#315专项报告",
  "#一级事件XX深度分析",
  "#竞品对比报告",
  "#本月NPS趋势分析",
  "#热点事件传播路径",
];

const recommendedTemplates = [
  { id: "TPL01", icon: FileText, title: "舆情日报模板", desc: "自动汇总每日舆情数据与风险预警", tags: ["日报", "舆情"] },
  { id: "TPL02", icon: BarChart3, title: "竞品对比模板", desc: "横向对比多品牌各维度表现", tags: ["周报", "行业"] },
  { id: "TPL03", icon: Clock, title: "热点追踪模板", desc: "追踪热点事件的传播路径与影响", tags: ["专项", "热点"] },
  { id: "TPL04", icon: Calendar, title: "体验洞察模板", desc: "用户反馈NPS分析与问题归因", tags: ["月报", "体验"] },
];

export default function SmartReports() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!query.trim()) return;
    console.log("Generate report for:", query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">智能报告</h1>
        <p className="text-sm text-muted-foreground mt-1">AI 智能分析助手，快速生成报告</p>
      </div>

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
                placeholder='请输入报告生成需求，如"生成同程旅行近3天舆情报告"'
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
                onClick={() => setQuery(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">常用报告模板</h2>
            <p className="text-xs text-muted-foreground mt-0.5">挑选模板快速生成，或前往模板管理调整</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => navigate("/analysis/report-templates")}
          >
            <Layout className="w-3.5 h-3.5" /> 前往模板管理
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {recommendedTemplates.map((t) => {
            const Icon = t.icon;
            return (
              <Card
                key={t.id}
                className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      {t.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2 min-h-[32px]">{t.desc}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs h-7"
                      onClick={() => setQuery(`使用「${t.title}」生成报告`)}
                    >
                      <Sparkles className="w-3 h-3" /> 快速使用
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs h-7 px-2"
                      onClick={() => navigate("/analysis/report-templates")}
                      title="去模板管理调整"
                    >
                      <Settings2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Entry to Report Management */}
      <Card
        className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
        onClick={() => navigate("/analysis/report-manage")}
      >
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">报告配置与管理</p>
            <p className="text-xs text-muted-foreground mt-0.5">查看、搜索、导出已生成的报告，或配置自动化生成规则</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
