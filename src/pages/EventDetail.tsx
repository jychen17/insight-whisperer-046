import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Flame, Eye, Globe, ThumbsUp, MessageCircle, Share2, Bookmark,
  TrendingUp, TrendingDown, Clock, BarChart3, AlertTriangle, Bell
} from "lucide-react";

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
  posts: [
    { id: 1, title: "骂机票 ✈", platform: "小红书", author: "蔡尔朗朗朗", publishTime: "2026-03-29 21:33:04", sentiment: "负向情感-客户投诉", comments: 53, likes: 0, shares: 0, collects: 0 },
    { id: 2, title: "同程旅行隐瞒机票全损规则，2232元仅退83元", platform: "黑猫投诉APP", author: "匿名", publishTime: "2026-03-29 21:34:41", sentiment: "负向情感-客户投诉", comments: 0, likes: 0, shares: 0, collects: 0 },
    { id: 3, title: "避雷❌长沙雅致酒店（IFS国金中心旗舰店）", platform: "小红书", author: "舒马曦", publishTime: "2026-03-29 16:32:49", sentiment: "负向情感-客户投诉", comments: 2, likes: 0, shares: 0, collects: 0 },
  ],
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

  const event = mockEvent;
  const importanceBadge = event.importance === "high"
    ? <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs gap-1"><Flame className="w-3 h-3" />重大</Badge>
    : <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs gap-1"><Eye className="w-3 h-3" />一般</Badge>;

  const speedLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };
  const speedColor: Record<string, string> = { high: "text-destructive", medium: "text-amber-600", low: "text-muted-foreground" };

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
        </div>
        <div className="flex items-center gap-2">
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
                <TableHead className="text-xs">评论</TableHead>
                <TableHead className="text-xs">点赞</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell className="text-xs font-medium max-w-[300px] truncate">{post.title}</TableCell>
                  <TableCell className="text-xs">{post.platform}</TableCell>
                  <TableCell className="text-xs">{post.author}</TableCell>
                  <TableCell className="text-xs">{post.publishTime}</TableCell>
                  <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{post.sentiment}</Badge></TableCell>
                  <TableCell className="text-xs">{post.comments}</TableCell>
                  <TableCell className="text-xs">{post.likes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
