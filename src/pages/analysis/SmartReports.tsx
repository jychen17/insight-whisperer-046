import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Sparkles, FileText, FolderOpen, ArrowRight,
  Clock, Calendar, BarChart3, Layout, Settings2,
  AlertTriangle, TrendingUp, Wand2, CheckCircle2, Loader2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

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

type GenStage = "idle" | "collecting" | "analyzing" | "rendering" | "done" | "failed";

const stageMeta: Record<Exclude<GenStage, "idle">, { label: string; progress: number }> = {
  collecting: { label: "采集数据中…", progress: 25 },
  analyzing: { label: "AI 分析中…", progress: 60 },
  rendering: { label: "渲染报告中…", progress: 90 },
  done: { label: "报告生成完成", progress: 100 },
  failed: { label: "生成失败，请重试", progress: 100 },
};

const dateRangeOptions = [
  { value: "1d", label: "近 1 天" },
  { value: "3d", label: "近 3 天" },
  { value: "7d", label: "近 7 天" },
  { value: "14d", label: "近 14 天" },
  { value: "30d", label: "近 30 天" },
  { value: "custom", label: "自定义范围" },
];

export default function SmartReports() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Quick-generate flow
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTemplate, setQuickTemplate] = useState<typeof recommendedTemplates[number] | null>(null);
  const [dateRange, setDateRange] = useState("7d");
  const [genStage, setGenStage] = useState<GenStage>("idle");

  const handleGenerate = () => {
    if (!query.trim()) return;
    toast.success("AI 正在分析需求并生成报告…");
  };

  const openQuickGen = (tpl: typeof recommendedTemplates[number]) => {
    setQuickTemplate(tpl);
    setDateRange("7d");
    setGenStage("idle");
    setQuickOpen(true);
  };

  // Simulated generation pipeline
  useEffect(() => {
    if (genStage === "idle" || genStage === "done" || genStage === "failed") return;
    const next: Record<string, GenStage> = {
      collecting: "analyzing",
      analyzing: "rendering",
      rendering: "done",
    };
    const t = setTimeout(() => setGenStage(next[genStage]), 1100);
    return () => clearTimeout(t);
  }, [genStage]);

  const startQuickGen = () => {
    setGenStage("collecting");
  };

  const closeQuick = () => {
    if (genStage === "collecting" || genStage === "analyzing" || genStage === "rendering") {
      toast.info("已在后台继续生成，可前往报告管理查看");
    }
    setQuickOpen(false);
    setGenStage("idle");
  };

  const goToReport = () => {
    setQuickOpen(false);
    navigate("/analysis/report-manage");
  };

  const dateRangeLabel = dateRangeOptions.find(o => o.value === dateRange)?.label ?? "";
  const isGenerating = genStage === "collecting" || genStage === "analyzing" || genStage === "rendering";

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
            <h2 className="text-base font-semibold text-foreground">从热门模板一键生成</h2>
            <p className="text-xs text-muted-foreground mt-0.5">挑选模板 → 选择数据时间范围 → AI 自动生成</p>
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
                onClick={() => openQuickGen(t)}
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
                      className="flex-1 gap-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); openQuickGen(t); }}
                    >
                      <Wand2 className="w-3 h-3" /> 一键生成
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); navigate("/analysis/report-templates"); }}
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

      {/* Quick generation guided dialog */}
      <Dialog open={quickOpen} onOpenChange={(o) => { if (!o) closeQuick(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              一键生成报告
            </DialogTitle>
            <DialogDescription>
              使用模板「{quickTemplate?.title}」快速生成报告
            </DialogDescription>
          </DialogHeader>

          {genStage === "idle" && quickTemplate && (
            <div className="space-y-4 mt-1">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <quickTemplate.icon className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">{quickTemplate.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{quickTemplate.desc}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">数据时间范围</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  AI 将基于「{dateRangeLabel}」内的数据生成报告
                </p>
              </div>
            </div>
          )}

          {genStage !== "idle" && quickTemplate && (
            <div className="space-y-4 mt-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                {genStage === "done" ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : genStage === "failed" ? (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{stageMeta[genStage].label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    模板：{quickTemplate.title} · 范围：{dateRangeLabel}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">生成进度</span>
                  <span className="font-medium text-foreground">{stageMeta[genStage].progress}%</span>
                </div>
                <Progress value={stageMeta[genStage].progress} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {(["collecting", "analyzing", "rendering"] as const).map((s, idx) => {
                  const order = ["collecting", "analyzing", "rendering"];
                  const currentIdx = order.indexOf(genStage as string);
                  const done = genStage === "done" || idx < currentIdx;
                  const active = idx === currentIdx && isGenerating;
                  return (
                    <div
                      key={s}
                      className={`p-2 rounded-md border text-center ${
                        done ? "border-primary/30 bg-primary/5 text-primary" :
                        active ? "border-primary bg-primary/10 text-primary font-medium" :
                        "border-border text-muted-foreground"
                      }`}
                    >
                      {idx + 1}. {stageMeta[s].label.replace("…", "")}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            {genStage === "idle" && (
              <>
                <Button variant="outline" onClick={closeQuick}>取消</Button>
                <Button onClick={startQuickGen} className="gap-1.5">
                  <Sparkles className="w-4 h-4" /> 开始生成
                </Button>
              </>
            )}
            {isGenerating && (
              <Button variant="outline" onClick={closeQuick}>后台继续</Button>
            )}
            {genStage === "done" && (
              <>
                <Button variant="outline" onClick={closeQuick}>关闭</Button>
                <Button onClick={goToReport} className="gap-1.5">
                  查看报告 <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
            {genStage === "failed" && (
              <>
                <Button variant="outline" onClick={closeQuick}>关闭</Button>
                <Button onClick={startQuickGen}>重新生成</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
