import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Shield,
  Globe,
  Zap,
  Lightbulb,
  Database,
  
  Tags,
  Palette,
  BarChart3,
  Settings,
  Users,
  Lock,
  Bell,
  FileText,
  Search,
} from "lucide-react";

interface NavChild {
  label: string;
  path: string;
}

interface NavSection {
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

interface NavGroup {
  groupLabel: string;
  sections: NavSection[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: "洞察主题",
    sections: [
      {
        label: "舆情主题",
        icon: <Shield className="w-4 h-4" />,
        children: [
          { label: "舆情大盘", path: "/sentiment/overview" },
          { label: "舆情列表", path: "/sentiment/detail" },
          { label: "舆情预警", path: "/sentiment/alerts" },
          { label: "舆情报告", path: "/sentiment/reports" },
        ],
      },
      {
        label: "行业咨询主题",
        icon: <Globe className="w-4 h-4" />,
        children: [
          { label: "行业大盘", path: "/industry/overview" },
          { label: "竞品监测", path: "/industry/competitors" },
          { label: "市场动态", path: "/industry/market" },
          { label: "趋势分析", path: "/industry/trends" },
        ],
      },
      {
        label: "热点洞察主题",
        icon: <Zap className="w-4 h-4" />,
        children: [
          { label: "热点发现", path: "/hotspot/discover" },
          { label: "话题分析", path: "/hotspot/topics" },
          { label: "关键词洞察", path: "/hotspot/keywords" },
          { label: "内容洞察", path: "/hotspot/content" },
        ],
      },
      {
        label: "产品体验主题",
        icon: <Lightbulb className="w-4 h-4" />,
        children: [
          { label: "体验概览", path: "/experience/overview" },
          { label: "问题分析", path: "/experience/issues" },
          { label: "用户反馈", path: "/experience/feedback" },
          { label: "优化建议", path: "/experience/suggestions" },
        ],
      },
    ],
  },
  {
    groupLabel: "数据中心",
    sections: [
      {
        label: "数据采集",
        icon: <Database className="w-4 h-4" />,
        children: [
          { label: "采集任务管理", path: "/datacenter/tasks" },
          { label: "数据源配置", path: "/datacenter/sources" },
          { label: "采集质量监控", path: "/datacenter/quality" },
        ],
      },
      {
        label: "标签管理",
        icon: <Tags className="w-4 h-4" />,
        children: [
          { label: "标签体系", path: "/datacenter/tags/system" },
          { label: "标签规则", path: "/datacenter/tags/rules" },
          { label: "标签质量", path: "/datacenter/tags/quality" },
        ],
      },
      {
        label: "主题配置",
        icon: <Palette className="w-4 h-4" />,
        children: [
          { label: "主题管理", path: "/datacenter/themes/manage" },
          { label: "规则配置", path: "/datacenter/themes/rules" },
          { label: "看板配置", path: "/datacenter/themes/dashboard" },
        ],
      },
    ],
  },
  {
    groupLabel: "分析工具",
    sections: [
      {
        label: "分析工具",
        icon: <BarChart3 className="w-4 h-4" />,
        children: [
          { label: "智能报告", path: "/analysis/reports" },
          { label: "数据导出", path: "/analysis/export" },
          { label: "自定义分析", path: "/analysis/custom" },
        ],
      },
    ],
  },
  {
    groupLabel: "系统设置",
    sections: [
      {
        label: "系统设置",
        icon: <Settings className="w-4 h-4" />,
        children: [
          { label: "用户管理", path: "/settings/users" },
          { label: "权限管理", path: "/settings/permissions" },
          { label: "通知设置", path: "/settings/notifications" },
          { label: "日志管理", path: "/settings/logs" },
        ],
      },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "舆情主题": true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-56 min-h-screen bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">外部洞察平台</span>
        </div>
      </div>
      <nav className="flex-1 py-1">
        {navGroups.map((group) => (
          <div key={group.groupLabel} className="mt-2">
            <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.groupLabel}
            </div>
            {group.sections.map((section) => (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
                >
                  <span className="text-primary">{section.icon}</span>
                  <span className="flex-1 text-left">{section.label}</span>
                  {openSections[section.label] ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                {openSections[section.label] && section.children && (
                  <div className="ml-4">
                    {section.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`block px-6 py-1.5 text-sm transition-colors ${
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
