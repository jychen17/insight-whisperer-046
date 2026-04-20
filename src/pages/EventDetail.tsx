import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft, Flame, Eye, Globe, ThumbsUp, MessageCircle, Share2, Bookmark,
  Clock, BarChart3, Bell, ClipboardList, XCircle, ArrowUpRight, History, User, ExternalLink, CheckCircle2, MessageSquarePlus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { HandleAction, HandleRecord, HandleStatus } from "./SentimentDetail";

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

interface PostItem {
  id: number;
  title: string;
  platform: string;
  author: string;
  publishTime: string;
  sentiment: string;
  comments: number;
  likes: number;
  shares: number;
  collects: number;
  handleStatus: HandleStatus;
  handleRecords: HandleRecord[];
}

const mockEvent = {
  id: "evt-1",
  title: "中央网信办约谈多家 OTA 平台整治抢票乱象",
  importance: "high" as const,
  topBusiness: "同程旅行-国内机票",
  fermentSpeed: "high" as const,
  sentimentBreakdown: { negative: 3, neutral: 1, positive: 0 },
  firstTime: "2026-03-29 16:32:49",
  latestTime: "2026-03-30 11:08:57",
  totalLikes: 8,
  totalComments: 55,
  totalShares: 0,
  totalCollects: 2,
  keyPlatforms: ["小红书", "黑猫投诉APP", "抖音"],
  summary: "多条舆情涉及OTA平台机票退改及价格问题，用户情绪较为激烈，已引发社交媒体广泛讨论。",
  handleStatus: "dispatched" as HandleStatus,
  handleRecords: [
    { id: "rec-1", action: "dispatch" as HandleAction, operator: "张三", time: "2026-03-30 09:15:00", assignee: "客服A-小张", complaintNo: "CMP-20260330-001", remark: "已分派客服跟进" },
    { id: "rec-2", action: "escalate" as HandleAction, operator: "客服A-小张", time: "2026-03-30 10:30:00", escalateTarget: "孙总监", escalateRole: "公关", remark: "事件影响面较大，升级处理" },
  ] as HandleRecord[],
  posts: [
    { id: 1, title: "骂机票 ✈", platform: "小红书", author: "蔡尔朗朗朗", publishTime: "2026-03-29 21:33:04", sentiment: "负向情感-客户投诉", comments: 53, likes: 0, shares: 0, collects: 0, handleStatus: "dispatched" as HandleStatus, handleRecords: [{ id: "r1", action: "dispatch" as HandleAction, operator: "张三", time: "2026-03-30 09:20:00", assignee: "客服B-小李", complaintNo: "CMP-20260330-002" }] },
    { id: 2, title: "同程旅行隐瞒机票全损规则，2232元仅退83元", platform: "黑猫投诉APP", author: "匿名", publishTime: "2026-03-29 21:34:41", sentiment: "负向情感-客户投诉", comments: 0, likes: 0, shares: 0, collects: 0, handleStatus: "pending" as HandleStatus, handleRecords: [] },
    { id: 3, title: "避雷❌长沙雅致酒店（IFS国金中心旗舰店）", platform: "小红书", author: "舒马曦", publishTime: "2026-03-29 16:32:49", sentiment: "负向情感-客户投诉", comments: 2, likes: 0, shares: 0, collects: 0, handleStatus: "silent" as HandleStatus, handleRecords: [{ id: "r2", action: "silent" as HandleAction, operator: "王五", time: "2026-03-30 08:00:00", remark: "非核心业务" }] },
  ] as PostItem[],
  timeline: [
    { time: "2026-03-29 16:32", desc: "首条舆情发布于小红书" },
    { time: "2026-03-29 21:33", desc: "第二条舆情发布，评论量迅速上升" },
    { time: "2026-03-29 21:34", desc: "黑猫投诉APP出现相关投诉" },
    { time: "2026-03-30 10:00", desc: "事件持续发酵，覆盖3个平台" },
  ],
};

export default function EventDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("id") || mockEvent.id;

  const [event, setEvent] = useState(mockEvent);
  const [handleDialogOpen, setHandleDialogOpen] = useState(false);
  const [handleTargetType, setHandleTargetType] = useState<"event" | "post">("event");
  const [handleTargetId, setHandleTargetId] = useState<number | null>(null);
  const [handleAction, setHandleAction] = useState<HandleAction>("silent");
  const [handleStep, setHandleStep] = useState(1);
  const [handleAssignee, setHandleAssignee] = useState("");
  const [handleComplaintNo, setHandleComplaintNo] = useState("");
  const [handleEscalateRole, setHandleEscalateRole] = useState("cs_supervisor");
  const [handleEscalateTarget, setHandleEscalateTarget] = useState("");
  const [handleRemark, setHandleRemark] = useState("");
  // Remark dialog
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkTargetType, setRemarkTargetType] = useState<"event" | "post">("event");
  const [remarkTargetId, setRemarkTargetId] = useState<number | null>(null);
  const [remarkOperator, setRemarkOperator] = useState("");
  const [remarkText, setRemarkText] = useState("");

  const importanceBadge = event.importance === "high"
    ? <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] justify-center py-1.5"><Flame className="w-3 h-3" />重大</Badge>
    : <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] justify-center py-1.5"><Eye className="w-3 h-3" />一般</Badge>;

  const speedLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };
  const speedColor: Record<string, string> = { high: "text-destructive", medium: "text-amber-600", low: "text-muted-foreground" };

  const renderStatusBadge = (status: HandleStatus) => {
    const info = HANDLE_STATUS_MAP[status];
    return <Badge className={`${info.color} border-0 text-[10px]`}>{info.label}</Badge>;
  };

  const getTargetStatus = (): HandleStatus => {
    if (handleTargetType === "event") return event.handleStatus;
    return event.posts.find(p => p.id === handleTargetId)?.handleStatus || "pending";
  };

  const openHandle = (type: "event" | "post", postId?: number) => {
    setHandleTargetType(type);
    setHandleTargetId(postId || null);
    setHandleAction("silent");
    setHandleAssignee("");
    setHandleComplaintNo("");
    setHandleEscalateRole("cs_supervisor");
    setHandleEscalateTarget("");
    setHandleRemark("");
    const status = type === "event" ? event.handleStatus : (event.posts.find(p => p.id === postId)?.handleStatus || "pending");
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
    if (handleTargetType === "event") {
      setEvent(prev => ({ ...prev, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...prev.handleRecords, record] }));
    } else {
      setEvent(prev => ({
        ...prev,
        posts: prev.posts.map(p =>
          p.id === handleTargetId ? { ...p, ...(newStatus ? { handleStatus: newStatus } : {}), handleRecords: [...p.handleRecords, record] } : p
        ),
      }));
    }
    setHandleDialogOpen(false);
    toast({ title: "处理成功" });
  };

  const handleCloseItem = (type: "event" | "post", postId?: number) => {
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: "close",
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      remark: "标记完结",
    };
    if (type === "event") {
      setEvent(prev => ({ ...prev, handleStatus: "closed" as HandleStatus, handleRecords: [...prev.handleRecords, record] }));
    } else {
      setEvent(prev => ({
        ...prev,
        posts: prev.posts.map(p =>
          p.id === postId ? { ...p, handleStatus: "closed" as HandleStatus, handleRecords: [...p.handleRecords, record] } : p
        ),
      }));
    }
    toast({ title: "已完结" });
  };

  const renderRecordDesc = (r: HandleRecord) => {
    if (r.action === "silent") return "静默处理";
    if (r.action === "dispatch") return `分派客服: ${r.assignee || "-"}${r.complaintNo ? `，投诉单号: ${r.complaintNo}` : ""}`;
    if (r.action === "escalate") return `升级到${r.escalateRole || ""}: ${r.escalateTarget}`;
    if (r.action === "close") return "标记完结";
    if (r.action === "reopen") return "重新打开";
    if (r.action === "add_remark") return "追加备注";
    return r.action;
  };

  const openRemarkDialog = (type: "event" | "post", postId?: number) => {
    setRemarkTargetType(type);
    setRemarkTargetId(postId || null);
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
    if (remarkTargetType === "event") {
      setEvent(prev => ({ ...prev, handleRecords: [...prev.handleRecords, record] }));
    } else {
      setEvent(prev => ({
        ...prev,
        posts: prev.posts.map(p =>
          p.id === remarkTargetId ? { ...p, handleRecords: [...p.handleRecords, record] } : p
        ),
      }));
    }
    setRemarkDialogOpen(false);
    toast({ title: "备注已添加" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">事件详情</h1>
          {importanceBadge}
          {renderStatusBadge(event.handleStatus)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openHandle("event")}>
            <ClipboardList className="w-3 h-3" /> 处置事件
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate(`/sentiment/event-alert?eventId=${eventId}`)}>
            <Bell className="w-3 h-3" /> 设置预警
          </Button>
          <Button variant="outline" size="sm" className="text-xs">导出事件报告</Button>
        </div>
      </div>

      {/* Event title & summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.summary}</p>
        </CardContent>
      </Card>

      {/* AI 标签字段 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {event.sentimentBreakdown.negative > 0 && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">负向 {event.sentimentBreakdown.negative}</Badge>}
            {event.sentimentBreakdown.neutral > 0 && <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">中性 {event.sentimentBreakdown.neutral}</Badge>}
            {event.sentimentBreakdown.positive > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">正向 {event.sentimentBreakdown.positive}</Badge>}
            <Badge className="bg-primary/20 text-primary border-0 text-[10px]">所属OTA: {event.topBusiness.split("-")[0]}</Badge>
            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">业务类型: {event.topBusiness.split("-")[1] || "-"}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-muted/30 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="w-4 h-4" /> 文章总量
              </div>
              <div className="text-lg font-semibold text-foreground">{event.posts.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 计算字段 */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-6 gap-3">
            {importanceBadge}
            <Badge variant="outline" className={`text-[10px] justify-center py-1.5 ${speedColor[event.fermentSpeed]}`}>发酵速度: {speedLabel[event.fermentSpeed]}</Badge>
            {[
              { label: "总点赞量", value: event.totalLikes, icon: ThumbsUp },
              { label: "总收藏量", value: event.totalCollects, icon: Bookmark },
              { label: "总评论量", value: event.totalComments, icon: MessageCircle },
              { label: "总分享量", value: event.totalShares, icon: Share2 },
            ].map(m => (
              <div key={m.label} className="bg-muted/30 rounded-md p-3 text-center">
                <m.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-base font-semibold text-foreground">{m.value}</div>
                <div className="text-[11px] text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 原始字段 */}
      <Card className="bg-muted/20">
        <CardContent className="pt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">首发时间</div>
            <div className="text-foreground text-sm">{event.firstTime}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">最新时间</div>
            <div className="text-foreground text-sm">{event.latestTime}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">覆盖平台（{event.keyPlatforms.length}）</div>
            <div className="flex gap-1.5 flex-wrap">
              {event.keyPlatforms.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> 事件时间线</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {event.timeline.map((t, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {idx < event.timeline.length - 1 && <div className="w-px h-8 bg-border" />}
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{t.time}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Processing Records */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> 事件处理记录</CardTitle></CardHeader>
        <CardContent>
          {event.handleRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无处理记录</p>
          ) : (
            <div className="space-y-3">
              {event.handleRecords.map((r, idx) => (
                <div key={r.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    {idx < event.handleRecords.length - 1 && <div className="w-px h-8 bg-border" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{r.operator}</span>
                      <span className="text-[11px] text-muted-foreground">{r.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      操作: <span className="text-foreground">{renderRecordDesc(r)}</span>
                      {r.remark && <span className="ml-2">备注: {r.remark}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">事件内文章列表 ({event.posts.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">标题</TableHead>
                <TableHead className="text-xs">平台</TableHead>
                <TableHead className="text-xs">发布者</TableHead>
                <TableHead className="text-xs">发布时间</TableHead>
                <TableHead className="text-xs">情感</TableHead>
                <TableHead className="text-xs">处理状态</TableHead>
                <TableHead className="text-xs">评论</TableHead>
                <TableHead className="text-xs">点赞</TableHead>
                <TableHead className="text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell className="text-xs font-medium max-w-[250px] truncate">
                    <button
                      className="text-left hover:text-primary truncate w-full"
                      onClick={() => navigate(`/sentiment/article/${post.id}`, {
                        state: {
                          item: {
                            id: post.id,
                            title: post.title,
                            platform: post.platform,
                            author: post.author,
                            contentType: "图文",
                            userType: "普通用户",
                            fans: "粉丝 1.2k",
                            publishTime: post.publishTime,
                            collectTime: post.publishTime,
                            region: "上海",
                            riskLevel: "一般",
                            speed: "中",
                            business: "同程旅行-国内机票",
                            sentiment: post.sentiment,
                            issueType: "客服态度",
                            summary: `事件「${event.title}」内文章：${post.title}。用户反馈相关问题，请查看完整内容了解详情。`,
                            comments: post.comments,
                            likes: post.likes,
                            collects: post.collects,
                            shares: post.shares,
                            handleStatus: post.handleStatus,
                            handleRecords: post.handleRecords,
                          },
                          from: "event",
                          eventId: event.id,
                          eventTitle: event.title,
                        },
                      })}
                    >{post.title}</button>
                  </TableCell>
                  <TableCell className="text-xs">{post.platform}</TableCell>
                  <TableCell className="text-xs">{post.author}</TableCell>
                  <TableCell className="text-xs">{post.publishTime}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="text-[10px] bg-destructive/20 text-destructive border-0">{(post.sentiment || "").split("-")[0]}</Badge>
                      <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{(post.sentiment || "").split("-")[1] || "-"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(post.handleStatus)}</TableCell>
                  <TableCell className="text-xs">{post.comments}</TableCell>
                  <TableCell className="text-xs">{post.likes}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => openHandle("post", post.id)}>
                        <ClipboardList className="w-3 h-3" /> 处置
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] px-1.5 text-destructive hover:text-destructive"
                        onClick={() => {
                          setEvent(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== post.id) }));
                          toast({ title: "已拆分该文章", description: "该文章已从事件中移出" });
                        }}
                      >
                        拆分
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      {/* Handle Dialog */}
      <Dialog open={handleDialogOpen} onOpenChange={setHandleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              {handleStep === 0 ? "重新打开" : handleStep === 4 ? "处理说明" : handleTargetType === "event" ? "事件处置" : "文章处置"}
            </DialogTitle>
          </DialogHeader>

          {/* Step bar */}
          {handleStep >= 1 && handleStep <= 3 && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${1 <= handleStep ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${1 <= handleStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
                <span className="text-xs font-medium">处置类型</span>
              </div>
              <div className={`h-px flex-1 ${2 <= handleStep ? "bg-primary" : "bg-border"}`} />
              <div className={`flex items-center gap-1.5 ${2 <= handleStep ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${2 <= handleStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
                <span className="text-xs font-medium">客服处理</span>
              </div>
              <div className={`h-px flex-1 ${3 <= handleStep ? "bg-primary" : "bg-border"}`} />
              <div className={`flex items-center gap-1.5 ${3 <= handleStep ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${3 <= handleStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
                <span className="text-xs font-medium">升级处理</span>
              </div>
            </div>
          )}

          {/* Step 0: Reopen */}
          {handleStep === 0 && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-6 text-center space-y-2">
                <History className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-foreground">当前状态：<span className="font-semibold">{HANDLE_STATUS_MAP[getTargetStatus()].label}</span></p>
                <p className="text-xs text-muted-foreground">重新打开后将恢复为「待处理」状态，可重新进入处置流程</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">备注（可选）</label>
                <textarea className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none" rows={2} value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="说明重新打开的原因..." />
              </div>
            </div>
          )}

          {/* Step 1: 处置类型 */}
          {handleStep === 1 && (
            <div className="space-y-4 py-2">
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
          )}

          {/* Step 2: 客服处理 */}
          {handleStep === 2 && (
            <div className="space-y-4 py-2">
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
          )}

          {/* Step 3: 升级处理 */}
          {handleStep === 3 && (
            <div className="space-y-4 py-2">
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
          )}

          {/* Step 4: 被升级人处理说明 */}
          {handleStep === 4 && (
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
          )}

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
    </div>
  );
}
