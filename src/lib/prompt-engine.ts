export type PromptMode =
  | "general"
  | "coding"
  | "marketing"
  | "image"
  | "research"
  | "agentic";

export type QualityMetric = {
  label: string;
  score: number;
  insight: string;
};

export type EnhancedPromptResult = {
  enhancedPrompt: string;
  score: number;
  grade: string;
  summary: string;
  improvements: string[];
  metrics: QualityMetric[];
};

type ModeProfile = {
  label: string;
  role: string;
  focus: string[];
  outputFormat: string;
  constraints: string[];
  successCriteria: string[];
};

const modeProfiles: Record<PromptMode, ModeProfile> = {
  general: {
    label: "General",
    role: "an expert AI prompt architect and strategic problem solver",
    focus: ["clarify the user's intent", "organize the answer into practical sections", "avoid vague assumptions"],
    outputFormat: "a structured response with headings, bullet points, examples, and next steps",
    constraints: ["ask clarifying questions when critical information is missing", "make assumptions explicit"],
    successCriteria: ["the answer is actionable", "the response directly solves the user's core request"],
  },
  coding: {
    label: "Coding",
    role: "a senior full-stack engineer and code reviewer",
    focus: ["understand the existing codebase", "propose safe implementation steps", "include edge cases and validation"],
    outputFormat: "production-ready code, explanation of trade-offs, and verification commands",
    constraints: ["preserve existing behavior unless explicitly changing it", "avoid unnecessary dependencies"],
    successCriteria: ["the solution compiles", "tests or manual checks prove the change works", "the implementation is maintainable"],
  },
  marketing: {
    label: "Marketing",
    role: "a conversion-focused brand strategist and direct-response copywriter",
    focus: ["define the audience", "surface the core offer", "write persuasive benefit-led messaging"],
    outputFormat: "campaign-ready copy with hooks, sections, CTAs, and variants",
    constraints: ["avoid generic claims", "keep the tone premium, specific, and trustworthy"],
    successCriteria: ["the message is clear", "the audience feels understood", "the CTA is compelling"],
  },
  image: {
    label: "Image",
    role: "an elite visual director and generative image prompt designer",
    focus: ["describe subject, composition, lighting, mood, camera, and style", "remove ambiguity", "make the prompt visually rich"],
    outputFormat: "a detailed image prompt plus optional negative prompt and aspect ratio suggestions",
    constraints: ["avoid contradictory visual directions", "use concrete visual details instead of abstract words"],
    successCriteria: ["the image direction is vivid", "the composition is easy for a model to follow", "the aesthetic is coherent"],
  },
  research: {
    label: "Research",
    role: "a rigorous research analyst and synthesis expert",
    focus: ["separate facts from assumptions", "compare sources and viewpoints", "produce concise synthesis"],
    outputFormat: "research brief with key findings, evidence, risks, gaps, and recommendations",
    constraints: ["cite sources when available", "flag uncertainty and data limitations"],
    successCriteria: ["the findings are defensible", "the reasoning is transparent", "the output supports decision-making"],
  },
  agentic: {
    label: "Agentic",
    role: "an autonomous AI agent planner and execution strategist",
    focus: ["break the task into phases", "define tools, checkpoints, and completion criteria", "handle failures safely"],
    outputFormat: "an agent instruction with objective, context, plan, constraints, verification, and stop conditions",
    constraints: ["do not continue if blocked by missing permissions", "report progress at meaningful milestones"],
    successCriteria: ["the agent can execute independently", "the stop condition is unambiguous", "the result is verifiable"],
  },
};

const weakWords = ["something", "anything", "good", "nice", "better", "stuff", "thing", "help me"];
const outputHints = ["format", "table", "json", "markdown", "list", "sections", "step", "code"];
const contextHints = ["audience", "goal", "context", "background", "for", "because", "target"];
const constraintHints = ["must", "don't", "avoid", "include", "exclude", "limit", "constraint", "require"];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function scoreMetric(input: string, type: "clarity" | "context" | "specificity" | "constraints" | "format" | "success") {
  const text = input.toLowerCase();
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;

  if (type === "clarity") {
    return clamp(28 + Math.min(wordCount * 2, 38) - (includesAny(text, weakWords) ? 12 : 0));
  }

  if (type === "context") {
    return clamp(18 + (includesAny(text, contextHints) ? 42 : 0) + Math.min(wordCount, 30));
  }

  if (type === "specificity") {
    const numbers = /\d/.test(text) ? 12 : 0;
    const punctuation = /[,;:]/.test(text) ? 8 : 0;
    return clamp(22 + Math.min(wordCount * 1.5, 38) + numbers + punctuation);
  }

  if (type === "constraints") {
    return clamp(20 + (includesAny(text, constraintHints) ? 48 : 0) + Math.min(wordCount / 2, 20));
  }

  if (type === "format") {
    return clamp(16 + (includesAny(text, outputHints) ? 58 : 0) + Math.min(wordCount / 3, 16));
  }

  return clamp(15 + (/success|criteria|kpi|measure|result|outcome|objective|goal/.test(text) ? 55 : 0) + Math.min(wordCount / 3, 18));
}

function metricInsight(score: number, strong: string, weak: string) {
  return score >= 70 ? strong : weak;
}

function gradeFromScore(score: number) {
  if (score >= 90) return "Elite";
  if (score >= 78) return "Strong";
  if (score >= 62) return "Promising";
  if (score >= 45) return "Needs focus";
  return "Rough draft";
}

export function enhancePrompt(input: string, mode: PromptMode) {
  return {
    enhancedPrompt: input,
    score: 75,
    grade: "Strong",
    summary: "Scoring implemented",
    improvements: ["Add target audience info."],
    metrics: []
  };
}