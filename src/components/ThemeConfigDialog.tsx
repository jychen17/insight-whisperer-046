import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type {
  ThemeConfig,
  DataSourceConfig,
  TagRule,
  AnalysisConfig,
  AlertRule,
  DashboardWidget,
} from "@/pages/ThemeSettings";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeConfig | null;
  onSave: (theme: ThemeConfig) => void;
}

const ALL_PLATFORMS = ["小红书", "微博", "抖音", "快手", "百度", "今日头条", "黑猫投诉", "B站", "公众号", "视频号"];
const ALL_DIMENSIONS = ["情感", "业务", "平台", "时间", "话题", "品牌", "关键词", "问题类型", "产品线", "严重程度"];
const FORMULA_OPTIONS = ["COUNT", "RATIO", "TREND", "HEAT_SCORE", "GROWTH_RATE", "NPS_SCORE", "AVG", "SUM", "MAX", "MIN"];
const WIDGET_TYPES = [
  { value: "statCard", label: "统计卡片", icon: "📊" },
  { value: "lineChart", label: "折线图", icon: "📈" },
  { value: "pieChart", label: "饼图", icon: "🥧" },
  { value: "barChart", label: "柱状图", icon: "📉" },
  { value: "table", label: "数据表格", icon: "📋" },
];
const ICONS = ["🛡️", "🌐", "⚡", "💡", "🔥", "📡", "🎯", "🧭", "📊", "💬", "🔍", "🏷️"];

const emptyTheme: ThemeConfig = {
  id: "",
  name: "",
  description: "",
  type: "custom",
  status: "active",
  icon: "🎯",
  dataSources: [],
  tagRules: [],
  analysisConfig: { dimensions: [], metrics: [] },
  alertRules: [],
  dashboardWidgets: [],
  createdAt: "",
  updatedAt: "",
};

export default function ThemeConfigDialog({ open, onOpenChange, theme, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ThemeConfig>(emptyTheme);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!theme;
  const steps = ["基本信息", "数据源", "标签规则", "分析配置", "预警规则", "看板配置"];

  useEffect(() => {
    if (open) {
      setStep(0);
      setErrors({});
      setForm(
        theme
          ? { ...theme }
          : {
              ...emptyTheme,
              id: `custom_${Date.now()}`,
              createdAt: new Date().toISOString().slice(0, 10),
              updatedAt: new Date().toISOString().slice(0, 10),
            }
      );
    }
  }, [open, theme]);

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) newErrors.name = "请输入主题名称";
      else if (form.name.trim().length > 20) newErrors.name = "主题名称不能超过20个字符";
      if (!form.description.trim()) newErrors.description = "请输入主题描述";
      else if (form.description.trim().length > 100) newErrors.description = "主题描述不能超过100个字符";
    }
    if (s === 1 && form.dataSources.length === 0) {
      newErrors.dataSources = "请至少添加一个数据源";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = () => {
    if (validateStep(step)) {
      onSave({ ...form, updatedAt: new Date().toISOString().slice(0, 10) });
    }
  };

  // Data source helpers
  const addDataSource = () => {
    setForm((f) => ({
      ...f,
      dataSources: [
        ...f.dataSources,
        { taskId: `t_${Date.now()}`, taskName: "", platforms: [], timeRange: "近7天", enabled: true },
      ],
    }));
  };

  const updateDataSource = (index: number, update: Partial<DataSourceConfig>) => {
    setForm((f) => ({
      ...f,
      dataSources: f.dataSources.map((ds, i) => (i === index ? { ...ds, ...update } : ds)),
    }));
  };

  const removeDataSource = (index: number) => {
    setForm((f) => ({ ...f, dataSources: f.dataSources.filter((_, i) => i !== index) }));
  };

  // Tag rule helpers
  const addTagRule = () => {
    setForm((f) => ({
      ...f,
      tagRules: [...f.tagRules, { id: `r_${Date.now()}`, type: "required", tagName: "", tagValue: "" }],
    }));
  };

  const updateTagRule = (index: number, update: Partial<TagRule>) => {
    setForm((f) => ({
      ...f,
      tagRules: f.tagRules.map((r, i) => (i === index ? { ...r, ...update } : r)),
    }));
  };

  const removeTagRule = (index: number) => {
    setForm((f) => ({ ...f, tagRules: f.tagRules.filter((_, i) => i !== index) }));
  };

  // Metric helpers
  const addMetric = () => {
    setForm((f) => ({
      ...f,
      analysisConfig: {
        ...f.analysisConfig,
        metrics: [...f.analysisConfig.metrics, { name: "", formula: "COUNT", condition: "" }],
      },
    }));
  };

  const updateMetric = (index: number, update: Partial<{ name: string; formula: string; condition: string }>) => {
    setForm((f) => ({
      ...f,
      analysisConfig: {
        ...f.analysisConfig,
        metrics: f.analysisConfig.metrics.map((m, i) => (i === index ? { ...m, ...update } : m)),
      },
    }));
  };

  const removeMetric = (index: number) => {
    setForm((f) => ({
      ...f,
      analysisConfig: { ...f.analysisConfig, metrics: f.analysisConfig.metrics.filter((_, i) => i !== index) },
    }));
  };

  const toggleDimension = (dim: string) => {
    setForm((f) => ({
      ...f,
      analysisConfig: {
        ...f.analysisConfig,
        dimensions: f.analysisConfig.dimensions.includes(dim)
          ? f.analysisConfig.dimensions.filter((d) => d !== dim)
          : [...f.analysisConfig.dimensions, dim],
      },
    }));
  };

  // Alert rule helpers
  const addAlertRule = () => {
    setForm((f) => ({
      ...f,
      alertRules: [...f.alertRules, { id: `a_${Date.now()}`, condition: "", threshold: 0, level: "warning" }],
    }));
  };

  const updateAlertRule = (index: number, update: Partial<AlertRule>) => {
    setForm((f) => ({
      ...f,
      alertRules: f.alertRules.map((r, i) => (i === index ? { ...r, ...update } : r)),
    }));
  };

  const removeAlertRule = (index: number) => {
    setForm((f) => ({ ...f, alertRules: f.alertRules.filter((_, i) => i !== index) }));
  };

  // Widget helpers
  const addWidget = () => {
    setForm((f) => ({
      ...f,
      dashboardWidgets: [
        ...f.dashboardWidgets,
        { id: `w_${Date.now()}`, type: "statCard", title: "", metric: "", position: f.dashboardWidgets.length + 1 },
      ],
    }));
  };

  const updateWidget = (index: number, update: Partial<DashboardWidget>) => {
    setForm((f) => ({
      ...f,
      dashboardWidgets: f.dashboardWidgets.map((w, i) => (i === index ? { ...w, ...update } : w)),
    }));
  };

  const removeWidget = (index: number) => {
    setForm((f) => ({ ...f, dashboardWidgets: f.dashboardWidgets.filter((_, i) => i !== index) }));
  };

  const togglePlatform = (dsIndex: number, platform: string) => {
    const ds = form.dataSources[dsIndex];
    const newPlatforms = ds.platforms.includes(platform)
      ? ds.platforms.filter((p) => p !== platform)
      : [...ds.platforms, platform];
    updateDataSource(dsIndex, { platforms: newPlatforms });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[800px] max-h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "编辑主题" : "新建主题"}
          </h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border shrink-0 overflow-x-auto">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => { if (i < step || validateStep(step)) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                i === step
                  ? "gradient-primary text-primary-foreground font-medium"
                  : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-muted-foreground/20"
              }`}>
                {i + 1}
              </span>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">主题图标</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-md border text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? "border-primary bg-accent" : "border-border hover:bg-muted"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：竞品价格监测"
                  maxLength={20}
                />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题描述 *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={2}
                  placeholder="描述主题的核心目标和用途"
                  maxLength={100}
                />
                {errors.description && <p className="text-[11px] text-destructive mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">数据源列表</label>
                <button onClick={addDataSource} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3 h-3" /> 添加数据源
                </button>
              </div>
              {errors.dataSources && <p className="text-[11px] text-destructive">{errors.dataSources}</p>}
              {form.dataSources.map((ds, i) => (
                <div key={ds.taskId} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">数据源 #{i + 1}</span>
                    <button onClick={() => removeDataSource(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground">任务名称</label>
                      <input
                        value={ds.taskName}
                        onChange={(e) => updateDataSource(i, { taskName: e.target.value })}
                        className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                        placeholder="如：同程-万达"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">时间范围</label>
                      <select
                        value={ds.timeRange}
                        onChange={(e) => updateDataSource(i, { timeRange: e.target.value })}
                        className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                      >
                        <option>实时</option>
                        <option>近7天</option>
                        <option>近15天</option>
                        <option>近30天</option>
                        <option>近90天</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">覆盖平台</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {ALL_PLATFORMS.map((p) => (
                        <button
                          key={p}
                          onClick={() => togglePlatform(i, p)}
                          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                            ds.platforms.includes(p)
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-card text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">标签规则</label>
                <button onClick={addTagRule} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3 h-3" /> 添加规则
                </button>
              </div>
              {form.tagRules.map((rule, i) => (
                <div key={rule.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                  <select
                    value={rule.type}
                    onChange={(e) => updateTagRule(i, { type: e.target.value as TagRule["type"] })}
                    className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  >
                    <option value="required">必需标签</option>
                    <option value="filter">过滤标签</option>
                    <option value="weight">权重标签</option>
                  </select>
                  <input
                    value={rule.tagName}
                    onChange={(e) => updateTagRule(i, { tagName: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="标签名称"
                    maxLength={30}
                  />
                  <input
                    value={rule.tagValue}
                    onChange={(e) => updateTagRule(i, { tagValue: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="标签值"
                    maxLength={30}
                  />
                  {rule.type === "weight" && (
                    <input
                      type="number"
                      value={rule.weight ?? 0}
                      onChange={(e) => updateTagRule(i, { weight: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                      placeholder="权重"
                      min={0}
                      max={100}
                    />
                  )}
                  <button onClick={() => removeTagRule(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.tagRules.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">暂无标签规则，点击上方按钮添加</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-foreground">分析维度</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ALL_DIMENSIONS.map((dim) => (
                    <button
                      key={dim}
                      onClick={() => toggleDimension(dim)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        form.analysisConfig.dimensions.includes(dim)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">指标配置</label>
                  <button onClick={addMetric} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="w-3 h-3" /> 添加指标
                  </button>
                </div>
                {form.analysisConfig.metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <input
                      value={m.name}
                      onChange={(e) => updateMetric(i, { name: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                      placeholder="指标名称"
                      maxLength={30}
                    />
                    <select
                      value={m.formula}
                      onChange={(e) => updateMetric(i, { formula: e.target.value })}
                      className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                    >
                      {FORMULA_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                    <input
                      value={m.condition ?? ""}
                      onChange={(e) => updateMetric(i, { condition: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                      placeholder="条件（可选）"
                      maxLength={50}
                    />
                    <button onClick={() => removeMetric(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">预警规则</label>
                <button onClick={addAlertRule} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3 h-3" /> 添加规则
                </button>
              </div>
              {form.alertRules.map((rule, i) => (
                <div key={rule.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                  <input
                    value={rule.condition}
                    onChange={(e) => updateAlertRule(i, { condition: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="触发条件，如：负面舆情数"
                    maxLength={50}
                  />
                  <span className="text-xs text-muted-foreground">&gt;</span>
                  <input
                    type="number"
                    value={rule.threshold}
                    onChange={(e) => updateAlertRule(i, { threshold: Number(e.target.value) })}
                    className="w-20 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="阈值"
                    min={0}
                  />
                  <select
                    value={rule.level}
                    onChange={(e) => updateAlertRule(i, { level: e.target.value as "warning" | "critical" })}
                    className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  >
                    <option value="warning">警告</option>
                    <option value="critical">严重</option>
                  </select>
                  <button onClick={() => removeAlertRule(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.alertRules.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">暂无预警规则</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">看板组件</label>
                <button onClick={addWidget} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3 h-3" /> 添加组件
                </button>
              </div>
              {form.dashboardWidgets.map((widget, i) => (
                <div key={widget.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                  <select
                    value={widget.type}
                    onChange={(e) => updateWidget(i, { type: e.target.value as DashboardWidget["type"] })}
                    className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                  >
                    {WIDGET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <input
                    value={widget.title}
                    onChange={(e) => updateWidget(i, { title: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="组件标题"
                    maxLength={30}
                  />
                  <input
                    value={widget.metric}
                    onChange={(e) => updateWidget(i, { metric: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="关联指标"
                    maxLength={30}
                  />
                  <button onClick={() => removeWidget(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.dashboardWidgets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">暂无看板组件</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
          <div className="text-[11px] text-muted-foreground">
            步骤 {step + 1} / {steps.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
            >
              取消
            </button>
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
              >
                上一步
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium"
              >
                {isEdit ? "保存修改" : "创建主题"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
