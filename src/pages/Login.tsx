import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, BarChart3, Shield, Globe, Zap, Lightbulb } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const features = [
    { icon: Shield, label: "舆情监控", desc: "全网风险实时预警" },
    { icon: Globe, label: "行业洞察", desc: "竞品动态一手掌握" },
    { icon: Zap, label: "热点追踪", desc: "热点话题智能捕获" },
    { icon: Lightbulb, label: "体验分析", desc: "用户反馈精准洞察" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Features */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 w-full">
          {/* Logo & Title */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">外部洞察平台</h1>
                <p className="text-white/60 text-sm mt-0.5">Enterprise Insight Platform</p>
              </div>
            </div>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              全方位数据洞察引擎，整合多源数据，驱动业务增长与风险决策
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{f.label}</p>
                    <p className="text-white/55 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom stats */}
          <div className="mt-16 flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold text-white">674K+</p>
              <p className="text-white/50 text-xs mt-1">累计数据量</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-2xl font-bold text-white">7</p>
              <p className="text-white/50 text-xs mt-1">数据源接入</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-2xl font-bold text-white">98.2%</p>
              <p className="text-white/50 text-xs mt-1">数据完整率</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">外部洞察平台</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
            <p className="text-muted-foreground text-sm mt-2">登录您的账户以继续使用平台</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">邮箱地址</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">密码</label>
                <button type="button" className="text-xs text-primary hover:underline">忘记密码？</button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium">
              登 录
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 外部洞察平台 · 企业内部系统
          </p>
        </div>
      </div>
    </div>
  );
}
