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
import ThemeSettings from "@/pages/ThemeSettings";
import NotFound from "./pages/NotFound.tsx";
import AIChatBot from "@/components/AIChatBot";
// 数据中心
import CollectionTasks from "@/pages/datacenter/CollectionTasks";
import DataSourceConfig from "@/pages/datacenter/DataSourceConfig";
import CollectionQuality from "@/pages/datacenter/CollectionQuality";
import KeywordManage from "@/pages/datacenter/KeywordManage";
import TagSystem from "@/pages/datacenter/TagSystem";
import TagRules from "@/pages/datacenter/TagRules";
import TagQuality from "@/pages/datacenter/TagQuality";
import ThemeRules from "@/pages/datacenter/ThemeRules";
import DashboardConfig from "@/pages/datacenter/DashboardConfig";
// 分析工具
import SmartReports from "@/pages/analysis/SmartReports";
import ReportConfig from "@/pages/analysis/ReportConfig";
import DataExport from "@/pages/analysis/DataExport";
import CustomAnalysis from "@/pages/analysis/CustomAnalysis";

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
            <Route path="/sentiment/alerts" element={<PlaceholderPage title="舆情预警" />} />
            <Route path="/sentiment/reports" element={<PlaceholderPage title="舆情报告" />} />
            {/* 洞察主题 - 行业 */}
            <Route path="/industry/overview" element={<IndustryOverview />} />
            <Route path="/industry/competitors" element={<PlaceholderPage title="竞品监测" />} />
            <Route path="/industry/market" element={<PlaceholderPage title="市场动态" />} />
            <Route path="/industry/trends" element={<PlaceholderPage title="趋势分析" />} />
            {/* 洞察主题 - 热点 */}
            <Route path="/hotspot/discover" element={<HotspotDiscover />} />
            <Route path="/hotspot/topics" element={<PlaceholderPage title="话题分析" />} />
            <Route path="/hotspot/keywords" element={<PlaceholderPage title="关键词洞察" />} />
            <Route path="/hotspot/content" element={<PlaceholderPage title="内容洞察" />} />
            {/* 洞察主题 - 体验 */}
            <Route path="/experience/overview" element={<ExperienceOverview />} />
            <Route path="/experience/issues" element={<PlaceholderPage title="问题分析" />} />
            <Route path="/experience/feedback" element={<PlaceholderPage title="用户反馈" />} />
            <Route path="/experience/suggestions" element={<PlaceholderPage title="优化建议" />} />
            {/* 数据中心 */}
            <Route path="/datacenter/tasks" element={<CollectionTasks />} />
            <Route path="/datacenter/sources" element={<DataSourceConfig />} />
            <Route path="/datacenter/quality" element={<CollectionQuality />} />
            <Route path="/datacenter/keywords" element={<KeywordManage />} />
            <Route path="/datacenter/tags/system" element={<TagSystem />} />
            <Route path="/datacenter/tags/rules" element={<TagRules />} />
            <Route path="/datacenter/tags/quality" element={<TagQuality />} />
            <Route path="/datacenter/themes/manage" element={<ThemeSettings />} />
            <Route path="/datacenter/themes/rules" element={<ThemeRules />} />
            <Route path="/datacenter/themes/dashboard" element={<DashboardConfig />} />
            {/* 分析工具 */}
            <Route path="/analysis/reports" element={<SmartReports />} />
            <Route path="/analysis/report-config" element={<ReportConfig />} />
            <Route path="/analysis/export" element={<DataExport />} />
            <Route path="/analysis/custom" element={<CustomAnalysis />} />
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
