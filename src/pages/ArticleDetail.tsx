import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft, FileText, History, Sparkles, Clock, Ban, ClipboardList,
  Image as ImageIcon, ScanText, ChevronLeft, ChevronRight, Search, X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SentimentItem, HandleRecord } from "@/pages/SentimentDetail";

const SENTIMENT_BASE_OPTIONS = ["负向情感", "中性", "正向情感"];
const CONTENT_TOPIC_OPTIONS = [
  "客户投诉", "媒体曝光", "用户吐槽", "用户好评", "媒体报道", "其他",
];
const ISSUE_TYPE_OPTIONS = [
  "票价吐槽", "机票退改", "金融服务", "酒店投诉", "客服态度", "退款问题", "其他",
];
const OTA_OPTIONS = ["同程旅行", "携程", "美团", "飞猪", "去哪儿"];
const BUSINESS_TYPE_OPTIONS = [
  "国际机票", "国内机票", "国内酒店", "旅游", "金服", "用车", "人资",
];
const RISK_LEVEL_OPTIONS = ["无", "低", "一般", "高", "紧急"];
const SPEED_OPTIONS = ["低", "中", "高"];

const NOISE_CATEGORIES = [
  { value: "unrelated", label: "与企业无关" },
  { value: "rental_ad", label: "租房广告" },
  { value: "recruitment", label: "招聘信息" },
  { value: "spam", label: "垃圾营销" },
  { value: "duplicate", label: "重复内容" },
  { value: "other", label: "其他噪音" },
];

const AI_NOISE_OPTIONS = [
  { value: "not_noise", label: "非噪音" },
  { value: "low_quality", label: "低质内容" },
  { value: "off_topic", label: "话题无关" },
  { value: "ad", label: "广告营销" },
  { value: "duplicate", label: "重复内容" },
];

const NEGATIVE_OPTIONS = [
  { value: "yes", label: "是负面舆情" },
  { value: "no", label: "非负面舆情" },
];

// Mock images for demo
const MOCK_IMAGES = [
  "https://picsum.photos/seed/order1/600/400",
  "https://picsum.photos/seed/order2/600/400",
  "https://picsum.photos/seed/order3/600/400",
  "https://picsum.photos/seed/order4/600/400",
];

const MOCK_OCR_TEXT = `订单号：T20240315001
航班：MU5101 上海虹桥 → 北京首都
日期：2024-03-15 08:30
舱位：经济舱
票价：¥1,280
已支付，状态：出票成功`;

const renderRecordDesc = (r: HandleRecord) => {
  const map: Record<string, string> = {
    silent: "执行了静默处理",
    dispatch: `分派客服${r.assignee ? `（${r.assignee}）` : ""}${r.complaintNo ? `，工单号 ${r.complaintNo}` : ""}`,
    escalate: `升级至${r.escalateRole || ""}${r.escalateTarget ? `（${r.escalateTarget}）` : ""}`,
    close: "完结处理",
    reopen: "重新打开",
    add_remark: "补充备注",
  };
  return map[r.action] || "执行了操作";
};

// 高亮命中关键词
const highlightText = (text: string, query: string): React.ReactNode => {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="bg-yellow-300/60 text-foreground rounded-sm px-0.5">{part}</mark>
      : <span key={i}>{part}</span>
  );
};

export default function ArticleDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const navState = (location.state as { item?: SentimentItem; from?: "sentiment" | "event"; eventId?: string; eventTitle?: string } | null) || null;
  const passedItem = navState?.item || null;
  const fromSource = navState?.from || "sentiment";
  const eventId = navState?.eventId;
  const eventTitle = navState?.eventTitle;
  const [item, setItem] = useState<SentimentItem | null>(passedItem);

  // AI noise label state (independent from "manual mark as noise")
  const [aiNoiseLabel, setAiNoiseLabel] = useState<string>(passedItem?.isNoise ? "low_quality" : "not_noise");
  // Editable AI fields — committed values
  const [aiSummary, setAiSummary] = useState<string>(passedItem?.summary || "");
  const [aiJudgement, setAiJudgement] = useState<string>(
    passedItem ? `根据「${passedItem.business}」业务范畴及内容关键词，命中${passedItem.issueType}问题，情感判定为${passedItem.sentiment}。` : ""
  );
  const [isNegativeLabel, setIsNegativeLabel] = useState<string>(
    passedItem?.sentiment?.includes("负向") ? "yes" : "no"
  );
  // Editable AI fields — draft values (in textarea while editing)
  const [draftSummary, setDraftSummary] = useState<string>(aiSummary);
  const [draftJudgement, setDraftJudgement] = useState<string>(aiJudgement);

  // AI field edit history
  interface AiEditRecord { id: string; field: string; from: string; to: string; operator: string; time: string; }
  const [aiEditHistory, setAiEditHistory] = useState<AiEditRecord[]>([]);

  // Pending change confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ field: string; from: string; to: string; apply: () => void } | null>(null);

  const requestAiChange = (field: string, from: string, to: string, apply: () => void) => {
    if (from === to) {
      toast({ title: "未做修改" });
      return;
    }
    setPendingChange({ field, from, to, apply });
    setConfirmOpen(true);
  };

  const confirmAiChange = () => {
    if (!pendingChange) return;
    pendingChange.apply();
    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    setAiEditHistory(prev => [
      { id: `${Date.now()}`, field: pendingChange.field, from: pendingChange.from, to: pendingChange.to, operator: "当前用户", time: now },
      ...prev,
    ]);
    setConfirmOpen(false);
    setPendingChange(null);
    toast({ title: "已确认修改" });
  };

  // Image preview
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [ocrOpen, setOcrOpen] = useState(false);

  // Noise dialog (manual mark)
  const [noiseDialogOpen, setNoiseDialogOpen] = useState(false);
  const [noiseCategory, setNoiseCategory] = useState("unrelated");

  useEffect(() => {
    if (!item) {
      // No state — just go back
      toast({ title: "未找到文章数据", description: "请从舆情列表进入", variant: "destructive" });
    }
  }, [item]);

  // Wrap AI tag (Select) updates with confirmation
  const updateAiSelect = <K extends keyof SentimentItem>(field: K, label: string, newValue: SentimentItem[K]) => {
    const currentValue = item?.[field] as unknown as string;
    requestAiChange(label, String(currentValue ?? ""), String(newValue ?? ""), () => {
      setItem(prev => prev ? { ...prev, [field]: newValue } : prev);
    });
  };

  const updateField = <K extends keyof SentimentItem>(field: K, value: SentimentItem[K]) => {
    setItem(prev => prev ? { ...prev, [field]: value } : prev);
    toast({ title: "已更新", description: `字段已手动调整` });
  };

  const confirmMarkNoise = () => {
    if (!item) return;
    setItem(prev => prev ? { ...prev, isNoise: true, noiseCategory } : prev);
    setNoiseDialogOpen(false);
    toast({ title: "已从舆情移出", description: `已标记为「${NOISE_CATEGORIES.find(c => c.value === noiseCategory)?.label}」` });
  };

  if (!item) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
        <div className="text-sm text-muted-foreground">未找到该文章数据，请从舆情列表中点击进入。</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Breadcrumb + back */}
      <div className="flex items-center justify-between gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/")} className="cursor-pointer">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/sentiment/overview")} className="cursor-pointer">舆情主题</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/sentiment/overview")} className="cursor-pointer">舆情列表</BreadcrumbLink>
            </BreadcrumbItem>
            {fromSource === "event" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => eventId ? navigate(`/sentiment/event/${eventId}`) : navigate(-1)}
                    className="cursor-pointer max-w-[220px] truncate inline-block align-bottom"
                    title={eventTitle}
                  >
                    {eventTitle ? `事件详情：${eventTitle}` : "事件详情"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>文章详情</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> 返回上一页
        </Button>
      </div>

      {/* Title */}
      <div className="flex items-start gap-3 pb-3 border-b">
        <FileText className="w-5 h-5 text-primary mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground">{item.title}</h1>
        </div>
      </div>

      {/* 原始字段 */}
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground text-[10px]">发布平台</div>
            <div className="text-foreground">{item.platform}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">发布者</div>
            <div className="text-foreground flex items-center gap-1.5 flex-wrap">
              {item.author}
              <Badge variant="outline" className="text-[10px] px-1 py-0">{item.userType}</Badge>
              <Badge className="text-[10px] px-1 py-0 bg-primary/80">{item.fans}</Badge>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">发布时间</div>
            <div className="text-foreground">{item.publishTime}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">文章标签</div>
            <div className="text-foreground flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1 py-0">内容类型: {item.contentType}</Badge>
              <Badge variant="outline" className="text-[10px] px-1 py-0">收录: {item.collectTime}</Badge>
              <Badge variant="outline" className="text-[10px] px-1 py-0">地区: {item.region}</Badge>
            </div>
          </div>
          <div className="col-span-2 md:col-span-4">
            <div className="text-muted-foreground text-[10px] mb-1">互动数据</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">点赞 {item.likes}</Badge>
              <Badge variant="outline" className="text-[10px]">收藏 {item.collects}</Badge>
              <Badge variant="outline" className="text-[10px]">评论 {item.comments}</Badge>
              <Badge variant="outline" className="text-[10px]">分享 {item.shares}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: content (images + OCR + text) */}
        <div className="col-span-2 space-y-4">
          {/* 计算字段 */}
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground shrink-0">初始等级：</span>
                <Select value={item.riskLevel} onValueChange={(v) => updateField("riskLevel", v)}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {RISK_LEVEL_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground shrink-0">发酵速度：</span>
                <Select value={item.speed} onValueChange={(v) => updateField("speed", v)}>
                  <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {SPEED_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                <ImageIcon className="w-3.5 h-3.5" /> 图片（{MOCK_IMAGES.length}）
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setOcrOpen(true)}>
                <ScanText className="w-3 h-3" /> 图片转文字
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOCK_IMAGES.map((src, idx) => (
                <button
                  key={idx}
                  className="relative aspect-[4/3] rounded-md overflow-hidden border border-border hover:border-primary transition-colors group"
                  onClick={() => setPreviewIdx(idx)}
                >
                  <img src={src} alt={`图片${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="text-xs font-medium text-foreground mb-1.5">文本：</div>
            <div className="text-sm text-foreground bg-muted/30 rounded-md p-4 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
              {item.summary}
              {"\n\n"}
              {/* Pad with mock long content for demonstration */}
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i}>
                  {`\n第 ${i + 1} 段补充：用户详细描述了相关问题的发生过程、与客服沟通的细节，并附上了订单截图作为证据，希望平台能尽快给出合理的解决方案。`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI panel */}
        <div className="col-span-1 space-y-4">
          <div className="bg-primary/5 rounded-md p-3 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="w-3.5 h-3.5" /> AI 摘要
              </div>
              <span className="text-[10px] text-muted-foreground">可手动调整</span>
            </div>
            <Textarea
              value={draftSummary}
              onChange={(e) => setDraftSummary(e.target.value)}
              className="text-xs min-h-[72px] bg-background"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px]"
                onClick={() => setDraftSummary(aiSummary)}
                disabled={draftSummary === aiSummary}
              >重置</Button>
              <Button
                size="sm"
                className="h-6 text-[11px]"
                onClick={() => requestAiChange("AI 摘要", aiSummary, draftSummary, () => setAiSummary(draftSummary))}
                disabled={draftSummary === aiSummary}
              >确定修改</Button>
            </div>
          </div>

          <div className="bg-primary/5 rounded-md p-3 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-primary">舆情判断依据</div>
              <span className="text-[10px] text-muted-foreground">可手动调整</span>
            </div>
            <Textarea
              value={draftJudgement}
              onChange={(e) => setDraftJudgement(e.target.value)}
              className="text-xs min-h-[72px] bg-background"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px]"
                onClick={() => setDraftJudgement(aiJudgement)}
                disabled={draftJudgement === aiJudgement}
              >重置</Button>
              <Button
                size="sm"
                className="h-6 text-[11px]"
                onClick={() => requestAiChange("舆情判断依据", aiJudgement, draftJudgement, () => setAiJudgement(draftJudgement))}
                disabled={draftJudgement === aiJudgement}
              >确定修改</Button>
            </div>
          </div>

          {/* AI 标签字段 */}
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground text-right">所有 AI 标签均可手动调整（修改需二次确认）</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">情感：</span>
              <Select
                value={(item.sentiment || "").split("-")[0] || "中性"}
                onValueChange={(v) => {
                  const fromSent = (item.sentiment || "").split("-")[0] || "";
                  const topic = (item.sentiment || "").split("-")[1];
                  const newSentiment = topic ? `${v}-${topic}` : v;
                  requestAiChange("情感", fromSent, v, () => setItem(prev => prev ? { ...prev, sentiment: newSentiment } : prev));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {SENTIMENT_BASE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">内容主题：</span>
              <Select
                value={(item.sentiment || "").split("-")[1] || "其他"}
                onValueChange={(v) => {
                  const fromTopic = (item.sentiment || "").split("-")[1] || "";
                  const sent = (item.sentiment || "").split("-")[0] || "中性";
                  const newSentiment = `${sent}-${v}`;
                  requestAiChange("内容主题", fromTopic, v, () => setItem(prev => prev ? { ...prev, sentiment: newSentiment } : prev));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {CONTENT_TOPIC_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">是否负面舆情：</span>
              <Select
                value={isNegativeLabel}
                onValueChange={(v) => {
                  const fromLabel = NEGATIVE_OPTIONS.find(o => o.value === isNegativeLabel)?.label || isNegativeLabel;
                  const toLabel = NEGATIVE_OPTIONS.find(o => o.value === v)?.label || v;
                  requestAiChange("是否负面舆情", fromLabel, toLabel, () => setIsNegativeLabel(v));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {NEGATIVE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">所属 OTA：</span>
              <Select
                value={item.business?.split("-")[0] || "同程旅行"}
                onValueChange={(v) => {
                  const fromOta = item.business?.split("-")[0] || "";
                  const type = item.business?.split("-")[1] || "其他";
                  const newBusiness = `${v}-${type}`;
                  requestAiChange("所属 OTA", fromOta, v, () => setItem(prev => prev ? { ...prev, business: newBusiness } : prev));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {OTA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">业务类型：</span>
              <Select
                value={item.business?.split("-")[1] || "其他"}
                onValueChange={(v) => {
                  const fromType = item.business?.split("-")[1] || "";
                  const ota = item.business?.split("-")[0] || "同程旅行";
                  const newBusiness = `${ota}-${v}`;
                  requestAiChange("业务类型", fromType, v, () => setItem(prev => prev ? { ...prev, business: newBusiness } : prev));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {BUSINESS_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">舆情问题分类：</span>
              <Select value={item.issueType} onValueChange={(v) => updateAiSelect("issueType", "舆情问题分类", v)}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {ISSUE_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">AI 噪音标签：</span>
              <Select
                value={aiNoiseLabel}
                onValueChange={(v) => {
                  const fromLabel = AI_NOISE_OPTIONS.find(o => o.value === aiNoiseLabel)?.label || aiNoiseLabel;
                  const toLabel = AI_NOISE_OPTIONS.find(o => o.value === v)?.label || v;
                  requestAiChange("AI 噪音标签", fromLabel, toLabel, () => setAiNoiseLabel(v));
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {AI_NOISE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI 字段修改记录 */}
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground mb-2">
              <History className="w-3.5 h-3.5" /> AI 字段修改记录
              {aiEditHistory.length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-1">（共 {aiEditHistory.length} 条）</span>
              )}
            </div>
            {aiEditHistory.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-2 text-center">暂无修改记录</div>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {aiEditHistory.map(r => (
                  <div key={r.id} className="text-[11px] border-l-2 border-primary/40 pl-2 py-1 bg-background/60 rounded-r">
                    <div className="text-foreground">
                      <span className="font-medium">{r.operator}</span>
                      <span className="text-muted-foreground"> 于 {r.time} 修改了 </span>
                      <span className="text-primary font-medium">{r.field}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 break-words">
                      <span className="line-through opacity-70">{r.from || "（空）"}</span>
                      <span className="mx-1">→</span>
                      <span className="text-foreground">{r.to || "（空）"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Handling records — moved out of below text */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
            <History className="w-4 h-4" /> 处理记录
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <ClipboardList className="w-3 h-3" /> 处置该文章
          </Button>
        </div>
        {(item.handleRecords || []).length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center bg-muted/30 rounded-md">暂无处理记录</div>
        ) : (
          <div className="space-y-2">
            {(item.handleRecords || []).map(r => (
              <div key={r.id} className="flex gap-2 text-xs border-l-2 border-primary/40 pl-3 py-1.5 bg-muted/20 rounded-r">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  <span className="text-foreground font-medium">{r.operator}</span> 于 {r.time} {renderRecordDesc(r)}
                  {r.remark && <div className="mt-0.5">备注：{r.remark}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image preview dialog */}
      <Dialog open={previewIdx !== null} onOpenChange={(o) => !o && setPreviewIdx(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>图片预览（{previewIdx !== null ? previewIdx + 1 : 0} / {MOCK_IMAGES.length}）</DialogTitle>
          </DialogHeader>
          {previewIdx !== null && (
            <div className="relative">
              <img src={MOCK_IMAGES[previewIdx]} alt={`预览${previewIdx + 1}`} className="w-full max-h-[70vh] object-contain rounded" />
              <Button
                variant="outline" size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setPreviewIdx((previewIdx - 1 + MOCK_IMAGES.length) % MOCK_IMAGES.length)}
              ><ChevronLeft className="w-4 h-4" /></Button>
              <Button
                variant="outline" size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setPreviewIdx((previewIdx + 1) % MOCK_IMAGES.length)}
              ><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OCR dialog */}
      <Dialog open={ocrOpen} onOpenChange={setOcrOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanText className="w-4 h-4 text-primary" /> 图片转文字（OCR 结果）
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">已识别 {MOCK_IMAGES.length} 张图片中的文字内容：</div>
          <div className="bg-muted/40 rounded-md p-3 text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto font-mono">
            {MOCK_OCR_TEXT}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOcrOpen(false)}>关闭</Button>
            <Button onClick={() => { navigator.clipboard?.writeText(MOCK_OCR_TEXT); toast({ title: "已复制" }); }}>复制全部</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as noise dialog */}
      <Dialog open={noiseDialogOpen} onOpenChange={setNoiseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-destructive" /> 标记为噪音
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">请选择噪音分类：</div>
            <RadioGroup value={noiseCategory} onValueChange={setNoiseCategory}>
              {NOISE_CATEGORIES.map(c => (
                <div key={c.value} className="flex items-center gap-2">
                  <RadioGroupItem value={c.value} id={`noise-${c.value}`} />
                  <Label htmlFor={`noise-${c.value}`} className="text-sm cursor-pointer">{c.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoiseDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmMarkNoise}>确认标记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 字段修改 二次确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) { setConfirmOpen(false); setPendingChange(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> 确认修改 AI 字段
            </DialogTitle>
          </DialogHeader>
          {pendingChange && (
            <div className="space-y-3 py-2 text-xs">
              <div className="text-muted-foreground">
                您正在手动修改 AI 标签字段「<span className="text-primary font-medium">{pendingChange.field}</span>」，确认后将记录本次修改。
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                <div>
                  <div className="text-[10px] text-muted-foreground">原值</div>
                  <div className="text-foreground line-through opacity-70 break-words">{pendingChange.from || "（空）"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">新值</div>
                  <div className="text-primary font-medium break-words">{pendingChange.to || "（空）"}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingChange(null); }}>取消</Button>
            <Button onClick={confirmAiChange}>确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
