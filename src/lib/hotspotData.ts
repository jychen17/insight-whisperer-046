// Shared mock data for the Hotspot Insight theme.
// Aligned with the unified hot_event data model (see 热点洞察主题配置).
// 6 event types: 考试 / 演唱会 / 展会 / 演出赛事 / 节假日 / 活动

export type SourceKind = "damai" | "bendibao" | "ranking" | "gov" | "exam";
export type Category = "考试" | "演唱会" | "展会" | "演出赛事" | "节假日" | "活动";
export type Importance = "high" | "medium" | "low";
export type HeatLevel = "高" | "中" | "低";

export interface RawSource {
  kind: SourceKind;
  label: string;
  url?: string;
  extra?: string;
}

export interface HotspotEvent {
  // ── 系统生成 ──
  id: string;             // eventId
  // ── 采集字段 ──
  eventSource?: string;   // 数据源标识
  title: string;          // eventName
  province?: string;      // eventProvince
  city: string;           // eventCity
  venue?: string;         // venueName
  date: string;           // eventStartDate (YYYY-MM-DD)
  endDate?: string;       // eventEndDate
  dateRange?: string;     // 展示用区间字符串
  artistName?: string;            // 演唱会
  ticketOpenTime?: string;        // 演唱会
  wantCount?: number;             // 演唱会
  ticketPrintDateTime?: string;   // 考试
  recruitCount?: number;          // 考试
  affectedRegions?: string[];     // 节假日
  activityScale?: "大型" | "中型" | "小型"; // 活动
  // ── AI 模型字段 ──
  category: Category;       // eventType
  subType?: string;         // eventSubType（细分类型）
  heatLevel: HeatLevel;     // 热度分级
  // ── 计算字段 ──
  daysToStart?: number;     // 距离开始天数

  // ── UI / 兼容字段（保留供既有组件使用）──
  heatScore: number;
  heatTrend: number;
  relatedVolume: { weibo: number; xhs: number; douyin: number };
  sentiment: { pos: number; neu: number; neg: number };
  businessRelevance: 1 | 2 | 3 | 4 | 5;
  sources: RawSource[];
  description: string;
  isNew?: boolean;
  crossSource: number;
  importance: Importance;
  firstTime: string;
  latestTime: string;
  itemCount: number;
}

export const hotspotEvents: HotspotEvent[] = [
  // ── 考试 ──
  {
    id: "h1", title: "2026年全国硕士研究生招生考试",
    eventSource: "中国研究生招生信息网",
    category: "考试", subType: "研究生考试", heatLevel: "高",
    province: "全国", city: "全国",
    date: "2026-12-19", endDate: "2026-12-22", dateRange: "2026-12-19 ~ 12-22",
    ticketPrintDateTime: "2026-12-15 09:00",
    recruitCount: 1100000,
    daysToStart: 235,
    heatScore: 82400, heatTrend: 65,
    relatedVolume: { weibo: 9800, xhs: 4200, douyin: 5100 },
    sentiment: { pos: 42, neu: 48, neg: 10 },
    businessRelevance: 5,
    sources: [
      { kind: "exam", label: "研招网", extra: "招生公告" },
      { kind: "bendibao", label: "本地宝考试专题", extra: "考点汇总" },
      { kind: "ranking", label: "微博热搜 #4", extra: "热度 82w" },
    ],
    description: "全国硕士研究生考试是 P0 级考试热点，覆盖城市广，带动短期住宿/交通需求。建议铺设考点周边酒店搜索资源。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-01 10:00", latestTime: "2026-04-15 22:00", itemCount: 421,
  },
  {
    id: "h2", title: "2026国家公务员考试（笔试）",
    eventSource: "国家公务员局",
    category: "考试", subType: "公务员考试", heatLevel: "高",
    province: "全国", city: "全国",
    date: "2026-11-30", endDate: "2026-11-30",
    ticketPrintDateTime: "2026-11-25 08:00",
    recruitCount: 39600,
    daysToStart: 216,
    heatScore: 71500, heatTrend: 48,
    relatedVolume: { weibo: 12300, xhs: 3100, douyin: 4500 },
    sentiment: { pos: 38, neu: 52, neg: 10 },
    businessRelevance: 4,
    sources: [
      { kind: "gov", label: "国家公务员局", extra: "公告" },
      { kind: "exam", label: "公考雷达", extra: "职位查询" },
    ],
    description: "国考是高基数考试热点，部分省会考点报名量大，建议关注考前一周机酒搜索激增。",
    crossSource: 2, importance: "high",
    firstTime: "2026-04-02 09:30", latestTime: "2026-04-15 18:20", itemCount: 312,
  },

  // ── 演唱会 ──
  {
    id: "h3", title: "周杰伦嘉年华世界巡回演唱会·上海站",
    eventSource: "大麦网",
    category: "演唱会", subType: "演唱会", heatLevel: "高",
    province: "上海", city: "上海", venue: "上海体育场",
    date: "2026-05-15", endDate: "2026-05-18", dateRange: "2026-05-15 ~ 05-18 (共4场)",
    artistName: "周杰伦",
    ticketOpenTime: "2026-04-20 12:00",
    wantCount: 982000,
    daysToStart: 17,
    heatScore: 98700, heatTrend: 245,
    relatedVolume: { weibo: 12300, xhs: 4500, douyin: 8900 },
    sentiment: { pos: 82, neu: 12, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥455-2015" },
      { kind: "bendibao", label: "上海本地宝", extra: "周边交通指引" },
      { kind: "ranking", label: "微博热搜 #3", extra: "热度 98.7w" },
    ],
    description: "周杰伦嘉年华世界巡演上海四场连开，预计带动周边酒店、餐饮、出行需求显著增长，建议同程酒旅前置铺货。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-08 09:12", latestTime: "2026-04-15 22:45", itemCount: 248,
  },
  {
    id: "h4", title: "草莓音乐节·成都站",
    eventSource: "大麦网",
    category: "演唱会", subType: "音乐节", heatLevel: "高",
    province: "四川", city: "成都", venue: "东安湖体育公园",
    date: "2026-05-01", endDate: "2026-05-03", dateRange: "2026-05-01 ~ 05-03",
    ticketOpenTime: "2026-04-10 12:00",
    wantCount: 312000,
    daysToStart: 3,
    heatScore: 67500, heatTrend: 132,
    relatedVolume: { weibo: 8900, xhs: 6700, douyin: 5400 },
    sentiment: { pos: 76, neu: 18, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "三日通票 ¥980" },
      { kind: "bendibao", label: "成都本地宝", extra: "五一活动汇总" },
      { kind: "ranking", label: "抖音热点 #8", extra: "话题 670w 播放" },
    ],
    description: "五一假期成都草莓音乐节，叠加假期出行高峰，机酒搜索预计暴涨。",
    crossSource: 3, isNew: true, importance: "high",
    firstTime: "2026-04-10 14:20", latestTime: "2026-04-15 21:30", itemCount: 189,
  },

  // ── 展会 ──
  {
    id: "h5", title: "武汉国际汽车展览会",
    eventSource: "大麦网",
    category: "展会", subType: "车展", heatLevel: "中",
    province: "湖北", city: "武汉", venue: "武汉国际博览中心",
    date: "2026-06-08", endDate: "2026-06-15", dateRange: "2026-06-08 ~ 06-15",
    daysToStart: 41,
    heatScore: 38200, heatTrend: 56,
    relatedVolume: { weibo: 4100, xhs: 2300, douyin: 7200 },
    sentiment: { pos: 71, neu: 23, neg: 6 },
    businessRelevance: 4,
    sources: [
      { kind: "damai", label: "大麦网", extra: "门票 ¥80" },
      { kind: "bendibao", label: "武汉本地宝", extra: "展会攻略" },
    ],
    description: "中部最大车展，跨省客流显著，建议关注机酒+车展门票的组合销售。",
    crossSource: 2, importance: "medium",
    firstTime: "2026-04-08 13:15", latestTime: "2026-04-15 20:30", itemCount: 124,
  },
  {
    id: "h6", title: "上海ChinaJoy 2026 漫展",
    eventSource: "大麦网",
    category: "展会", subType: "漫展", heatLevel: "高",
    province: "上海", city: "上海", venue: "上海新国际博览中心",
    date: "2026-07-30", endDate: "2026-08-02", dateRange: "2026-07-30 ~ 08-02",
    daysToStart: 93,
    heatScore: 52300, heatTrend: 89,
    relatedVolume: { weibo: 6700, xhs: 5300, douyin: 8400 },
    sentiment: { pos: 84, neu: 12, neg: 4 },
    businessRelevance: 4,
    sources: [
      { kind: "damai", label: "大麦网", extra: "通票 ¥260" },
      { kind: "ranking", label: "抖音热点 #22", extra: "话题 840w 播放" },
    ],
    description: "二次元年度盛事，年轻客群跨城观展集中，浦东酒店一房难求。",
    crossSource: 2, isNew: true, importance: "high",
    firstTime: "2026-04-08 13:15", latestTime: "2026-04-15 20:30", itemCount: 142,
  },

  // ── 演出赛事 ──
  {
    id: "h7", title: "2026 上海国际马拉松",
    eventSource: "大麦网",
    category: "演出赛事", subType: "马拉松", heatLevel: "高",
    province: "上海", city: "上海", venue: "外滩起点 → 上海体育场",
    date: "2026-11-15", endDate: "2026-11-15",
    daysToStart: 201,
    heatScore: 58900, heatTrend: 78,
    relatedVolume: { weibo: 5400, xhs: 4200, douyin: 6300 },
    sentiment: { pos: 86, neu: 11, neg: 3 },
    businessRelevance: 4,
    sources: [
      { kind: "damai", label: "大麦网", extra: "报名费 ¥200" },
      { kind: "bendibao", label: "上海本地宝", extra: "封路提醒" },
    ],
    description: "上马是国内顶级路跑赛事，外地参赛者占比高，比赛日前后两晚酒店预订集中。",
    crossSource: 2, importance: "high",
    firstTime: "2026-04-09 11:30", latestTime: "2026-04-15 18:20", itemCount: 156,
  },
  {
    id: "h8", title: "2026年英雄联盟全球总决赛（S赛）",
    eventSource: "大麦网",
    category: "演出赛事", subType: "电竞", heatLevel: "高",
    province: "北京", city: "北京", venue: "国家体育场",
    date: "2026-10-20", endDate: "2026-11-08", dateRange: "2026-10-20 ~ 11-08",
    daysToStart: 175,
    heatScore: 86300, heatTrend: 156,
    relatedVolume: { weibo: 13200, xhs: 4100, douyin: 11400 },
    sentiment: { pos: 78, neu: 16, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥380-1980" },
      { kind: "ranking", label: "微博热搜 #9", extra: "热度 86w" },
    ],
    description: "电竞顶级赛事，鸟巢决赛场，全球粉丝聚集，京津冀酒旅资源高度紧张。",
    crossSource: 2, importance: "high",
    firstTime: "2026-04-07 09:00", latestTime: "2026-04-15 22:00", itemCount: 198,
  },

  // ── 节假日 ──
  {
    id: "h9", title: "2026 五一国际劳动节",
    eventSource: "国务院办公厅",
    category: "节假日", subType: "全国法定", heatLevel: "高",
    province: "全国", city: "全国",
    date: "2026-05-01", endDate: "2026-05-05", dateRange: "2026-05-01 ~ 05-05 (5天)",
    affectedRegions: ["全国"],
    daysToStart: 3,
    heatScore: 125000, heatTrend: 412,
    relatedVolume: { weibo: 23400, xhs: 8100, douyin: 21200 },
    sentiment: { pos: 56, neu: 32, neg: 12 },
    businessRelevance: 5,
    sources: [
      { kind: "gov", label: "国务院办公厅", extra: "节假日安排通知" },
      { kind: "bendibao", label: "本地宝节假日专题", extra: "出行提示" },
      { kind: "ranking", label: "微博热搜 #1", extra: "热度 125w" },
    ],
    description: "五一长假为年度顶级出行高峰，目的地与机酒搜索集中爆发，需提前7天储备运营内容。",
    crossSource: 3, isNew: true, importance: "high",
    firstTime: "2026-04-12 08:00", latestTime: "2026-04-15 23:10", itemCount: 312,
  },
  {
    id: "h10", title: "云南泼水节（傣历新年）",
    eventSource: "云南省文旅厅",
    category: "节假日", subType: "地域特殊", heatLevel: "中",
    province: "云南", city: "西双版纳",
    date: "2026-04-13", endDate: "2026-04-15", dateRange: "2026-04-13 ~ 04-15",
    affectedRegions: ["云南", "西双版纳", "德宏"],
    daysToStart: -15,
    heatScore: 42100, heatTrend: 138,
    relatedVolume: { weibo: 4800, xhs: 9200, douyin: 6700 },
    sentiment: { pos: 88, neu: 9, neg: 3 },
    businessRelevance: 4,
    sources: [
      { kind: "gov", label: "云南文旅", extra: "活动公告" },
      { kind: "ranking", label: "小红书热搜 #6", extra: "笔记 9.2k" },
    ],
    description: "地域特色节庆，主要拉动昆明—西双版纳航线及当地民宿，建议精准内容投放云南目的地。",
    crossSource: 2, importance: "medium",
    firstTime: "2026-04-01 10:00", latestTime: "2026-04-15 19:50", itemCount: 167,
  },

  // ── 活动 ──
  {
    id: "h11", title: "豫园新春民俗灯会",
    eventSource: "上海本地宝",
    category: "活动", subType: "民俗活动", heatLevel: "中",
    province: "上海", city: "上海", venue: "上海豫园",
    date: "2026-01-28", endDate: "2026-02-15", dateRange: "2026-01-28 ~ 02-15",
    activityScale: "大型",
    daysToStart: -90,
    heatScore: 28900, heatTrend: 45,
    relatedVolume: { weibo: 1200, xhs: 12400, douyin: 3400 },
    sentiment: { pos: 91, neu: 8, neg: 1 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略" },
      { kind: "ranking", label: "小红书热搜 #28", extra: "笔记 1.2w" },
    ],
    description: "城市民俗活动，长期持续热度，适合做城市目的地内容营销。",
    crossSource: 2, importance: "low",
    firstTime: "2026-04-09 11:30", latestTime: "2026-04-15 18:20", itemCount: 87,
  },
  {
    id: "h12", title: "上海咖啡文化周",
    eventSource: "上海本地宝",
    category: "活动", subType: "时令活动", heatLevel: "中",
    province: "上海", city: "上海", venue: "新天地、武康路等多处",
    date: "2026-04-20", endDate: "2026-04-28", dateRange: "2026-04-20 ~ 04-28",
    activityScale: "中型",
    daysToStart: -8,
    heatScore: 32100, heatTrend: 68,
    relatedVolume: { weibo: 1500, xhs: 18900, douyin: 3800 },
    sentiment: { pos: 89, neu: 9, neg: 2 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略" },
      { kind: "ranking", label: "小红书热搜 #16", extra: "笔记 1.8w" },
    ],
    description: "城市生活方式类活动，可作为目的地周边内容素材。",
    crossSource: 2, importance: "medium",
    firstTime: "2026-04-09 11:30", latestTime: "2026-04-15 18:20", itemCount: 96,
  },
];

// ─── Clue (article) item shared across HotspotList & HotspotDetail ───
export interface ClueItem {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  source: string;
  kind: SourceKind;
  author: string;
  publishTime: string;
  region: string;
  heat: number;
  comments: number;
  likes: number;
  url: string;
}

export const buildClues = (event: HotspotEvent): ClueItem[] => {
  const base: Omit<ClueItem, "eventId" | "eventTitle">[] = [
    { id: `${event.id}-c1`, title: `${event.title} - 详情页`, source: event.eventSource ?? "数据源", kind: event.sources[0]?.kind ?? "ranking", author: "官方", publishTime: event.firstTime, region: event.city, heat: 5200, comments: 312, likes: 1240, url: "#" },
    { id: `${event.id}-c2`, title: `#${event.title.split("·")[0]}# 上榜微博热搜`, source: "微博热搜", kind: "ranking", author: "微博热搜榜", publishTime: event.firstTime, region: "全国", heat: event.heatScore, comments: 4280, likes: 32100, url: "#" },
    { id: `${event.id}-c3`, title: `${event.city}${event.category}打卡攻略，亲测好玩`, source: "小红书", kind: "ranking", author: "城市探索家", publishTime: event.latestTime, region: event.city, heat: 18900, comments: 521, likes: 8200, url: "#" },
    { id: `${event.id}-c4`, title: `${event.title} 现场视频热度上升`, source: "抖音", kind: "ranking", author: "现场达人", publishTime: event.latestTime, region: event.city, heat: 67200, comments: 1820, likes: 12400, url: "#" },
    { id: `${event.id}-c5`, title: `${event.city}周边活动汇总收录`, source: `${event.city}本地宝`, kind: "bendibao", author: "本地宝小编", publishTime: event.firstTime, region: event.city, heat: 4200, comments: 56, likes: 320, url: "#" },
    { id: `${event.id}-c6`, title: `周边交通指引 - ${event.venue ?? event.city}`, source: `${event.city}本地宝`, kind: "bendibao", author: "本地宝小编", publishTime: event.firstTime, region: event.city, heat: 3100, comments: 42, likes: 280, url: "#" },
  ];
  return base
    .slice(0, Math.max(3, Math.min(base.length, Math.ceil(event.itemCount / 50))))
    .map(c => ({ ...c, eventId: event.id, eventTitle: event.title }));
};

export const allClues = (): ClueItem[] => hotspotEvents.flatMap(buildClues);
