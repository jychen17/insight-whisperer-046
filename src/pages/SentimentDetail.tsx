import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const filters = {
  brands: ["同程旅行", "携程", "美团", "飞猪", "去哪儿"],
  platforms: ["全部", "小红书", "新浪微博", "抖音", "百度", "黑猫投诉APP"],
  business: ["国内机票", "国内酒店", "旅游", "金服", "用车", "人资"],
};

const sentimentItems = [
  {
    id: 1,
    title: "避雷❌长沙雅致酒店（IFS国金中心旗舰店）",
    platform: "小红书",
    author: "舒马曦",
    contentType: "视频",
    userType: "普通用户",
    fans: "10+粉丝",
    publishTime: "2026-03-29 16:32:49",
    collectTime: "2026-03-30 11:08:57",
    region: "湖南",
    riskLevel: "一般",
    speed: "低",
    business: "同程旅行-国内酒店",
    sentiment: "负向情感-客户投诉",
    issueType: "其他",
    summary: "用户投诉长沙雅致酒店装修噪音扰民且未提前告知，处理方案不合理（投诉风险，品牌声誉风险）",
    comments: 2,
    likes: 0,
    collects: 0,
    shares: 0,
  },
  {
    id: 2,
    title: "骂机票 ✈",
    platform: "小红书",
    author: "蔡尔朗朗朗",
    contentType: "图文",
    userType: "普通用户",
    fans: "10+粉丝",
    publishTime: "2026-03-29 21:33:04",
    collectTime: "2026-03-30 11:07:02",
    region: "江苏",
    riskLevel: "一般",
    speed: "高",
    business: "同程旅行-国内机票",
    sentiment: "负向情感-客户投诉",
    issueType: "机票退改",
    summary: "用户因不满多家OTA平台机票价格暴涨，威胁刺激抵制（投诉风险，品牌声誉风险）",
    comments: 53,
    likes: 0,
    collects: 0,
    shares: 0,
  },
  {
    id: 3,
    title: "同程金融借贷还款无门，债权转让金额乱，求帮忙协商",
    platform: "黑猫投诉APP",
    author: "润家曦",
    contentType: "图文",
    userType: "未知",
    fans: "未知",
    publishTime: "2026-03-29 22:39:03",
    collectTime: "2026-03-30 10:45:16",
    region: "-",
    riskLevel: "一般",
    speed: "低",
    business: "同程旅行-金服",
    sentiment: "负向情感-客户投诉",
    issueType: "金融服务",
    summary: "用户投诉同程金融借贷产品还款困难，债权转让金额混乱",
    comments: 0,
    likes: 0,
    collects: 0,
    shares: 0,
  },
  {
    id: 4,
    title: "同程旅行隐瞒机票全损规则，2232元仅退83元",
    platform: "黑猫投诉APP",
    author: "匿名",
    contentType: "图文",
    userType: "未知",
    fans: "未知",
    publishTime: "2026-03-29 21:34:41",
    collectTime: "2026-03-30 10:00:24",
    region: "-",
    riskLevel: "一般",
    speed: "低",
    business: "同程旅行-国内机票",
    sentiment: "负向情感-客户投诉",
    issueType: "机票退改",
    summary: "用户投诉同程旅行隐瞒机票退改全损规则，高额机票仅退83元",
    comments: 0,
    likes: 0,
    collects: 0,
    shares: 0,
  },
];

export default function SentimentDetail() {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">舆情详情</h1>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button className="px-3 py-1 text-xs bg-primary text-primary-foreground">舆情内容</button>
            <button className="px-3 py-1 text-xs bg-card text-muted-foreground border-l border-border">全部内容</button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">导出所选数据</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">导出全部数据</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">预警设置</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-card text-foreground">报告设置</button>
        </div>
      </div>

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

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <select className="px-2 py-1 border border-border rounded-md bg-card text-foreground">
            <option>收录时间降序</option>
            <option>发布时间降序</option>
          </select>
          <label className="flex items-center gap-1"><input type="checkbox" className="rounded" /> 全选</label>
        </div>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 text-xs ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
          >卡片模式</button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs border-l border-border ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
          >列表模式</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {sentimentItems.map((item) => (
          <div key={item.id} className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground cursor-pointer hover:text-primary">{item.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                  <span>{item.platform}</span>
                  <span>发布者: {item.author}</span>
                  <span>内容类型: {item.contentType}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.userType}</Badge>
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/80">{item.fans}</Badge>
                </div>
              </div>
              <input type="checkbox" className="mt-1 rounded" />
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
            <div className="text-destructive text-xs font-medium">
              AI摘要：{item.summary}
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span>评论量: {item.comments}</span>
              <span>点赞量: {item.likes}</span>
              <span>收藏量: {item.collects}</span>
              <span>分享量: {item.shares}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
