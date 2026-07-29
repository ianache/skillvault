import { AIAgent, ChatMessage, ThoughtStep } from "./store";

export async function simulateAgentResponse(agent: AIAgent, prompt: string): Promise<ChatMessage> {
  const input = prompt.toLowerCase();
  const thoughtSteps: ThoughtStep[] = [];
  let content = "";

  const hasSkill = (slug: string) => agent.skills.includes(slug);

  if (
    hasSkill("terraform-lint") &&
    (input.includes("terraform") ||
      input.includes("tf") ||
      input.includes("infra") ||
      input.includes("lint"))
  ) {
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
      output: '[INFO] Buscando archivos *.tf en el espacio de trabajo...\n[WARN] main.tf:L12: Variable "aws_region" declarada pero no se usa en ningún recurso.\n[SUCCESS] Análisis sintáctico de Terraform completado: 0 errores, 1 advertencia.'
    });
    thoughtSteps.push({
      id: "step-3",
      label: "Formulando respuesta final...",
      status: "completed",
      durationMs: 400
    });

    content = "¡He revisado tus archivos de Terraform! Encontré una advertencia menor en tu `main.tf` en la línea 12, donde declaras la variable `aws_region` pero no está asociada a ningún recurso. Fuera de eso, toda la sintaxis cumple excelentemente con las buenas prácticas de la plataforma.";
  } else if (
    hasSkill("pr-reviewer") &&
    (input.includes("pr") ||
      input.includes("pull request") ||
      input.includes("review") ||
      input.includes("revisar"))
  ) {
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
      output: '[INFO] Comparando rama "feat/auth" con "master" (3 commits, 4 archivos modificados)\n[PASS] Guía de estilos de SkillVault: OK.\n[SUGGESTION] auth.ts:L45: Considera usar un proveedor criptográfico aleatorio más robusto.'
    });
    thoughtSteps.push({
      id: "step-3",
      label: "Formulando veredicto...",
      status: "completed",
      durationMs: 400
    });

    content = "He finalizado la revisión de tu Pull Request de forma automatizada. Las guías de estilo y el linter pasan perfectamente. Te sugiero un cambio menor en `auth.ts` en la línea 45 para robustecer la generación criptográfica de tokens.";
  } else {
    // Standard conversational fallback
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
    id: "msg-" + Math.random().toString(36).substring(2, 11),
    role: "assistant",
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    thoughtSteps
  };
}
