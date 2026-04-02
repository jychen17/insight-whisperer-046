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
  Bell,
  Search,
  Monitor,
  FolderOpen,
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
        ],
      },
      {
        label: "行业资讯主题",
        icon: <Globe className="w-4 h-4" />,
        children: [
          { label: "行业资讯大盘", path: "/industry/overview" },
          { label: "行业资讯列表", path: "/industry/detail" },
        ],
      },
      {
        label: "热点洞察主题",
        icon: <Zap className="w-4 h-4" />,
        children: [
          { label: "热点洞察大盘", path: "/hotspot/discover" },
          { label: "热点洞察列表", path: "/hotspot/detail" },
        ],
      },
      {
        label: "产品体验主题",
        icon: <Lightbulb className="w-4 h-4" />,
        children: [
          { label: "产品体验大盘", path: "/experience/overview" },
          { label: "产品体验列表", path: "/experience/detail" },
        ],
      },
      {
        label: "更多主题",
        icon: <FolderOpen className="w-4 h-4" />,
        children: [
          { label: "主题列表", path: "/themes/list" },
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
          { label: "关键词管理", path: "/datacenter/keywords" },
        ],
      },
      {
        label: "标签管理",
        icon: <Tags className="w-4 h-4" />,
        children: [
          { label: "标签体系", path: "/datacenter/tags/system" },
        ],
      },
      {
        label: "主题配置",
        icon: <Palette className="w-4 h-4" />,
        children: [
          { label: "主题管理", path: "/datacenter/themes/manage" },
          { label: "看板配置", path: "/datacenter/themes/dashboard" },
        ],
      },
      {
        label: "预警管理",
        icon: <Bell className="w-4 h-4" />,
        children: [
          { label: "预警配置", path: "/datacenter/themes/rules" },
          { label: "预警列表", path: "/datacenter/alerts/list" },
        ],
      },
    ],
  },
  {
    groupLabel: "专项监控",
    sections: [
      {
        label: "专项监控",
        icon: <Monitor className="w-4 h-4" />,
        children: [
          { label: "内容监控", path: "/monitor/content" },
          { label: "账户监控", path: "/monitor/account" },
          { label: "话题监控", path: "/monitor/topic" },
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
          { label: "报告配置", path: "/analysis/report-config" },
          { label: "报告模板", path: "/analysis/templates" },
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
