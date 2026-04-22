import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, MessageCircle, Users, Search, RefreshCcw, ExternalLink,
  CheckCircle2, XCircle, Clock as ClockIcon, Eye, Trash2, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  alertMessageStore,
  useAlertMessages,
  isYesterday,
  isWithin7Days,
  type AlertMessage,
  type AlertStatus,
} from "@/lib/alertMessageStore";
import { defaultThemes } from "@/pages/ThemeSettings";

const STATUS_META: Record<AlertStatus, { label: string; tone: string; icon: JSX.Element }> = {
  pushed: { label: "已推送", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "推送失败", tone: "bg-destructive/10 text-destructive border-destructive/30", icon: <XCircle className="w-3 h-3" /> },
  pending: { label: "待推送", tone: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: <ClockIcon className="w-3 h-3" /> },
  read: { label: "已查看", tone: "bg-muted text-muted-foreground border-border", icon: <Eye className="w-3 h-3" /> },
};

const LEVEL_META: Record<AlertMessage["level"], { label: string; tone: string }> = {
  critical: { label: "严重", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  warning: { label: "一般", tone: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
};

export default function AlertList() {
  const navigate = useNavigate();
  const messages = useAlertMessages();
  const [keyword, setKeyword] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState<"all" | "yesterday" | "week">("all");
  const [detail, setDetail] = useState<AlertMessage | null>(null);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (themeFilter !== "all" && m.themeId !== themeFilter) return false;
      if (rangeFilter === "yesterday" && !isYesterday(m.pushedAt)) return false;
      if (rangeFilter === "week" && !isWithin7Days(m.pushedAt)) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (!m.triggerTitle.toLowerCase().includes(k) && !m.ruleName.toLowerCase().includes(k)) return false;
      }
      return true;
    });
  }, [messages, themeFilter, rangeFilter, keyword]);

  // Jump to the source object in its theme list
  const jumpToTrigger = (m: AlertMessage) => {
    if (m.themeId === "sentiment") {
      if (m.triggerType === "event") {
        // pseudo eventId from rule (mock data has no real id) — use rule id as fallback
        navigate(`/sentiment/event-detail?id=${m.ruleId}&from=alert&node=${encodeURIComponent(m.triggerNodeName || "")}`);
      } else {
        navigate(`/sentiment/article/${m.id}`, { state: { from: "alert", title: m.triggerTitle } });
      }
    } else {
      // Other themes: jump to the theme's detail/list page filtered to this node
      navigate(`/sentiment/detail?themeId=${m.themeId}&node=${encodeURIComponent(m.triggerNodeName || "")}&q=${encodeURIComponent(m.triggerTitle)}`);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: messages.length,
    yesterday: messages.filter((m) => isYesterday(m.pushedAt)).length,
    week: messages.filter((m) => isWithin7Days(m.pushedAt)).length,
    critical: messages.filter((m) => m.level === "critical").length,
  }), [messages]);

  const handleResend = (id: string) => {
    alertMessageStore.resend(id);
    toast.success("预警已重新推送");
  };
  const handleDelete = (id: string) => {
    alertMessageStore.remove(id);
    toast.success("预警记录已删除");
  };
  const handleMarkRead = (id: string) => {
    alertMessageStore.markRead(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">预警列表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理所有已推送的预警消息记录，支持查看详情、重推与状态跟踪
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/datacenter/themes/rules")}>
          <Settings2 className="w-4 h-4" /> 管理预警规则
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">累计预警</p><p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">昨天预警</p><p className="text-2xl font-bold text-primary mt-1">{stats.yesterday}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">近 7 天预警</p><p className="text-2xl font-bold text-amber-500 mt-1">{stats.week}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">严重预警</p><p className="text-2xl font-bold text-destructive mt-1">{stats.critical}</p></CardContent></Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> 预警消息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8 h-9 text-sm" placeholder="搜索事件标题或规则名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="主题" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部主题</SelectItem>
                {defaultThemes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rangeFilter} onValueChange={(v) => setRangeFilter(v as "all" | "yesterday" | "week")}>
              <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="时间范围" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="yesterday">昨天</SelectItem>
                <SelectItem value="week">近 7 天</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">共 {filtered.length} 条</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">所属主题</TableHead>
                <TableHead>触发对象 / 规则</TableHead>
                <TableHead>命中条件</TableHead>
                <TableHead>推送目标</TableHead>
                <TableHead>推送时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{m.themeName}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <button
                      type="button"
                      onClick={() => jumpToTrigger(m)}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left truncate inline-flex items-center gap-1 max-w-full"
                      title={`跳转到 ${m.themeName} - ${m.triggerNodeName || "文章列表"}`}
                    >
                      <span className="truncate">{m.triggerTitle}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                    </button>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {m.triggerType === "event" ? `节点：${m.triggerNodeName}` : "单条文章"}
                      </Badge>
                      <span>规则：{m.ruleName}</span>
                      {m.articleCount && <span>· {m.articleCount} 篇</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{m.hitConditions}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.channels.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] gap-0.5">
                          {c.type === "wechat_group" ? <Users className="w-2.5 h-2.5" /> : <MessageCircle className="w-2.5 h-2.5" />}
                          {c.target}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{m.pushedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="查看详情" onClick={() => setDetail(m)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="删除" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                    暂无符合条件的预警记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail drawer (simple inline panel) */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-6" onClick={() => setDetail(null)}>
          <Card className="max-w-xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> 预警详情
                <Badge variant="outline" className={`text-[10px] ml-2 ${LEVEL_META[detail.level].tone}`}>{LEVEL_META[detail.level].label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">触发对象</div>
                <div className="text-foreground font-medium mt-1">{detail.triggerTitle}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">所属主题：</span><span className="text-foreground">{detail.themeName}</span></div>
                <div><span className="text-muted-foreground">触发类型：</span><span className="text-foreground">{detail.triggerType === "event" ? `节点 - ${detail.triggerNodeName}` : "单条文章"}</span></div>
                <div><span className="text-muted-foreground">规则名称：</span><span className="text-foreground">{detail.ruleName}</span></div>
                <div><span className="text-muted-foreground">推送时间：</span><span className="text-foreground">{detail.pushedAt}</span></div>
                {detail.articleCount !== undefined && <div><span className="text-muted-foreground">关联文章：</span><span className="text-foreground">{detail.articleCount} 篇</span></div>}
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <Badge variant="outline" className={`text-[10px] gap-1 ${STATUS_META[detail.status].tone}`}>{STATUS_META[detail.status].icon} {STATUS_META[detail.status].label}</Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">命中条件</div>
                <div className="mt-1 bg-muted px-2 py-1.5 rounded text-xs text-foreground">{detail.hitConditions}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">推送目标</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detail.channels.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] gap-0.5">
                      {c.type === "wechat_group" ? <Users className="w-2.5 h-2.5" /> : <MessageCircle className="w-2.5 h-2.5" />}
                      企业微信 {c.type === "wechat_group" ? "群" : "个人"} · {c.target}
                    </Badge>
                  ))}
                </div>
              </div>
              {detail.remark && (
                <div>
                  <div className="text-xs text-muted-foreground">备注</div>
                  <div className="mt-1 text-xs text-destructive">{detail.remark}</div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/datacenter/themes/rules")} className="gap-1 text-xs">
                  <ExternalLink className="w-3 h-3" /> 查看规则
                </Button>
                {detail.status === "failed" && (
                  <Button size="sm" className="gap-1 text-xs" onClick={() => { handleResend(detail.id); setDetail(null); }}>
                    <RefreshCcw className="w-3 h-3" /> 重新推送
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>关闭</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
