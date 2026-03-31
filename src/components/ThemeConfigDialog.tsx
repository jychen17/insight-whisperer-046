import { useState, useEffect } from "react";
import { X, Plus, Trash2, Eye, GripVertical, GitMerge, ArrowUp, ArrowDown } from "lucide-react";
import type {
  ThemeConfig,
  DataSourceConfig,
  TagRule,
  DashboardWidget,
  FieldConfig,
  MergeNode,
} from "@/pages/ThemeSettings";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeConfig | null;
  onSave: (theme: ThemeConfig) => void;
}

const MOCK_TASKS = [
  { id: "t1", name: "同程-万达", platforms: ["小红书", "微博", "抖音"], status: "running" },
  { id: "t2", name: "同程-金服", platforms: ["微博", "黑猫投诉"], status: "running" },
  { id: "t3", name: "同程-基础监控", platforms: ["百度", "今日头条"], status: "running" },
  { id: "t4", name: "OTA行业监控", platforms: ["微博", "抖音", "小红书", "百度"], status: "running" },
  { id: "t5", name: "全平台热点", platforms: ["微博", "抖音", "小红书", "百度", "快手"], status: "running" },
  { id: "t6", name: "用户反馈监控", platforms: ["小红书", "黑猫投诉", "微博"], status: "paused" },
  { id: "t7", name: "竞品价格监控", platforms: ["抖音", "小红书"], status: "running" },
];

const BASE_FIELDS = [
  { key: "sentiment", label: "情感倾向", type: "AI标签" },
  { key: "risk_level", label: "风险等级", type: "AI标签" },
  { key: "topic", label: "话题分类", type: "AI标签" },
  { key: "intent", label: "用户意图", type: "AI标签" },
  { key: "platform", label: "平台", type: "原生字段" },
  { key: "publish_time", label: "发布时间", type: "原生字段" },
  { key: "author", label: "作者", type: "原生字段" },
  { key: "content", label: "内容正文", type: "原生字段" },
  { key: "likes", label: "点赞数", type: "原生字段" },
  { key: "comments", label: "评论数", type: "原生字段" },
  { key: "shares", label: "分享数", type: "原生字段" },
  { key: "reads", label: "阅读数", type: "原生字段" },
];

const CALC_FIELDS = [
  { key: "heat_score", label: "热度指数", formula: "LOG(互动量) × 时间衰减因子" },
  { key: "risk_score", label: "风险分数", formula: "(互动量×0.5 + 风险等级×0.5)" },
  { key: "ferment_level", label: "发酵等级", formula: "IF(评论量<10,'低',IF(≤50,'中','快'))" },
  { key: "sov", label: "SOV份额", formula: "品牌声量/行业总声量×100%" },
  { key: "nps", label: "NPS评分", formula: "(推荐者%-贬损者%)×100" },
  { key: "growth_rate", label: "增长率", formula: "(本期-上期)/上期×100%" },
];

const WIDGET_TYPES = [
  { value: "statCard", label: "统计卡片", icon: "📊" },
  { value: "lineChart", label: "折线图", icon: "📈" },
  { value: "pieChart", label: "饼图", icon: "🥧" },
  { value: "barChart", label: "柱状图", icon: "📉" },
  { value: "table", label: "数据表格", icon: "📋" },
];

const MERGE_TYPES = [
  { value: "text_similarity", label: "文本相似度", desc: "根据内容文本的语义相似度进行合并" },
  { value: "field_group", label: "字段分组", desc: "按指定字段值相同进行合并分组" },
  { value: "time_window", label: "时间窗口", desc: "在指定时间范围内的数据合并" },
  { value: "custom", label: "自定义规则", desc: "自定义合并逻辑表达式" },
];

const ICONS = ["🛡️", "🌐", "⚡", "💡", "🔥", "📡", "🎯", "🧭", "📊", "💬", "🔍", "🏷️"];

const emptyTheme: ThemeConfig = {
  id: "",
  name: "",
  description: "",
  owner: "",
  type: "custom",
  status: "active",
  icon: "🎯",
  dataSources: [],
  tagRules: [],
  baseFields: [],
  calcFields: [],
  fieldConfigs: [],
  mergeNodes: [],
  dashboardWidgets: [],
  createdAt: "",
  updatedAt: "",
};

export default function ThemeConfigDialog({ open, onOpenChange, theme, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ThemeConfig>(emptyTheme);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const isEdit = !!theme;
  const steps = ["基本信息", "数据源", "标签规则与字段", "合并管线", "看板配置"];

  useEffect(() => {
    if (open) {
      setStep(0);
      setErrors({});
      setPreviewMode(false);
      setForm(
        theme
          ? { ...theme, mergeNodes: theme.mergeNodes || [] }
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
      if (!form.description.trim()) newErrors.description = "请输入主题描述";
      if (!form.owner.trim()) newErrors.owner = "请输入负责人";
    }
    if (s === 1 && form.dataSources.length === 0) {
      newErrors.dataSources = "请至少选择一个采集任务";
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

  const toggleTask = (task: typeof MOCK_TASKS[0]) => {
    setForm((f) => {
      const exists = f.dataSources.find((ds) => ds.taskId === task.id);
      if (exists) return { ...f, dataSources: f.dataSources.filter((ds) => ds.taskId !== task.id) };
      return { ...f, dataSources: [...f.dataSources, { taskId: task.id, taskName: task.name, platforms: task.platforms, timeRange: "近7天", enabled: true }] };
    });
  };

  const addTagRule = () => {
    setForm((f) => ({ ...f, tagRules: [...f.tagRules, { id: `r_${Date.now()}`, type: "required", tagName: "", tagValue: "" }] }));
  };
  const updateTagRule = (index: number, update: Partial<TagRule>) => {
    setForm((f) => ({ ...f, tagRules: f.tagRules.map((r, i) => (i === index ? { ...r, ...update } : r)) }));
  };
  const removeTagRule = (index: number) => {
    setForm((f) => ({ ...f, tagRules: f.tagRules.filter((_, i) => i !== index) }));
  };

  const toggleBaseField = (key: string) => {
    setForm((f) => {
      const included = f.baseFields.includes(key);
      return {
        ...f,
        baseFields: included ? f.baseFields.filter((k) => k !== key) : [...f.baseFields, key],
        fieldConfigs: included ? f.fieldConfigs.filter(c => c.key !== key) : [...f.fieldConfigs, { key, isFilter: false, filterType: "text" as const, enumValues: [] }],
      };
    });
  };
  const toggleCalcField = (key: string) => {
    setForm((f) => ({ ...f, calcFields: f.calcFields.includes(key) ? f.calcFields.filter((k) => k !== key) : [...f.calcFields, key] }));
  };
  const updateFieldConfig = (key: string, update: Partial<FieldConfig>) => {
    setForm((f) => ({ ...f, fieldConfigs: f.fieldConfigs.map(fc => fc.key === key ? { ...fc, ...update } : fc) }));
  };

  // Merge node helpers
  const addMergeNode = () => {
    const maxOrder = form.mergeNodes.length > 0 ? Math.max(...form.mergeNodes.map(n => n.order)) : 0;
    setForm(f => ({
      ...f,
      mergeNodes: [...f.mergeNodes, {
        id: `mn_${Date.now()}`,
        name: `合并节点${f.mergeNodes.length + 1}`,
        enabled: true,
        type: "text_similarity",
        similarityThreshold: 80,
        timeWindowHours: 24,
        order: maxOrder + 1,
      }],
    }));
  };
  const updateMergeNode = (id: string, update: Partial<MergeNode>) => {
    setForm(f => ({ ...f, mergeNodes: f.mergeNodes.map(n => n.id === id ? { ...n, ...update } : n) }));
  };
  const removeMergeNode = (id: string) => {
    setForm(f => {
      const filtered = f.mergeNodes.filter(n => n.id !== id);
      return { ...f, mergeNodes: filtered.map((n, i) => ({ ...n, order: i + 1 })) };
    });
  };
  const moveMergeNode = (id: string, direction: "up" | "down") => {
    setForm(f => {
      const sorted = [...f.mergeNodes].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(n => n.id === id);
      if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= sorted.length - 1)) return f;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const temp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: temp };
      return { ...f, mergeNodes: sorted };
    });
  };

  const addWidget = () => {
    setForm((f) => ({
      ...f,
      dashboardWidgets: [...f.dashboardWidgets, { id: `w_${Date.now()}`, type: "statCard", title: "", metric: "", position: f.dashboardWidgets.length + 1 }],
    }));
  };
  const updateWidget = (index: number, update: Partial<DashboardWidget>) => {
    setForm((f) => ({ ...f, dashboardWidgets: f.dashboardWidgets.map((w, i) => (i === index ? { ...w, ...update } : w)) }));
  };
  const removeWidget = (index: number) => {
    setForm((f) => ({ ...f, dashboardWidgets: f.dashboardWidgets.filter((_, i) => i !== index) }));
  };

  if (!open) return null;

  const sortedMergeNodes = [...form.mergeNodes].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[860px] max-h-[88vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "编辑主题" : "新建主题"}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border shrink-0 overflow-x-auto">
          {steps.map((s, i) => (
            <button key={s}
              onClick={() => { if (i < step || validateStep(step)) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                i === step ? "gradient-primary text-primary-foreground font-medium"
                : i < step ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
              }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-muted-foreground/20"
              }`}>{i + 1}</span>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">主题图标</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {ICONS.map((icon) => (
                    <button key={icon} onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-md border text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? "border-primary bg-accent" : "border-border hover:bg-muted"
                      }`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题名称 *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：竞品价格监测" maxLength={20} />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题描述 *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={2} placeholder="描述主题的核心目标和用途" maxLength={100} />
                {errors.description && <p className="text-[11px] text-destructive mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">负责人 *</label>
                <input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：张三" maxLength={20} />
                {errors.owner && <p className="text-[11px] text-destructive mt-1">{errors.owner}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Data Source */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">选择采集任务作为数据源</label>
                <span className="text-[11px] text-muted-foreground">已选 {form.dataSources.length} 个</span>
              </div>
              {errors.dataSources && <p className="text-[11px] text-destructive">{errors.dataSources}</p>}
              <div className="space-y-2">
                {MOCK_TASKS.map((task) => {
                  const selected = form.dataSources.some((ds) => ds.taskId === task.id);
                  return (
                    <div key={task.id} onClick={() => toggleTask(task)}
                      className={`border rounded-lg p-3.5 cursor-pointer transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}>
                            {selected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{task.name}</p>
                            <div className="flex gap-1 mt-1">
                              {task.platforms.map((p) => (
                                <Badge key={p} className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${task.status === "running" ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}`}>
                          {task.status === "running" ? "运行中" : "已暂停"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Tag Rules + Fields */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">数据入主题条件</label>
                  <button onClick={addTagRule} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="w-3 h-3" /> 添加条件
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">满足以下条件的数据将自动归入此主题</p>
                {form.tagRules.map((rule, i) => (
                  <div key={rule.id} className="border border-border rounded-lg p-3 flex items-center gap-2 mb-2">
                    {i > 0 && <Badge className="text-[10px] bg-muted text-muted-foreground border-0 shrink-0">AND</Badge>}
                    <select value={rule.tagName} onChange={(e) => updateTagRule(i, { tagName: e.target.value })}
                      className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground flex-1">
                      <option value="">选择字段</option>
                      {BASE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    <select value={rule.type} onChange={(e) => updateTagRule(i, { type: e.target.value as TagRule["type"] })}
                      className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                      <option value="required">等于</option>
                      <option value="filter">不等于</option>
                      <option value="weight">包含</option>
                    </select>
                    <input value={rule.tagValue} onChange={(e) => updateTagRule(i, { tagValue: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                      placeholder="值" maxLength={30} />
                    <button onClick={() => removeTagRule(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.tagRules.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">暂无入主题条件，点击上方按钮添加</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">展示字段选择与筛选配置</label>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">选择要展示的字段，并配置是否作为筛选条件</p>
                <div className="space-y-2">
                  {BASE_FIELDS.map((f) => {
                    const selected = form.baseFields.includes(f.key);
                    const fc = form.fieldConfigs.find(c => c.key === f.key);
                    return (
                      <div key={f.key} className={`border rounded-lg p-3 transition-colors ${selected ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleBaseField(f.key)}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                            }`}>
                              {selected && <span className="text-primary-foreground text-[8px] font-bold">✓</span>}
                            </div>
                            <span className="text-[10px] text-muted-foreground mr-1">{f.type}</span>
                            <span className="text-xs font-medium text-foreground">{f.label}</span>
                          </div>
                          {selected && fc && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">筛选条件</span>
                                <Switch checked={fc.isFilter} onCheckedChange={(checked) => updateFieldConfig(f.key, { isFilter: checked })} className="scale-75" />
                              </div>
                              {fc.isFilter && (
                                <select value={fc.filterType} onChange={(e) => updateFieldConfig(f.key, { filterType: e.target.value as "enum" | "text" })}
                                  className="px-2 py-1 text-[10px] border border-border rounded bg-card text-foreground">
                                  <option value="text">模糊搜索</option>
                                  <option value="enum">下拉选择</option>
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                        {selected && fc?.isFilter && fc.filterType === "enum" && (
                          <div className="mt-2 ml-7">
                            <input className="w-full px-2 py-1 text-[10px] border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                              placeholder="输入枚举值，按回车添加"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (!fc.enumValues.includes(val)) updateFieldConfig(f.key, { enumValues: [...fc.enumValues, val] });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }} />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {fc.enumValues.map((v, vi) => (
                                <Badge key={vi} variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                  {v}
                                  <button onClick={() => updateFieldConfig(f.key, { enumValues: fc.enumValues.filter((_, j) => j !== vi) })}
                                    className="text-muted-foreground hover:text-destructive ml-0.5">×</button>
                                </Badge>
                              ))}
                              {fc.enumValues.length === 0 && <span className="text-[10px] text-muted-foreground">请添加枚举值</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">计算字段展示</label>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">选择在该主题中展示的计算指标</p>
                <div className="space-y-1.5">
                  {CALC_FIELDS.map((f) => (
                    <div key={f.key} onClick={() => toggleCalcField(f.key)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                        form.calcFields.includes(f.key) ? "bg-primary/5 border-primary/30" : "border-border hover:bg-muted/30"
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          form.calcFields.includes(f.key) ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {form.calcFields.includes(f.key) && <span className="text-primary-foreground text-[8px] font-bold">✓</span>}
                        </div>
                        <span className="text-xs font-medium text-foreground">{f.label}</span>
                      </div>
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{f.formula}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Merge Pipeline */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-primary" /> 合并管线配置
                  </label>
                  <button onClick={addMergeNode} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="w-3 h-3" /> 添加合并节点
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 mb-4">
                  配置多级合并管线，数据将按顺序依次通过每个合并节点。每个节点基于上一级的结果进行再合并，形成「总→分」层级展示。
                </p>
              </div>

              {sortedMergeNodes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <GitMerge className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">暂未配置合并节点</p>
                  <p className="text-[10px] text-muted-foreground">不配置合并节点时，主题仅展示原始入库帖子</p>
                  <button onClick={addMergeNode} className="mt-3 px-4 py-1.5 text-xs text-primary border border-primary/30 rounded-md hover:bg-primary/5">
                    添加第一个合并节点
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMergeNodes.map((node, i) => (
                    <div key={node.id} className={`border rounded-lg overflow-hidden transition-colors ${node.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
                      {/* Node header */}
                      <div className="flex items-center justify-between p-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">第{i + 1}级</Badge>
                          <input value={node.name}
                            onChange={(e) => updateMergeNode(node.id, { name: e.target.value })}
                            className="text-xs font-medium text-foreground bg-transparent border-none outline-none w-32"
                            placeholder="节点名称" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveMergeNode(node.id, "up")} disabled={i === 0}
                            className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={() => moveMergeNode(node.id, "down")} disabled={i === sortedMergeNodes.length - 1}
                            className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                          <Switch checked={node.enabled} onCheckedChange={(checked) => updateMergeNode(node.id, { enabled: checked })} className="scale-75 mx-1" />
                          <button onClick={() => removeMergeNode(node.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Node config */}
                      {node.enabled && (
                        <div className="p-3 space-y-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">合并类型</label>
                            <div className="grid grid-cols-2 gap-2">
                              {MERGE_TYPES.map(mt => (
                                <button key={mt.value} onClick={() => updateMergeNode(node.id, { type: mt.value as MergeNode["type"] })}
                                  className={`text-left p-2.5 rounded-md border text-xs transition-colors ${
                                    node.type === mt.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"
                                  }`}>
                                  <div className="font-medium text-foreground">{mt.label}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{mt.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Type-specific config */}
                          {node.type === "text_similarity" && (
                            <div className="space-y-3 p-3 bg-card rounded-md border border-border">
                              <div>
                                <label className="text-[10px] text-muted-foreground">相似度阈值</label>
                                <div className="flex items-center gap-3 mt-1">
                                  <input type="range" min="50" max="99" value={node.similarityThreshold || 80}
                                    onChange={(e) => updateMergeNode(node.id, { similarityThreshold: Number(e.target.value) })}
                                    className="flex-1 accent-primary" />
                                  <span className="text-sm font-bold text-primary min-w-[3rem] text-right">{node.similarityThreshold || 80}%</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">时间窗口</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input type="number" min="1" max="168" value={node.timeWindowHours || 24}
                                    onChange={(e) => updateMergeNode(node.id, { timeWindowHours: Number(e.target.value) })}
                                    className="w-20 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none" />
                                  <span className="text-[10px] text-muted-foreground">小时</span>
                                  <div className="flex gap-1 ml-2">
                                    {[6, 12, 24, 48].map(h => (
                                      <button key={h} onClick={() => updateMergeNode(node.id, { timeWindowHours: h })}
                                        className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                                          (node.timeWindowHours || 24) === h ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                                        }`}>{h}h</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {node.type === "field_group" && (
                            <div className="p-3 bg-card rounded-md border border-border">
                              <label className="text-[10px] text-muted-foreground">按字段分组</label>
                              <select value={node.groupByField || ""} onChange={(e) => updateMergeNode(node.id, { groupByField: e.target.value })}
                                className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground">
                                <option value="">选择分组字段</option>
                                {BASE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                              </select>
                            </div>
                          )}

                          {node.type === "time_window" && (
                            <div className="p-3 bg-card rounded-md border border-border">
                              <label className="text-[10px] text-muted-foreground">时间窗口（小时）</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input type="number" min="1" max="168" value={node.timeWindowHours || 24}
                                  onChange={(e) => updateMergeNode(node.id, { timeWindowHours: Number(e.target.value) })}
                                  className="w-20 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none" />
                                <span className="text-[10px] text-muted-foreground">小时内的数据合并为一组</span>
                              </div>
                            </div>
                          )}

                          {node.type === "custom" && (
                            <div className="p-3 bg-card rounded-md border border-border">
                              <label className="text-[10px] text-muted-foreground">自定义合并规则表达式</label>
                              <textarea value={node.customRule || ""} onChange={(e) => updateMergeNode(node.id, { customRule: e.target.value })}
                                className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                                rows={3} placeholder="例如：IF(similarity > 0.8 AND same_topic) THEN merge" />
                            </div>
                          )}

                          {i > 0 && (
                            <div className="bg-muted/30 rounded p-2">
                              <p className="text-[10px] text-muted-foreground">💡 此节点将基于第{i}级「{sortedMergeNodes[i - 1]?.name}」的合并结果进行再合并</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pipeline preview */}
                  <div className="bg-muted/30 rounded-lg p-3 border border-dashed border-border mt-4">
                    <p className="text-[11px] text-muted-foreground mb-1.5">📋 管线预览：数据展示Tab结构</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className="text-[10px] px-2 py-0.5 bg-muted text-foreground border-0">全部帖子</Badge>
                      {sortedMergeNodes.filter(n => n.enabled).map((n, i) => (
                        <div key={n.id} className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-[10px]">→</span>
                          <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-0">第{i + 1}级：{n.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Dashboard Config */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">看板组件配置</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewMode(!previewMode)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      previewMode ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-border hover:bg-muted"
                    }`}>
                    <Eye className="w-3 h-3" /> {previewMode ? "编辑模式" : "预览"}
                  </button>
                  <button onClick={addWidget} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="w-3 h-3" /> 添加组件
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="border border-border rounded-lg p-4 bg-muted/20 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{form.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{form.name || "未命名主题"}</h3>
                      <p className="text-[10px] text-muted-foreground">{form.description || "暂无描述"}</p>
                    </div>
                  </div>
                  {form.dashboardWidgets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10">暂无看板组件</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {form.dashboardWidgets.map((widget) => (
                        <div key={widget.id} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">
                              {widget.type === "statCard" ? "📊" : widget.type === "lineChart" ? "📈" :
                               widget.type === "pieChart" ? "🥧" : widget.type === "barChart" ? "📉" : "📋"}
                            </span>
                            <span className="text-xs font-medium text-foreground">{widget.title || "未命名"}</span>
                          </div>
                          <div className="h-20 bg-muted/30 rounded-md flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">{WIDGET_TYPES.find((t) => t.value === widget.type)?.label} 预览区</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {form.dashboardWidgets.map((widget, i) => (
                    <div key={widget.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grab" />
                      <select value={widget.type} onChange={(e) => updateWidget(i, { type: e.target.value as DashboardWidget["type"] })}
                        className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                        {WIDGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                      <input value={widget.title} onChange={(e) => updateWidget(i, { title: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                        placeholder="组件标题" maxLength={30} />
                      <input value={widget.metric} onChange={(e) => updateWidget(i, { metric: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                        placeholder="关联指标" maxLength={30} />
                      <button onClick={() => removeWidget(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.dashboardWidgets.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">暂无看板组件，点击上方按钮添加</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
          <div className="text-[11px] text-muted-foreground">步骤 {step + 1} / {steps.length}</div>
          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">取消</button>
            {step > 0 && (
              <button onClick={handlePrev}
                className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">上一步</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={handleNext}
                className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">下一步</button>
            ) : (
              <button onClick={handleSave}
                className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">
                {isEdit ? "保存修改" : "创建主题"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
