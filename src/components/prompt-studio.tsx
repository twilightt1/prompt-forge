"use client";

import { useEffect, useMemo, useState } from "react";
import { enhancePrompt, promptModes, type PromptMode } from "@/lib/prompt-engine";
import { promptTemplates } from "@/lib/templates";
import type { AiBenchmarkResult, AiEnhanceResult, AiGuardrailsResult, AiOptimizeResult, AiPromptAnalysis, AiPromptTestResult } from "@/lib/ai-result";
import type { EnhanceLanguage, EnhanceStrength, EnhanceStyle, RewriteFramework, RewriteLevel, RewriteOutputGoal } from "@/lib/enhance-options";
import { defaultLocale, getOppositeLocale, getStoredLocale, setStoredLocale, translations, type Locale } from "@/lib/i18n";

type ResultTab = "improved" | "why" | "alternatives" | "safety" | "export";
type StudioResult = AiEnhanceResult;

type HistoryItem = {
  id: string;
  mode: PromptMode;
  input: string;
  output: string;
  score: number;
  createdAt: string;
  source: AiEnhanceResult["source"];
  favorite: boolean;
};

type SimpleIntent = "clearer" | "better-answer" | "plan" | "coding" | "marketing" | "image" | "agent";

const starterPrompt = "Build me a sleek SaaS landing page for an AI prompt optimizer that helps creators and developers get better outputs from ChatGPT.";

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function intentPreset(intent: SimpleIntent): { mode: PromptMode; outputGoal: RewriteOutputGoal; framework: RewriteFramework; rewriteLevel: RewriteLevel; strength: EnhanceStrength } {
  const presets: Record<SimpleIntent, { mode: PromptMode; outputGoal: RewriteOutputGoal; framework: RewriteFramework; rewriteLevel: RewriteLevel; strength: EnhanceStrength }> = {
    clearer: { mode: "general", outputGoal: "accurate-answer", framework: "rtf", rewriteLevel: "clean", strength: "light" },
    "better-answer": { mode: "general", outputGoal: "accurate-answer", framework: "craft", rewriteLevel: "expert", strength: "balanced" },
    plan: { mode: "research", outputGoal: "structured-plan", framework: "co-star", rewriteLevel: "expert", strength: "balanced" },
    coding: { mode: "coding", outputGoal: "code-generation", framework: "risen", rewriteLevel: "production", strength: "deep" },
    marketing: { mode: "marketing", outputGoal: "marketing-copy", framework: "craft", rewriteLevel: "expert", strength: "balanced" },
    image: { mode: "image", outputGoal: "creative-ideation", framework: "tag", rewriteLevel: "structure", strength: "balanced" },
    agent: { mode: "agentic", outputGoal: "agent-instruction", framework: "agent-spec", rewriteLevel: "agentic", strength: "deep" },
  };
  return presets[intent];
}

export function PromptStudio() {
  const [input, setInput] = useState(starterPrompt);
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [localeReady, setLocaleReady] = useState(false);
  const [simpleIntent, setSimpleIntent] = useState<SimpleIntent>("better-answer");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState<PromptMode>("marketing");
  const [language, setLanguage] = useState<EnhanceLanguage>("auto");
  const [strength, setStrength] = useState<EnhanceStrength>("balanced");
  const [style, setStyle] = useState<EnhanceStyle>("professional");
  const [outputGoal, setOutputGoal] = useState<RewriteOutputGoal>("structured-plan");
  const [framework, setFramework] = useState<RewriteFramework>("auto");
  const [rewriteLevel, setRewriteLevel] = useState<RewriteLevel>("expert");
  const [activeTab, setActiveTab] = useState<ResultTab>("improved");
  const [result, setResult] = useState<StudioResult>(() => ({
    ...enhancePrompt(starterPrompt, "marketing"),
    source: "local-fallback",
    model: "local diagnostics",
  }));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [analysis, setAnalysis] = useState<AiPromptAnalysis | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [sampleInput, setSampleInput] = useState("");
  const [testResult, setTestResult] = useState<AiPromptTestResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isGeneratingGuardrails, setIsGeneratingGuardrails] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<AiOptimizeResult | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<AiBenchmarkResult | null>(null);
  const [guardrailsResult, setGuardrailsResult] = useState<AiGuardrailsResult | null>(null);

  const wordCount = useMemo(() => input.trim().split(/\s+/).filter(Boolean).length, [input]);
  const t = translations[locale];
  const tabs: { id: ResultTab; label: string }[] = [
    { id: "improved", label: t.tabs.improved },
    { id: "why", label: t.tabs.why },
    { id: "alternatives", label: t.tabs.alternatives },
    { id: "safety", label: t.tabs.safety },
    { id: "export", label: t.tabs.export },
  ];
  const activeMode = promptModes.find((item) => item.id === mode);
  const displayScore = result.evaluation?.score ?? result.score;
  const displayGrade = result.evaluation?.grade ?? result.grade;
  const exportContent = `# ${result.metadata?.title ?? t.exportTitle}\n\n${t.score}: ${displayScore}/100 (${displayGrade})\nSource: ${result.source}\nModel: ${result.model ?? t.unknownModel}\n\n## ${t.exportPrompt}\n\n\`\`\`text\n${result.enhancedPrompt}\n\`\`\`\n\n## ${t.exportSummary}\n${result.summary}\n\n## ${t.exportImprovements}\n${asArray(result.improvements).map((item) => `- ${item}`).join("\n")}\n\n## ${t.exportIssues}\n${asArray(result.evaluation?.issues).map((item) => `- ${item}`).join("\n")}\n\n## ${t.exportSuggestions}\n${asArray(result.evaluation?.suggestions).map((item) => `- ${item}`).join("\n")}\n\n## ${t.exportQuestions}\n${asArray(result.clarifyingQuestions).map((item) => `- ${item}`).join("\n")}`;

  const filteredHistory = useMemo(() => {
    const query = historyQuery.toLowerCase().trim();
    return history
      .filter((item) => !query || item.input.toLowerCase().includes(query) || item.output.toLowerCase().includes(query))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [history, historyQuery]);

  useEffect(() => {
    const stored = window.localStorage.getItem("promptforge-history");
    if (!stored) return;
    queueMicrotask(() => setHistory(JSON.parse(stored) as HistoryItem[]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setLocale(getStoredLocale());
      setLocaleReady(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (localeReady) setStoredLocale(locale);
  }, [locale, localeReady]);

  function persistHistory(items: HistoryItem[]) {
    setHistory(items);
    window.localStorage.setItem("promptforge-history", JSON.stringify(items));
  }

  function saveResult(nextInput: string, nextMode: PromptMode, enhanced: StudioResult) {
    setResult(enhanced);
    setActiveTab("improved");
    persistHistory([
      {
        id: crypto.randomUUID(),
        mode: nextMode,
        input: nextInput,
        output: enhanced.enhancedPrompt,
        score: enhanced.evaluation?.score ?? enhanced.score,
        source: enhanced.source ?? "llm",
        favorite: false,
        createdAt: new Date().toLocaleString(),
      },
      ...history,
    ].slice(0, 12));
  }

  async function runAnalyze() {
    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "AI analysis failed");
      setAnalysis(payload as AiPromptAnalysis);
      setQuestionAnswers(((payload as AiPromptAnalysis).questions ?? []).map(() => ""));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function runEnhance(nextInput = input, nextMode = mode) {
    setIsEnhancing(true);
    setErrorMessage("");
    const preset = intentPreset(simpleIntent);
    const effectiveMode = showAdvanced ? nextMode : preset.mode;
    const effectiveStrength = showAdvanced ? strength : preset.strength;
    const effectiveOutputGoal = showAdvanced ? outputGoal : preset.outputGoal;
    const effectiveFramework = showAdvanced ? framework : preset.framework;
    const effectiveRewriteLevel = showAdvanced ? rewriteLevel : preset.rewriteLevel;
    const effectiveTargetModel = "auto";

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: nextInput,
          mode: effectiveMode,
          language,
          strength: effectiveStrength,
          style,
          outputGoal: effectiveOutputGoal,
          framework: effectiveFramework,
          rewriteLevel: effectiveRewriteLevel,
          targetModel: effectiveTargetModel,
          analysisContext: analysis ? { ...analysis, answers: questionAnswers } : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "AI enhancement API failed");
      saveResult(nextInput, effectiveMode, payload as StudioResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function runTestPrompt() {
    setIsTesting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: result.enhancedPrompt, sampleInput }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Prompt test failed");
      setTestResult(payload as AiPromptTestResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Prompt test failed");
    } finally {
      setIsTesting(false);
    }
  }

  async function runOptimize(nextTab: ResultTab = "why") {
    setIsOptimizing(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, enhancedPrompt: result.enhancedPrompt, analysisContext: analysis ? { ...analysis, answers: questionAnswers } : undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Auto optimize failed");
      setOptimizeResult(payload as AiOptimizeResult);
      setActiveTab(nextTab);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Auto optimize failed");
    } finally {
      setIsOptimizing(false);
    }
  }

  async function runBenchmark() {
    setIsBenchmarking(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: input, enhanced: result.enhancedPrompt, sampleInput }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Benchmark failed");
      setBenchmarkResult(payload as AiBenchmarkResult);
      setActiveTab("why");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Benchmark failed");
    } finally {
      setIsBenchmarking(false);
    }
  }

  async function runGuardrails() {
    setIsGeneratingGuardrails(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/guardrails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: result.enhancedPrompt, mode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Guardrails generation failed");
      setGuardrailsResult(payload as AiGuardrailsResult);
      setActiveTab("safety");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Guardrails generation failed");
    } finally {
      setIsGeneratingGuardrails(false);
    }
  }

  function handleTabChange(tab: ResultTab) {
    setActiveTab(tab);
    if (tab === "why" && !benchmarkResult && !isBenchmarking && result.enhancedPrompt) void runBenchmark();
    if (tab === "alternatives" && !optimizeResult && !isOptimizing && result.enhancedPrompt) void runOptimize("alternatives");
    if (tab === "safety" && !guardrailsResult && !isGeneratingGuardrails && result.enhancedPrompt) void runGuardrails();
  }

  function applyOptimizedPrompt() {
    if (!optimizeResult?.finalPrompt) return;
    setResult({ ...result, enhancedPrompt: optimizeResult.finalPrompt, score: optimizeResult.finalScore });
    setActiveTab("improved");
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(result.enhancedPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function exportMarkdown() {
    const blob = new Blob([exportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "enhanced-prompt.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyTemplate(index: number) {
    const template = promptTemplates[index];
    setInput(template.prompt);
    setMode(template.mode);
  }

  function toggleFavorite(id: string) {
    persistHistory(history.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item));
  }

  function restoreHistory(item: HistoryItem) {
    setInput(item.input);
    setMode(item.mode);
    setResult({ ...enhancePrompt(item.input, item.mode), enhancedPrompt: item.output, source: item.source });
    setActiveTab("improved");
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <nav className="nav-bar" aria-label="Application summary">
          <div className="brand-mark">PF</div>
          <div>
            <strong>PromptForge</strong>
            <span>{t.navSubtitle}</span>
          </div>
          <p className="api-status">{t.apiStatus}</p>
          <button className="locale-toggle" type="button" aria-label={t.localeAria} onClick={() => setLocale(getOppositeLocale(locale))}>
            <span className="locale-option" data-active={locale === "en"}>EN</span>
            <span className="locale-option" data-active={locale === "vi"}>VI</span>
            <span className="sr-only">{t.localeLabel}</span>
          </button>
        </nav>

        <section className="hero-content">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroDescription}</p>
            <div className="hero-actions">
              <a href="#workspace" className="hero-link primary">{t.improvePrompt}</a>
              <a href="#templates" className="hero-link">{t.useTemplate}</a>
            </div>
          </div>
          <div className="hero-metrics" aria-label="Current prompt metrics">
            <article><span>{t.score}</span><strong>{displayScore}</strong><small>{displayGrade}</small></article>
            <article><span>{t.mode}</span><strong>{activeMode?.label ?? mode}</strong><small>{style}</small></article>
            <article><span>{t.engine}</span><strong>{result.source === "llm" ? t.ai : t.local}</strong><small>{result.model ? "Deep Analysis" : t.diagnosticsSmall}</small></article>
          </div>
        </section>
      </header>

      <section id="workspace" className="workspace-grid" aria-label="Prompt consultant workspace">
        <aside className="panel control-panel">
          <div className="panel-title">
            <span className="step-badge">01</span>
            <div><p className="section-kicker">{t.simpleSetup}</p><h2>{t.whatNeed}</h2></div>
          </div>

          <div className="field-stack simple-controls">
            <label>{t.iWantTo}<select value={simpleIntent} onChange={(event) => setSimpleIntent(event.target.value as SimpleIntent)}><option value="clearer">{t.intentClearer}</option><option value="better-answer">{t.intentBetter}</option><option value="plan">{t.intentPlan}</option><option value="coding">{t.intentCoding}</option><option value="marketing">{t.intentMarketing}</option><option value="image">{t.intentImage}</option><option value="agent">{t.intentAgent}</option></select></label>
            <label>{t.tone}<select value={style} onChange={(event) => setStyle(event.target.value as EnhanceStyle)}><option value="professional">{t.professional}</option><option value="creative">{t.creative}</option><option value="technical">{t.detailed}</option><option value="concise">{t.concise}</option></select></label>
            <label>{t.language}<select value={language} onChange={(event) => setLanguage(event.target.value as EnhanceLanguage)}><option value="auto">{t.auto}</option><option value="english">{t.english}</option><option value="vietnamese">{t.vietnamese}</option><option value="bilingual">{t.bilingual}</option></select></label>
          </div>

          <button className="advanced-toggle" type="button" onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? t.hideAdvanced : t.advancedSettings}</button>
          {showAdvanced && <div className="field-stack advanced-settings">
            <label>{t.mode}<select value={mode} onChange={(event) => setMode(event.target.value as PromptMode)}>{promptModes.map((promptMode) => <option key={promptMode.id} value={promptMode.id}>{promptMode.label}</option>)}</select></label>
            <label>{t.strength}<select value={strength} onChange={(event) => setStrength(event.target.value as EnhanceStrength)}><option value="light">{t.lightRewrite}</option><option value="balanced">{t.balanced}</option><option value="deep">{t.deepConsultant}</option></select></label>
            <label>{t.framework}<select value={framework} onChange={(event) => setFramework(event.target.value as RewriteFramework)}><option value="auto">{t.auto}</option><option value="rtf">RTF</option><option value="craft">CRAFT</option><option value="co-star">CO-STAR</option><option value="tag">TAG</option><option value="risen">RISEN</option><option value="agent-spec">Agent Spec</option><option value="json-contract">JSON Contract</option></select></label>
            <label>{t.rewriteLevel}<select value={rewriteLevel} onChange={(event) => setRewriteLevel(event.target.value as RewriteLevel)}><option value="clean">Clean</option><option value="structure">Structure</option><option value="expert">Expert</option><option value="production">Production</option><option value="agentic">Agentic</option></select></label>
            <label>{t.outputGoal}<select value={outputGoal} onChange={(event) => setOutputGoal(event.target.value as RewriteOutputGoal)}><option value="accurate-answer">Accurate answer</option><option value="structured-plan">Structured plan</option><option value="json-api">JSON/API output</option><option value="creative-ideation">Creative ideation</option><option value="code-generation">Code generation</option><option value="agent-instruction">Agent instruction</option><option value="research-synthesis">Research synthesis</option><option value="marketing-copy">Marketing copy</option></select></label>
          </div>}

          <div className="workflow-actions">
            <button className="secondary-action" type="button" onClick={() => void runAnalyze()} disabled={isAnalyzing || !input.trim()}>
              {isAnalyzing ? t.checking : t.checkMissing}
            </button>
            {analysis && <button className="secondary-action" type="button" onClick={() => setMode(analysis.recommendedMode)}>{t.useAiSuggestion}</button>}
          </div>

          {analysis && <div className="analysis-card">
            <span className="risk-chip" data-risk={analysis.riskLevel}>{analysis.riskLevel} {t.risk}</span>
            <h3>{analysis.intent}</h3>
            <p>{analysis.strategyReason}</p>
            <div className="mini-list"><strong>{t.missingInfo}</strong>{asArray(analysis.missingInfo).map((item) => <span key={item}>{item}</span>)}</div>
          </div>}

          <div className="tip-card">
            <strong>{t.workflow}</strong>
            <p>{t.workflowTip}</p>
          </div>
        </aside>

        <section className="panel compose-panel">
          <div className="panel-title split">
            <div className="panel-title"><span className="step-badge">02</span><div><p className="section-kicker">{t.input}</p><h2>{t.roughPrompt}</h2></div></div>
            <span className="word-pill">{wordCount} {t.words}</span>
          </div>
          <textarea id="prompt-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.promptPlaceholder} />
          {asArray(analysis?.questions).length ? <div className="question-stack">
            <strong>{t.clarifyingAnswers}</strong>
            {asArray(analysis?.questions).map((question, index) => <label key={question}>{question}<input value={questionAnswers[index] ?? ""} onChange={(event) => setQuestionAnswers(questionAnswers.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))} placeholder={t.optionalAnswer} /></label>)}
          </div> : null}
          {errorMessage && <p className="error-banner">{errorMessage}</p>}
          <button id="enhance-button" className="primary-action" type="button" onClick={() => void runEnhance()} disabled={isEnhancing || !input.trim()}>
            {isEnhancing ? t.improving : t.improveMyPrompt}<span>{isEnhancing ? "✦" : "→"}</span>
          </button>
        </section>

        <section className="panel result-panel">
          <div className="result-head">
            <div className="panel-title"><span className="step-badge">03</span><div><p className="section-kicker">{t.output}</p><h2>{t.improvedPromptTitle}</h2></div></div>
            <div className="score-card"><strong>{displayScore}</strong><span>{displayGrade}</span></div>
          </div>

          <div className="status-row">
            <p className="source-pill" data-source={result.source}>{result.source === "llm" ? t.aiEnhanced : t.diagnostics}</p>
            {/* <p className="meta-pill">{result.model ?? t.unknownModel}</p> */}
            {typeof result.latencyMs === "number" && <p className="meta-pill">{result.latencyMs > 60000 ? `${Math.floor(result.latencyMs / 60000) > 0 ? `${Math.floor(result.latencyMs / 60000)}m ` : ""}${Math.floor((result.latencyMs % 60000) / 1000)}s` : `${result.latencyMs}ms`}</p>}
          </div>

          <div className="tab-row" role="tablist" aria-label={t.resultTabsAria}>
            {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "tab active" : "tab"} type="button" onClick={() => handleTabChange(tab.id)}>{tab.label}</button>)}
          </div>

          {isEnhancing && <div className="skeleton-card" aria-label={t.generatingPrompt} />}
          {!isEnhancing && activeTab === "improved" && <><p className="result-summary">{result.summary}</p>{asArray(result.metadata?.tags).length ? <div className="tag-row">{asArray(result.metadata?.tags).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}<pre className="prompt-output">{result.enhancedPrompt}</pre></>}
          {!isEnhancing && activeTab === "why" && <div className="simple-result-stack"><div className="consultant-grid"><section className="consultant-card score-summary"><h3>{t.qualityScore}</h3><strong className="big-score">{displayScore}/100</strong><p>{displayGrade}</p></section><section className="consultant-card"><h3>{t.whatImproved}</h3><ul>{(asArray(result.improvements).length ? asArray(result.improvements) : asArray(result.evaluation?.suggestions)).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>{t.qualityGoals}</h3><ul>{(asArray(result.qualityContract?.mustImprove).length ? asArray(result.qualityContract?.mustImprove) : [t.defaultQualityGoal]).map((item) => <li key={item}>{item}</li>)}</ul></section></div>{isBenchmarking && <div className="skeleton-card compact" aria-label={t.comparing} />}{!isBenchmarking && <div className="card-list">{(asArray(result.changes).length ? asArray(result.changes) : [{ title: t.promptRewritten, before: input, after: result.enhancedPrompt, reason: t.rewriteReason }]).slice(0, 3).map((change) => <article className="change-card" key={change.title}><h3>{change.title}</h3><div className="diff-grid"><article><span>{t.before}</span><p>{change.before}</p></article><article><span>{t.after}</span><p>{change.after}</p></article></div><p>{change.reason}</p></article>)}</div>}{benchmarkResult && <div className="roadmap-panel"><div className="score-duo"><article><span>{t.original}</span><strong>{benchmarkResult.originalScore}</strong></article><article><span>{t.improved}</span><strong>{benchmarkResult.enhancedScore}</strong></article><article><span>{t.winner}</span><strong>{benchmarkResult.winner}</strong></article></div><p>{benchmarkResult.summary}</p></div>}{optimizeResult && <div className="roadmap-panel"><div className="score-duo"><article><span>{t.finalScore}</span><strong>{optimizeResult.finalScore}</strong></article><button className="secondary-action" type="button" onClick={applyOptimizedPrompt}>{t.useOptimized}</button></div><p>{optimizeResult.reasoningSummary}</p></div>}<div className="workflow-actions"><button className="secondary-action" type="button" onClick={() => void runBenchmark()} disabled={isBenchmarking || !result.enhancedPrompt}>{isBenchmarking ? t.comparing : t.compare}</button><button className="secondary-action" type="button" onClick={() => void runOptimize("why")} disabled={isOptimizing || !input.trim()}>{isOptimizing ? t.optimizing : t.stronger}</button></div></div>}
          {!isEnhancing && activeTab === "alternatives" && (isOptimizing && !optimizeResult ? <div className="skeleton-card compact" aria-label={t.optimizing} /> : <div className="variant-grid">{(optimizeResult ? [{ name: t.stronger, prompt: optimizeResult.finalPrompt, bestFor: optimizeResult.reasoningSummary }, ...optimizeResult.iterations.map((iteration) => ({ name: `V${iteration.version}`, prompt: iteration.prompt, bestFor: iteration.critique }))] : asArray(result.variants).length ? asArray(result.variants) : [{ name: t.improved, prompt: result.enhancedPrompt, bestFor: t.defaultVariant }]).map((variant) => <article className="variant-card" key={variant.name}><div><h3>{variant.name}</h3><span>{variant.bestFor}</span></div><pre>{variant.prompt}</pre><button className="secondary-action" type="button" onClick={() => navigator.clipboard.writeText(variant.prompt)}>{t.copyVersion}</button></article>)}</div>)}
          {!isEnhancing && activeTab === "safety" && <div className="simple-result-stack">{isGeneratingGuardrails && !guardrailsResult && <div className="skeleton-card compact" aria-label={t.creating} />}<div className="consultant-grid"><section className="consultant-card"><h3>{t.questions}</h3><ul>{(asArray(result.clarifyingQuestions).length ? asArray(result.clarifyingQuestions) : [t.noExtraQuestions]).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>{t.checklist}</h3><ul>{(asArray(result.checklist).length ? asArray(result.checklist).map((item) => `${item.passed ? "✓" : "!"} ${item.item}`) : asArray(result.metrics).map((metric) => metric.label)).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>{t.safetyRules}</h3><ul>{(asArray(guardrailsResult?.guardrails).length ? asArray(guardrailsResult?.guardrails) : [t.safetyFallback]).map((item) => <li key={item}>{item}</li>)}</ul></section></div><div className="test-panel inline-test"><div><p className="section-kicker">{t.trySafely}</p><h3>{t.testWithContext}</h3></div><textarea value={sampleInput} onChange={(event) => setSampleInput(event.target.value)} placeholder={t.samplePlaceholder} /><div className="workflow-actions"><button className="secondary-action" type="button" onClick={() => void runTestPrompt()} disabled={isTesting || !result.enhancedPrompt}>{isTesting ? t.testing : t.testPrompt}</button><button className="secondary-action" type="button" onClick={() => void runGuardrails()} disabled={isGeneratingGuardrails || !result.enhancedPrompt}>{isGeneratingGuardrails ? t.creating : t.createSafety}</button></div>{testResult && <div className="test-result"><pre>{testResult.previewOutput}</pre><div className="consultant-grid"><section className="consultant-card"><h3>{t.strengths}</h3><ul>{asArray(testResult.strengths).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>{t.possibleIssues}</h3><ul>{asArray(testResult.failureModes).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>{t.recommendedTweaks}</h3><ul>{asArray(testResult.recommendedTweaks).map((item) => <li key={item}>{item}</li>)}</ul></section></div></div>}</div></div>}
          {!isEnhancing && activeTab === "export" && <pre className="prompt-output">{exportContent}</pre>}

          <div className="action-row">
            <button id="copy-prompt" className="secondary-action" type="button" onClick={copyPrompt}>{copied ? t.copied : t.copyPrompt}</button>
            <button id="export-markdown" className="secondary-action" type="button" onClick={exportMarkdown}>{t.exportMarkdown}</button>
          </div>
        </section>
      </section>

      <section className="support-grid">
        <section id="templates" className="panel">
          <div className="section-heading"><div><p className="section-kicker">{t.templates}</p><h2>{t.quickStarts}</h2></div></div>
          <div className="template-list">{promptTemplates.slice(0, 6).map((template, index) => <button className="template-row" key={template.title} type="button" onClick={() => applyTemplate(index)}><span>{template.tag}</span><strong>{template.title}</strong><p>{template.prompt}</p></button>)}</div>
        </section>

        <section className="panel history-panel" aria-labelledby="history-title">
          <div className="section-heading"><div><p className="section-kicker">{t.library}</p><h2 id="history-title">{t.recentPrompts}</h2></div><button className="secondary-action" type="button" onClick={() => persistHistory([])}>{t.clear}</button></div>
          <input className="history-search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder={t.searchHistory} />
          {filteredHistory.length === 0 ? <p className="empty-state">{t.noHistory}</p> : <div className="history-list compact">{filteredHistory.map((item) => <article className="history-item" key={item.id}><button type="button" onClick={() => restoreHistory(item)}><span>{item.createdAt}</span><strong>{item.score}/100</strong><p>{item.input}</p></button><button className="favorite-button" type="button" onClick={() => toggleFavorite(item.id)}>{item.favorite ? "★" : "☆"}</button></article>)}</div>}
        </section>
      </section>
    </main>
  );
}
