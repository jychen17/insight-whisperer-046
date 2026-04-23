import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Flame, TrendingUp, TrendingDown, Minus, Sparkles, Hash,
  Plane, FileText, Bell, Share2, ExternalLink, Clock, MapPin, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RANK_SOURCES, findTopic, formatHeat,
  buildRankHistory, buildHeatHistory,
  type RankSource, type TrendDir, type RankTopic,
} from "@/lib/socialRankingData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

const TREND_META: Record<TrendDir, { icon: typeof TrendingUp; cls: string; label: string }> = {
  up:   { icon: TrendingUp,   cls: "text-rose-600",     label: "上升" },
  down: { icon: TrendingDown, cls: "text-emerald-600",  label: "下降" },
  flat: { icon: Minus,        cls: "text-muted-foreground", label: "持平" },
  new:  { icon: Sparkles,     cls: "text-amber-600",    label: "新上榜" },
  boom: { icon: Flame,        cls: "text-destructive",  label: "爆点" },
};

const SOURCE_LINE_COLOR: Record<RankSource, string> = {
  douyin_realtime: "#0f172a",
  douyin_travel:   "#64748b",
  weibo_realtime:  "#e11d48",
  weibo_travel:    "#f59e0b",
  xhs_travel:      "#ec4899",
};

export default function SocialRankingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const topic = useMemo(() => (id ? findTopic(id) : undefined), [id]);

  if (!topic) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/social-ranking/list")}>
          <ArrowLeft className="w-4 h-4 mr-1" />返回列表
        </Button>
        <Card className="mt-4 p-12 text-center text-muted-foreground">未找到该话题</Card>
      </div>
    );
  }

  const meta = RANK_SOURCES[topic.source];
  const TIcon = TREND_META[topic.trend].icon;

  // Per-source rank history merged into one chart
  const allSources = Object.keys(RANK_SOURCES) as RankSource[];
  const histories = allSources.map(s => ({ source: s, points: buildRankHistory(topic, s) }));
  const mergedRankData = histories[0].points.map((p, i) => {
    const row: Record<string, string | number | null> = { time: p.time };
    histories.forEach(h => { row[h.source] = h.points[i].rank; });
    return row;
  });

  const heatHistory = buildHeatHistory(topic);

  const goReport = () => {
    navigate("/analysis/report-manage", {
      state: {
        reportPrefill: {
          theme: "社媒榜单", scope: "topics",
          ids: [topic.id], titles: [topic.title], source: "社媒榜单话题详情",
        }
      }
    });
  };

  // Compute current ranks across all 5 boards (deterministic)
  const currentRanks: { source: RankSource; rank: number | null; prev: number | null }[] = histories.map(h => {
    const last = h.points[h.points.length - 1].rank;
    const prev = h.points[h.points.length - 2]?.rank ?? null;
    return { source: h.source, rank: last, prev };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />返回
          </Button>
          <span className="text-xs text-muted-foreground">社媒榜单 / 话题详情</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => navigate("/sentiment/event-alert?themeId=social-ranking")}>
            <Bell className="w-3.5 h-3.5" />预警设置
          </Button>
          <Button variant="default" size="sm" className="h-8 gap-1" onClick={goReport}>
            <FileText className="w-3.5 h-3.5" />一键生成报告
          </Button>
        </div>
      </div>

      {/* Title card */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Badge variant="outline" className={`text-xs shrink-0 ${meta.cls}`}>{meta.shortLabel}</Badge>
          <Badge variant="outline" className="text-xs shrink-0">主榜 #{topic.rank}</Badge>
          <Badge variant="outline" className="text-xs shrink-0">{topic.category}</Badge>
          {topic.travelRelated && (
            <Badge variant="outline" className="text-xs shrink-0 bg-primary/5 text-primary border-primary/20 gap-0.5">
              <Plane className="w-3 h-3" />旅游相关
            </Badge>
          )}
          <span className={`ml-auto text-xs inline-flex items-center gap-0.5 ${TREND_META[topic.trend].cls}`}>
            <TIcon className="w-3.5 h-3.5" />{TREND_META[topic.trend].label}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-foreground mt-3">{topic.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{topic.summary}</p>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-[11px] text-muted-foreground">综合热度</div>
            <div className="text-lg font-semibold text-rose-600 inline-flex items-center gap-1 mt-0.5">
              <Flame className="w-4 h-4" />{formatHeat(topic.heat)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">热度涨幅</div>
            <div className={`text-lg font-semibold mt-0.5 ${topic.heatTrend > 0 ? "text-rose-600" : topic.heatTrend < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
              {topic.heatTrend > 0 ? "+" : ""}{topic.heatTrend}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">在榜时长</div>
            <div className="text-lg font-semibold text-foreground inline-flex items-center gap-1 mt-0.5">
              <Clock className="w-4 h-4 text-muted-foreground" />{topic.duration}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">首次上榜</div>
            <div className="text-sm font-medium text-foreground mt-1">{topic.firstSeen}</div>
          </div>
        </div>
      </Card>

      {/* Per-source ranks */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">五大榜单当前排名</h3>
        <div className="grid grid-cols-5 gap-3">
          {currentRanks.map(({ source, rank, prev }) => {
            const m = RANK_SOURCES[source];
            const onBoard = rank !== null;
            const delta = onBoard && prev !== null ? prev - rank : 0;
            return (
              <div key={source} className="rounded-lg border border-border p-3 bg-card">
                <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.shortLabel}</Badge>
                {onBoard ? (
                  <>
                    <div className="mt-2 text-2xl font-bold text-foreground">#{rank}</div>
                    <div className="mt-1 text-[11px]">
                      {delta > 0 ? (
                        <span className="text-rose-600 inline-flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />上升 {delta} 位</span>
                      ) : delta < 0 ? (
                        <span className="text-emerald-600 inline-flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />下降 {Math.abs(delta)} 位</span>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-0.5"><Minus className="w-3 h-3" />持平</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-2 text-lg font-medium text-muted-foreground">未上榜</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">—</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rank history */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">24h 排名变化</h3>
            <span className="text-[11px] text-muted-foreground">数值越小排名越高</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mergedRankData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={3} />
              <YAxis reversed domain={[1, 50]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
                formatter={(v: unknown, name: string) => [v ?? "未上榜", RANK_SOURCES[name as RankSource].shortLabel]}
              />
              {allSources.map(s => (
                <Line
                  key={s} type="monotone" dataKey={s}
                  stroke={SOURCE_LINE_COLOR[s]} strokeWidth={2}
                  dot={false} connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {allSources.map(s => (
              <span key={s} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-0.5" style={{ background: SOURCE_LINE_COLOR[s] }} />
                {RANK_SOURCES[s].shortLabel}
              </span>
            ))}
          </div>
        </Card>

        {/* Heat curve */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">24h 热度曲线</h3>
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500" />跨平台综合热度
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={heatHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatHeat(Number(v))} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
                formatter={(v: unknown) => [formatHeat(Number(v)), "热度"]}
              />
              <Area type="monotone" dataKey="heat" stroke="#f43f5e" strokeWidth={2} fill="url(#heatGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Keywords + cross sources */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-primary" />关联关键词
            </h3>
            <span className="text-[11px] text-muted-foreground">基于 24h 共现频次</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topic.keywords.map((k, i) => {
              const sizes = ["text-base font-semibold", "text-sm font-medium", "text-sm"];
              const colors = ["bg-rose-100 text-rose-700 border-rose-200", "bg-amber-100 text-amber-700 border-amber-200", "bg-blue-100 text-blue-700 border-blue-200"];
              return (
                <Badge key={k} variant="outline" className={`${sizes[i % sizes.length]} ${colors[i % colors.length]} px-2.5 py-1 gap-1`}>
                  <Hash className="w-3 h-3" />{k}
                </Badge>
              );
            })}
            {/* extra context keywords */}
            {[topic.category, ...(topic.travelRelated ? ["旅游"] : [])].map(k => (
              <Badge key={k} variant="outline" className="text-xs px-2.5 py-1 bg-muted text-muted-foreground">
                {k}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">跨榜分布</h3>
          <div className="space-y-2">
            {topic.crossSources.map(s => {
              const m = RANK_SOURCES[s];
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span className="flex-1 text-foreground">{m.shortLabel}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Share2 className="w-3 h-3" />共出现在 {topic.crossSources.length} 个榜单
          </div>
        </Card>
      </div>

      {/* Quick actions footer */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            想深度分析这个话题?可一键生成专项报告或加入预警监测。
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => navigate("/sentiment/event-alert?themeId=social-ranking")}>
              <Bell className="w-3.5 h-3.5" />加入预警
            </Button>
            <Button variant="default" size="sm" className="h-8 gap-1" onClick={goReport}>
              <FileText className="w-3.5 h-3.5" />一键生成报告
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
