import { GenerateWorkflowInput } from "@/types/ai";

export function buildGenerateWorkflowPrompt(input: GenerateWorkflowInput): string {
  const {
    workspaceId,
    projectId,
    requirements,
    domainHint,
    deadline,
    members,
    constraints,
    documentContext,
  } = input;

  return `
You are FlowForge, an expert AI workflow compiler.
Your objective is to translate natural language requirements into a strictly structured, mathematically sound workflow.

## DOMAIN
${domainHint || "General"}

## PROJECT OBJECTIVE
${requirements}

## TEAM MEMBERS (RESOURCES)
${members.map(m => `- ID: ${m.id} | Name: ${m.name} | Role: ${m.role} | Skills: ${m.skills.join(", ")} | Available Hours: ${m.availability.workingHours[0]?.startTime || "N/A"} - ${m.availability.workingHours[0]?.endTime || "N/A"}`).join("\n")}

## CONSTRAINTS
${constraints && constraints.length > 0 ? constraints.join("\n") : "None specified."}
Deadline: ${deadline || "None"}

## DOCUMENTS / CONTEXT
${documentContext && documentContext.length > 0 ? documentContext.map(d => `--- Chunk from Document ID ${d.documentId} ---\n${d.text}`).join("\n\n") : "No documents provided."}

## INSTRUCTIONS
1. Break down the project objective into logical, sequential, or parallel tasks.
2. For each task, provide an estimated duration (in minutes).
3. Specify required skills for each task based on what is needed to complete it.
4. Assign members to tasks IF they possess the required skills. You may leave "assignedMemberId" empty if no member perfectly matches, but try to assign where obvious.
5. Create dependencies between tasks (e.g. Task B depends on Task A finishing). Use "finish_to_start" for standard sequential dependencies.
6. The final output must be a valid JSON object conforming exactly to the requested schema.
7. DO NOT generate impossible tasks, fake team members, or invent skills not present in the team.
8. Make sure task IDs are unique string identifiers (e.g., "task_1", "task_2").
9. Every "dependsOn" ID in a task MUST match an actual task ID you generated.
10. **CRITICAL**: You MUST return the ENTIRE JSON object exactly as structured below. DO NOT omit any fields. DO NOT return only the tasks. DO NOT wrap the object in another property. Provide all top-level properties including id, workspaceId, projectId, name, description, domain, objective, etc.

## OUTPUT FORMAT
Return a JSON object with the following structure. Do NOT include markdown code blocks (\`\`\`json), just return the raw JSON object.

{
  "id": "workflow_will_be_generated",
  "workspaceId": "${workspaceId}",
  "projectId": "${projectId}",
  "name": "A short, descriptive name for the workflow",
  "description": "A summary of the workflow",
  "domain": "other",
  "objective": "The parsed objective",
  "tasks": [
    {
      "id": "task_1",
      "workflowId": "workflow_will_be_generated",
      "name": "Task Name",
      "description": "Task description",
      "status": "not_started",
      "priority": "medium",
      "requiredSkills": ["skill1"],
      "estimatedDuration": 60,
      "dependsOn": [],
      "classification": "mandatory",
      "createdAt": "${new Date().toISOString()}",
      "updatedAt": "${new Date().toISOString()}"
    }
  ],
  "dependencies": [
    {
      "id": "dep_1",
      "workflowId": "workflow_will_be_generated",
      "sourceTaskId": "task_1",
      "targetTaskId": "task_2",
      "dependencyType": "finish_to_start"
    }
  ],
  "milestones": [],
  "assignments": [],
  "constraints": [],
  "risks": [],
  "metadata": {
    "version": 1
  },
  "createdAt": "${new Date().toISOString()}",
  "updatedAt": "${new Date().toISOString()}"
}
`;
}
