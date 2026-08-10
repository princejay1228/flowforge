export const APP_NAME = "FlowForge";

export const SUPPORTED_DOMAINS = [
  "software_development",
  "healthcare",
  "food_service",
  "manufacturing",
  "construction",
  "research",
  "education",
  "events",
  "administrative",
  "emergency_procedures",
  "equipment_maintenance",
  "other",
] as const;

export const MAX_DOCUMENT_SIZE_MB = 3;

export const AI_PROVIDERS = ["gemini", "qwen", "deepseek", "openai"] as const;
