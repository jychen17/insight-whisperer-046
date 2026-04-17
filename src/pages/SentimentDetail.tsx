import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, Ban, ChevronDown, ChevronUp, X, AlertTriangle, Trash2, Sparkles, Clock, Settings2, TrendingUp, TrendingDown, Eye, Flame, Search, Filter, ArrowUpDown, BarChart3, Zap, MessageCircle, ThumbsUp, Share2, Calendar, Globe, Bookmark, Bell, ExternalLink, FileText, CheckCircle2, XCircle, ArrowUpRight, ClipboardList, History, User, MessageSquarePlus, Download, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ThemeConfigDialog from "@/components/ThemeConfigDialog";
import { defaultThemes, type ThemeConfig } from "@/pages/ThemeSettings";

const filters = {
  brands: ["同程旅行", "携程", "美团", "飞猪", "去哪儿"],
  platforms: ["全部", "小红书", "新浪微博", "抖音", "百度", "黑猫投诉APP"],
  business: ["国内机票", "国内酒店", "旅游", "金服", "用车", "人资"],
};

const NOISE_CATEGORIES = [
  { value: "unrelated", label: "与企业无关" },
  { value: "rental_ad", label: "租房广告" },
  { value: "recruitment", label: "招聘信息" },
  { value: "spam", label: "垃圾营销" },
  { value: "duplicate", label: "重复内容" },
  { value: "other", label: "其他噪音" },
];

/* ── Processing types ── */
export type HandleAction = "silent" | "dispatch" | "escalate" | "close" | "reopen" | "add_remark";
export interface HandleRecord {
  id: string;
  action: HandleAction;
  operator: string;
  time: string;
  assignee?: string;
  complaintNo?: string;
  escalateTarget?: string;
  escalateRole?: string;
  remark?: string;
}

export type HandleStatus = "pending" | "silent" | "dispatched" | "escalated" | "closed";

const HANDLE_STATUS_MAP: Record<HandleStatus, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-amber-500/10 text-amber-600" },
  silent: { label: "已静默", color: "bg-muted text-muted-foreground" },
  dispatched: { label: "已分派客服", color: "bg-primary/10 text-primary" },
  escalated: { label: "已升级", color: "bg-destructive/10 text-destructive" },
  closed: { label: "已完结", color: "bg-emerald-500/10 text-emerald-600" },
};

const ESCALATE_ROLES = [
  { value: "cs_supervisor", label: "客服主管" },
  { value: "business", label: "业务负责人" },
  { value: "pr", label: "公关" },
];

const ESCALATE_PERSONS: Record<string, string[]> = {
  cs_supervisor: ["张经理", "李主管", "王组长"],
  business: ["赵总监", "刘经理", "陈总"],
  pr: ["孙总监", "周经理", "吴主管"],
};

const CS_AGENTS = ["客服A-小张", "客服B-小李", "客服C-小王", "客服D-小赵"];

export interface SentimentItem {
  id: number;
  title: string;
  platform: string;
  author: string;
  contentType: string;
  userType: string;
  fans: string;
  publishTime: string;
  collectTime: string;
  region: string;
  riskLevel: string;
  speed: string;
  business: string;
  sentiment: string;
  issueType: string;
  summary: string;
  comments: number;
  likes: number;
  collects: number;
  shares: number;
  isNoise?: boolean;
  noiseCategory?: string;
  mergedEventId?: string | null;
  handleStatus?: HandleStatus;
  handleRecords?: HandleRecord[];
}

interface MergedEvent {
  id: string;
  title: string;
  postIds: number[];
  createdAt: string;
  summary: string;
  clusterMethod?: string;
  importance?: "high" | "medium" | "low";
  trendDirection?: "up" | "down" | "stable";
  totalInteractions?: number;
  keyPlatforms?: string[];
  sentimentBreakdown?: { negative: number; neutral: number; positive: number };
  topBusiness?: string;
  fermentSpeed?: "high" | "medium" | "low";
  firstTime?: string;
  latestTime?: string;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  totalCollects?: number;
  handleStatus?: HandleStatus;
  handleRecords?: HandleRecord[];
}

const initialItems: SentimentItem[] = [
  {
    id: 1, title: "避雷❌长沙雅致酒店（IFS国金中心旗舰店）", platform: "小红书", author: "舒马曦",
    contentType: "视频", userType: "普通用户", fans: "10+粉丝", publishTime: "2026-03-29 16:32:49",
    collectTime: "2026-03-30 11:08:57", region: "湖南", riskLevel: "一般", speed: "低",
    business: "同程旅行-国内酒店", sentiment: "负向情感-客户投诉", issueType: "其他",
    summary: "用户投诉长沙雅致酒店装修噪音扰民且未提前告知，处理方案不合理（投诉风险，品牌声誉风险）",
    comments: 2, likes: 0, collects: 0, shares: 0, handleStatus: "pending", handleRecords: [],
  },
  {
    id: 2, title: "骂机票 ✈", platform: "小红书", author: "蔡尔朗朗朗",
    contentType: "图文", userType: "普通用户", fans: "10+粉丝", publishTime: "2026-03-29 21:33:04",
    collectTime: "2026-03-30 11:07:02", region: "江苏", riskLevel: "一般", speed: "高",
    business: "同程旅行-国内机票", sentiment: "负向情感-客户投诉", issueType: "机票退改",
    summary: "用户因不满多家OTA平台机票价格暴涨，威胁刺激抵制（投诉风险，品牌声誉风险）",
    comments: 53, likes: 0, collects: 0, shares: 0, handleStatus: "pending", handleRecords: [],
  },
  {
    id: 3, title: "同程金融借贷还款无门，债权转让金额乱，求帮忙协商", platform: "黑猫投诉APP", author: "润家曦",
    contentType: "图文", userType: "未知", fans: "未知", publishTime: "2026-03-29 22:39:03",
    collectTime: "2026-03-30 10:45:16", region: "-", riskLevel: "一般", speed: "低",
    business: "同程旅行-金服", sentiment: "负向情感-客户投诉", issueType: "金融服务",
    summary: "用户投诉同程金融借贷产品还款困难，债权转让金额混乱",
    comments: 0, likes: 0, collects: 0, shares: 0, handleStatus: "pending", handleRecords: [],
  },
  {
    id: 4, title: "同程旅行隐瞒机票全损规则，2232元仅退83元", platform: "黑猫投诉APP", author: "匿名",
    contentType: "图文", userType: "未知", fans: "未知", publishTime: "2026-03-29 21:34:41",
    collectTime: "2026-03-30 10:00:24", region: "-", riskLevel: "一般", speed: "低",
    business: "同程旅行-国内机票", sentiment: "负向情感-客户投诉", issueType: "机票退改",
    summary: "用户投诉同程旅行隐瞒机票退改全损规则，高额机票仅退83元",
    comments: 0, likes: 0, collects: 0, shares: 0, handleStatus: "pending", handleRecords: [],
  },
  {
    id: 5, title: "长沙租房 近IFS 精装修一室一厅 拎包入住", platform: "小红书", author: "长沙租房小助手",
    contentType: "图文", userType: "普通用户", fans: "500+粉丝", publishTime: "2026-03-29 15:10:00",
    collectTime: "2026-03-30 09:30:00", region: "湖南", riskLevel: "无", speed: "低",
    business: "同程旅行-国内酒店", sentiment: "中性", issueType: "其他",
    summary: "租房广告内容，与企业舆情无关",
    comments: 1, likes: 3, collects: 2, shares: 0,
    isNoise: true, noiseCategory: "rental_ad", handleStatus: "silent", handleRecords: [],
  },
  {
    id: 6, title: "招聘旅游顾问 底薪6000+提成", platform: "抖音", author: "HR小王",
    contentType: "视频", userType: "普通用户", fans: "200+粉丝", publishTime: "2026-03-29 10:00:00",
    collectTime: "2026-03-30 08:00:00", region: "上海", riskLevel: "无", speed: "低",
    business: "同程旅行-人资", sentiment: "中性", issueType: "其他",
    summary: "招聘广告内容，与企业舆情无关",
    comments: 0, likes: 5, collects: 1, shares: 0,
    isNoise: true, noiseCategory: "recruitment", handleStatus: "silent", handleRecords: [],
  },
];

export default function SentimentDetail() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<"sentiment" | "all">("sentiment");
  const [sentimentView, setSentimentView] = useState<"events" | "articles">("events");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [items, setItems] = useState<SentimentItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [mergedEvents, setMergedEvents] = useState<MergedEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showNoiseFilter, setShowNoiseFilter] = useState<"all" | "normal" | "noise">("normal");
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("");
  const [noiseDialogOpen, setNoiseDialogOpen] = useState(false);
  const [noiseCategory, setNoiseCategory] = useState("unrelated");
  const [noiseTargetIds, setNoiseTargetIds] = useState<number[]>([]);
  const [autoClusterOpen, setAutoClusterOpen] = useState(false);
  const [clusterMethod, setClusterMethod] = useState<"text_similarity" | "title_same" | "content_same">("text_similarity");
  const [clusterTimeWindow, setClusterTimeWindow] = useState(24);
  const [clusterSimilarity, setClusterSimilarity] = useState(0.7);
  const [isClustering, setIsClustering] = useState(false);
  const [clusterProgress, setClusterProgress] = useState(0);
  const [eventSortBy, setEventSortBy] = useState<string>("firstTime_desc");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [hasAutoClustered, setHasAutoClustered] = useState(false);

  // Event filter states
  const [eventFilterImportance, setEventFilterImportance] = useState<"all" | "high" | "medium" | "low">("all");
  const [eventFilterPlatform, setEventFilterPlatform] = useState("全部");
  const [eventFilterFirstDateStart, setEventFilterFirstDateStart] = useState("");
  const [eventFilterFirstDateEnd, setEventFilterFirstDateEnd] = useState("");
  const [eventFilterLatestDateStart, setEventFilterLatestDateStart] = useState("");
  const [eventFilterLatestDateEnd, setEventFilterLatestDateEnd] = useState("");

  // Handle processing states
  const [handleDialogOpen, setHandleDialogOpen] = useState(false);
  const [handleDialogType, setHandleDialogType] = useState<"event" | "article">("article");
  const [handleTargetId, setHandleTargetId] = useState<string | number | null>(null);
  const [handleAction, setHandleAction] = useState<HandleAction>("silent");
  const [handleAssignee, setHandleAssignee] = useState("");
  const [handleComplaintNo, setHandleComplaintNo] = useState("");
  const [handleEscalateRole, setHandleEscalateRole] = useState("cs_supervisor");
  const [handleEscalateTarget, setHandleEscalateTarget] = useState("");
  const [handleRemark, setHandleRemark] = useState("");
  const [handleStep, setHandleStep] = useState(1);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [batchHandleDialogOpen, setBatchHandleDialogOpen] = useState(false);
  const [batchHandleType, setBatchHandleType] = useState<"event" | "article">("article");
  // Remark dialog states
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkDialogType, setRemarkDialogType] = useState<"event" | "article">("article");
  const [remarkTargetId, setRemarkTargetId] = useState<string | number | null>(null);
  const [remarkOperator, setRemarkOperator] = useState("");
  const [remarkText, setRemarkText] = useState("");
  // Handle filter for events
  const [eventFilterHandleStatus, setEventFilterHandleStatus] = useState<"all" | HandleStatus>("all");

  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  const displayItems = useMemo(() => {
    const filtered = items.filter(item => {
      if (showNoiseFilter === "normal") return !item.isNoise;
      if (showNoiseFilter === "noise") return item.isNoise;
      return true;
    });
    const unmerged = filtered.filter(i => !i.mergedEventId);
    return { unmerged, filtered };
  }, [items, showNoiseFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleEventSelect = (id: string) => {
    setSelectedEventIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMerge = () => {
    if (selectedIds.length < 2) {
      toast({ title: "至少选择2条舆情进行合并", variant: "destructive" });
      return;
    }
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    setMergeTitle(selectedItems[0]?.issueType + " - 合并事件");
    setMergeDialogOpen(true);
  };

  const buildEventMeta = (posts: SentimentItem[], methodLabel?: string): Partial<MergedEvent> => {
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
    const totalShares = posts.reduce((s, p) => s + p.shares, 0);
    const totalCollects = posts.reduce((s, p) => s + p.collects, 0);
    const totalInteractions = totalComments + totalLikes + totalShares + totalCollects;
    const negative = posts.filter(p => p.sentiment.includes("负向")).length;
    const positive = posts.filter(p => p.sentiment.includes("正向")).length;
    const neutral = posts.length - negative - positive;
    const businessCounts: Record<string, number> = {};
    posts.forEach(p => { businessCounts[p.business] = (businessCounts[p.business] || 0) + 1; });
    const topBusiness = Object.entries(businessCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const highSpeedCount = posts.filter(p => p.speed === "高").length;
    const fermentSpeed: "high" | "medium" | "low" = highSpeedCount > posts.length * 0.5 ? "high" : highSpeedCount > 0 ? "medium" : "low";
    const times = posts.map(p => p.publishTime).sort();
    const importance: "high" | "medium" | "low" = totalInteractions > 50 ? "high" : totalInteractions > 10 ? "medium" : "low";

    return {
      importance,
      trendDirection: fermentSpeed === "high" ? "up" : fermentSpeed === "medium" ? "stable" : "down",
      totalInteractions, totalComments, totalLikes, totalShares, totalCollects,
      keyPlatforms: [...new Set(posts.map(p => p.platform))].slice(0, 3),
      sentimentBreakdown: { negative, neutral, positive },
      topBusiness, fermentSpeed,
      firstTime: times[0],
      latestTime: times[times.length - 1],
    };
  };

  const confirmMerge = () => {
    const eventId = `evt-${Date.now()}`;
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    const meta = buildEventMeta(selectedItems);
    const newEvent: MergedEvent = {
      id: eventId,
      title: mergeTitle || "未命名事件",
      postIds: selectedIds,
      createdAt: new Date().toLocaleString("zh-CN"),
      summary: `合并了 ${selectedIds.length} 条相关舆情，涉及平台: ${[...new Set(selectedItems.map(i => i.platform))].join("、")}`,
      handleStatus: "pending",
      handleRecords: [],
      ...meta,
    };
    setMergedEvents(prev => [...prev, newEvent]);
    setItems(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, mergedEventId: eventId } : i));
    setSelectedIds([]);
    setMergeDialogOpen(false);
    setMergeTitle("");
    toast({ title: "合并成功", description: `已将 ${selectedIds.length} 条舆情合并为事件` });
  };

  const handleUnmerge = (eventId: string) => {
    setItems(prev => prev.map(i => i.mergedEventId === eventId ? { ...i, mergedEventId: null } : i));
    setMergedEvents(prev => prev.filter(e => e.id !== eventId));
    toast({ title: "已拆分事件" });
  };

  const openNoiseDialog = (ids: number[]) => {
    setNoiseTargetIds(ids);
    setNoiseCategory("unrelated");
    setNoiseDialogOpen(true);
  };

  const confirmMarkNoise = () => {
    setItems(prev => prev.map(i =>
      noiseTargetIds.includes(i.id) ? { ...i, isNoise: true, noiseCategory: noiseCategory } : i
    ));
    setSelectedIds(prev => prev.filter(id => !noiseTargetIds.includes(id)));
    setNoiseDialogOpen(false);
    toast({ title: "已标记为噪音", description: `${noiseTargetIds.length} 条帖子已标记为噪音` });
  };

  const restoreFromNoise = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isNoise: false, noiseCategory: undefined } : i));
    toast({ title: "已恢复", description: "该帖子已从噪音中恢复" });
  };

  const getEventPosts = (eventId: string) => items.filter(i => i.mergedEventId === eventId);

  /* ── Processing handlers ── */
  const getTargetStatus = (): HandleStatus => {
    if (handleDialogType === "event") {
      return mergedEvents.find(e => e.id === handleTargetId)?.handleStatus || "pending";
    }
    return items.find(i => i.id === handleTargetId)?.handleStatus || "pending";
  };

  const openHandleDialog = (type: "event" | "article", targetId: string | number) => {
    setHandleDialogType(type);
    setHandleTargetId(targetId);
    setHandleAction("silent");
    setHandleAssignee("");
    setHandleComplaintNo("");
    setHandleEscalateRole("cs_supervisor");
    setHandleEscalateTarget("");
    setHandleRemark("");
    const status = type === "event"
      ? mergedEvents.find(e => e.id === targetId)?.handleStatus || "pending"
      : items.find(i => i.id === targetId)?.handleStatus || "pending";
    if (status === "closed" || status === "silent") setHandleStep(0);
    else if (status === "dispatched") setHandleStep(2);
    else if (status === "escalated") setHandleStep(4);
    else setHandleStep(1);
    setHandleDialogOpen(true);
  };

  const actionToStatus = (action: HandleAction): HandleStatus => {
    if (action === "silent") return "silent";
    if (action === "dispatch") return "dispatched";
    if (action === "escalate") return "escalated";
    if (action === "close") return "closed";
    if (action === "reopen") return "pending";
    return "pending";
  };

  const actionLabel = (action: HandleAction): string => {
    if (action === "silent") return "静默";
    if (action === "dispatch") return "分派客服";
    if (action === "escalate") return "升级处理";
    if (action === "close") return "完结";
    if (action === "reopen") return "重新打开";
    if (action === "add_remark") return "提交处理说明";
    return "";
  };

  const confirmWithAction = (action: HandleAction) => {
    if (action === "dispatch" && !handleAssignee) {
      toast({ title: "请选择客服", variant: "destructive" }); return;
    }
    if (action === "escalate" && !handleEscalateTarget) {
      toast({ title: "请指定处理人", variant: "destructive" }); return;
    }
    if (action === "add_remark" && !handleRemark.trim()) {
      toast({ title: "请输入处理说明", variant: "destructive" }); return;
    }
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action,
      operator: (action === "add_remark" && handleAssignee) ? handleAssignee : "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      assignee: action === "dispatch" ? handleAssignee : undefined,
      complaintNo: action === "dispatch" ? handleComplaintNo : undefined,
      escalateTarget: action === "escalate" ? handleEscalateTarget : undefined,
      escalateRole: action === "escalate" ? ESCALATE_ROLES.find(r => r.value === handleEscalateRole)?.label : undefined,
      remark: handleRemark || undefined,
    };
    const keepStatus = action === "add_remark";
    const newStatus = keepStatus ? undefined : actionToStatus(action);
    if (handleDialogType === "event") {
      setMergedEvents(prev => prev.map(e =>
        e.id === handleTargetId ? { ...e, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...(e.handleRecords || []), record] } : e
      ));
    } else {
      setItems(prev => prev.map(i =>
        i.id === handleTargetId ? { ...i, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...(i.handleRecords || []), record] } : i
      ));
    }
    setHandleDialogOpen(false);
    toast({ title: "处理成功", description: `已${actionLabel(action)}` });
  };

  const confirmBatchWithAction = (action: HandleAction) => {
    if (action === "dispatch" && !handleAssignee) {
      toast({ title: "请选择客服", variant: "destructive" }); return;
    }
    if (action === "escalate" && !handleEscalateTarget) {
      toast({ title: "请指定处理人", variant: "destructive" }); return;
    }
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action,
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      assignee: action === "dispatch" ? handleAssignee : undefined,
      complaintNo: action === "dispatch" ? handleComplaintNo : undefined,
      escalateTarget: action === "escalate" ? handleEscalateTarget : undefined,
      escalateRole: action === "escalate" ? ESCALATE_ROLES.find(r => r.value === handleEscalateRole)?.label : undefined,
      remark: handleRemark || undefined,
    };
    const keepStatus = action === "add_remark";
    const newStatus = keepStatus ? undefined : actionToStatus(action);
    if (batchHandleType === "event") {
      setMergedEvents(prev => prev.map(e =>
        selectedEventIds.includes(e.id) ? { ...e, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...(e.handleRecords || []), record] } : e
      ));
      setSelectedEventIds([]);
    } else {
      setItems(prev => prev.map(i =>
        selectedIds.includes(i.id) ? { ...i, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...(i.handleRecords || []), record] } : i
      ));
      setSelectedIds([]);
    }
    setBatchHandleDialogOpen(false);
    toast({ title: "批量处理成功" });
  };

  const openBatchHandle = (type: "event" | "article") => {
    setBatchHandleType(type);
    setHandleAction("silent");
    setHandleAssignee("");
    setHandleComplaintNo("");
    setHandleEscalateRole("cs_supervisor");
    setHandleEscalateTarget("");
    setHandleRemark("");
    setHandleStep(1);
    setBatchHandleDialogOpen(true);
  };

  const handleReopen = (type: "event" | "article", targetId: string | number) => {
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: "reopen",
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      remark: "重新打开处理",
    };
    if (type === "event") {
      setMergedEvents(prev => prev.map(e =>
        e.id === targetId ? { ...e, handleStatus: "pending" as HandleStatus, handleRecords: [...(e.handleRecords || []), record] } : e
      ));
    } else {
      setItems(prev => prev.map(i =>
        i.id === targetId ? { ...i, handleStatus: "pending" as HandleStatus, handleRecords: [...(i.handleRecords || []), record] } : i
      ));
    }
    toast({ title: "已重新打开" });
  };

  const handleClose = (type: "event" | "article", targetId: string | number) => {
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: "close",
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      remark: "标记完结",
    };
    if (type === "event") {
      setMergedEvents(prev => prev.map(e =>
        e.id === targetId ? { ...e, handleStatus: "closed" as HandleStatus, handleRecords: [...(e.handleRecords || []), record] } : e
      ));
    } else {
      setItems(prev => prev.map(i =>
        i.id === targetId ? { ...i, handleStatus: "closed" as HandleStatus, handleRecords: [...(i.handleRecords || []), record] } : i
      ));
    }
    toast({ title: "已完结" });
  };

  const openRemarkDialog = (type: "event" | "article", targetId: string | number) => {
    setRemarkDialogType(type);
    setRemarkTargetId(targetId);
    setRemarkOperator("");
    setRemarkText("");
    setRemarkDialogOpen(true);
  };

  const confirmAddRemark = () => {
    if (!remarkText.trim()) {
      toast({ title: "请输入备注内容", variant: "destructive" });
      return;
    }
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: "add_remark",
      operator: remarkOperator || "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      remark: remarkText,
    };
    if (remarkDialogType === "event") {
      setMergedEvents(prev => prev.map(e =>
        e.id === remarkTargetId ? { ...e, handleRecords: [...(e.handleRecords || []), record] } : e
      ));
    } else {
      setItems(prev => prev.map(i =>
        i.id === remarkTargetId ? { ...i, handleRecords: [...(i.handleRecords || []), record] } : i
      ));
    }
    setRemarkDialogOpen(false);
    toast({ title: "备注已添加" });
  };

  const runAutoCluster = () => {
    setIsClustering(true);
    setClusterProgress(0);
    const availableItems = items.filter(i => !i.isNoise && !i.mergedEventId);

    const interval = setInterval(() => {
      setClusterProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 15;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setClusterProgress(100);

      const groups: Record<string, number[]> = {};
      availableItems.forEach(item => {
        const key = item.issueType;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item.id);
      });

      const newEvents: MergedEvent[] = [];
      const updatedItems = [...items];
      const methodLabel = clusterMethod === "text_similarity" ? "文本相似度" : clusterMethod === "title_same" ? "标题相同" : "正文相同";

      Object.entries(groups).forEach(([key, ids]) => {
        if (ids.length < 2) return;
        const eventId = `auto-${Date.now()}-${key}`;
        const posts = updatedItems.filter(i => ids.includes(i.id));
        const meta = buildEventMeta(posts, methodLabel);
        newEvents.push({
          id: eventId,
          title: `${key} - 自动聚类事件`,
          postIds: ids,
          createdAt: new Date().toLocaleString("zh-CN"),
          summary: `通过${methodLabel}在${clusterTimeWindow}h内自动聚类，合并了 ${ids.length} 条舆情`,
          clusterMethod: methodLabel,
          handleStatus: "pending",
          handleRecords: [],
          ...meta,
        });
        ids.forEach(id => {
          const idx = updatedItems.findIndex(i => i.id === id);
          if (idx >= 0) updatedItems[idx] = { ...updatedItems[idx], mergedEventId: eventId };
        });
      });

      if (newEvents.length === 0) {
        toast({ title: "未发现可聚类的舆情", description: "当前条件下无相似内容" });
      } else {
        setItems(updatedItems);
        setMergedEvents(prev => [...prev, ...newEvents]);
        toast({ title: "自动聚类完成", description: `生成了 ${newEvents.length} 个事件` });
        setSentimentView("events");
      }

      setIsClustering(false);
      setAutoClusterOpen(false);
      setClusterProgress(0);
    }, 2000);
  };

  // Auto-cluster on first load
  useEffect(() => {
    if (!hasAutoClustered && mergedEvents.length === 0) {
      setHasAutoClustered(true);
      const availableItems = items.filter(i => !i.isNoise && !i.mergedEventId);
      const groups: Record<string, number[]> = {};
      availableItems.forEach(item => {
        const key = item.issueType;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item.id);
      });
      const newEvents: MergedEvent[] = [];
      const updatedItems = [...items];
      const methodLabel = clusterMethod === "text_similarity" ? "文本相似度" : clusterMethod === "title_same" ? "标题相同" : "正文相同";
      Object.entries(groups).forEach(([key, ids]) => {
        if (ids.length < 2) return;
        const eid = `auto-${Date.now()}-${key}`;
        const posts = updatedItems.filter(i => ids.includes(i.id));
        const meta = buildEventMeta(posts, methodLabel);
        newEvents.push({
          id: eid, title: `${key} - 自动聚类事件`, postIds: ids,
          createdAt: new Date().toLocaleString("zh-CN"),
          summary: `通过${methodLabel}在${clusterTimeWindow}h内自动聚类，合并了 ${ids.length} 条舆情`,
          handleStatus: "pending",
          handleRecords: [],
          ...meta,
        });
        ids.forEach(id => {
          const idx = updatedItems.findIndex(i => i.id === id);
          if (idx >= 0) updatedItems[idx] = { ...updatedItems[idx], mergedEventId: eid };
        });
      });
      if (newEvents.length > 0) {
        setItems(updatedItems);
        setMergedEvents(newEvents);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showArticles = mainTab === "all" || (mainTab === "sentiment" && sentimentView === "articles");
  const showEvents = mainTab === "sentiment" && sentimentView === "events";

  const filteredEvents = useMemo(() => {
    let evts = mergedEvents;
    if (eventSearchQuery) {
      evts = evts.filter(e => e.title.includes(eventSearchQuery) || e.summary.includes(eventSearchQuery));
    }
    if (eventFilterImportance !== "all") {
      evts = evts.filter(e => e.importance === eventFilterImportance);
    }
    if (eventFilterPlatform !== "全部") {
      evts = evts.filter(e => e.keyPlatforms?.includes(eventFilterPlatform));
    }
    if (eventFilterFirstDateStart) {
      evts = evts.filter(e => (e.firstTime || "") >= eventFilterFirstDateStart);
    }
    if (eventFilterFirstDateEnd) {
      evts = evts.filter(e => (e.firstTime || "") <= eventFilterFirstDateEnd + " 23:59:59");
    }
    if (eventFilterLatestDateStart) {
      evts = evts.filter(e => (e.latestTime || "") >= eventFilterLatestDateStart);
    }
    if (eventFilterLatestDateEnd) {
      evts = evts.filter(e => (e.latestTime || "") <= eventFilterLatestDateEnd + " 23:59:59");
    }
    if (eventFilterHandleStatus !== "all") {
      evts = evts.filter(e => (e.handleStatus || "pending") === eventFilterHandleStatus);
    }
    return [...evts].sort((a, b) => {
      switch (eventSortBy) {
        case "firstTime_desc": return (b.firstTime || "").localeCompare(a.firstTime || "");
        case "latestTime_desc": return (b.latestTime || "").localeCompare(a.latestTime || "");
        case "count_desc": return b.postIds.length - a.postIds.length;
        case "comments_desc": return (b.totalComments || 0) - (a.totalComments || 0);
        case "likes_desc": return (b.totalLikes || 0) - (a.totalLikes || 0);
        case "collects_desc": return (b.totalCollects || 0) - (a.totalCollects || 0);
        case "shares_desc": return (b.totalShares || 0) - (a.totalShares || 0);
        default: return 0;
      }
    });
  }, [mergedEvents, eventSearchQuery, eventFilterImportance, eventFilterPlatform, eventSortBy, eventFilterFirstDateStart, eventFilterFirstDateEnd, eventFilterLatestDateStart, eventFilterLatestDateEnd, eventFilterHandleStatus]);

  const importanceBadgeMap = {
    high: <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] gap-0.5"><Flame className="w-2.5 h-2.5" />重大</Badge>,
    medium: <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-0.5"><Eye className="w-2.5 h-2.5" />一般</Badge>,
    low: <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">低</Badge>,
  };

  const speedLabel = { high: "高", medium: "中", low: "低" };
  const speedColor = { high: "text-destructive", medium: "text-amber-600", low: "text-muted-foreground" };

  /* ── Handle processing dialog content (shared between single & batch) ── */
  const renderRecordDesc = (r: HandleRecord) => {
    if (r.action === "silent") return "静默处理";
    if (r.action === "dispatch") return `分派客服: ${r.assignee || "-"}${r.complaintNo ? `，投诉单号: ${r.complaintNo}` : ""}`;
    if (r.action === "escalate") return `升级到${r.escalateRole || ""}: ${r.escalateTarget}`;
    if (r.action === "close") return "标记完结";
    if (r.action === "reopen") return "重新打开";
    if (r.action === "add_remark") return "追加备注";
    return r.action;
  };

  const renderStepBar = (active: number) => (
    <div className="flex items-center gap-2 mb-4">
      <div className={`flex items-center gap-1.5 ${1 <= active ? "text-primary" : "text-muted-foreground"}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${1 <= active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
        <span className="text-xs font-medium">处置类型</span>
      </div>
      <div className={`h-px flex-1 ${2 <= active ? "bg-primary" : "bg-border"}`} />
      <div className={`flex items-center gap-1.5 ${2 <= active ? "text-primary" : "text-muted-foreground"}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${2 <= active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
        <span className="text-xs font-medium">客服处理</span>
      </div>
      <div className={`h-px flex-1 ${3 <= active ? "bg-primary" : "bg-border"}`} />
      <div className={`flex items-center gap-1.5 ${3 <= active ? "text-primary" : "text-muted-foreground"}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${3 <= active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
        <span className="text-xs font-medium">升级处理</span>
      </div>
    </div>
  );

  const renderHandleForm = (_isBatch = false) => {
    const currentStatus = _isBatch ? "pending" : getTargetStatus();

    if (handleStep === 0) {
      return (
        <div className="space-y-4 py-2">
          <div className="bg-muted/30 rounded-lg p-6 text-center space-y-2">
            <History className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-foreground">当前状态：<span className="font-semibold">{HANDLE_STATUS_MAP[currentStatus].label}</span></p>
            <p className="text-xs text-muted-foreground">重新打开后将恢复为「待处理」状态，可重新进入处置流程</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">备注（可选）</label>
            <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={2} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="说明重新打开的原因..." />
          </div>
        </div>
      );
    }

    if (handleStep === 1) {
      return (
        <div className="space-y-4 py-2">
          {renderStepBar(1)}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${handleAction === "silent" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50 hover:bg-muted/20"}`}
              onClick={() => setHandleAction("silent")}
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">无需处理</span>
              </div>
              <p className="text-xs text-muted-foreground">标记为静默，不做人工介入</p>
            </div>
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${handleAction === "dispatch" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50 hover:bg-muted/20"}`}
              onClick={() => setHandleAction("dispatch")}
            >
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">需要处理</span>
              </div>
              <p className="text-xs text-muted-foreground">分派客服跟进处理</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">备注（可选）</label>
            <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={2} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="可选填备注..." />
          </div>
        </div>
      );
    }

    if (handleStep === 2) {
      return (
        <div className="space-y-4 py-2">
          {renderStepBar(2)}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground">分派给 <span className="text-destructive">*</span></label>
              <select className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground" value={handleAssignee} onChange={e => setHandleAssignee(e.target.value)}>
                <option value="">请选择客服</option>
                {CS_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">投诉单号 <span className="text-muted-foreground font-normal">（可选）</span></label>
              <input className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground" value={handleComplaintNo} onChange={e => setHandleComplaintNo(e.target.value)} placeholder="如有投诉单号请输入" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">备注（可选）</label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={2} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="可选填备注..." />
            </div>
          </div>
        </div>
      );
    }

    if (handleStep === 3) {
      return (
        <div className="space-y-4 py-2">
          {renderStepBar(3)}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            客服无法处理，升级到上级指定负责人
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground">升级角色 <span className="text-destructive">*</span></label>
              <div className="flex gap-2 mt-1">
                {ESCALATE_ROLES.map(role => (
                  <label key={role.value} className={`flex-1 p-2.5 rounded-md border text-center text-xs cursor-pointer transition-colors ${handleEscalateRole === role.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-foreground hover:bg-muted/30"}`}>
                    <input type="radio" className="sr-only" checked={handleEscalateRole === role.value} onChange={() => { setHandleEscalateRole(role.value); setHandleEscalateTarget(""); }} />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">指定处理人 <span className="text-destructive">*</span></label>
              <select className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground" value={handleEscalateTarget} onChange={e => setHandleEscalateTarget(e.target.value)}>
                <option value="">请选择处理人</option>
                {(ESCALATE_PERSONS[handleEscalateRole] || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">备注（可选）</label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={2} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="说明升级原因..." />
            </div>
          </div>
        </div>
      );
    }

    if (handleStep === 4) {
      return (
        <div className="space-y-4 py-2">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary shrink-0" />
            <span>当前事件/文章已升级，请填写处理说明</span>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">操作人</label>
            <input className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground" value={handleAssignee} onChange={e => setHandleAssignee(e.target.value)} placeholder="请输入姓名或工号" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">处理说明 <span className="text-destructive">*</span></label>
            <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={4} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="请输入处理进展、反馈结果或补充说明..." />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderStatusBadge = (status: HandleStatus | undefined) => {
    const s = status || "pending";
    const info = HANDLE_STATUS_MAP[s];
    return <Badge className={`${info.color} border-0 text-[10px]`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">舆情列表</h1>
          <div className="flex rounded-md border border-border overflow-hidden">
            {([["sentiment", "舆情内容"], ["all", "全部内容"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMainTab(key)}
                className={`px-3 py-1 text-xs ${mainTab === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"} ${key !== "sentiment" ? "border-l border-border" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1"><Download className="w-3 h-3" />导出数据</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1" onClick={() => navigate("/sentiment/event-alert")}><Bell className="w-3 h-3" />预警设置</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground inline-flex items-center gap-1" onClick={() => navigate("/analysis/report-config")}><FileText className="w-3 h-3" />报告设置</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1" onClick={() => setThemeConfigOpen(true)}><Settings className="w-3 h-3" />主题配置</button>
        </div>
      </div>

      {/* Sub-view toggle under sentiment tab */}
      {mainTab === "sentiment" && (
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            <button
              onClick={() => setSentimentView("events")}
              className={`px-4 py-1.5 font-medium ${sentimentView === "events" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
            >
              事件合并
              {mergedEvents.length > 0 && <span className="ml-1">({mergedEvents.length})</span>}
            </button>
            <button
              onClick={() => setSentimentView("articles")}
              className={`px-4 py-1.5 border-l border-border font-medium ${sentimentView === "articles" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
            >
              原始文章
            </button>
          </div>
        </div>
      )}

      {/* ========== EVENTS VIEW ========== */}
      {showEvents && (
        <div className="space-y-4">
          {/* Event filters */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">事件等级</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={eventFilterImportance}
                  onChange={e => setEventFilterImportance(e.target.value as typeof eventFilterImportance)}
                >
                  <option value="all">全部</option>
                  <option value="high">重大</option>
                  <option value="medium">一般</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">覆盖平台</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={eventFilterPlatform}
                  onChange={e => setEventFilterPlatform(e.target.value)}
                >
                  {filters.platforms.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">处理状态</label>
                <select
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  value={eventFilterHandleStatus}
                  onChange={e => setEventFilterHandleStatus(e.target.value as typeof eventFilterHandleStatus)}
                >
                  <option value="all">全部</option>
                  <option value="pending">待处理</option>
                  <option value="silent">已静默</option>
                  <option value="dispatched">已分派客服</option>
                  <option value="escalated">已升级</option>
                  <option value="closed">已完结</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">首发日期</label>
                <div className="flex gap-1 mt-1">
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={eventFilterFirstDateStart} onChange={e => setEventFilterFirstDateStart(e.target.value)} />
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={eventFilterFirstDateEnd} onChange={e => setEventFilterFirstDateEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">最新发布日期</label>
                <div className="flex gap-1 mt-1">
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={eventFilterLatestDateStart} onChange={e => setEventFilterLatestDateStart(e.target.value)} />
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" value={eventFilterLatestDateEnd} onChange={e => setEventFilterLatestDateEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">搜索事件</label>
                <div className="relative mt-1">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="搜索事件标题..."
                    value={eventSearchQuery}
                    onChange={e => setEventSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedEventIds.length > 0 && selectedEventIds.length === filteredEvents.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedEventIds(filteredEvents.map(e => e.id));
                      else setSelectedEventIds([]);
                    }}
                  />
                  <span>全选</span>
                </label>
                {selectedEventIds.length > 0 && (
                  <>
                    <span className="text-primary font-medium">已选 {selectedEventIds.length} 个事件</span>
                    <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={() => openBatchHandle("event")}>
                      <ClipboardList className="w-3 h-3" /> 批量处置
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={eventSortBy}
                  onChange={e => setEventSortBy(e.target.value)}
                  className="px-2 py-1 text-xs border border-border rounded-md bg-card text-foreground"
                >
                  <option value="firstTime_desc">首发时间降序</option>
                  <option value="latestTime_desc">最新发布时间降序</option>
                  <option value="count_desc">文章数量降序</option>
                  <option value="comments_desc">总评论量降序</option>
                  <option value="likes_desc">总点赞量降序</option>
                  <option value="collects_desc">总收藏量降序</option>
                  <option value="shares_desc">总分享量降序</option>
                </select>
              </div>
            </div>
          </div>

          {/* Event Cards (no stat cards) */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-lg border border-border">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>{mergedEvents.length === 0 ? "暂无合并事件，正在自动聚类..." : "未找到匹配的事件"}</p>
              <p className="text-xs mt-1">{mergedEvents.length === 0 ? "系统将自动进行智能聚类" : "请调整筛选条件"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map(event => {
                const posts = getEventPosts(event.id);
                const isExpanded = expandedEventId === event.id;
                const importanceColors = {
                  high: "border-l-destructive border-l-4",
                  medium: "border-l-amber-500 border-l-4",
                  low: "",
                };

                return (
                  <div key={event.id} className={`bg-card rounded-lg border border-border overflow-hidden ${importanceColors[event.importance || "low"]}`}>
                    <div className="p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedEventId(isExpanded ? null : event.id)}>
                      {/* Row 1: Title & badges & handle status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedEventIds.includes(event.id)}
                              onChange={(e) => { e.stopPropagation(); toggleEventSelect(event.id); }}
                              onClick={e => e.stopPropagation()}
                            />
                            {importanceBadgeMap[event.importance || "low"]}
                            {renderStatusBadge(event.handleStatus)}
                            <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {event.sentimentBreakdown && (
                              <>
                                {event.sentimentBreakdown.negative > 0 && (
                                  <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">负向</Badge>
                                )}
                                {event.sentimentBreakdown.neutral > 0 && (
                                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">中性</Badge>
                                )}
                                {event.sentimentBreakdown.positive > 0 && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">正向</Badge>
                                )}
                              </>
                            )}
                            {event.topBusiness && (
                              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{event.topBusiness}</Badge>
                            )}
                            {event.fermentSpeed && (
                              <Badge variant="outline" className={`text-[10px] ${speedColor[event.fermentSpeed]}`}>
                                发酵速度: {speedLabel[event.fermentSpeed]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); openHandleDialog("event", event.id); }}>
                            <ClipboardList className="w-3 h-3" /> 处置
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); navigate(`/sentiment/event-detail?id=${event.id}`); }}>
                            <ExternalLink className="w-3 h-3" /> 详情
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-[11px] text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleUnmerge(event.id); }}>
                            拆分
                          </Button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Row 3: Key metrics */}
                      <div className="grid grid-cols-7 gap-3 mt-3 bg-muted/20 rounded-md p-2.5">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-foreground">{event.postIds.length}</div>
                          <div className="text-[10px] text-muted-foreground">文章总量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-0.5">
                            <ThumbsUp className="w-3 h-3" /> {event.totalLikes || 0}
                          </div>
                          <div className="text-[10px] text-muted-foreground">总点赞量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-0.5">
                            <Bookmark className="w-3 h-3" /> {event.totalCollects || 0}
                          </div>
                          <div className="text-[10px] text-muted-foreground">总收藏量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-0.5">
                            <MessageCircle className="w-3 h-3" /> {event.totalComments || 0}
                          </div>
                          <div className="text-[10px] text-muted-foreground">总评论量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-0.5">
                            <Share2 className="w-3 h-3" /> {event.totalShares || 0}
                          </div>
                          <div className="text-[10px] text-muted-foreground">总分享量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-foreground">{event.firstTime || "-"}</div>
                          <div className="text-[10px] text-muted-foreground">首发时间</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-foreground">{event.latestTime || "-"}</div>
                          <div className="text-[10px] text-muted-foreground">最新时间</div>
                        </div>
                      </div>

                      {/* Row 4: Platforms */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 覆盖平台:</span>
                        {(event.keyPlatforms || []).map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">{p}</Badge>
                        ))}
                        {event.trendDirection === "up" && <span className="flex items-center gap-0.5 text-destructive ml-auto"><TrendingUp className="w-3 h-3" />趋势上升</span>}
                        {event.trendDirection === "down" && <span className="flex items-center gap-0.5 text-emerald-600 ml-auto"><TrendingDown className="w-3 h-3" />趋势下降</span>}
                      </div>

                      {/* Processing records preview */}
                      {(event.handleRecords || []).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                            <History className="w-3 h-3" /> 最新处理记录
                          </div>
                          {(event.handleRecords || []).slice(-1).map(r => (
                            <div key={r.id} className="text-[11px] text-muted-foreground">
                              <span className="text-foreground">{r.operator}</span> 于 {r.time} {renderRecordDesc(r)}
                              {r.remark && <span className="ml-1">（{r.remark}）</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expanded: post list */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">标题</TableHead>
                              <TableHead className="text-xs">平台</TableHead>
                              <TableHead className="text-xs">发布者</TableHead>
                              <TableHead className="text-xs">发布时间</TableHead>
                              <TableHead className="text-xs">情感</TableHead>
                              <TableHead className="text-xs">处理状态</TableHead>
                              <TableHead className="text-xs">互动量</TableHead>
                              <TableHead className="text-xs">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {posts.map(post => (
                              <TableRow key={post.id}>
                                <TableCell className="text-xs font-medium max-w-[300px] truncate">{post.title}</TableCell>
                                <TableCell className="text-xs">{post.platform}</TableCell>
                                <TableCell className="text-xs">{post.author}</TableCell>
                                <TableCell className="text-xs">{post.publishTime}</TableCell>
                                <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{post.sentiment}</Badge></TableCell>
                                <TableCell>{renderStatusBadge(post.handleStatus)}</TableCell>
                                <TableCell className="text-xs">{post.comments + post.likes + post.shares}</TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => openHandleDialog("article", post.id)}>
                                    <ClipboardList className="w-3 h-3" /> 处置
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== ARTICLES VIEW ========== */}
      {showArticles && (
        <>
          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">OTA品牌</label>
                <select className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                  {filters.brands.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">标题</label>
                <input className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" placeholder="请输入标题关键词" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">正文</label>
                <input className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" placeholder="请输入正文关键词" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">发布平台</label>
                <select className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                  {filters.platforms.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">业务分类</label>
                <select className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                  {filters.business.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">发布时间</label>
                <div className="flex gap-1 mt-1">
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" defaultValue="2026-03-23" />
                  <input type="date" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" defaultValue="2026-03-29" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs border border-border rounded-md bg-card text-muted-foreground">重置</button>
              <button className="px-4 py-1.5 text-xs gradient-primary text-primary-foreground rounded-md font-medium">查询</button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <select className="px-2 py-1 border border-border rounded-md bg-card text-foreground">
                <option>收录时间降序</option>
                <option>发布时间降序</option>
              </select>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedIds.length > 0 && selectedIds.length === displayItems.unmerged.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(displayItems.unmerged.map(i => i.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
                全选
              </label>
              {selectedIds.length > 0 && (
                <>
                  <span className="text-primary font-medium">已选 {selectedIds.length} 条</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleMerge}>
                    <Layers className="w-3 h-3" /> 合并为事件
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => openNoiseDialog(selectedIds)}>
                    <Ban className="w-3 h-3" /> 标记为噪音
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openBatchHandle("article")}>
                    <ClipboardList className="w-3 h-3" /> 批量处置
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                {([["normal", "有效舆情"], ["noise", "噪音帖"], ["all", "全部"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setShowNoiseFilter(key)}
                    className={`px-3 py-1 ${showNoiseFilter === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"} ${key !== "normal" ? "border-l border-border" : ""}`}
                  >{label}{key === "noise" && <span className="ml-1">({items.filter(i => i.isNoise).length})</span>}</button>
                ))}
              </div>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button onClick={() => setViewMode("card")} className={`px-3 py-1 text-xs ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>卡片模式</button>
                <button onClick={() => setViewMode("list")} className={`px-3 py-1 text-xs border-l border-border ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>列表模式</button>
              </div>
            </div>
          </div>

          {/* Cards */}
          {(() => {
            if (displayItems.unmerged.length === 0 && showNoiseFilter === "noise" && items.filter(i => i.isNoise).length === 0) {
              return <div className="text-center py-12 text-muted-foreground text-sm">暂无噪音帖</div>;
            }
            if (displayItems.unmerged.length === 0) {
              return <div className="text-center py-12 text-muted-foreground text-sm">暂无数据</div>;
            }
            return (
              <div className="grid grid-cols-2 gap-4">
                {displayItems.unmerged.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-card rounded-lg border p-4 space-y-3 animate-fade-in hover:shadow-md transition-shadow ${
                      item.isNoise ? "border-muted opacity-60" : selectedIds.includes(item.id) ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground cursor-pointer hover:text-primary truncate">{item.title}</h3>
                          {renderStatusBadge(item.handleStatus)}
                          {item.isNoise && (
                            <Badge className="bg-muted text-muted-foreground border-0 text-[10px] shrink-0">
                              <Ban className="w-2.5 h-2.5 mr-0.5" />
                              {NOISE_CATEGORIES.find(c => c.value === item.noiseCategory)?.label || "噪音"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                          <span>{item.platform}</span>
                          <span>发布者: {item.author}</span>
                          <span>内容类型: {item.contentType}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.userType}</Badge>
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/80">{item.fans}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isNoise ? (
                          <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => restoreFromNoise(item.id)}>恢复</Button>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-0.5 px-1.5" onClick={() => openHandleDialog("article", item.id)}>
                              <ClipboardList className="w-3 h-3" /> 处置
                            </Button>
                            <button
                              className="text-muted-foreground hover:text-destructive"
                              title="标记为噪音"
                              onClick={() => openNoiseDialog([item.id])}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelect(item.id)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <div>发布时间: {item.publishTime} &nbsp; 收录时间: {item.collectTime} &nbsp; 收录地区: {item.region}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">初始等级: {item.riskLevel}</Badge>
                      <Badge variant="outline" className="text-[10px]">发酵速度: {item.speed}</Badge>
                      <Badge className="text-[10px] bg-primary/20 text-primary border-0">{item.business}</Badge>
                      <Badge className="text-[10px] bg-destructive/20 text-destructive border-0">{item.sentiment}</Badge>
                      <Badge variant="outline" className="text-[10px]">舆情问题分类: {item.issueType}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.summary}</div>
                    {!item.isNoise && (
                      <div className="text-destructive text-xs font-medium">AI摘要：{item.summary}</div>
                    )}
                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                      <span>评论量: {item.comments}</span>
                      <span>点赞量: {item.likes}</span>
                      <span>收藏量: {item.collects}</span>
                      <span>分享量: {item.shares}</span>
                    </div>
                    {/* Processing records */}
                    {(item.handleRecords || []).length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                          <History className="w-3 h-3" /> 处理记录
                        </div>
                        {(item.handleRecords || []).map(r => (
                          <div key={r.id} className="text-[11px] text-muted-foreground">
                            <span className="text-foreground">{r.operator}</span> 于 {r.time} {renderRecordDesc(r)}
                            {r.remark && <span className="ml-1">（{r.remark}）</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>合并为事件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground">事件名称</label>
              <input
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                value={mergeTitle}
                onChange={e => setMergeTitle(e.target.value)}
                placeholder="请输入合并后的事件名称"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">将合并以下 {selectedIds.length} 条舆情：</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {items.filter(i => selectedIds.includes(i.id)).map(item => (
                  <div key={item.id} className="text-xs p-2 bg-muted/30 rounded flex items-center justify-between">
                    <span className="truncate flex-1">{item.title}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{item.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>取消</Button>
            <Button onClick={confirmMerge}>确认合并</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Noise Mark Dialog */}
      <Dialog open={noiseDialogOpen} onOpenChange={setNoiseDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> 标记为噪音
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              将 {noiseTargetIds.length} 条帖子标记为噪音后，它们将从有效舆情列表中移除（可在"噪音帖"标签中查看和恢复）。
            </p>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">噪音分类</label>
              <div className="grid grid-cols-2 gap-2">
                {NOISE_CATEGORIES.map(cat => (
                  <label
                    key={cat.value}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      noiseCategory === cat.value ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <input type="radio" name="noiseCategory" value={cat.value} checked={noiseCategory === cat.value} onChange={() => setNoiseCategory(cat.value)} className="sr-only" />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoiseDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmMarkNoise}>确认标记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handle Processing Dialog (single) */}
      <Dialog open={handleDialogOpen} onOpenChange={setHandleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              {handleStep === 0 ? "重新打开" : handleStep === 4 ? "处理说明" : handleDialogType === "event" ? "事件处置" : "文章处置"}
            </DialogTitle>
          </DialogHeader>
          {renderHandleForm()}
          <DialogFooter>
            {handleStep === 0 && (
              <>
                <Button variant="outline" onClick={() => setHandleDialogOpen(false)}>取消</Button>
                <Button onClick={() => confirmWithAction("reopen")}>确认重新打开</Button>
              </>
            )}
            {handleStep === 1 && (
              <>
                <Button variant="outline" onClick={() => setHandleDialogOpen(false)}>取消</Button>
                {handleAction === "dispatch" ? (
                  <Button onClick={() => setHandleStep(2)}>下一步 →</Button>
                ) : (
                  <Button onClick={() => confirmWithAction("silent")}>确认静默</Button>
                )}
              </>
            )}
            {handleStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setHandleStep(1)}>← 上一步</Button>
                <Button variant="outline" className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={() => setHandleStep(3)}>
                  <ArrowUpRight className="w-3 h-3" /> 处理不了，升级
                </Button>
                <Button variant="outline" onClick={() => confirmWithAction("close")}>完结</Button>
                <Button onClick={() => confirmWithAction("dispatch")}>确认分派客服</Button>
              </>
            )}
            {handleStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setHandleStep(2)}>← 上一步</Button>
                <Button onClick={() => confirmWithAction("escalate")}>确认升级</Button>
              </>
            )}
            {handleStep === 4 && (
              <>
                <Button variant="outline" onClick={() => setHandleDialogOpen(false)}>取消</Button>
                <Button variant="outline" onClick={() => confirmWithAction("close")}>完结</Button>
                <Button onClick={() => confirmWithAction("add_remark")}>提交处理说明</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Handle Dialog */}
      <Dialog open={batchHandleDialogOpen} onOpenChange={setBatchHandleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> 批量处置（{batchHandleType === "event" ? `${selectedEventIds.length} 个事件` : `${selectedIds.length} 条文章`}）
            </DialogTitle>
          </DialogHeader>
          {renderHandleForm(true)}
          <DialogFooter>
            {handleStep === 1 && (
              <>
                <Button variant="outline" onClick={() => setBatchHandleDialogOpen(false)}>取消</Button>
                {handleAction === "dispatch" ? (
                  <Button onClick={() => setHandleStep(2)}>下一步 →</Button>
                ) : (
                  <Button onClick={() => confirmBatchWithAction("silent")}>确认静默</Button>
                )}
              </>
            )}
            {handleStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setHandleStep(1)}>← 上一步</Button>
                <Button variant="outline" className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={() => setHandleStep(3)}>
                  <ArrowUpRight className="w-3 h-3" /> 处理不了，升级
                </Button>
                <Button onClick={() => confirmBatchWithAction("dispatch")}>确认分派客服</Button>
              </>
            )}
            {handleStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setHandleStep(2)}>← 上一步</Button>
                <Button onClick={() => confirmBatchWithAction("escalate")}>确认升级</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Cluster Dialog */}
      <Dialog open={autoClusterOpen} onOpenChange={v => { if (!isClustering) setAutoClusterOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> 聚类设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">聚类方式</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "text_similarity" as const, label: "文本相似度", desc: "基于语义相似度聚类" },
                  { value: "title_same" as const, label: "标题相同", desc: "标题完全匹配归并" },
                  { value: "content_same" as const, label: "正文相同", desc: "正文内容完全匹配" },
                ]).map(opt => (
                  <label
                    key={opt.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      clusterMethod === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input type="radio" className="sr-only" checked={clusterMethod === opt.value} onChange={() => setClusterMethod(opt.value)} />
                    <div className="text-xs font-medium text-foreground">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 时间窗口
              </label>
              <div className="flex flex-wrap gap-2">
                {[6, 12, 24, 48, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => setClusterTimeWindow(h)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      clusterTimeWindow === h ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-foreground hover:bg-muted/30"
                    }`}
                  >{h}小时</button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={1} max={720} value={clusterTimeWindow}
                    onChange={e => setClusterTimeWindow(Number(e.target.value) || 24)}
                    className="w-16 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
              </div>
            </div>
            {clusterMethod === "text_similarity" && (
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  相似度阈值: <span className="text-primary">{(clusterSimilarity * 100).toFixed(0)}%</span>
                </label>
                <input type="range" min={0.3} max={1} step={0.05} value={clusterSimilarity}
                  onChange={e => setClusterSimilarity(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>宽松 (30%)</span>
                  <span>严格 (100%)</span>
                </div>
              </div>
            )}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <div>待处理舆情: <span className="text-foreground font-medium">{items.filter(i => !i.isNoise && !i.mergedEventId).length}</span> 条</div>
              <div>聚类方式: <span className="text-foreground">{clusterMethod === "text_similarity" ? "文本相似度" : clusterMethod === "title_same" ? "标题相同" : "正文相同"}</span></div>
              <div>时间窗口: <span className="text-foreground">{clusterTimeWindow} 小时内</span></div>
            </div>
            {isClustering && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">正在聚类分析...</span>
                  <span className="text-primary font-medium">{clusterProgress}%</span>
                </div>
                <Progress value={clusterProgress} className="h-1.5" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoClusterOpen(false)} disabled={isClustering}>取消</Button>
            <Button onClick={() => { runAutoCluster(); }} disabled={isClustering}>
              {isClustering ? "聚类中..." : "保存并重新聚类"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ThemeConfigDialog
        open={themeConfigOpen}
        onOpenChange={setThemeConfigOpen}
        theme={defaultThemes.find(t => t.id === "sentiment") ?? null}
        onSave={() => setThemeConfigOpen(false)}
      />

    </div>
  );
}
