import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit2, LayoutDashboard, GitMerge, Filter, Search, Layers, ChevronRight, ChevronDown, ChevronUp, Eye, ArrowLeft, X, Trash2, Home, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ThemeFlowCanvas from "@/components/ThemeFlowCanvas";
import ThemeConfigDialog, { mergeConditionTreeToText } from "@/components/ThemeConfigDialog";
import { DataPermissionDialog, type ThemeConfig, type DashboardWidget } from "@/pages/ThemeSettings";

// Re-use labels from ThemeSettings
const MERGE_TYPE_LABELS: Record<string, string> = { text_similarity: "文本相似度合并", field_group: "字段组合分组", time_window: "时间窗口聚合" };
const FIELD_LABELS: Record<string, string> = {
  title: "标题", content: "正文", platform: "平台", author: "作者", publishTime: "发布时间", publish_time: "发布时间",
  sentiment: "情感倾向", topic: "话题分类", region: "地域", likes: "点赞数", comments: "评论数",
  shares: "转发数", readCount: "阅读量", heatScore: "热度指数", influenceScore: "影响力评分",
  risk_level: "风险等级", intent: "用户意图", reads: "阅读数", heat_score: "热度指数",
  risk_score: "风险分数", ferment_level: "发酵等级", sov: "SOV份额", nps: "NPS评分", growth_rate: "增长率",
};
const DISPLAY_POS_LABELS: Record<string, string> = { list: "仅列表", detail: "仅详情", both: "列表+详情" };

const MOCK_POSTS = [
  { id: "p1", title: "某品牌新品发布引热议", platform: "微博", sentiment: "正面", author: "科技观察", time: "2024-01-15 10:30", likes: 1200, comments: 89 },
  { id: "p2", title: "产品质量问题遭投诉", platform: "小红书", sentiment: "负面", author: "消费者之声", time: "2024-01-15 11:20", likes: 856, comments: 234 },
  { id: "p3", title: "行业分析：2024趋势展望", platform: "微信", sentiment: "中性", author: "行业研究院", time: "2024-01-15 09:00", likes: 2100, comments: 67 },
  { id: "p4", title: "竞品对比评测报告", platform: "知乎", sentiment: "中性", author: "评测达人", time: "2024-01-14 16:45", likes: 3400, comments: 156 },
  { id: "p5", title: "用户体验优化建议收集", platform: "微博", sentiment: "正面", author: "产品体验官", time: "2024-01-14 14:30", likes: 567, comments: 78 },
];
const MOCK_NODE1_EVENTS = [
  { id: "e1", title: "品牌新品发布事件", postCount: 3, sentiment: "正面", platforms: ["微博", "微信"], firstTime: "2024-01-15 09:00", lastTime: "2024-01-15 11:20", totalLikes: 4156, totalComments: 390, posts: ["p1", "p3", "p5"] },
  { id: "e2", title: "产品质量争议事件", postCount: 2, sentiment: "负面", platforms: ["小红书", "知乎"], firstTime: "2024-01-14 16:45", lastTime: "2024-01-15 11:20", totalLikes: 4256, totalComments: 390, posts: ["p2", "p4"] },
];
const MOCK_NODE2_GROUPS = [
  { id: "g1", title: "品牌舆情综合", eventCount: 2, postCount: 5, mainSentiment: "中性", platforms: ["微博", "小红书", "微信", "知乎"], totalLikes: 8412, totalComments: 780, events: ["e1", "e2"] },
];

function SentimentBadge({ v }: { v: string }) {
  return (
    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
      v === "负面" ? "bg-destructive/10 text-destructive" : v === "正面" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>{v}</Badge>
  );
}

export default function ThemeDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = location.state?.theme as ThemeConfig | undefined;
  const fromPath = location.state?.from as string | undefined;
  const fromLabel = location.state?.fromLabel as string | undefined;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [dashboardDialogTheme, setDashboardDialogTheme] = useState<ThemeConfig | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(theme || null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  if (!currentTheme) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground mb-4">未找到主题数据，请从主题列表进入</p>
        <button onClick={() => navigate("/datacenter/themes/manage")} className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md">返回主题列表</button>
      </div>
    );
  }

  const enabledNodes = (currentTheme.mergeNodes || []).filter(n => n.enabled).sort((a, b) => a.order - b.order);

  const handleSaveTheme = (t: ThemeConfig) => {
    setCurrentTheme(t);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {fromPath ? (
          <>
            <button onClick={() => navigate(fromPath)} className="hover:text-foreground transition-colors">{fromLabel || "返回"}</button>
            <ChevronRight className="w-3 h-3" />
          </>
        ) : (
          <>
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">数据中心</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate("/datacenter/themes/manage")} className="hover:text-foreground transition-colors">主题配置</button>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-foreground font-medium">{currentTheme.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentTheme.icon}</span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{currentTheme.name}</h1>
            <p className="text-xs text-muted-foreground">{currentTheme.description} · 负责人：{currentTheme.owner}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPermissionDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-accent transition-colors">
            <Shield className="w-3 h-3" /> 数据权限
          </button>
          <button onClick={() => setDashboardDialogTheme(currentTheme)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-accent transition-colors">
            <LayoutDashboard className="w-3 h-3" /> 看板搭建
          </button>
          <button onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs gradient-primary text-primary-foreground rounded-md font-medium">
            <Edit2 className="w-3 h-3" /> 编辑配置
          </button>
        </div>
      </div>

      {/* Flow Canvas */}
      <ThemeFlowCanvas theme={currentTheme} />

      {/* Data Sources */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 数据源配置
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentTheme.dataSources.map(ds => (
              <div key={ds.taskId} className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-2 border border-border">
                <span className="text-xs font-medium text-foreground">{ds.taskName}</span>
                <div className="flex gap-1">
                  {ds.platforms.map(p => <Badge key={p} className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-0">{p}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions (per data source) */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 入主题条件（按数据源）
          </h3>
          <div className="space-y-2">
            {currentTheme.dataSources.map(ds => {
              const tree = ds.conditionTree;
              const hasConditions = tree && tree.children && tree.children.length > 0;
              return (
                <div key={ds.taskId} className="bg-muted/30 rounded-md px-4 py-3 border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{ds.taskName}</Badge>
                    <span className="text-[10px] text-muted-foreground">{ds.platforms.join("、")}</span>
                  </div>
                  <code className="text-xs text-foreground">
                    {hasConditions ? conditionToText(tree!) : "（无条件限制）"}
                  </code>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 展示字段与筛选条件
          </h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">字段名</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">类型</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">展示位置</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">筛选条件</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">筛选方式</th>
                </tr>
              </thead>
              <tbody>
                {currentTheme.fieldConfigs.map(fc => (
                  <tr key={fc.key} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{FIELD_LABELS[fc.key] || fc.key}</td>
                    <td className="px-3 py-2">
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                        fc.fieldType === "ai" ? "bg-purple-500/10 text-purple-600" :
                        fc.fieldType === "calc" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>{fc.fieldType === "ai" ? "AI标签" : fc.fieldType === "calc" ? "计算字段" : "原生字段"}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">{DISPLAY_POS_LABELS[fc.displayPosition]}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {fc.isFilter ? <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0"><Filter className="w-2.5 h-2.5 mr-0.5" />是</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {fc.isFilter ? (
                        fc.filterType === "enum" ? (
                          <span className="text-foreground">下拉选择 · <span className="text-muted-foreground">{fc.enumValues.join(", ")}</span></span>
                        ) : (
                          <span className="text-foreground flex items-center gap-1"><Search className="w-3 h-3 text-muted-foreground" />模糊搜索</span>
                        )
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Merge Pipeline */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 合并管线
          </h3>
          {enabledNodes.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-muted/50 rounded-md px-3 py-2 border border-border text-xs font-medium text-foreground">全部帖子</div>
              {enabledNodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="bg-primary/5 rounded-md px-3 py-2 border border-primary/20">
                    <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <GitMerge className="w-3 h-3 text-primary" /> 第{i + 1}级：{node.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {node.mergeConditionTree && (node.mergeConditionTree.children || []).length > 0
                        ? mergeConditionTreeToText(node.mergeConditionTree)
                        : (() => {
                            const parts: string[] = [];
                            (node.mergeConditions || []).forEach(mc => {
                              const fl = FIELD_LABELS[mc.field] || mc.field;
                              if (mc.operator === "similarity_gte") parts.push(`${fl}≥${mc.value}%`);
                              else if (mc.operator === "time_within") parts.push(`${mc.value}h窗口`);
                              else if (mc.operator === "equals") parts.push(`${fl}相同`);
                              else parts.push(`${fl}包含${mc.value}`);
                            });
                            return parts.join(" + ") || "字段分组合并";
                          })()
                      }
                    </div>
                    {/* Sort config */}
                    {(node.displayFields || []).some(df => df.isDefaultSort) && (
                      <div className="text-[10px] text-primary mt-0.5">
                        📋 排序：{FIELD_LABELS[(node.displayFields || []).find(df => df.isDefaultSort)?.key || ""] || (node.displayFields || []).find(df => df.isDefaultSort)?.key}
                        {(node.displayFields || []).find(df => df.isDefaultSort)?.sortDirection === "asc" ? " 升序" : " 降序"}
                      </div>
                    )}
                    {(node.displayFields || []).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(node.displayFields || []).map(df => (
                          <Badge key={df.key} className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">
                            {FIELD_LABELS[df.key] || df.key}·{DISPLAY_POS_LABELS[df.position]}
                            {df.isFilter && "·筛选"}
                            {df.isSortable && "·排序"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">未配置合并节点，仅展示原始入库帖子</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 数据展示
        </h3>
        <Tabs value={activeTab || (enabledNodes.length > 0 ? `node_${enabledNodes[enabledNodes.length - 1].id}` : "posts")} onValueChange={v => { setActiveTab(v); setExpandedEvent(null); }}>
          <TabsList>
            {[...enabledNodes].map((node, i) => ({ node, i })).reverse().map(({ node, i }) => (
              <TabsTrigger key={node.id} value={`node_${node.id}`}>
                第{i + 1}级：{node.name}
                <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{i === 0 ? MOCK_NODE1_EVENTS.length : MOCK_NODE2_GROUPS.length}</Badge>
              </TabsTrigger>
            ))}
            <TabsTrigger value="posts">全部帖子<Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{MOCK_POSTS.length}</Badge></TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="flex flex-wrap gap-2 mb-3 mt-1">
              {currentTheme.fieldConfigs.filter(fc => fc.isFilter).map(fc => (
                <div key={fc.key}>
                  {fc.filterType === "enum" ? (
                    <select className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                      <option value="">{FIELD_LABELS[fc.key]}（全部）</option>
                      {fc.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center border border-border rounded-md bg-card px-2">
                      <Search className="w-3 h-3 text-muted-foreground" />
                      <input className="px-1.5 py-1.5 text-xs bg-transparent text-foreground outline-none w-24" placeholder={`搜索${FIELD_LABELS[fc.key]}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">标题</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">平台</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">情感</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">作者</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">时间</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">互动</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_POSTS.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-foreground font-medium max-w-[240px] truncate">{p.title}</td>
                      <td className="px-3 py-2.5"><Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{p.platform}</Badge></td>
                      <td className="px-3 py-2.5"><SentimentBadge v={p.sentiment} /></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.author}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.time}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">👍 {p.likes} · 💬 {p.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {enabledNodes.map((node, nodeIndex) => (
            <TabsContent key={node.id} value={`node_${node.id}`}>
              <div className="bg-muted/20 rounded-lg p-3 mb-3 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">{node.name}</span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    {node.mergeConditionTree && (node.mergeConditionTree.children || []).length > 0
                      ? mergeConditionTreeToText(node.mergeConditionTree)
                      : "字段分组合并"}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {node.mergeConditionTree && (node.mergeConditionTree.children || []).length > 0
                    ? mergeConditionTreeToText(node.mergeConditionTree)
                    : (node.mergeConditions || []).map(mc => {
                        const fl = FIELD_LABELS[mc.field] || mc.field;
                        if (mc.operator === "similarity_gte") return `${fl}≥${mc.value}%`;
                        if (mc.operator === "time_within") return `${mc.value}h窗口`;
                        if (mc.operator === "equals") return `${fl}相同`;
                        return `${fl}包含${mc.value}`;
                      }).join(" + ")}
                  {nodeIndex > 0 && " · 基于上一级合并结果"}
                </span>
              </div>

              {nodeIndex === 0 ? (
                <div className="space-y-2">
                  {MOCK_NODE1_EVENTS.map(e => (
                    <div key={e.id} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedEvent(expandedEvent === e.id ? null : e.id)}>
                        <div className="flex items-center gap-3">
                          {expandedEvent === e.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-medium text-foreground">{e.title}</span>
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{e.postCount} 篇</Badge>
                          <SentimentBadge v={e.sentiment} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{e.platforms.join(", ")}</span>
                          <span>{e.firstTime.slice(5)} ~ {e.lastTime.slice(5)}</span>
                          <span>👍 {e.totalLikes} · 💬 {e.totalComments}</span>
                        </div>
                      </div>
                      {expandedEvent === e.id && (
                        <div className="border-t border-border bg-muted/10">
                          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] font-medium text-muted-foreground">事件详情 · 包含 {e.postCount} 篇帖子</span>
                          </div>
                          <table className="w-full text-xs">
                            <thead><tr className="bg-muted/30">
                              <th className="text-left px-4 py-1.5 font-medium text-muted-foreground">标题</th>
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">平台</th>
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">情感</th>
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">时间</th>
                              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">互动</th>
                            </tr></thead>
                            <tbody>
                              {e.posts.map(pid => {
                                const post = MOCK_POSTS.find(p => p.id === pid);
                                if (!post) return null;
                                return (
                                  <tr key={pid} className="border-t border-border/50 hover:bg-muted/20">
                                    <td className="px-4 py-2 text-foreground">{post.title}</td>
                                    <td className="px-3 py-2"><Badge className="text-[10px] px-1 py-0 bg-muted text-muted-foreground border-0">{post.platform}</Badge></td>
                                    <td className="px-3 py-2"><SentimentBadge v={post.sentiment} /></td>
                                    <td className="px-3 py-2 text-muted-foreground">{post.time}</td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">👍 {post.likes} · 💬 {post.comments}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {MOCK_NODE2_GROUPS.map(g => (
                    <div key={g.id} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedEvent(expandedEvent === g.id ? null : g.id)}>
                        <div className="flex items-center gap-3">
                          {expandedEvent === g.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                          <GitMerge className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-medium text-foreground">{g.title}</span>
                          <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground border-0">{g.eventCount} 个事件</Badge>
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{g.postCount} 篇帖子</Badge>
                          <SentimentBadge v={g.mainSentiment} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{g.platforms.join(", ")}</span>
                          <span>👍 {g.totalLikes} · 💬 {g.totalComments}</span>
                        </div>
                      </div>
                      {expandedEvent === g.id && (
                        <div className="border-t border-border bg-muted/10">
                          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] font-medium text-muted-foreground">分组详情 · 包含 {g.eventCount} 个事件</span>
                          </div>
                          {g.events.map(eid => {
                            const ev = MOCK_NODE1_EVENTS.find(x => x.id === eid);
                            if (!ev) return null;
                            return (
                              <div key={eid} className="border-b border-border/30 last:border-b-0 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-medium text-foreground">{ev.title}</span>
                                  <Badge className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-0">{ev.postCount} 篇</Badge>
                                  <SentimentBadge v={ev.sentiment} />
                                  <span className="text-[10px] text-muted-foreground ml-auto">👍 {ev.totalLikes} · 💬 {ev.totalComments}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dashboard Widgets */}
      {currentTheme.dashboardWidgets.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full gradient-primary inline-block" /> 看板组件
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {currentTheme.dashboardWidgets.map(w => (
              <div key={w.id} className="bg-muted/30 rounded-md p-3 border border-border text-center">
                <div className="text-lg mb-1">
                  {w.type === "statCard" ? "📊" : w.type === "lineChart" ? "📈" : w.type === "pieChart" ? "🥧" : w.type === "barChart" ? "📉" : "📋"}
                </div>
                <div className="text-xs font-medium text-foreground">{w.title}</div>
                {w.tagField && <div className="text-[10px] text-primary mt-0.5">{FIELD_LABELS[w.tagField] || w.tagField}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <ThemeConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} theme={currentTheme} onSave={handleSaveTheme} />
      {dashboardDialogTheme && (
        <DashboardBuilderDialog theme={dashboardDialogTheme} onClose={() => setDashboardDialogTheme(null)}
          onSave={updated => { setCurrentTheme(updated); setDashboardDialogTheme(null); }} />
      )}
      {permissionDialogOpen && (
        <DataPermissionDialog
          theme={currentTheme}
          currentUser={{ name: "张三", isSuperAdmin: true }}
          onClose={() => setPermissionDialogOpen(false)}
          onSave={(t) => { setCurrentTheme(t); setPermissionDialogOpen(false); }}
        />
      )}
    </div>
  );
}

// Inline DashboardBuilderDialog (same as ThemeSettings)
function DashboardBuilderDialog({ theme, onClose, onSave }: { theme: ThemeConfig; onClose: () => void; onSave: (t: ThemeConfig) => void }) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(theme.dashboardWidgets || []);
  const WIDGET_TYPES = [
    { value: "statCard", label: "统计卡片", icon: "📊" },
    { value: "lineChart", label: "折线图", icon: "📈" },
    { value: "pieChart", label: "饼图", icon: "🥧" },
    { value: "barChart", label: "柱状图", icon: "📉" },
    { value: "table", label: "数据表格", icon: "📋" },
  ];
  const addWidget = (type: string) => setWidgets(w => [...w, { id: `w_${Date.now()}`, type: type as DashboardWidget["type"], title: "", metric: "", position: w.length + 1 }]);
  const updateWidget = (i: number, u: Partial<DashboardWidget>) => setWidgets(w => w.map((x, j) => j === i ? { ...x, ...u } : x));
  const removeWidget = (i: number) => setWidgets(w => w.filter((_, j) => j !== i));
  const availableFields = theme.fieldConfigs.map(fc => ({ key: fc.key, label: FIELD_LABELS[fc.key] || fc.key }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[900px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">看板搭建 · {theme.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">拖拽组件到看板（点击添加）</label>
            <div className="flex gap-2 flex-wrap">
              {WIDGET_TYPES.map(wt => (
                <button key={wt.value} onClick={() => addWidget(wt.value)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs hover:bg-muted/50 transition-colors cursor-grab">
                  <span>{wt.icon}</span> {wt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {widgets.map((w, i) => (
              <div key={w.id} className="border border-border rounded-lg p-3 flex items-center gap-3 bg-card">
                <span className="text-sm cursor-grab">≡</span>
                <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0 shrink-0">
                  {WIDGET_TYPES.find(t => t.value === w.type)?.icon} {WIDGET_TYPES.find(t => t.value === w.type)?.label}
                </Badge>
                <input value={w.title} onChange={e => updateWidget(i, { title: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="组件标题" />
                <select value={w.tagField || ""} onChange={e => updateWidget(i, { tagField: e.target.value })}
                  className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                  <option value="">关联标签字段</option>
                  {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <input value={w.metric} onChange={e => updateWidget(i, { metric: e.target.value })}
                  className="w-28 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="指标逻辑" />
                <button onClick={() => removeWidget(i)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {widgets.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">点击上方组件类型添加到看板</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted">取消</button>
          <button onClick={() => onSave({ ...theme, dashboardWidgets: widgets, updatedAt: new Date().toISOString().slice(0, 10) })}
            className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">保存看板</button>
        </div>
      </div>
    </div>
  );
}

function conditionToText(node: any): string {
  if (node.type === "condition") {
    const opLabel = node.operator === "equals" ? "=" : node.operator === "not_equals" ? "≠" : node.operator === "contains" ? "∈" : node.operator || "=";
    return `${FIELD_LABELS[node.field || ""] || node.field} ${opLabel} ${node.value}`;
  }
  const childTexts = (node.children || []).map((c: any) => conditionToText(c));
  const joined = childTexts.join(` ${node.logic} `);
  return node.children && node.children.length > 1 ? `(${joined})` : joined;
}
