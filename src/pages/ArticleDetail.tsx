import { useState, useMemo, useEffect } from "react";
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
  Image as ImageIcon, ScanText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SentimentItem, HandleRecord } from "@/pages/SentimentDetail";

const SENTIMENT_OPTIONS = [
  "负向情感-客户投诉", "负向情感-媒体曝光", "负向情感-用户吐槽",
  "中性", "正向情感-用户好评", "正向情感-媒体报道",
];
const ISSUE_TYPE_OPTIONS = [
  "票价吐槽", "机票退改", "金融服务", "酒店投诉", "客服态度", "退款问题", "其他",
];
const BUSINESS_OPTIONS = [
  "同程旅行-国际机票", "同程旅行-国内机票", "同程旅行-国内酒店",
  "同程旅行-旅游", "同程旅行-金服", "同程旅行-用车", "同程旅行-人资",
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
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">原始字段</Badge>
          <span className="text-[11px] text-muted-foreground">采集自原始平台</span>
        </div>
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: content (images + OCR + text) */}
        <div className="col-span-2 space-y-4">
          {/* 计算字段 */}
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">计算字段</Badge>
              <span className="text-[11px] text-muted-foreground">基于规则计算</span>
            </div>
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
              <div className="flex gap-2 ml-auto">
                <Badge variant="outline" className="text-[10px]">点赞 {item.likes}</Badge>
                <Badge variant="outline" className="text-[10px]">收藏 {item.collects}</Badge>
                <Badge variant="outline" className="text-[10px]">评论 {item.comments}</Badge>
                <Badge variant="outline" className="text-[10px]">分享 {item.shares}</Badge>
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
          <div className="bg-primary/5 rounded-md p-3 border border-primary/20">
            <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI 摘要
            </div>
            <div className="text-xs text-foreground leading-relaxed">{item.summary}</div>
          </div>

          <div className="bg-muted/30 rounded-md p-3 border border-border">
            <div className="text-xs font-medium text-foreground mb-1.5">AI 命中原因</div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              根据「{item.business}」业务范畴及内容关键词，命中{item.issueType}问题，情感判定为{item.sentiment}。
            </div>
          </div>

          {/* AI 标签字段 */}
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">AI 标签</Badge>
              <span className="text-[11px] text-muted-foreground">AI 推理输出</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">情感分类：</span>
              <Select value={item.sentiment} onValueChange={(v) => updateField("sentiment", v)}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {SENTIMENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">业务类型：</span>
              <Select value={item.business} onValueChange={(v) => updateField("business", v)}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {BUSINESS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">所属 OTA：</span>
              <Select value={item.business?.split("-")[0] || "同程旅行"} onValueChange={(v) => updateField("business", `${v}-${item.business?.split("-")[1] || "其他"}`)}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {["同程旅行", "携程", "美团", "飞猪", "去哪儿"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">舆情问题分类：</span>
              <Select value={item.issueType} onValueChange={(v) => updateField("issueType", v)}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {ISSUE_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">AI 噪音标签：</span>
              <Select value={aiNoiseLabel} onValueChange={setAiNoiseLabel}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {AI_NOISE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Two separated actions */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              「从舆情移出」基于 AI 舆情标签判断；「标记噪音」基于 AI 噪音标签判断，两者相互独立。
            </div>
            {!item.isNoise && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => updateField("sentiment", "中性")}
              >
                <ArrowLeft className="w-3 h-3 mr-1 rotate-45" /> 从舆情移出（调整AI舆情标签）
              </Button>
            )}
            {!item.isNoise && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setNoiseDialogOpen(true)}
              >
                <Ban className="w-3 h-3 mr-1" /> 标记噪音（基于AI噪音标签）
              </Button>
            )}
            {item.isNoise && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2 text-center">
                已标记为噪音：{NOISE_CATEGORIES.find(c => c.value === item.noiseCategory)?.label || "未分类"}
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
    </div>
  );
}
