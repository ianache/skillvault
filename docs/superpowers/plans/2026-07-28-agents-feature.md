# AI Agents Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a premium, highly interactive client-side AI Agent Management and Chat Simulator within SkillVault, allowing users to create, configure, assign skills, and chat with AI agents that visually simulate tool/skill execution.

**Architecture:** Core state and message histories are persisted in `localStorage` with a robust Next.js/React layout. Chat prompts are analyzed by an intelligent frontend simulation engine that triggers a multi-step "thinking and tool-execution" timeline before outputting results in a custom-designed terminal window.

**Tech Stack:** React, TypeScript, Next.js (App Router), CSS variables (SkillVault Design Tokens), standard test suite (`node:test`).

## Global Constraints

- No external libraries for state or chat; use Vanilla React State/Context and native Web APIs (`localStorage`).
- Maintain pixel-perfect compliance with SkillVault design system tokens defined in `_ds/skillvault/styles.css`.
- Support standard `node:test` + `tsx` test runners for unit testing.
- Ensure all pages and routes export valid React components and compile cleanly under Turbopack.

---

### Task 1: Definición de Tipos y Almacén de Persistencia (LocalStorage Store)

**Files:**
- Create: `src/lib/agents/store.ts`
- Create: `src/lib/agents/store.test.ts`

**Interfaces:**
- Produces: `AIAgent`, `ThoughtStep`, `ChatMessage` types, and `AgentStore` utility functions.

- [ ] **Step 1: Escribir la prueba que falle**
  Crear `src/lib/agents/store.test.ts` con una prueba para inicializar el almacén local y verificar que contenga los agentes por defecto si no existen datos previos en `localStorage`:
  ```typescript
  import test from "node:test";
  import assert from "node:assert";
  import { getAgents, createAgent, deleteAgent, resetStore } from "./store";

  test("AgentStore initializes with default agents and handles CRUD", () => {
    resetStore(); // Helper to clear state
    const agents = getAgents();
    assert.ok(agents.length > 0, "Debe tener agentes por defecto");
    
    const newAgent = createAgent({
      name: "Test Agent",
      description: "Linter tool test",
      systemPrompt: "You are a test linter",
      model: "gpt-4o",
      skills: ["terraform-lint"],
      status: "active"
    });

    const activeAgents = getAgents();
    assert.strictEqual(activeAgents.find(a => a.id === newAgent.id)?.name, "Test Agent");

    deleteAgent(newAgent.id);
    const updatedAgents = getAgents();
    assert.strictEqual(updatedAgents.find(a => a.id === newAgent.id), undefined);
  });
  ```

- [ ] **Step 2: Ejecutar pruebas para verificar que fallan**
  Run: `tsx --test src/lib/agents/store.test.ts`
  Expected: FAIL con error de importación/módulo no definido.

- [ ] **Step 3: Implementar código mínimo**
  Crear `src/lib/agents/store.ts`:
  ```typescript
  export interface AIAgent {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    model: string;
    skills: string[];
    status: 'active' | 'inactive';
    createdAt: string;
  }

  export interface ThoughtStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'completed';
    durationMs?: number;
    output?: string;
  }

  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    thoughtSteps?: ThoughtStep[];
  }

  const DEFAULT_AGENTS: AIAgent[] = [
    {
      id: "agent-1",
      name: "Especialista DevOps",
      description: "Analiza infraestructura con terraform-lint",
      systemPrompt: "Eres un agente especializado en DevOps e Infraestructura como Código.",
      model: "claude-3-5-sonnet",
      skills: ["terraform-lint"],
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "agent-2",
      name: "Revisor de Código Senior",
      description: "Revisa Pull Requests de forma inteligente",
      systemPrompt: "Eres un Ingeniero de Software Principal que revisa PRs.",
      model: "claude-3-5-sonnet",
      skills: ["pr-reviewer"],
      status: "active",
      createdAt: new Date().toISOString()
    }
  ];

  const getLocalStorage = () => {
    if (typeof window !== "undefined") {
      return window.localStorage;
    }
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    } as any;
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
      id: "agent-" + Math.random().toString(36).substr(2, 9),
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
  ```

- [ ] **Step 4: Ejecutar pruebas para verificar que pasan**
  Run: `tsx --test src/lib/agents/store.test.ts`
  Expected: PASS

- [ ] **Step 5: Confirmar cambios en git y commit**
  ```bash
  git add src/lib/agents/store.ts src/lib/agents/store.test.ts
  git commit -m "feat: define AI Agent types and implement localStorage store"
  ```

---

### Task 2: Motor de Simulación de Orquestación de Herramientas

**Files:**
- Create: `src/lib/agents/simulator.ts`
- Create: `src/lib/agents/simulator.test.ts`

**Interfaces:**
- Consumes: `AIAgent`, `ThoughtStep`, `ChatMessage` types
- Produces: `simulateAgentResponse(agent: AIAgent, prompt: string): Promise<ChatMessage>`

- [ ] **Step 1: Escribir la prueba que falle**
  Crear `src/lib/agents/simulator.test.ts`:
  ```typescript
  import test from "node:test";
  import assert from "node:assert";
  import { simulateAgentResponse } from "./simulator";
  import { AIAgent } from "./store";

  test("Simulator detects keywords and spawns correct tool steps", async () => {
    const agent: AIAgent = {
      id: "agent-1",
      name: "DevOps",
      description: "Linter",
      systemPrompt: "You are DevOps",
      model: "claude-3-5-sonnet",
      skills: ["terraform-lint"],
      status: "active",
      createdAt: new Date().toISOString()
    };

    const response = await simulateAgentResponse(agent, "Revisa mi modulo de terraform por favor");
    assert.strictEqual(response.role, "assistant");
    assert.ok(response.thoughtSteps && response.thoughtSteps.length > 0, "Debe tener thought steps");
    
    const linterStep = response.thoughtSteps.find(s => s.label.includes("terraform-lint"));
    assert.ok(linterStep, "Debe contener el paso simulado de terraform-lint");
    assert.ok(linterStep.output?.includes("main.tf"), "Debe tener output de consola realista");
  });
  ```

- [ ] **Step 2: Ejecutar pruebas para verificar que fallan**
  Run: `tsx --test src/lib/agents/simulator.test.ts`
  Expected: FAIL con error de importación.

- [ ] **Step 3: Implementar código mínimo**
  Crear `src/lib/agents/simulator.ts`:
  ```typescript
  import { AIAgent, ChatMessage, ThoughtStep } from "./store";

  export async function simulateAgentResponse(agent: AIAgent, prompt: string): Promise<ChatMessage> {
    const input = prompt.toLowerCase();
    const thoughtSteps: ThoughtStep[] = [];
    let content = "";

    const hasSkill = (slug: string) => agent.skills.includes(slug);

    if (hasSkill("terraform-lint") && (input.includes("terraform") || input.includes("tf") || input.includes("infra") || input.includes("lint"))) {
      thoughtSteps.push({
        id: "step-1",
        label: "Analizando sintaxis de Terraform en el prompt...",
        status: "completed",
        durationMs: 600
      });
      thoughtSteps.push({
        id: "step-2",
        label: "Ejecutando terraform-lint --check...",
        status: "completed",
        durationMs: 1200,
        output: "[INFO] Buscando archivos *.tf en el espacio de trabajo...\n[WARN] main.tf:L12: Variable \"aws_region\" declarada pero no se usa en ningún recurso.\n[SUCCESS] Análisis sintáctico de Terraform completado: 0 errores, 1 advertencia."
      });
      thoughtSteps.push({
        id: "step-3",
        label: "Formulando respuesta final...",
        status: "completed",
        durationMs: 400
      });

      content = `¡He revisado tus archivos de Terraform! Encontré una advertencia menor en tu \`main.tf\` en la línea 12, donde declaras la variable \`aws_region\` pero no está asociada a ningún recurso. Fuera de eso, toda la sintaxis cumple excelentemente con las buenas prácticas de la plataforma.`;
    } else if (hasSkill("pr-reviewer") && (input.includes("pr") || input.includes("pull request") || input.includes("review") || input.includes("revisar"))) {
      thoughtSteps.push({
        id: "step-1",
        label: "Descargando diff del pull request...",
        status: "completed",
        durationMs: 800
      });
      thoughtSteps.push({
        id: "step-2",
        label: "Ejecutando pr-reviewer contra guías de estilo...",
        status: "completed",
        durationMs: 1500,
        output: "[INFO] Comparando rama \"feat/auth\" con \"master\" (3 commits, 4 archivos modificados)\n[PASS] Guía de estilos de SkillVault: OK.\n[SUGGESTION] auth.ts:L45: Considera usar un proveedor criptográfico aleatorio más robusto."
      });
      thoughtSteps.push({
        id: "step-3",
        label: "Formulando veredicto...",
        status: "completed",
        durationMs: 400
      });

      content = `He finalizado la revisión de tu Pull Request de forma automatizada. Las guías de estilo y el linter pasan perfectamente. Te sugiero un cambio menor en \`auth.ts\` en la línea 45 para robustecer la generación criptográfica de tokens.`;
    } else {
      // Flujo conversacional estándar
      thoughtSteps.push({
        id: "step-1",
        label: "Analizando instrucciones del sistema...",
        status: "completed",
        durationMs: 500
      });
      thoughtSteps.push({
        id: "step-2",
        label: "Generando respuesta...",
        status: "completed",
        durationMs: 800
      });

      content = `Hola. Soy un agente configurado como "${agent.name}". Mi rol es: "${agent.description}". Tengo asignadas las siguientes herramientas: [${agent.skills.join(", ") || "Ninguna"}]. ¿En qué te puedo ayudar hoy?`;
    }

    return {
      id: "msg-" + Math.random().toString(36).substr(2, 9),
      role: "assistant",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thoughtSteps
    };
  }
  ```

- [ ] **Step 4: Ejecutar pruebas para verificar que pasan**
  Run: `tsx --test src/lib/agents/simulator.test.ts`
  Expected: PASS

- [ ] **Step 5: Confirmar cambios en git y commit**
  ```bash
  git add src/lib/agents/simulator.ts src/lib/agents/simulator.test.ts
  git commit -m "feat: implement AI agent intelligent execution and tool simulation engine"
  ```

---

### Task 3: Vistas de Listado y Formulario de Agentes (Rutas /agents)

**Files:**
- Create: `src/app/agents/page.tsx`
- Create: `src/app/agents/create/page.tsx`
- Modify: `src/components/shell/AppSidebar.tsx`
- Create: `src/lib/review/agents-smoke.test.ts`

**Interfaces:**
- Consumes: `getAgents`, `createAgent` de `store.ts`
- Produces: Rutas e interfaz responsiva para ver y crear agentes.

- [ ] **Step 1: Escribir la prueba que falle**
  Crear `src/lib/review/agents-smoke.test.ts` para verificar la existencia del link en la barra lateral y que las páginas de los agentes renderizan sin fallos:
  ```typescript
  import test from "node:test";
  import assert from "node:assert";
  import fs from "fs/promises";
  import path from "path";

  const source = async (relPath: string) => {
    return await fs.readFile(path.join(__dirname, relPath), "utf-8");
  };

  test("AppSidebar contains Agents navigation link", async () => {
    const sidebarSource = await source("../../components/shell/AppSidebar.tsx");
    assert.match(sidebarSource, /\/agents/);
  });
  ```

- [ ] **Step 2: Ejecutar pruebas para verificar que fallan**
  Run: `pnpm run test:review`
  Expected: FAIL (porque `AppSidebar` aún no contiene la ruta `/agents`).

- [ ] **Step 3: Implementar código en AppSidebar.tsx y crear vistas**
  - **Editar `src/components/shell/AppSidebar.tsx`** para añadir el enlace de navegación hacia `/agents` con icono de Robot/Agentes (M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z).
  - **Crear `src/app/agents/page.tsx`**: Renderizar tarjetas de agentes utilizando `getAgents()`, estilizado usando tokens oficiales (Space Grotesk, bg `#f7f5f0`, tarjetas blancas, bordes limpios).
  - **Crear `src/app/agents/create/page.tsx`**: Renderizar el formulario con Name, Description, System Prompt, Model y un checkbox grid para seleccionar skills del catálogo.

- [ ] **Step 4: Ejecutar pruebas para verificar que pasan**
  Run: `pnpm run test:review`
  Expected: PASS

- [ ] **Step 5: Confirmar cambios en git y commit**
  ```bash
  git add src/components/shell/AppSidebar.tsx src/app/agents/page.tsx src/app/agents/create/page.tsx src/lib/review/agents-smoke.test.ts
  git commit -m "feat: design and implement AI agent list, create pages and sidebar nav"
  ```

---

### Task 4: Sala de Chat y Terminal de Logs Interactivo

**Files:**
- Create: `src/app/agents/chat/[id]/page.tsx`

**Interfaces:**
- Consumes: `simulateAgentResponse`, `getAgents` de `store.ts` y `simulator.ts`
- Produces: Chat interactivo premium con consola macOS empotrada.

- [ ] **Step 1: Escribir la prueba que falle**
  Añadir caso de prueba al final de `src/lib/review/agents-smoke.test.ts` para validar que el chat consume la simulación del orquestador:
  ```typescript
  test("Chat page contains simulation components", async () => {
    const chatSource = await source("../../app/agents/chat/[id]/page.tsx");
    assert.match(chatSource, /simulateAgentResponse/);
    assert.match(chatSource, /ThoughtStep/);
  });
  ```

- [ ] **Step 2: Ejecutar pruebas para verificar que fallan**
  Run: `pnpm run test:review`
  Expected: FAIL porque el archivo de chat no existe.

- [ ] **Step 3: Implementar página del Chat**
  Crear la página `src/app/agents/chat/[id]/page.tsx` con:
  - Sidebar izquierdo de sesión rápida con listado de agentes y herramientas.
  - Timeline central con mensajes que actualizan secuencialmente su estado de `thoughtSteps`.
  - Caja negra terminal con efecto typing y botones estilo macOS para outputs técnicos de herramientas.
  - Entrada de chat adaptativa y botones rápidos para prompts instantáneos.

- [ ] **Step 4: Ejecutar pruebas para verificar que pasan**
  Run: `pnpm run test:review`
  Expected: PASS

- [ ] **Step 5: Confirmar cambios en git y commit**
  ```bash
  git add src/app/agents/chat/\[id\]/page.tsx
  git commit -m "feat: complete interactive AI Agent chat and console simulation engine"
  ```
