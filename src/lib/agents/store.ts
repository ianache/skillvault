export interface AIAgent {
  id: string;
  name: string;
  description: string;
  responsibility: string;
  deliverables: string[];
  systemPrompt: string;
  model: string;         // e.g., "claude-3-5-sonnet", "gpt-4o", "llama-3.3"
  owner: string;
  harnesses: string[];   // subset of VALID_HARNESSES, e.g. ["claude", "codex"]
  skills: string[];      // list of assigned skill slugs (e.g., ["terraform-lint", "pr-reviewer"])
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
}

export interface ThoughtStep {
  id: string;
  label: string;         // friendly message (e.g., "Invocando herramienta /terraform-lint")
  status: 'pending' | 'running' | 'completed';
  durationMs?: number;
  output?: string;       // terminal logs in plain text format
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  thoughtSteps?: ThoughtStep[]; // thought steps for the assistant
}

const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: "agent-1",
    name: "Especialista DevOps",
    description: "Analiza infraestructura con terraform-lint",
    responsibility: "Revisar cambios de infraestructura como código y detectar configuraciones riesgosas antes de aplicarlas.",
    deliverables: ["Reporte de lint de Terraform", "Lista de advertencias de seguridad"],
    systemPrompt: "Eres un agente especializado en DevOps e Infraestructura como Código.",
    model: "claude-3-5-sonnet",
    owner: "Equipo DevOps",
    harnesses: ["claude"],
    skills: ["terraform-lint"],
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "agent-2",
    name: "Revisor de Código Senior",
    description: "Revisa Pull Requests de forma inteligente",
    responsibility: "Revisar Pull Requests contra las guías de estilo del equipo y señalar riesgos antes del merge.",
    deliverables: ["Comentarios de revisión", "Veredicto de aprobación"],
    systemPrompt: "Eres un Ingeniero de Software Principal que revisa PRs.",
    model: "claude-3-5-sonnet",
    owner: "Equipo QA",
    harnesses: ["claude", "codex"],
    skills: ["pr-reviewer"],
    status: "active",
    createdAt: new Date().toISOString()
  }
];

class InMemoryLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

let inMemoryStorageInstance: InMemoryLocalStorage | null = null;

const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  if (!inMemoryStorageInstance) {
    inMemoryStorageInstance = new InMemoryLocalStorage();
  }
  return inMemoryStorageInstance;
};

export function getAgents(): AIAgent[] {
  const ls = getLocalStorage();
  const data = ls.getItem("sv_agents");
  if (!data) {
    ls.setItem("sv_agents", JSON.stringify(DEFAULT_AGENTS));
    return DEFAULT_AGENTS;
  }
  return JSON.parse(data);
}

export function createAgent(agent: Omit<AIAgent, 'id' | 'createdAt'>): AIAgent {
  const ls = getLocalStorage();
  const list = getAgents();
  const newAgent: AIAgent = {
    ...agent,
    id: "agent-" + Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString()
  };
  list.push(newAgent);
  ls.setItem("sv_agents", JSON.stringify(list));
  return newAgent;
}

export function deleteAgent(id: string): void {
  const ls = getLocalStorage();
  const list = getAgents().filter(a => a.id !== id);
  ls.setItem("sv_agents", JSON.stringify(list));
}

export function updateAgent(updated: AIAgent): void {
  const ls = getLocalStorage();
  const list = getAgents().map(a => a.id === updated.id ? updated : a);
  ls.setItem("sv_agents", JSON.stringify(list));
}

export function resetStore(): void {
  const ls = getLocalStorage();
  ls.removeItem("sv_agents");
}
