import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import SentimentOverview from "@/pages/SentimentOverview";
import SentimentDetail from "@/pages/SentimentDetail";
import IndustryOverview from "@/pages/IndustryOverview";
import HotspotDiscover from "@/pages/HotspotDiscover";
import ExperienceOverview from "@/pages/ExperienceOverview";
import PlaceholderPage from "@/components/PlaceholderPage";
import ThemeList from "@/pages/ThemeList";
import ThemeSettings from "@/pages/ThemeSettings";
import ThemeDetail from "@/pages/ThemeDetail";
import NotFound from "./pages/NotFound.tsx";
import AIChatBot from "@/components/AIChatBot";
// 数据中心
import CollectionTasks from "@/pages/datacenter/CollectionTasks";
import KeywordManage from "@/pages/datacenter/KeywordManage";
import TagSystem from "@/pages/datacenter/TagSystem";
import ThemeRules from "@/pages/datacenter/ThemeRules";
import DashboardConfig from "@/pages/datacenter/DashboardConfig";
// 分析工具
import SmartReports from "@/pages/analysis/SmartReports";
import ReportConfig from "@/pages/analysis/ReportConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            {/* 洞察主题 - 舆情 */}
            <Route path="/sentiment/overview" element={<SentimentOverview />} />
            <Route path="/sentiment/detail" element={<SentimentDetail />} />
            {/* 洞察主题 - 行业资讯 */}
            <Route path="/industry/overview" element={<IndustryOverview />} />
            <Route path="/industry/detail" element={<PlaceholderPage title="行业资讯列表" />} />
            {/* 洞察主题 - 热点洞察 */}
            <Route path="/hotspot/discover" element={<HotspotDiscover />} />
            <Route path="/hotspot/detail" element={<PlaceholderPage title="热点洞察列表" />} />
            {/* 洞察主题 - 产品体验 */}
            <Route path="/experience/overview" element={<ExperienceOverview />} />
            <Route path="/experience/detail" element={<PlaceholderPage title="产品体验列表" />} />
            {/* 洞察主题 - 更多主题 */}
            <Route path="/themes/list" element={<PlaceholderPage title="主题列表" />} />
            {/* 数据中心 */}
            <Route path="/datacenter/tasks" element={<CollectionTasks />} />
            <Route path="/datacenter/keywords" element={<KeywordManage />} />
            <Route path="/datacenter/tags/system" element={<TagSystem />} />
            <Route path="/datacenter/themes/manage" element={<ThemeSettings />} />
            <Route path="/datacenter/themes/detail" element={<ThemeDetail />} />
            <Route path="/datacenter/themes/dashboard" element={<DashboardConfig />} />
            {/* 预警管理 */}
            <Route path="/datacenter/themes/rules" element={<ThemeRules />} />
            <Route path="/datacenter/alerts/list" element={<PlaceholderPage title="预警列表" />} />
            {/* 专项监控 */}
            <Route path="/monitor/content" element={<PlaceholderPage title="内容监控" />} />
            <Route path="/monitor/account" element={<PlaceholderPage title="账户监控" />} />
            <Route path="/monitor/topic" element={<PlaceholderPage title="话题监控" />} />
            {/* 分析工具 */}
            <Route path="/analysis/reports" element={<SmartReports />} />
            <Route path="/analysis/report-config" element={<ReportConfig />} />
            <Route path="/analysis/templates" element={<PlaceholderPage title="报告模板" />} />
            {/* 系统设置 */}
            <Route path="/settings/users" element={<PlaceholderPage title="用户管理" />} />
            <Route path="/settings/permissions" element={<PlaceholderPage title="权限管理" />} />
            <Route path="/settings/notifications" element={<PlaceholderPage title="通知设置" />} />
            <Route path="/settings/logs" element={<PlaceholderPage title="日志管理" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
