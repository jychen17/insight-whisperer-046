import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import SentimentOverview from "@/pages/SentimentOverview";
import SentimentDetail from "@/pages/SentimentDetail";
import IndustryOverview from "@/pages/IndustryOverview";
import HotspotDiscover from "@/pages/HotspotDiscover";
import ExperienceOverview from "@/pages/ExperienceOverview";
import PlaceholderPage from "@/components/PlaceholderPage";
import ThemeSettings from "@/pages/ThemeSettings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
            <Route path="/datacenter/tasks" element={<PlaceholderPage title="采集任务管理" />} />
            <Route path="/datacenter/sources" element={<PlaceholderPage title="数据源配置" />} />
            <Route path="/datacenter/quality" element={<PlaceholderPage title="采集质量监控" />} />
            <Route path="/datacenter/tags/system" element={<PlaceholderPage title="标签体系" />} />
            <Route path="/datacenter/tags/rules" element={<PlaceholderPage title="标签规则" />} />
            <Route path="/datacenter/tags/quality" element={<PlaceholderPage title="标签质量" />} />
            <Route path="/datacenter/themes/manage" element={<ThemeSettings />} />
            <Route path="/datacenter/themes/rules" element={<PlaceholderPage title="规则配置" />} />
            <Route path="/datacenter/themes/dashboard" element={<PlaceholderPage title="看板配置" />} />
            {/* 分析工具 */}
            <Route path="/analysis/reports" element={<PlaceholderPage title="智能报告" />} />
            <Route path="/analysis/export" element={<PlaceholderPage title="数据导出" />} />
            <Route path="/analysis/custom" element={<PlaceholderPage title="自定义分析" />} />
            {/* 系统设置 */}
            <Route path="/settings/users" element={<PlaceholderPage title="用户管理" />} />
            <Route path="/settings/permissions" element={<PlaceholderPage title="权限管理" />} />
            <Route path="/settings/notifications" element={<PlaceholderPage title="通知设置" />} />
            <Route path="/settings/logs" element={<PlaceholderPage title="日志管理" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
