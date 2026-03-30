import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  ListOrdered,
  Bell,
  BarChart3,
  Hash,
  Settings,
  Shield,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Zap,
  Globe,
  Eye,
} from "lucide-react";

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const themes: NavItem[] = [
  {
    label: "舆情监控",
    icon: <Shield className="w-4 h-4" />,
    children: [
      { label: "舆情概览", path: "/sentiment/overview" },
      { label: "舆情详情", path: "/sentiment/detail" },
      { label: "报告列表", path: "/sentiment/reports" },
      { label: "订阅管理", path: "/sentiment/subscriptions" },
    ],
  },
  {
    label: "行业咨询",
    icon: <Globe className="w-4 h-4" />,
    children: [
      { label: "行业大盘", path: "/industry/overview" },
      { label: "竞品监测", path: "/industry/competitors" },
      { label: "市场动态", path: "/industry/market" },
    ],
  },
  {
    label: "热点洞察",
    icon: <Zap className="w-4 h-4" />,
    children: [
      { label: "热点发现", path: "/hotspot/discover" },
      { label: "话题分析", path: "/hotspot/topics" },
      { label: "关键词洞察", path: "/hotspot/keywords" },
    ],
  },
  {
    label: "产品体验",
    icon: <Lightbulb className="w-4 h-4" />,
    children: [
      { label: "体验概览", path: "/experience/overview" },
      { label: "问题分析", path: "/experience/issues" },
      { label: "用户反馈", path: "/experience/feedback" },
    ],
  },
  {
    label: "品牌声量",
    icon: <BarChart3 className="w-4 h-4" />,
    children: [
      { label: "热点榜单", path: "/brand/hotlist" },
      { label: "旅行服务榜", path: "/brand/service" },
    ],
  },
  {
    label: "系统设置",
    icon: <Settings className="w-4 h-4" />,
    children: [
      { label: "规则配置", path: "/settings/rules" },
      { label: "爬虫任务", path: "/settings/crawlers" },
      { label: "关键词管理", path: "/settings/keywords" },
      { label: "主题配置", path: "/settings/themes" },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "舆情监控": true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-52 min-h-screen bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">外部洞察平台</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {themes.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => toggleSection(item.label)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
            >
              <span className="text-primary">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {openSections[item.label] ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {openSections[item.label] && item.children && (
              <div className="ml-4">
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`block px-6 py-2 text-sm transition-colors ${
                      isActive(child.path)
                        ? "text-primary font-medium bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
