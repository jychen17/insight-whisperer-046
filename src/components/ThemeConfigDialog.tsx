import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, GitMerge, ArrowUp, ArrowDown, Search, ChevronDown, ChevronRight, Check, Copy, Calendar } from "lucide-react";
import type {
  ThemeConfig,
  DataSourceConfig,
  DashboardWidget,
  FieldConfig,
  MergeNode,
  MergeDisplayField,
  ConditionNode,
  TaskParamConfig,
  ExtendedParamConfig,
} from "@/pages/ThemeSettings";
import { ALL_FIELDS } from "@/pages/ThemeSettings";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeConfig | null;
  onSave: (theme: ThemeConfig) => void;
}

const TASK_TYPES = ["话题", "账号", "关键词", "链接"];
const PLATFORM_OPTIONS = ["新浪微博", "小红书", "抖音", "快手", "B站", "知乎", "百度", "今日头条", "黑猫投诉", "京东", "淘宝"];
const SORT_OPTIONS = ["默认排序", "时间倒序", "热度排序", "相关度排序"];
const OWNER_OPTIONS = ["张三", "李四", "王五", "赵六", "陈佳燕-1227152"];

const OPERATORS = [
  { value: "equals", label: "等于" },
  { value: "not_equals", label: "不等于" },
  { value: "contains", label: "包含" },
  { value: "not_contains", label: "不包含" },
  { value: "greater", label: "大于" },
  { value: "less", label: "小于" },
];

const MERGE_TYPES = [
  { value: "text_similarity", label: "文本相似度", desc: "按内容语义相似度合并" },
  { value: "field_group", label: "字段分组", desc: "按指定字段值组合分组" },
  { value: "time_window", label: "时间窗口", desc: "指定时间范围内合并" },
  { value: "custom", label: "自定义规则", desc: "自定义合并逻辑" },
];

const ICONS = ["🛡️", "🌐", "⚡", "💡", "🔥", "📡", "🎯", "🧭", "📊", "💬", "🔍", "🏷️"];

const FIELD_TYPE_LABELS: Record<string, string> = { ai: "AI标签", raw: "原生字段", calc: "计算字段" };

const emptyConditionTree: ConditionNode = { id: "root", type: "group", logic: "AND", children: [] };

const emptyTheme: ThemeConfig = {
  id: "", name: "", description: "", owner: "", type: "custom", status: "active", icon: "🎯",
  dataSources: [], conditionTree: { ...emptyConditionTree }, fieldConfigs: [], mergeNodes: [], dashboardWidgets: [],
  createdAt: "", updatedAt: "",
};

export default function ThemeConfigDialog({ open, onOpenChange, theme, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ThemeConfig>(emptyTheme);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dsSearch, setDsSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeConditionDS, setActiveConditionDS] = useState<string>("");

  const isEdit = !!theme;
  const steps = ["基本信息", "数据源", "入主题条件与字段", "合并管线"];

  useEffect(() => {
    if (open) {
      setStep(0); setErrors({}); setDsSearch(""); setFieldSearch("");
      setCollapsedGroups({}); setActiveConditionDS("");
      const initForm = theme ? {
        ...theme,
        mergeNodes: Array.isArray(theme.mergeNodes) ? theme.mergeNodes : [],
        conditionTree: theme.conditionTree || { ...emptyConditionTree },
        fieldConfigs: Array.isArray(theme.fieldConfigs) ? theme.fieldConfigs : [],
        dataSources: (theme.dataSources || []).map(ds => ({
          ...ds,
          conditionTree: ds.conditionTree || { ...emptyConditionTree },
        })),
      } : { ...emptyTheme, id: `custom_${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
      setForm(initForm);
      if (initForm.dataSources.length > 0) {
        setActiveConditionDS(initForm.dataSources[0].taskId);
      }
    }
  }, [open, theme]);

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "请输入主题名称";
      if (!form.description.trim()) e.description = "请输入主题描述";
      if (!form.owner.trim()) e.owner = "请输入负责人";
    }
    if (s === 1 && form.dataSources.length === 0) e.dataSources = "请至少选择一个采集任务";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, steps.length - 1)); };
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));
  const handleSave = () => { if (validateStep(step)) onSave({ ...form, updatedAt: new Date().toISOString().slice(0, 10) }); };

  // ── Data Sources ──
  const toggleTask = (task: typeof MOCK_TASKS[0]) => {
    setForm(f => {
      const exists = f.dataSources.find(ds => ds.taskId === task.id);
      if (exists) {
        const newDS = f.dataSources.filter(ds => ds.taskId !== task.id);
        // Reset active tab if removed
        if (activeConditionDS === task.id && newDS.length > 0) {
          setActiveConditionDS(newDS[0].taskId);
        }
        return { ...f, dataSources: newDS };
      }
      const newDs = { taskId: task.id, taskName: task.name, platforms: task.platforms, timeRange: "近7天", enabled: true, conditionTree: { ...emptyConditionTree, id: `root_${task.id}` } };
      if (f.dataSources.length === 0) setActiveConditionDS(task.id);
      return { ...f, dataSources: [...f.dataSources, newDs] };
    });
  };

  // ── Condition Tree (per data source) ──
  const updateDSConditionTree = (taskId: string, tree: ConditionNode) => {
    setForm(f => ({
      ...f,
      dataSources: f.dataSources.map(ds => ds.taskId === taskId ? { ...ds, conditionTree: tree } : ds),
    }));
  };

  const getActiveDS = () => form.dataSources.find(ds => ds.taskId === activeConditionDS);
  const getActiveDSTree = () => getActiveDS()?.conditionTree || emptyConditionTree;

  const addCondition = (parentId: string) => {
    const newCond: ConditionNode = { id: `c_${Date.now()}`, type: "condition", field: "", operator: "equals", value: "" };
    updateDSConditionTree(activeConditionDS, insertIntoTree(getActiveDSTree(), parentId, newCond));
  };
  const addGroup = (parentId: string) => {
    const newGroup: ConditionNode = { id: `g_${Date.now()}`, type: "group", logic: "AND", children: [] };
    updateDSConditionTree(activeConditionDS, insertIntoTree(getActiveDSTree(), parentId, newGroup));
  };
  const removeConditionNode = (nodeId: string) => {
    updateDSConditionTree(activeConditionDS, removeFromTree(getActiveDSTree(), nodeId));
  };
  const updateConditionNode = (nodeId: string, update: Partial<ConditionNode>) => {
    updateDSConditionTree(activeConditionDS, updateInTree(getActiveDSTree(), nodeId, update));
  };

  // ── Fields ──
  const toggleField = (key: string) => {
    setForm(f => {
      const exists = f.fieldConfigs.find(fc => fc.key === key);
      if (exists) return { ...f, fieldConfigs: f.fieldConfigs.filter(fc => fc.key !== key) };
      const fieldDef = ALL_FIELDS.find(ff => ff.key === key);
      if (!fieldDef) return f;
      const newFc: FieldConfig = {
        key, fieldType: fieldDef.fieldType, displayPosition: "both",
        isFilter: false, filterType: fieldDef.hasSystemEnum ? "enum" : "text",
        hasSystemEnum: fieldDef.hasSystemEnum, enumValues: fieldDef.enumValues || [],
      };
      return { ...f, fieldConfigs: [...f.fieldConfigs, newFc] };
    });
  };
  const updateFieldConfig = (key: string, update: Partial<FieldConfig>) => {
    setForm(f => ({ ...f, fieldConfigs: f.fieldConfigs.map(fc => fc.key === key ? { ...fc, ...update } : fc) }));
  };

  // ── Merge Nodes ──
  const addMergeNode = () => {
    const nodes = form.mergeNodes || [];
    const maxOrder = nodes.length > 0 ? Math.max(...nodes.map(n => n.order)) : 0;
    setForm(f => ({
      ...f, mergeNodes: [...(f.mergeNodes || []), {
        id: `mn_${Date.now()}`, name: `合并节点${(f.mergeNodes || []).length + 1}`, enabled: true,
        type: "text_similarity", similarityThreshold: 80, timeWindowHours: 24, groupByFields: [], order: maxOrder + 1, displayFields: [],
      }],
    }));
  };
  const updateMergeNode = (id: string, update: Partial<MergeNode>) => {
    setForm(f => ({ ...f, mergeNodes: (f.mergeNodes || []).map(n => n.id === id ? { ...n, ...update } : n) }));
  };
  const removeMergeNode = (id: string) => {
    setForm(f => { const filtered = (f.mergeNodes || []).filter(n => n.id !== id); return { ...f, mergeNodes: filtered.map((n, i) => ({ ...n, order: i + 1 })) }; });
  };
  const moveMergeNode = (id: string, dir: "up" | "down") => {
    setForm(f => {
      const sorted = [...(f.mergeNodes || [])].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(n => n.id === id);
      if ((dir === "up" && idx <= 0) || (dir === "down" && idx >= sorted.length - 1)) return f;
      const si = dir === "up" ? idx - 1 : idx + 1;
      const t = sorted[idx].order; sorted[idx] = { ...sorted[idx], order: sorted[si].order }; sorted[si] = { ...sorted[si], order: t };
      return { ...f, mergeNodes: sorted };
    });
  };
  const toggleMergeDisplayField = (nodeId: string, fieldKey: string) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        const dfs = n.displayFields || [];
        const exists = dfs.find(d => d.key === fieldKey);
        if (exists) return { ...n, displayFields: dfs.filter(d => d.key !== fieldKey) };
        return { ...n, displayFields: [...dfs, { key: fieldKey, position: "list" as const }] };
      }),
    }));
  };
  const updateMergeDisplayField = (nodeId: string, fieldKey: string, update: Partial<MergeDisplayField>) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        return { ...n, displayFields: (n.displayFields || []).map(d => d.key === fieldKey ? { ...d, ...update } : d) };
      }),
    }));
  };
  const toggleGroupByField = (nodeId: string, fieldKey: string) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        const fields = n.groupByFields || [];
        return { ...n, groupByFields: fields.includes(fieldKey) ? fields.filter(k => k !== fieldKey) : [...fields, fieldKey] };
      }),
    }));
  };

  if (!open) return null;

  const sortedMergeNodes = [...(form.mergeNodes || [])].sort((a, b) => a.order - b.order);
  const filteredTasks = MOCK_TASKS.filter(t => !dsSearch || t.name.includes(dsSearch) || t.platforms.some(p => p.includes(dsSearch)));

  const fieldsByType = { ai: ALL_FIELDS.filter(f => f.fieldType === "ai"), raw: ALL_FIELDS.filter(f => f.fieldType === "raw"), calc: ALL_FIELDS.filter(f => f.fieldType === "calc") };
  const filteredFields = (fields: typeof ALL_FIELDS) => fields.filter(f => !fieldSearch || f.label.includes(fieldSearch) || f.key.includes(fieldSearch));

  const toggleGroup = (g: string) => setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[900px] max-h-[88vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "编辑主题" : "新建主题"}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border shrink-0">
          {steps.map((s, i) => (
            <button key={s} onClick={() => { if (i < step || validateStep(step)) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                i === step ? "gradient-primary text-primary-foreground font-medium" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-muted-foreground/20"
              }`}>{i + 1}</span>{s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ═══════ Step 1: Basic Info ═══════ */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">主题图标</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-md border text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? "border-primary bg-accent" : "border-border hover:bg-muted"
                      }`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题名称 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：竞品价格监测" maxLength={20} />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题描述 *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={2} placeholder="描述主题的核心目标和用途" maxLength={100} />
                {errors.description && <p className="text-[11px] text-destructive mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">负责人 *</label>
                <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：张三" maxLength={20} />
                {errors.owner && <p className="text-[11px] text-destructive mt-1">{errors.owner}</p>}
              </div>
            </div>
          )}

          {/* ═══════ Step 2: Data Sources (searchable compact) ═══════ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">选择采集任务作为数据源</label>
                <span className="text-[11px] text-muted-foreground">已选 {form.dataSources.length} 个</span>
              </div>
              {errors.dataSources && <p className="text-[11px] text-destructive">{errors.dataSources}</p>}

              {/* Selected chips */}
              {form.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.dataSources.map(ds => (
                    <Badge key={ds.taskId} className="text-xs px-2 py-1 bg-primary/10 text-primary border-0 gap-1">
                      {ds.taskName}
                      <button onClick={() => setForm(f => ({ ...f, dataSources: f.dataSources.filter(d => d.taskId !== ds.taskId) }))}
                        className="hover:text-destructive ml-0.5">×</button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="flex items-center border border-border rounded-md bg-card px-3">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input value={dsSearch} onChange={e => setDsSearch(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-transparent text-foreground outline-none"
                  placeholder="搜索任务名称或平台..." />
              </div>

              {/* Compact task list */}
              <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto divide-y divide-border">
                {filteredTasks.map(task => {
                  const selected = form.dataSources.some(ds => ds.taskId === task.id);
                  return (
                    <div key={task.id} onClick={() => toggleTask(task)}
                      className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                          {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-medium text-foreground">{task.name}</span>
                        <div className="flex gap-1">
                          {task.platforms.slice(0, 3).map(p => <Badge key={p} className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">{p}</Badge>)}
                          {task.platforms.length > 3 && <Badge className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">+{task.platforms.length - 3}</Badge>}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${task.status === "running" ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}`}>
                        {task.status === "running" ? "运行中" : "已暂停"}
                      </Badge>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">无匹配结果</p>}
              </div>
            </div>
          )}

          {/* ═══════ Step 3: Conditions + Fields ═══════ */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Per-datasource condition builder */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">各数据源入主题条件</label>
                <p className="text-[11px] text-muted-foreground mb-3">每个数据源可独立配置入主题规则，支持 AND/OR 组合与括号嵌套</p>

                {form.dataSources.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">请先在上一步选择数据源</p>
                  </div>
                ) : (
                  <>
                    {/* Data source tabs */}
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {form.dataSources.map(ds => (
                        <button key={ds.taskId} onClick={() => setActiveConditionDS(ds.taskId)}
                          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                            activeConditionDS === ds.taskId
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}>
                          {ds.taskName}
                          <span className="ml-1 text-[10px] opacity-60">({ds.platforms.slice(0, 2).join("、")}{ds.platforms.length > 2 ? "…" : ""})</span>
                        </button>
                      ))}
                    </div>

                    {/* Active datasource condition tree */}
                    {getActiveDS() && (
                      <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{getActiveDS()?.taskName}</Badge>
                            <span className="text-[10px] text-muted-foreground">平台：{getActiveDS()?.platforms.join("、")}</span>
                          </div>
                          {/* Copy from another datasource */}
                          {form.dataSources.length > 1 && (
                            <div className="flex items-center gap-1">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                              <select
                                value=""
                                onChange={(e) => {
                                  const sourceDS = form.dataSources.find(ds => ds.taskId === e.target.value);
                                  if (sourceDS?.conditionTree) {
                                    const cloneTree = JSON.parse(JSON.stringify(sourceDS.conditionTree));
                                    // Regenerate IDs to avoid conflicts
                                    const reId = (node: any) => {
                                      node.id = `${node.id}_copy_${Date.now()}`;
                                      (node.children || []).forEach(reId);
                                    };
                                    reId(cloneTree);
                                    updateDSConditionTree(activeConditionDS, cloneTree);
                                  }
                                }}
                                className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground"
                              >
                                <option value="">复制规则自...</option>
                                {form.dataSources.filter(ds => ds.taskId !== activeConditionDS).map(ds => (
                                  <option key={ds.taskId} value={ds.taskId}>{ds.taskName}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <ConditionTreeEditor
                          node={getActiveDSTree()}
                          onAddCondition={addCondition}
                          onAddGroup={addGroup}
                          onRemove={removeConditionNode}
                          onUpdate={updateConditionNode}
                          depth={0}
                          isRoot
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Field selection with groups */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">展示字段配置</label>
                  <span className="text-[11px] text-muted-foreground">已选 {form.fieldConfigs.length} 个</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  选择要展示的字段（AI标签/原生字段/计算字段），配置展示位置和筛选方式。枚举值来自标签管理。
                </p>

                {/* Search */}
                <div className="flex items-center border border-border rounded-md bg-card px-3 mb-3">
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input value={fieldSearch} onChange={e => setFieldSearch(e.target.value)}
                    className="flex-1 px-2 py-2 text-xs bg-transparent text-foreground outline-none"
                    placeholder="搜索字段名称..." />
                </div>

                {/* Grouped collapsible field list */}
                {(["ai", "raw", "calc"] as const).map(ftype => {
                  const fields = filteredFields(fieldsByType[ftype]);
                  if (fields.length === 0) return null;
                  const collapsed = collapsedGroups[ftype];
                  const selectedCount = fields.filter(f => form.fieldConfigs.some(fc => fc.key === f.key)).length;
                  return (
                    <div key={ftype} className="mb-3">
                      <button onClick={() => toggleGroup(ftype)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 bg-muted/50 rounded-t-lg border border-border text-xs font-medium text-foreground hover:bg-muted/70 transition-colors">
                        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span className={`w-2 h-2 rounded-full ${ftype === "ai" ? "bg-purple-500" : ftype === "calc" ? "bg-primary" : "bg-muted-foreground"}`} />
                        {FIELD_TYPE_LABELS[ftype]}
                        <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{fields.length}</Badge>
                        {selectedCount > 0 && <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">已选{selectedCount}</Badge>}
                      </button>
                      {!collapsed && (
                        <div className="border border-t-0 border-border rounded-b-lg divide-y divide-border">
                          {fields.map(f => {
                            const fc = form.fieldConfigs.find(c => c.key === f.key);
                            const selected = !!fc;
                            return (
                              <div key={f.key} className={`px-3 py-2.5 transition-colors ${selected ? "bg-primary/5" : ""}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => toggleField(f.key)}>
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                      {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                    </div>
                                    <span className="text-xs font-medium text-foreground">{f.label}</span>
                                    {f.hasSystemEnum && (
                                      <Badge className="text-[9px] px-1 py-0 bg-accent text-accent-foreground border-0">有枚举值</Badge>
                                    )}
                                  </div>
                                  {selected && fc && (
                                    <div className="flex items-center gap-2">
                                      {/* Display position */}
                                      <select value={fc.displayPosition} onChange={e => updateFieldConfig(f.key, { displayPosition: e.target.value as FieldConfig["displayPosition"] })}
                                        className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground">
                                        <option value="list">列表展示</option>
                                        <option value="detail">详情展示</option>
                                        <option value="both">列表+详情</option>
                                      </select>
                                      {/* Filter toggle */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">筛选</span>
                                        <Switch checked={fc.isFilter} onCheckedChange={checked => updateFieldConfig(f.key, { isFilter: checked })} className="scale-75" />
                                      </div>
                                      {/* Filter type: only show dropdown/fuzzy choice if field has enum */}
                                      {fc.isFilter && (
                                        f.hasSystemEnum ? (
                                          <select value={fc.filterType} onChange={e => updateFieldConfig(f.key, { filterType: e.target.value as "enum" | "text" })}
                                            className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground">
                                            <option value="enum">下拉选择</option>
                                            <option value="text">模糊搜索</option>
                                          </select>
                                        ) : (
                                          <Badge className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground border-0">模糊搜索</Badge>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                                {/* Show enum values if filter=enum */}
                                {selected && fc?.isFilter && fc.filterType === "enum" && fc.hasSystemEnum && (
                                  <div className="ml-7 mt-1.5 flex flex-wrap gap-1">
                                    <span className="text-[10px] text-muted-foreground mr-1">枚举值（来自标签管理）：</span>
                                    {fc.enumValues.map(v => <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0">{v}</Badge>)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ Step 4: Merge Pipeline ═══════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-primary" /> 合并管线配置
                </label>
                <button onClick={addMergeNode} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="w-3 h-3" /> 添加合并节点</button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                配置多级合并管线。每个节点基于上一级结果再合并。字段分组支持多字段组合。每个节点可配置结果展示字段及位置。
              </p>

              {sortedMergeNodes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <GitMerge className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">暂未配置合并节点</p>
                  <button onClick={addMergeNode} className="mt-3 px-4 py-1.5 text-xs text-primary border border-primary/30 rounded-md hover:bg-primary/5">添加第一个合并节点</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMergeNodes.map((node, i) => (
                    <div key={node.id} className={`border rounded-lg overflow-hidden transition-colors ${node.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
                      {/* Node header */}
                      <div className="flex items-center justify-between p-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">第{i + 1}级</Badge>
                          <input value={node.name} onChange={e => updateMergeNode(node.id, { name: e.target.value })}
                            className="text-xs font-medium text-foreground bg-transparent border-none outline-none w-32" placeholder="节点名称" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveMergeNode(node.id, "up")} disabled={i === 0} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={() => moveMergeNode(node.id, "down")} disabled={i === sortedMergeNodes.length - 1} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                          <Switch checked={node.enabled} onCheckedChange={checked => updateMergeNode(node.id, { enabled: checked })} className="scale-75 mx-1" />
                          <button onClick={() => removeMergeNode(node.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>

                      {node.enabled && (
                        <div className="p-3 space-y-3">
                          {/* Type selection */}
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
                                    onChange={e => updateMergeNode(node.id, { similarityThreshold: Number(e.target.value) })} className="flex-1 accent-primary" />
                                  <span className="text-sm font-bold text-primary min-w-[3rem] text-right">{node.similarityThreshold || 80}%</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">时间窗口</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input type="number" min="1" max="168" value={node.timeWindowHours || 24}
                                    onChange={e => updateMergeNode(node.id, { timeWindowHours: Number(e.target.value) })}
                                    className="w-20 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none" />
                                  <span className="text-[10px] text-muted-foreground">小时</span>
                                  <div className="flex gap-1 ml-2">
                                    {[6, 12, 24, 48].map(h => (
                                      <button key={h} onClick={() => updateMergeNode(node.id, { timeWindowHours: h })}
                                        className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${(node.timeWindowHours || 24) === h ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{h}h</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {node.type === "field_group" && (
                            <div className="p-3 bg-card rounded-md border border-border space-y-2">
                              <label className="text-[10px] text-muted-foreground">按字段组合分组（可多选，如"时间窗口+业务类型"组合）</label>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {ALL_FIELDS.map(f => {
                                  const selected = (node.groupByFields || []).includes(f.key);
                                  return (
                                    <button key={f.key} onClick={() => toggleGroupByField(node.id, f.key)}
                                      className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                                        selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/30"
                                      }`}>
                                      {selected && <Check className="w-2.5 h-2.5 inline mr-0.5" />}{f.label}
                                    </button>
                                  );
                                })}
                              </div>
                              {(node.groupByFields || []).length > 0 && (
                                <p className="text-[10px] text-primary">将按「{(node.groupByFields || []).map(k => ALL_FIELDS.find(f => f.key === k)?.label || k).join(" + ")}」组合进行分组合并</p>
                              )}

                              {/* Optional time window for field_group */}
                              <div className="pt-2 border-t border-border/50">
                                <label className="text-[10px] text-muted-foreground">可选：同时限制时间窗口</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input type="number" min="0" max="168" value={node.timeWindowHours || 0}
                                    onChange={e => updateMergeNode(node.id, { timeWindowHours: Number(e.target.value) })}
                                    className="w-20 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none" />
                                  <span className="text-[10px] text-muted-foreground">小时（0 = 不限制）</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {node.type === "time_window" && (
                            <div className="p-3 bg-card rounded-md border border-border">
                              <label className="text-[10px] text-muted-foreground">时间窗口</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input type="number" min="1" max="168" value={node.timeWindowHours || 24}
                                  onChange={e => updateMergeNode(node.id, { timeWindowHours: Number(e.target.value) })}
                                  className="w-20 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none" />
                                <span className="text-[10px] text-muted-foreground">小时内合并</span>
                              </div>
                            </div>
                          )}

                          {node.type === "custom" && (
                            <div className="p-3 bg-card rounded-md border border-border">
                              <label className="text-[10px] text-muted-foreground">自定义合并规则</label>
                              <textarea value={node.customRule || ""} onChange={e => updateMergeNode(node.id, { customRule: e.target.value })}
                                className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                                rows={3} placeholder="例如：IF(similarity > 0.8 AND same_topic) THEN merge" />
                            </div>
                          )}

                          {/* Display fields for merge result */}
                          <div className="p-3 bg-card rounded-md border border-border space-y-2">
                            <label className="text-[10px] text-muted-foreground">合并结果展示字段（选择在事件列表或详情中展示哪些字段）</label>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_FIELDS.map(f => {
                                const df = (node.displayFields || []).find(d => d.key === f.key);
                                const selected = !!df;
                                return (
                                  <div key={f.key} className="flex items-center gap-0.5">
                                    <button onClick={() => toggleMergeDisplayField(node.id, f.key)}
                                      className={`px-2 py-1 text-[10px] rounded-l-md border transition-colors ${
                                        selected ? "border-primary bg-primary/10 text-primary border-r-0" : "border-border text-muted-foreground hover:bg-muted/30"
                                      }`}>
                                      {selected && <Check className="w-2.5 h-2.5 inline mr-0.5" />}{f.label}
                                    </button>
                                    {selected && (
                                      <select value={df!.position} onChange={e => updateMergeDisplayField(node.id, f.key, { position: e.target.value as MergeDisplayField["position"] })}
                                        className="px-1 py-1 text-[9px] border border-primary/30 rounded-r-md bg-primary/5 text-primary outline-none">
                                        <option value="list">列表</option>
                                        <option value="detail">详情</option>
                                        <option value="both">都展示</option>
                                      </select>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

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
                    <p className="text-[11px] text-muted-foreground mb-1.5">📋 管线预览</p>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
          <div className="text-[11px] text-muted-foreground">步骤 {step + 1} / {steps.length}</div>
          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">取消</button>
            {step > 0 && <button onClick={handlePrev} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">上一步</button>}
            {step < steps.length - 1 ? (
              <button onClick={handleNext} className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">下一步</button>
            ) : (
              <button onClick={handleSave} className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">{isEdit ? "保存修改" : "创建主题"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nested Condition Tree Editor ────────────────────────────

function ConditionTreeEditor({
  node, onAddCondition, onAddGroup, onRemove, onUpdate, depth, isRoot,
}: {
  node: ConditionNode; onAddCondition: (parentId: string) => void; onAddGroup: (parentId: string) => void;
  onRemove: (id: string) => void; onUpdate: (id: string, u: Partial<ConditionNode>) => void;
  depth: number; isRoot?: boolean;
}) {
  if (node.type === "condition") {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <select value={node.field || ""} onChange={e => onUpdate(node.id, { field: e.target.value })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground flex-1 min-w-[100px]">
          <option value="">选择字段</option>
          {ALL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <select value={node.operator || "equals"} onChange={e => onUpdate(node.id, { operator: e.target.value })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
        {/* If field has enum, show dropdown for value */}
        {(() => {
          const fieldDef = ALL_FIELDS.find(f => f.key === node.field);
          if (fieldDef?.hasSystemEnum && fieldDef.enumValues.length > 0) {
            return (
              <select value={node.value || ""} onChange={e => onUpdate(node.id, { value: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[80px]">
                <option value="">选择值</option>
                {fieldDef.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            );
          }
          return (
            <input value={node.value || ""} onChange={e => onUpdate(node.id, { value: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[80px]"
              placeholder="输入值" />
          );
        })()}
        <button onClick={() => onRemove(node.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3 h-3" /></button>
      </div>
    );
  }

  // Group node
  const children = node.children || [];
  return (
    <div className={`rounded-lg border ${depth === 0 ? "border-border" : "border-primary/20 bg-primary/5"} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isRoot && <span className="text-[10px] text-muted-foreground">(</span>}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button onClick={() => onUpdate(node.id, { logic: "AND" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "AND" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>AND</button>
            <button onClick={() => onUpdate(node.id, { logic: "OR" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "OR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>OR</button>
          </div>
          {!isRoot && <span className="text-[10px] text-muted-foreground">)</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddCondition(node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"><Plus className="w-2.5 h-2.5" />条件</button>
          <button onClick={() => onAddGroup(node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline ml-2"><Plus className="w-2.5 h-2.5" />分组()</button>
          {!isRoot && <button onClick={() => onRemove(node.id)} className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </div>
      <div className="space-y-1 ml-2">
        {children.map((child, ci) => (
          <div key={child.id}>
            {ci > 0 && <div className="text-[10px] text-primary font-medium py-0.5 ml-2">{node.logic}</div>}
            <ConditionTreeEditor node={child} onAddCondition={onAddCondition} onAddGroup={onAddGroup} onRemove={onRemove} onUpdate={onUpdate} depth={depth + 1} />
          </div>
        ))}
        {children.length === 0 && <p className="text-[10px] text-muted-foreground py-2 text-center">点击上方按钮添加条件或嵌套分组</p>}
      </div>
    </div>
  );
}

// ── Tree manipulation helpers ───────────────────────────────

function insertIntoTree(tree: ConditionNode, parentId: string, newNode: ConditionNode): ConditionNode {
  if (tree.id === parentId && tree.type === "group") {
    return { ...tree, children: [...(tree.children || []), newNode] };
  }
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => insertIntoTree(c, parentId, newNode)) };
  }
  return tree;
}

function removeFromTree(tree: ConditionNode, nodeId: string): ConditionNode {
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.filter(c => c.id !== nodeId).map(c => removeFromTree(c, nodeId)) };
  }
  return tree;
}

function updateInTree(tree: ConditionNode, nodeId: string, update: Partial<ConditionNode>): ConditionNode {
  if (tree.id === nodeId) return { ...tree, ...update };
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => updateInTree(c, nodeId, update)) };
  }
  return tree;
}
