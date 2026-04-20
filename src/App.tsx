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
import EventDetail from "@/pages/EventDetail";
import ArticleDetail from "@/pages/ArticleDetail";
import EventAlert from "@/pages/EventAlert";
import NotFound from "./pages/NotFound.tsx";
import AIChatBot from "@/components/AIChatBot";
// 数据中心
import CollectionTasks from "@/pages/datacenter/CollectionTasks";
import KeywordManage from "@/pages/datacenter/KeywordManage";
import TagSystem from "@/pages/datacenter/TagSystem";
import ModelManage from "@/pages/datacenter/ModelManage";
import ThemeRules from "@/pages/datacenter/ThemeRules";
import DashboardConfig from "@/pages/datacenter/DashboardConfig";
// 分析工具
import SmartReports from "@/pages/analysis/SmartReports";
import ReportConfig from "@/pages/analysis/ReportConfig";
import AnalysisHome from "@/pages/analysis/AnalysisHome";
import ReportManagement from "@/pages/analysis/ReportManagement";
import ReportTemplates from "@/pages/analysis/ReportTemplates";

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
            <Route path="/sentiment/event-detail" element={<EventDetail />} />
            <Route path="/sentiment/article/:id" element={<ArticleDetail />} />
            <Route path="/sentiment/event-alert" element={<EventAlert />} />
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
            <Route path="/themes/list" element={<ThemeList />} />
            {/* 数据中心 */}
            <Route path="/datacenter/tasks" element={<CollectionTasks />} />
            <Route path="/datacenter/keywords" element={<KeywordManage />} />
            <Route path="/datacenter/tags/system" element={<TagSystem />} />
            <Route path="/datacenter/tags/models" element={<ModelManage />} />
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
            <Route path="/analysis/home" element={<AnalysisHome />} />
            <Route path="/analysis/reports" element={<SmartReports />} />
            <Route path="/analysis/report-config" element={<ReportConfig />} />
            <Route path="/analysis/report-manage" element={<ReportManagement />} />
            <Route path="/analysis/report-templates" element={<ReportTemplates />} />
            {/* 系统设置 */}
            <Route path="/settings/fields" element={<PlaceholderPage title="字段管理" />} />
            <Route path="/settings/crawlers" element={<PlaceholderPage title="爬虫管理" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
