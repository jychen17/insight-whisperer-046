import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, Ban, ChevronDown, ChevronUp, X, AlertTriangle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

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
}

interface MergedEvent {
  id: string;
  title: string;
  postIds: number[];
  createdAt: string;
  summary: string;
}

const initialItems: SentimentItem[] = [
  {
    id: 1, title: "避雷❌长沙雅致酒店（IFS国金中心旗舰店）", platform: "小红书", author: "舒马曦",
    contentType: "视频", userType: "普通用户", fans: "10+粉丝", publishTime: "2026-03-29 16:32:49",
    collectTime: "2026-03-30 11:08:57", region: "湖南", riskLevel: "一般", speed: "低",
    business: "同程旅行-国内酒店", sentiment: "负向情感-客户投诉", issueType: "其他",
    summary: "用户投诉长沙雅致酒店装修噪音扰民且未提前告知，处理方案不合理（投诉风险，品牌声誉风险）",
    comments: 2, likes: 0, collects: 0, shares: 0,
  },
  {
    id: 2, title: "骂机票 ✈", platform: "小红书", author: "蔡尔朗朗朗",
    contentType: "图文", userType: "普通用户", fans: "10+粉丝", publishTime: "2026-03-29 21:33:04",
    collectTime: "2026-03-30 11:07:02", region: "江苏", riskLevel: "一般", speed: "高",
    business: "同程旅行-国内机票", sentiment: "负向情感-客户投诉", issueType: "机票退改",
    summary: "用户因不满多家OTA平台机票价格暴涨，威胁刺激抵制（投诉风险，品牌声誉风险）",
    comments: 53, likes: 0, collects: 0, shares: 0,
  },
  {
    id: 3, title: "同程金融借贷还款无门，债权转让金额乱，求帮忙协商", platform: "黑猫投诉APP", author: "润家曦",
    contentType: "图文", userType: "未知", fans: "未知", publishTime: "2026-03-29 22:39:03",
    collectTime: "2026-03-30 10:45:16", region: "-", riskLevel: "一般", speed: "低",
    business: "同程旅行-金服", sentiment: "负向情感-客户投诉", issueType: "金融服务",
    summary: "用户投诉同程金融借贷产品还款困难，债权转让金额混乱",
    comments: 0, likes: 0, collects: 0, shares: 0,
  },
  {
    id: 4, title: "同程旅行隐瞒机票全损规则，2232元仅退83元", platform: "黑猫投诉APP", author: "匿名",
    contentType: "图文", userType: "未知", fans: "未知", publishTime: "2026-03-29 21:34:41",
    collectTime: "2026-03-30 10:00:24", region: "-", riskLevel: "一般", speed: "低",
    business: "同程旅行-国内机票", sentiment: "负向情感-客户投诉", issueType: "机票退改",
    summary: "用户投诉同程旅行隐瞒机票退改全损规则，高额机票仅退83元",
    comments: 0, likes: 0, collects: 0, shares: 0,
  },
  {
    id: 5, title: "长沙租房 近IFS 精装修一室一厅 拎包入住", platform: "小红书", author: "长沙租房小助手",
    contentType: "图文", userType: "普通用户", fans: "500+粉丝", publishTime: "2026-03-29 15:10:00",
    collectTime: "2026-03-30 09:30:00", region: "湖南", riskLevel: "无", speed: "低",
    business: "同程旅行-国内酒店", sentiment: "中性", issueType: "其他",
    summary: "租房广告内容，与企业舆情无关",
    comments: 1, likes: 3, collects: 2, shares: 0,
    isNoise: true, noiseCategory: "rental_ad",
  },
  {
    id: 6, title: "招聘旅游顾问 底薪6000+提成", platform: "抖音", author: "HR小王",
    contentType: "视频", userType: "普通用户", fans: "200+粉丝", publishTime: "2026-03-29 10:00:00",
    collectTime: "2026-03-30 08:00:00", region: "上海", riskLevel: "无", speed: "低",
    business: "同程旅行-人资", sentiment: "中性", issueType: "其他",
    summary: "招聘广告内容，与企业舆情无关",
    comments: 0, likes: 5, collects: 1, shares: 0,
    isNoise: true, noiseCategory: "recruitment",
  },
];

export default function SentimentDetail() {
  const [mainTab, setMainTab] = useState<"sentiment" | "all" | "events">("sentiment");
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

  // Filtered items based on noise filter
  const displayItems = useMemo(() => {
    const filtered = items.filter(item => {
      if (showNoiseFilter === "normal") return !item.isNoise;
      if (showNoiseFilter === "noise") return item.isNoise;
      return true;
    });
    // Separate merged and unmerged
    const unmerged = filtered.filter(i => !i.mergedEventId);
    return { unmerged, filtered };
  }, [items, showNoiseFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const confirmMerge = () => {
    const eventId = `evt-${Date.now()}`;
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    const newEvent: MergedEvent = {
      id: eventId,
      title: mergeTitle || "未命名事件",
      postIds: selectedIds,
      createdAt: new Date().toLocaleString("zh-CN"),
      summary: `合并了 ${selectedIds.length} 条相关舆情，涉及平台: ${[...new Set(selectedItems.map(i => i.platform))].join("、")}`,
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">舆情详情</h1>
          <div className="flex rounded-md border border-border overflow-hidden">
            {([["sentiment", "舆情内容"], ["events", "事件合并"], ["all", "全部内容"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMainTab(key)}
                className={`px-3 py-1 text-xs ${mainTab === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"} ${key !== "sentiment" ? "border-l border-border" : ""}`}
              >
                {label}
                {key === "events" && mergedEvents.length > 0 && <span className="ml-1">({mergedEvents.length})</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">导出所选数据</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">导出全部数据</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">预警设置</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">报告设置</button>
        </div>
      </div>

      {/* Filters - show on sentiment/all tabs */}
      {mainTab !== "events" && (
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
      )}

      {/* Toolbar: merge, noise, filter - show on sentiment/all tabs */}
      {mainTab !== "events" && (
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
      )}

      {/* Events Tab Content */}
      {mainTab === "events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> 合并事件 ({mergedEvents.length})
            </h2>
            <span className="text-xs text-muted-foreground">共 {items.filter(i => i.mergedEventId).length} 条舆情已合并</span>
          </div>
          {mergedEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-lg border border-border">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>暂无合并事件</p>
              <p className="text-xs mt-1">在"舆情内容"中选择多条舆情后点击"合并为事件"</p>
            </div>
          ) : (
            mergedEvents.map(event => {
              const posts = getEventPosts(event.id);
              const isExpanded = expandedEventId === event.id;
              return (
                <div key={event.id} className="bg-card rounded-lg border border-primary/30 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">事件</Badge>
                        <h3 className="text-sm font-medium text-foreground">{event.title}</h3>
                        <span className="text-[11px] text-muted-foreground">包含 {posts.length} 条舆情</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] text-destructive" onClick={(e) => { e.stopPropagation(); handleUnmerge(event.id); }}>
                          拆分
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{event.summary}</p>
                    <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span>涉及平台: {[...new Set(posts.map(p => p.platform))].join("、")}</span>
                      <span>总评论: {posts.reduce((s, p) => s + p.comments, 0)}</span>
                      <span>创建时间: {event.createdAt}</span>
                    </div>
                  </div>
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
                            <TableHead className="text-xs">评论</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {posts.map(post => (
                            <TableRow key={post.id}>
                              <TableCell className="text-xs font-medium">{post.title}</TableCell>
                              <TableCell className="text-xs">{post.platform}</TableCell>
                              <TableCell className="text-xs">{post.author}</TableCell>
                              <TableCell className="text-xs">{post.publishTime}</TableCell>
                              <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{post.sentiment}</Badge></TableCell>
                              <TableCell className="text-xs">{post.comments}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Cards / List - show on sentiment/all tabs */}
      {mainTab !== "events" && (displayItems.unmerged.length === 0 && showNoiseFilter === "noise" && items.filter(i => i.isNoise).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">暂无噪音帖</div>
      ) : displayItems.unmerged.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">暂无数据</div>
      ) : (
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
            </div>
          ))}
        </div>
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
                    <input
                      type="radio"
                      name="noiseCategory"
                      value={cat.value}
                      checked={noiseCategory === cat.value}
                      onChange={() => setNoiseCategory(cat.value)}
                      className="sr-only"
                    />
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
    </div>
  );
}
