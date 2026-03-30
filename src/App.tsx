import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import SentimentOverview from "@/pages/SentimentOverview";
import SentimentDetail from "@/pages/SentimentDetail";
import IndustryOverview from "@/pages/IndustryOverview";
import HotspotDiscover from "@/pages/HotspotDiscover";
import ExperienceOverview from "@/pages/ExperienceOverview";
import PlaceholderPage from "@/components/PlaceholderPage";
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
            <Route path="/" element={<SentimentOverview />} />
            <Route path="/sentiment/detail" element={<SentimentDetail />} />
            <Route path="/sentiment/reports" element={<PlaceholderPage title="报告列表" />} />
            <Route path="/sentiment/subscriptions" element={<PlaceholderPage title="订阅管理" />} />
            <Route path="/industry/overview" element={<IndustryOverview />} />
            <Route path="/industry/competitors" element={<PlaceholderPage title="竞品监测" />} />
            <Route path="/industry/market" element={<PlaceholderPage title="市场动态" />} />
            <Route path="/hotspot/discover" element={<HotspotDiscover />} />
            <Route path="/hotspot/topics" element={<PlaceholderPage title="话题分析" />} />
            <Route path="/hotspot/keywords" element={<PlaceholderPage title="关键词洞察" />} />
            <Route path="/experience/overview" element={<ExperienceOverview />} />
            <Route path="/experience/issues" element={<PlaceholderPage title="问题分析" />} />
            <Route path="/experience/feedback" element={<PlaceholderPage title="用户反馈" />} />
            <Route path="/brand/hotlist" element={<PlaceholderPage title="热点榜单" />} />
            <Route path="/brand/service" element={<PlaceholderPage title="旅行服务榜" />} />
            <Route path="/settings/rules" element={<PlaceholderPage title="规则配置" />} />
            <Route path="/settings/crawlers" element={<PlaceholderPage title="爬虫任务" />} />
            <Route path="/settings/keywords" element={<PlaceholderPage title="关键词管理" />} />
            <Route path="/settings/themes" element={<PlaceholderPage title="主题配置" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
