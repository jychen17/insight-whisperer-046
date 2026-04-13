import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    ? <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs gap-1"><Flame className="w-3 h-3" />重大</Badge>
    : <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs gap-1"><Eye className="w-3 h-3" />一般</Badge>;

  const speedLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };
  const speedColor: Record<string, string> = { high: "text-destructive", medium: "text-amber-600", low: "text-muted-foreground" };

  const renderStatusBadge = (status: HandleStatus) => {
    const info = HANDLE_STATUS_MAP[status];
    return <Badge className={`${info.color} border-0 text-[10px]`}>{info.label}</Badge>;
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

  const confirmHandle = () => {
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: handleAction,
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      assignee: handleAction === "dispatch" ? handleAssignee : undefined,
      complaintNo: handleAction === "dispatch" ? handleComplaintNo : undefined,
      escalateTarget: handleAction === "escalate" ? handleEscalateTarget : undefined,
      escalateRole: handleAction === "escalate" ? ESCALATE_ROLES.find(r => r.value === handleEscalateRole)?.label : undefined,
      remark: handleRemark || undefined,
    };
    const newStatus = actionToStatus(handleAction);

    if (handleTargetType === "event") {
      setEvent(prev => ({ ...prev, handleStatus: newStatus, handleRecords: [...prev.handleRecords, record] }));
    } else {
      setEvent(prev => ({
        ...prev,
        posts: prev.posts.map(p =>
          p.id === handleTargetId ? { ...p, handleStatus: newStatus, handleRecords: [...p.handleRecords, record] } : p
        ),
      }));
    }
    setHandleDialogOpen(false);
    toast({ title: "处理成功" });
  };

  const handleReopen = (type: "event" | "post", postId?: number) => {
    const record: HandleRecord = {
      id: `rec-${Date.now()}`,
      action: "reopen",
      operator: "当前用户",
      time: new Date().toLocaleString("zh-CN"),
      remark: "重新打开处理",
    };
    if (type === "event") {
      setEvent(prev => ({ ...prev, handleStatus: "pending" as HandleStatus, handleRecords: [...prev.handleRecords, record] }));
    } else {
      setEvent(prev => ({
        ...prev,
        posts: prev.posts.map(p =>
          p.id === postId ? { ...p, handleStatus: "pending" as HandleStatus, handleRecords: [...p.handleRecords, record] } : p
        ),
      }));
    }
    toast({ title: "已重新打开" });
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
          {event.handleStatus === "closed" ? (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => handleReopen("event")}>
              <History className="w-3 h-3" /> 重新打开
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openHandle("event")}>
                <ClipboardList className="w-3 h-3" /> 处置事件
              </Button>
              {event.handleStatus !== "pending" && (
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => handleCloseItem("event")}>
                  <CheckCircle2 className="w-3 h-3" /> 完结
                </Button>
              )}
            </>
          )}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openRemarkDialog("event")}>
            <MessageSquarePlus className="w-3 h-3" /> 追加备注
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
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {event.sentimentBreakdown.negative > 0 && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">负向 {event.sentimentBreakdown.negative}</Badge>}
            {event.sentimentBreakdown.neutral > 0 && <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">中性 {event.sentimentBreakdown.neutral}</Badge>}
            {event.sentimentBreakdown.positive > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">正向 {event.sentimentBreakdown.positive}</Badge>}
            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{event.topBusiness}</Badge>
            <Badge variant="outline" className={`text-[10px] ${speedColor[event.fermentSpeed]}`}>发酵速度: {speedLabel[event.fermentSpeed]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.summary}</p>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "文章总量", value: event.posts.length, icon: BarChart3 },
          { label: "总点赞量", value: event.totalLikes, icon: ThumbsUp },
          { label: "总收藏量", value: event.totalCollects, icon: Bookmark },
          { label: "总评论量", value: event.totalComments, icon: MessageCircle },
          { label: "总分享量", value: event.totalShares, icon: Share2 },
          { label: "覆盖平台", value: event.keyPlatforms.length, icon: Globe },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-3 text-center">
              <m.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <div className="text-lg font-semibold text-foreground">{m.value}</div>
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time info & platforms */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">时间信息</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">首发时间</span><span className="text-foreground">{event.firstTime}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">最新时间</span><span className="text-foreground">{event.latestTime}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">覆盖平台</CardTitle></CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {event.keyPlatforms.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
          </CardContent>
        </Card>
      </div>

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
                  <TableCell className="text-xs font-medium max-w-[250px] truncate">{post.title}</TableCell>
                  <TableCell className="text-xs">{post.platform}</TableCell>
                  <TableCell className="text-xs">{post.author}</TableCell>
                  <TableCell className="text-xs">{post.publishTime}</TableCell>
                  <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{post.sentiment}</Badge></TableCell>
                  <TableCell>{renderStatusBadge(post.handleStatus)}</TableCell>
                  <TableCell className="text-xs">{post.comments}</TableCell>
                  <TableCell className="text-xs">{post.likes}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {post.handleStatus === "closed" ? (
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => handleReopen("post", post.id)}>
                          <History className="w-3 h-3" /> 重新打开
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => openHandle("post", post.id)}>
                            <ClipboardList className="w-3 h-3" /> 处置
                          </Button>
                          {post.handleStatus !== "pending" && (
                            <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => handleCloseItem("post", post.id)}>
                              <CheckCircle2 className="w-3 h-3" /> 完结
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => openRemarkDialog("post", post.id)}>
                      <MessageSquarePlus className="w-3 h-3" /> 备注
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-post processing records */}
      {event.posts.filter(p => p.handleRecords.length > 0).map(post => (
        <Card key={`records-${post.id}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" /> 文章处理记录 - {post.title.slice(0, 20)}{post.title.length > 20 ? "..." : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {post.handleRecords.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-xs">
                  <User className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground">{r.operator}</span>
                  <span className="text-muted-foreground">{r.time}</span>
                  <span className="text-foreground">{renderRecordDesc(r)}</span>
                  {r.remark && <span className="text-muted-foreground">（{r.remark}）</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Handle Dialog */}
      <Dialog open={handleDialogOpen} onOpenChange={setHandleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> {handleTargetType === "event" ? "事件处置" : "文章处置"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">处置方式</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "silent" as HandleAction, label: "静默", icon: XCircle, desc: "无需人工处理" },
                  { value: "dispatch" as HandleAction, label: "分派客服", icon: ClipboardList, desc: "分派给客服跟进" },
                  { value: "escalate" as HandleAction, label: "升级处理", icon: ArrowUpRight, desc: "升级到上级指定人" },
                ]).map(opt => (
                  <label
                    key={opt.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      handleAction === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input type="radio" className="sr-only" checked={handleAction === opt.value} onChange={() => setHandleAction(opt.value)} />
                    <div className="flex items-center gap-1.5">
                      <opt.icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium text-foreground">{opt.label}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            {handleAction === "dispatch" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">分派给</label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                    value={handleAssignee}
                    onChange={e => setHandleAssignee(e.target.value)}
                  >
                    <option value="">请选择客服</option>
                    {CS_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">投诉单号（可选）</label>
                  <input
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                    value={handleComplaintNo}
                    onChange={e => setHandleComplaintNo(e.target.value)}
                    placeholder="如有投诉单号请输入"
                  />
                </div>
              </div>
            )}
            {handleAction === "escalate" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">升级角色</label>
                  <div className="flex gap-2 mt-1">
                    {ESCALATE_ROLES.map(role => (
                      <label
                        key={role.value}
                        className={`flex-1 p-2 rounded-md border text-center text-xs cursor-pointer transition-colors ${
                          handleEscalateRole === role.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <input type="radio" className="sr-only" checked={handleEscalateRole === role.value} onChange={() => { setHandleEscalateRole(role.value); setHandleEscalateTarget(""); }} />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">指定处理人</label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                    value={handleEscalateTarget}
                    onChange={e => setHandleEscalateTarget(e.target.value)}
                  >
                    <option value="">请选择处理人</option>
                    {(ESCALATE_PERSONS[handleEscalateRole] || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">备注</label>
              <textarea
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none"
                rows={2}
                value={handleRemark}
                onChange={e => setHandleRemark(e.target.value)}
                placeholder="可选填备注..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandleDialogOpen(false)}>取消</Button>
            <Button onClick={confirmHandle}>确认处置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-primary" /> 追加处理备注
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground">操作人</label>
              <input
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground"
                value={remarkOperator}
                onChange={e => setRemarkOperator(e.target.value)}
                placeholder="请输入您的姓名或工号"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">备注内容 <span className="text-destructive">*</span></label>
              <textarea
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground resize-none"
                rows={4}
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="请输入处理进展、反馈结果或补充说明..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>取消</Button>
            <Button onClick={confirmAddRemark}>提交备注</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
