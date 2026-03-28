import type { PromptMode } from "./prompt-engine";

export type PromptTemplate = {
  title: string;
  mode: PromptMode;
  tag: string;
  difficulty: "Starter" | "Pro" | "Expert";
  prompt: string;
};

export const promptTemplates: PromptTemplate[] = [
  {
    title: "Premium Landing Page",
    mode: "marketing",
    tag: "Growth",
    difficulty: "Pro",
    prompt: "Create a high-converting landing page for an AI productivity course for busy founders. Include hero, benefits, curriculum, testimonials, pricing, FAQ, and CTA copy. Tone should feel premium, clear, and trustworthy.",
  },
  {
    title: "Debug Production Bug",
    mode: "coding",
    tag: "Engineering",
    difficulty: "Expert",
    prompt: "Help me debug a Next.js production issue where users see stale dashboard data after updating settings. Explain likely causes, files to inspect, safe fixes, and verification steps.",
  },
  {
    title: "SEO Article Brief",
    mode: "marketing",
    tag: "SEO",
    difficulty: "Pro",
    prompt: "Create an SEO article brief for the keyword 'AI prompt engineering for small businesses'. Include search intent, audience, outline, title options, meta description, FAQs, internal link ideas, and quality criteria.",
  },
  {
    title: "YouTube Script System",
    mode: "general",
    tag: "Creator",
    difficulty: "Pro",
    prompt: "Create a YouTube script prompt for a 10-minute educational video about using AI tools to save 5 hours per week. Include hook, retention beats, examples, CTA, and tone guidance.",
  },
  {
    title: "Product Requirement Doc",
    mode: "agentic",
    tag: "Product",
    difficulty: "Expert",
    prompt: "Turn my feature idea into a clear product requirement document. Include problem statement, users, user stories, acceptance criteria, edge cases, analytics events, rollout plan, and risks.",
  },
  {
    title: "Refactor Plan",
    mode: "coding",
    tag: "Code Quality",
    difficulty: "Expert",
    prompt: "Analyze a messy frontend component and create a safe refactor plan. Include code smells, target architecture, step-by-step migration, test strategy, and rollback plan.",
  },
  {
    title: "Market Opportunity Research",
    mode: "research",
    tag: "Strategy",
    difficulty: "Expert",
    prompt: "Research the opportunity for a solo-founder SaaS that helps creators repurpose long videos into short clips. Compare competitors, customer pain points, pricing, risks, and positioning angles.",
  },
  {
    title: "Cinematic Image Direction",
    mode: "image",
    tag: "Visual",
    difficulty: "Pro",
    prompt: "Create an image prompt for a futuristic prompt engineering dashboard floating inside a dark glass command center, neon violet and cyan lighting, cinematic composition, ultra-detailed UI panels.",
  },
  {
    title: "Autonomous Task Brief",
    mode: "agentic",
    tag: "Agent",
    difficulty: "Expert",
    prompt: "Act as an autonomous coding agent. Audit my repository for onboarding friction, improve README setup instructions, verify commands, and stop only when the project can be run by a new developer.",
  },
  {
    title: "Vietnamese Business Plan",
    mode: "general",
    tag: "Vietnamese",
    difficulty: "Starter",
    prompt: "Hãy biến ý tưởng thô của tôi thành kế hoạch rõ ràng: tôi muốn xây sản phẩm nhỏ về prompt AI tốt hơn cho creator và developer, cần định vị, MVP features, và các bước tiếp theo.",
  },
];
