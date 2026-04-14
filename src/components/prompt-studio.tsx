"use client";

import { useEffect, useMemo, useState } from "react";
import { enhancePrompt, promptModes, type PromptMode } from "@/lib/prompt-engine";
import { promptTemplates } from "@/lib/templates";
import type { AiEnhanceResult, AiPromptAnalysis, AiPromptTestResult } from "@/lib/ai-result";
import type { EnhanceLanguage, EnhanceStrength, EnhanceStyle } from "@/lib/enhance-options";

type ResultTab = "prompt" | "evaluate" | "questions" | "variants" | "changes" | "checklist" | "export";
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

const starterPrompt = "Build me a sleek SaaS landing page for an AI prompt optimizer that helps creators and developers get better outputs from ChatGPT.";
const tabs: ResultTab[] = ["prompt", "evaluate", "questions", "variants", "changes", "checklist", "export"];

export function PromptStudio() {
  const [input, setInput] = useState(starterPrompt);
  const [mode, setMode] = useState<PromptMode>("marketing");
  const [language, setLanguage] = useState<EnhanceLanguage>("auto");
  const [strength, setStrength] = useState<EnhanceStrength>("balanced");
  const [style, setStyle] = useState<EnhanceStyle>("professional");
  const [activeTab, setActiveTab] = useState<ResultTab>("prompt");
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

  const wordCount = useMemo(() => input.trim().split(/\s+/).filter(Boolean).length, [input]);
  const activeMode = promptModes.find((item) => item.id === mode);
  const displayScore = result.evaluation?.score ?? result.score;
  const displayGrade = result.evaluation?.grade ?? result.grade;
  const exportContent = `# ${result.metadata?.title ?? "Enhanced Prompt"}\n\nScore: ${displayScore}/100 (${displayGrade})\nSource: ${result.source}\nModel: ${result.model ?? "unknown"}\n\n## Prompt\n\n\`\`\`text\n${result.enhancedPrompt}\n\`\`\`\n\n## Summary\n${result.summary}\n\n## Improvements\n${result.improvements.map((item) => `- ${item}`).join("\n")}\n\n## Issues\n${result.evaluation?.issues?.map((item) => `- ${item}`).join("\n") ?? ""}\n\n## Suggestions\n${result.evaluation?.suggestions?.map((item) => `- ${item}`).join("\n") ?? ""}\n\n## Clarifying Questions\n${result.clarifyingQuestions?.map((item) => `- ${item}`).join("\n") ?? ""}`;

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

  function persistHistory(items: HistoryItem[]) {
    setHistory(items);
    window.localStorage.setItem("promptforge-history", JSON.stringify(items));
  }

  function saveResult(nextInput: string, nextMode: PromptMode, enhanced: StudioResult) {
    setResult(enhanced);
    setActiveTab("prompt");
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

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: nextInput,
          mode: nextMode,
          language,
          strength,
          style,
          analysisContext: analysis ? { ...analysis, answers: questionAnswers } : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "AI enhancement API failed");
      saveResult(nextInput, nextMode, payload as StudioResult);
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

  function function toggleFavorite(id) {}

  function restoreHistory(item: HistoryItem) {
    setInput(item.input);
    setMode(item.mode);
    setResult({ ...enhancePrompt(item.input, item.mode), enhancedPrompt: item.output, source: item.source });
    setActiveTab("prompt");
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <nav className="nav-bar" aria-label="Application summary">
          <div className="brand-mark">PF</div>
          <div>
            <strong>PromptForge</strong>
            <span>AI Prompt Consultant</span>
          </div>
          <p className="api-status">OpenAI-compatible</p>
        </nav>

        <section className="hero-content">
          <div>
            <p className="eyebrow">Professional prompt workflow</p>
            <h1>Rewrite, evaluate, and ship better prompts.</h1>
            <p>
              Nhập prompt thô, chọn ngữ cảnh, để AI tư vấn cách rewrite, chấm điểm,
              tạo variants và checklist để prompt sẵn sàng dùng trong sản phẩm thật.
            </p>
            <div className="hero-actions">
              <a href="#workspace" className="hero-link primary">Start enhancing</a>
              <a href="#templates" className="hero-link">Use template</a>
            </div>
          </div>
          <div className="hero-metrics" aria-label="Current prompt metrics">
            <article><span>Score</span><strong>{displayScore}</strong><small>{displayGrade}</small></article>
            <article><span>Mode</span><strong>{activeMode?.label ?? mode}</strong><small>{style}</small></article>
            <article><span>Engine</span><strong>{result.source === "llm" ? "AI" : "Local"}</strong><small>{result.model ?? "diagnostics"}</small></article>
          </div>
        </section>
      </header>

      <section id="workspace" className="workspace-grid" aria-label="Prompt consultant workspace">
        <aside className="panel control-panel">
          <div className="panel-title">
            <span className="step-badge">01</span>
            <div><p className="section-kicker">Setup</p><h2>Controls</h2></div>
          </div>

          <div className="field-stack">
            <label>Mode<select value={mode} onChange={(event) => setMode(event.target.value as PromptMode)}>{promptModes.map((promptMode) => <option key={promptMode.id} value={promptMode.id}>{promptMode.label}</option>)}</select></label>
            <label>Language<select value={language} onChange={(event) => setLanguage(event.target.value as EnhanceLanguage)}><option value="auto">Auto</option><option value="english">English</option><option value="vietnamese">Vietnamese</option><option value="bilingual">Bilingual</option></select></label>
            <label>Strength<select value={strength} onChange={(event) => setStrength(event.target.value as EnhanceStrength)}><option value="light">Light rewrite</option><option value="balanced">Balanced</option><option value="deep">Deep consultant</option></select></label>
            <label>Style<select value={style} onChange={(event) => setStyle(event.target.value as EnhanceStyle)}><option value="professional">Professional</option><option value="creative">Creative</option><option value="technical">Technical</option><option value="concise">Concise</option></select></label>
          </div>

          <div className="workflow-actions">
            <button className="secondary-action" type="button" onClick={() => void runAnalyze()} disabled={isAnalyzing || !input.trim()}>
              {isAnalyzing ? "Analyzing..." : "Analyze prompt"}
            </button>
            {analysis && <button className="secondary-action" type="button" onClick={() => setMode(analysis.recommendedMode)}>Apply {analysis.recommendedMode}</button>}
          </div>

          {analysis && <div className="analysis-card">
            <span className="risk-chip" data-risk={analysis.riskLevel}>{analysis.riskLevel} risk</span>
            <h3>{analysis.intent}</h3>
            <p>{analysis.strategyReason}</p>
            <div className="mini-list"><strong>Missing info</strong>{analysis.missingInfo.map((item) => <span key={item}>{item}</span>)}</div>
          </div>}

          <div className="tip-card">
            <strong>Workflow</strong>
            <p>Analyze trước để AI phát hiện intent và câu hỏi thiếu dữ liệu, sau đó enhance và test prompt.</p>
          </div>
        </aside>

        <section className="panel compose-panel">
          <div className="panel-title split">
            <div className="panel-title"><span className="step-badge">02</span><div><p className="section-kicker">Input</p><h2>Prompt draft</h2></div></div>
            <span className="word-pill">{wordCount} words</span>
          </div>
          <textarea id="prompt-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập prompt cần rewrite..." />
          {analysis?.questions?.length ? <div className="question-stack">
            <strong>Clarifying answers</strong>
            {analysis.questions.map((question, index) => <label key={question}>{question}<input value={questionAnswers[index] ?? ""} onChange={(event) => setQuestionAnswers(questionAnswers.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))} placeholder="Optional answer..." /></label>)}
          </div> : null}
          {errorMessage && <p className="error-banner">{errorMessage}</p>}
          <button id="enhance-button" className="primary-action" type="button" onClick={() => void runEnhance()} disabled={isEnhancing || !input.trim()}>
            {isEnhancing ? "AI is consulting..." : "Enhance with AI"}<span>{isEnhancing ? "✦" : "→"}</span>
          </button>
        </section>

        <section className="panel result-panel">
          <div className="result-head">
            <div className="panel-title"><span className="step-badge">03</span><div><p className="section-kicker">Output</p><h2>Consultant result</h2></div></div>
            <div className="score-card"><strong>{displayScore}</strong><span>{displayGrade}</span></div>
          </div>

          <div className="status-row">
            <p className="source-pill" data-source={result.source}>{result.source === "llm" ? "AI enhanced" : "Diagnostics"}</p>
            <p className="meta-pill">{result.model ?? "unknown model"}</p>
            {typeof result.latencyMs === "number" && <p className="meta-pill">{result.latencyMs}ms</p>}
          </div>

          <div className="tab-row" role="tablist" aria-label="Result tabs">
            {tabs.map((tab) => <button key={tab} className={activeTab === tab ? "tab active" : "tab"} type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>

          {isEnhancing && <div className="skeleton-card" aria-label="Generating prompt" />}
          {!isEnhancing && activeTab === "prompt" && <><p className="result-summary">{result.summary}</p>{result.metadata?.tags?.length ? <div className="tag-row">{result.metadata.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}<pre className="prompt-output">{result.enhancedPrompt}</pre></>}
          {!isEnhancing && activeTab === "evaluate" && <div className="consultant-grid"><section className="consultant-card score-summary"><h3>AI Evaluation</h3><strong className="big-score">{displayScore}/100</strong><p>{displayGrade}</p></section><section className="consultant-card"><h3>Issues</h3><ul>{(result.evaluation?.issues?.length ? result.evaluation.issues : ["No major issues returned by AI."]).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>Suggestions</h3><ul>{(result.evaluation?.suggestions?.length ? result.evaluation.suggestions : result.improvements).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card wide"><h3>Criteria</h3><div className="metrics-list">{(result.evaluation?.criteria ?? result.metrics).map((metric) => <article className="metric" key={metric.label}><div><strong>{metric.label}</strong><span>{metric.insight}</span></div><div className="meter" aria-hidden="true"><i style={{ width: `${metric.score}%` }} /></div><b>{metric.score}</b></article>)}</div></section></div>}
          {!isEnhancing && activeTab === "questions" && <div className="card-list">{(result.clarifyingQuestions?.length ? result.clarifyingQuestions : ["No clarifying questions needed."]).map((question, index) => <article className="consultant-card" key={question}><span className="card-index">Q{index + 1}</span><p>{question}</p></article>)}</div>}
          {!isEnhancing && activeTab === "variants" && <div className="variant-grid">{(result.variants?.length ? result.variants : [{ name: "Enhanced", prompt: result.enhancedPrompt, bestFor: "Default use" }]).map((variant) => <article className="variant-card" key={variant.name}><div><h3>{variant.name}</h3><span>{variant.bestFor}</span></div><pre>{variant.prompt}</pre><button className="secondary-action" type="button" onClick={() => navigator.clipboard.writeText(variant.prompt)}>Copy variant</button></article>)}</div>}
          {!isEnhancing && activeTab === "changes" && <div className="card-list">{(result.changes?.length ? result.changes : [{ title: "Prompt rewritten", before: input, after: result.enhancedPrompt, reason: "AI improved structure and specificity." }]).map((change) => <article className="change-card" key={change.title}><h3>{change.title}</h3><div className="diff-grid"><article><span>Before</span><p>{change.before}</p></article><article><span>After</span><p>{change.after}</p></article></div><p>{change.reason}</p></article>)}</div>}
          {!isEnhancing && activeTab === "checklist" && <div className="checklist-list">{(result.checklist?.length ? result.checklist : result.metrics.map((metric) => ({ item: metric.label, passed: metric.score >= 70, note: metric.insight }))).map((item) => <article className="check-row" key={item.item} data-passed={item.passed}><strong>{item.passed ? "✓" : "!"}</strong><div><b>{item.item}</b><p>{item.note}</p></div></article>)}</div>}
          {!isEnhancing && activeTab === "export" && <pre className="prompt-output">{exportContent}</pre>}

          <div className="test-panel">
            <div>
              <p className="section-kicker">Test prompt</p>
              <h3>Preview real behavior</h3>
            </div>
            <textarea value={sampleInput} onChange={(event) => setSampleInput(event.target.value)} placeholder="Optional sample input/context for testing..." />
            <button className="secondary-action" type="button" onClick={() => void runTestPrompt()} disabled={isTesting || !result.enhancedPrompt}>{isTesting ? "Testing..." : "Test enhanced prompt"}</button>
            {testResult && <div className="test-result"><pre>{testResult.previewOutput}</pre><div className="consultant-grid"><section className="consultant-card"><h3>Strengths</h3><ul>{testResult.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>Failure modes</h3><ul>{testResult.failureModes.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="consultant-card"><h3>Tweaks</h3><ul>{testResult.recommendedTweaks.map((item) => <li key={item}>{item}</li>)}</ul></section></div></div>}
          </div>

          <div className="action-row">
            <button id="copy-prompt" className="secondary-action" type="button" onClick={copyPrompt}>{copied ? "Copied" : "Copy prompt"}</button>
            <button id="export-markdown" className="secondary-action" type="button" onClick={exportMarkdown}>Export Markdown</button>
          </div>
        </section>
      </section>

      <section className="support-grid">
        <section id="templates" className="panel">
          <div className="section-heading"><div><p className="section-kicker">Templates</p><h2>Quick starts</h2></div></div>
          <div className="template-list">{promptTemplates.slice(0, 6).map((template, index) => <button className="template-row" key={template.title} type="button" onClick={() => applyTemplate(index)}><span>{template.tag}</span><strong>{template.title}</strong><p>{template.prompt}</p></button>)}</div>
        </section>

        <section className="panel history-panel" aria-labelledby="history-title">
          <div className="section-heading"><div><p className="section-kicker">Library</p><h2 id="history-title">Recent prompts</h2></div><button className="secondary-action" type="button" onClick={() => persistHistory([])}>Clear</button></div>
          <input className="history-search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search history..." />
          {filteredHistory.length === 0 ? <p className="empty-state">Chưa có prompt nào được lưu.</p> : <div className="history-list compact">{filteredHistory.map((item) => <article className="history-item" key={item.id}><button type="button" onClick={() => restoreHistory(item)}><span>{item.createdAt}</span><strong>{item.score}/100</strong><p>{item.input}</p></button><button className="favorite-button" type="button" onClick={() => toggleFavorite(item.id)}>{item.favorite ? "★" : "☆"}</button></article>)}</div>}
        </section>
      </section>
    </main>
  );
}
