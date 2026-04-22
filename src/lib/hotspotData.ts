// Shared mock data for the Hotspot Insight theme.
// Used by both the list view (HotspotList) and the detail page (HotspotDetail).

export type SourceKind = "damai" | "bendibao" | "ranking";
export type Category = "演唱会" | "音乐节" | "展览" | "市集" | "节庆" | "亲子" | "线上热议";
export type Importance = "high" | "medium" | "low";

export interface RawSource {
  kind: SourceKind;
  label: string;
  url?: string;
  extra?: string;
}

export interface HotspotEvent {
  id: string;
  title: string;
  category: Category;
  city: string;
  venue?: string;
  date: string;
  dateRange?: string;
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
  {
    id: "h1", title: "周杰伦嘉年华世界巡回演唱会·上海站",
    category: "演唱会", city: "上海", venue: "上海体育场",
    date: "2026-04-18", dateRange: "2026-04-18 ~ 04-20",
    heatScore: 98700, heatTrend: 245,
    relatedVolume: { weibo: 12300, xhs: 4500, douyin: 8900 },
    sentiment: { pos: 82, neu: 12, neg: 6 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥455-2015" },
      { kind: "bendibao", label: "上海本地宝", extra: "周边交通指引" },
      { kind: "ranking", label: "微博热搜 #3", extra: "热度 98.7w" },
    ],
    description: "周杰伦嘉年华世界巡演上海三场连开，预计带动周边酒店、餐饮、出行需求显著增长，建议同程酒旅前置铺货。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-08 09:12", latestTime: "2026-04-15 22:45", itemCount: 248,
  },
  {
    id: "h2", title: "草莓音乐节·成都站",
    category: "音乐节", city: "成都", venue: "东安湖体育公园",
    date: "2026-05-01", dateRange: "2026-05-01 ~ 05-03",
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
  {
    id: "h3", title: "teamLab 无界美术馆·上海特展",
    category: "展览", city: "上海", venue: "黄浦滨江",
    date: "2026-04-15", dateRange: "2026-04-15 ~ 06-30",
    heatScore: 45200, heatTrend: 68,
    relatedVolume: { weibo: 3200, xhs: 18900, douyin: 6700 },
    sentiment: { pos: 88, neu: 10, neg: 2 },
    businessRelevance: 4,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略 · 门票 ¥199" },
      { kind: "ranking", label: "小红书热搜 #12", extra: "笔记 1.8w 篇" },
    ],
    description: "小红书种草型展览，亲子+情侣双客群，长期持续热度，适合做城市目的地内容营销。",
    crossSource: 2, importance: "medium",
    firstTime: "2026-04-05 10:00", latestTime: "2026-04-15 19:50", itemCount: 142,
  },
  {
    id: "h4", title: "五一返程高峰·机票退改话题",
    category: "线上热议", city: "全国",
    date: "2026-05-05",
    heatScore: 89400, heatTrend: 412,
    relatedVolume: { weibo: 23400, xhs: 2100, douyin: 11200 },
    sentiment: { pos: 12, neu: 28, neg: 60 },
    businessRelevance: 5,
    sources: [
      { kind: "ranking", label: "微博热搜 #5", extra: "热度 89w" },
      { kind: "ranking", label: "抖音热点 #14", extra: "话题 1100w 播放" },
    ],
    description: "返程高峰叠加天气因素，退改签投诉量陡增，建议客服团队提前扩容并准备话术。",
    crossSource: 1, isNew: true, importance: "high",
    firstTime: "2026-04-12 08:00", latestTime: "2026-04-15 23:10", itemCount: 312,
  },
  {
    id: "h5", title: "上海咖啡文化周",
    category: "市集", city: "上海", venue: "新天地、武康路等多处",
    date: "2026-04-20", dateRange: "2026-04-20 ~ 04-28",
    heatScore: 28900, heatTrend: 45,
    relatedVolume: { weibo: 1200, xhs: 12400, douyin: 3400 },
    sentiment: { pos: 91, neu: 8, neg: 1 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "上海本地宝", extra: "活动攻略" },
      { kind: "ranking", label: "小红书热搜 #28", extra: "笔记 1.2w" },
    ],
    description: "城市生活方式类活动，可作为目的地周边内容素材。",
    crossSource: 2, importance: "low",
    firstTime: "2026-04-09 11:30", latestTime: "2026-04-15 18:20", itemCount: 87,
  },
  {
    id: "h6", title: "薛之谦天外来物巡演·北京站",
    category: "演唱会", city: "北京", venue: "国家体育场",
    date: "2026-04-25", dateRange: "2026-04-25 ~ 04-26",
    heatScore: 76800, heatTrend: 178,
    relatedVolume: { weibo: 9800, xhs: 5200, douyin: 7100 },
    sentiment: { pos: 78, neu: 15, neg: 7 },
    businessRelevance: 5,
    sources: [
      { kind: "damai", label: "大麦网", extra: "票价 ¥380-1880" },
      { kind: "bendibao", label: "北京本地宝", extra: "鸟巢交通指引" },
      { kind: "ranking", label: "微博热搜 #11", extra: "热度 76w" },
    ],
    description: "鸟巢双场演唱会，京津冀客流为主，关注高铁+酒店组合包销售。",
    crossSource: 3, importance: "high",
    firstTime: "2026-04-07 09:00", latestTime: "2026-04-15 22:00", itemCount: 198,
  },
  {
    id: "h7", title: "广州春季亲子游园会",
    category: "亲子", city: "广州", venue: "天河区多个商圈",
    date: "2026-04-22", dateRange: "2026-04-22 ~ 04-24",
    heatScore: 18600, heatTrend: 22,
    relatedVolume: { weibo: 800, xhs: 4200, douyin: 2100 },
    sentiment: { pos: 86, neu: 12, neg: 2 },
    businessRelevance: 3,
    sources: [
      { kind: "bendibao", label: "广州本地宝", extra: "活动攻略" },
    ],
    description: "本地亲子客群活动，适合作为粤港澳片区目的地内容补充。",
    crossSource: 1, importance: "low",
    firstTime: "2026-04-11 16:00", latestTime: "2026-04-15 17:40", itemCount: 56,
  },
  {
    id: "h8", title: "成都国际车展",
    category: "展览", city: "成都", venue: "西博城",
    date: "2026-04-28", dateRange: "2026-04-28 ~ 05-05",
    heatScore: 52300, heatTrend: 89,
    relatedVolume: { weibo: 6700, xhs: 2300, douyin: 8400 },
    sentiment: { pos: 71, neu: 22, neg: 7 },
    businessRelevance: 4,
    sources: [
      { kind: "bendibao", label: "成都本地宝", extra: "展会攻略" },
      { kind: "ranking", label: "抖音热点 #22", extra: "话题 840w 播放" },
    ],
    description: "西部最大车展，跨城观展客流多，叠加五一长假，机酒需求集中。",
    crossSource: 2, isNew: true, importance: "medium",
    firstTime: "2026-04-08 13:15", latestTime: "2026-04-15 20:30", itemCount: 124,
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
    { id: `${event.id}-c1`, title: `${event.title} - 票务详情页`, source: "大麦网", kind: "damai", author: "大麦官方", publishTime: event.firstTime, region: event.city, heat: 5200, comments: 312, likes: 1240, url: "#" },
    { id: `${event.id}-c2`, title: `#${event.title.split("·")[0]}# 上榜微博热搜`, source: "微博热搜", kind: "ranking", author: "微博热搜榜", publishTime: event.firstTime, region: "全国", heat: 98700, comments: 4280, likes: 32100, url: "#" },
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
