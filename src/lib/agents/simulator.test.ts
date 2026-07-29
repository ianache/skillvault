import test from "node:test";
import assert from "node:assert";
import { simulateAgentResponse } from "./simulator";
import { AIAgent } from "./store";

test("Simulator detects terraform keywords and triggers terraform-lint steps", async () => {
  const agent: AIAgent = {
    id: "agent-1",
    name: "Especialista DevOps",
    description: "Analiza infraestructura con terraform-lint",
    systemPrompt: "Eres un agente especializado en DevOps e Infraestructura como Código.",
    model: "claude-3-5-sonnet",
    skills: ["terraform-lint"],
    status: "active",
    createdAt: new Date().toISOString()
  };

  // Test keyword: tf
  const response = await simulateAgentResponse(agent, "Revisa mi tf");
  assert.strictEqual(response.role, "assistant");
  assert.ok(response.thoughtSteps && response.thoughtSteps.length === 3, "Debe tener exactamente 3 thought steps");
  
  const step1 = response.thoughtSteps[0];
  assert.strictEqual(step1.label, "Analizando sintaxis de Terraform en el prompt...");
  assert.strictEqual(step1.durationMs, 600);
  assert.strictEqual(step1.status, "completed");

  const step2 = response.thoughtSteps[1];
  assert.strictEqual(step2.label, "Ejecutando terraform-lint --check...");
  assert.strictEqual(step2.durationMs, 1200);
  assert.strictEqual(step2.status, "completed");
  assert.ok(step2.output?.includes("aws_region"), "Debe tener output de consola con advertencia de aws_region");

  const step3 = response.thoughtSteps[2];
  assert.strictEqual(step3.label, "Formulando respuesta final...");
  assert.strictEqual(step3.durationMs, 400);
  assert.strictEqual(step3.status, "completed");

  assert.ok(response.content.includes("main.tf"), "Debe contener referencia a main.tf");
});

test("Simulator detects PR keywords and triggers pr-reviewer steps", async () => {
  const agent: AIAgent = {
    id: "agent-2",
    name: "Revisor de Código Senior",
    description: "Revisa Pull Requests de forma inteligente",
    systemPrompt: "Eres un Ingeniero de Software Principal que revisa PRs.",
    model: "claude-3-5-sonnet",
    skills: ["pr-reviewer"],
    status: "active",
    createdAt: new Date().toISOString()
  };

  const response = await simulateAgentResponse(agent, "Por favor revisar este PR");
  assert.strictEqual(response.role, "assistant");
  assert.ok(response.thoughtSteps && response.thoughtSteps.length === 3, "Debe tener exactamente 3 thought steps");

  const step1 = response.thoughtSteps[0];
  assert.strictEqual(step1.label, "Descargando diff del pull request...");
  assert.strictEqual(step1.durationMs, 800);

  const step2 = response.thoughtSteps[1];
  assert.strictEqual(step2.label, "Ejecutando pr-reviewer contra guías de estilo...");
  assert.strictEqual(step2.durationMs, 1500);
  assert.ok(step2.output?.includes("auth.ts"), "Debe tener output de consola con advertencia de auth.ts");

  const step3 = response.thoughtSteps[2];
  assert.strictEqual(step3.label, "Formulando veredicto...");
  assert.strictEqual(step3.durationMs, 400);

  assert.ok(response.content.includes("auth.ts"), "Debe contener sugerencia de auth.ts");
});

test("Simulator fallback when no keywords match or skill is not assigned", async () => {
  const agent: AIAgent = {
    id: "agent-1",
    name: "Especialista DevOps",
    description: "Analiza infraestructura con terraform-lint",
    systemPrompt: "Eres un agente especializado en DevOps e Infraestructura como Código.",
    model: "claude-3-5-sonnet",
    skills: ["terraform-lint"],
    status: "active",
    createdAt: new Date().toISOString()
  };

  // Keywords match but agent lacks skill "pr-reviewer"
  const response = await simulateAgentResponse(agent, "Revisa este PR");
  assert.strictEqual(response.role, "assistant");
  assert.ok(response.thoughtSteps && response.thoughtSteps.length === 2, "Debe caer en el fallback conversacional estándar con 2 pasos");

  const step1 = response.thoughtSteps[0];
  assert.strictEqual(step1.label, "Analizando instrucciones del sistema...");
  assert.strictEqual(step1.durationMs, 500);

  const step2 = response.thoughtSteps[1];
  assert.strictEqual(step2.label, "Generando respuesta...");
  assert.strictEqual(step2.durationMs, 800);

  assert.ok(response.content.includes("Especialista DevOps"), "Debe mencionar el nombre del agente");
});
