import test from "node:test";
import assert from "node:assert";
import { getAgents, createAgent, deleteAgent, updateAgent, resetStore } from "./store";

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
  const foundAgent = activeAgents.find(a => a.id === newAgent.id);
  assert.strictEqual(foundAgent?.name, "Test Agent");

  // Test updating the agent
  if (foundAgent) {
    const updated = { ...foundAgent, name: "Updated Test Agent", status: "inactive" as const };
    updateAgent(updated);
    const postUpdateAgents = getAgents();
    const updatedAgent = postUpdateAgents.find(a => a.id === newAgent.id);
    assert.strictEqual(updatedAgent?.name, "Updated Test Agent");
    assert.strictEqual(updatedAgent?.status, "inactive");
  }

  deleteAgent(newAgent.id);
  const updatedAgents = getAgents();
  assert.strictEqual(updatedAgents.find(a => a.id === newAgent.id), undefined);
});
