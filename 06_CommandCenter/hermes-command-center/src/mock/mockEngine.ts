'use client';

import { useState, useEffect } from 'react';
import type {
  ExecutionEvent,
  Agent,
  Skill,
  Tool,
  ApprovalRequest,
  Mission,
  Task,
  Category,
  KPIs,
} from '../types/events';

export const categories: Category[] = [
  { id: 'dashboard', name: 'Dashboard', color: '#3b82f6' },
  { id: 'playbooks', name: 'Playbooks', color: '#10b981' },
  { id: 'frameworks', name: 'Frameworks', color: '#8b5cf6' },
  { id: 'automations', name: 'Automations', color: '#f59e0b' },
  { id: 'agents', name: 'Agents', color: '#ef4444' },
  { id: 'integrations', name: 'Integrations', color: '#06b6d4' },
  { id: 'research', name: 'Research', color: '#84cc16' },
  { id: 'creative', name: 'Creative', color: '#ec4899' },
  { id: 'development', name: 'Development', color: '#6366f1' },
  { id: 'jobs', name: 'Jobs / Opportunities', color: '#f97316' },
];

const initialMission: Mission = {
  id: 'mission-1',
  name: 'LinkedIn Prospecting',
  status: 'RUNNING',
  progress: 28,
  governance: 'PENDING',
};
const initialAgents: Agent[] = [
  { id: 'hermes', name: 'Hermes', role: 'Orchestrator', status: 'RUNNING' },
  { id: 'agent-zero', name: 'Agent Zero', role: 'Autonomous Execution', status: 'RUNNING' },
  { id: 'creative', name: 'Creative', role: 'Content & Assets', status: 'IDLE' },
  { id: 'growth', name: 'Growth', role: 'Growth Ops', status: 'IDLE' },
  { id: 'operations', name: 'Operations', role: 'Operations', status: 'WAITING' },
  { id: 'governance', name: 'Governance', role: 'Governance', status: 'REQUIRES_APPROVAL' },
];
const initialSkills: Skill[] = [
  { id: 's1', name: 'LinkedIn Opportunity Hunter', category: 'jobs', active: true },
  { id: 's2', name: 'LinkedIn Job Hunter', category: 'jobs', active: true },
  { id: 's3', name: 'Creative Direction', category: 'creative', active: false },
  { id: 's4', name: 'Approval Gate', category: 'agents', active: true },
  { id: 's5', name: 'Autonomous Router', category: 'automations', active: true },
  { id: 's6', name: 'Autonomous Continuous Improvement', category: 'automations', active: true },
  { id: 's7', name: 'Audit Log', category: 'integrations', active: true },
];
const initialTools: Tool[] = [
  { id: 't1', name: 'Browser Automation', category: 'integrations', status: 'active' },
  { id: 't2', name: 'Screenshot', category: 'integrations', status: 'idle' },
  { id: 't3', name: 'Terminal', category: 'integrations', status: 'active' },
  { id: 't4', name: 'Delegation', category: 'agents', status: 'idle' },
  { id: 't5', name: 'Memory', category: 'integrations', status: 'idle' },
];
const initialTasks: Task[] = [
  { id: 'task-1', title: 'Creative Strategist', category: 'creative', project: 'LinkedIn Prospecting', agent: 'Hermes', status: 'RUNNING', priority: 'HIGH', createdAt: '2026-08-13T21:40:00.000Z', updatedAt: '2026-08-13T21:42:00.000Z', duration: '2m', toolsUsed: ['Browser Automation'], nextAction: 'Review draft assets' },
  { id: 'task-2', title: 'Job Hunter', category: 'jobs', project: 'LinkedIn Prospecting', agent: 'Agent Zero', status: 'RUNNING', priority: 'HIGH', createdAt: '2026-08-13T21:41:00.000Z', updatedAt: '2026-08-13T21:43:00.000Z', duration: '1m', toolsUsed: ['Browser Automation'], nextAction: 'Submit Easy Apply' },
  { id: 'task-3', title: 'Repository push', category: 'development', project: 'Command Center', agent: 'Operations', status: 'BLOCKED', priority: 'HIGH', createdAt: '2026-08-13T21:35:00.000Z', updatedAt: '2026-08-13T21:45:00.000Z', blocker: 'GitHub authentication required', nextAction: 'Authenticate GitHub', toolsUsed: ['GitHub'] },
  { id: 'task-4', title: 'Research prospects', category: 'research', project: 'LinkedIn Prospecting', agent: 'Growth', status: 'WAITING', priority: 'MEDIUM', createdAt: '2026-08-13T21:30:00.000Z', updatedAt: '2026-08-13T21:40:00.000Z', duration: '5m', toolsUsed: ['Browser Automation', 'Screenshot'], nextAction: 'Awaiting approval' },
  { id: 'task-5', title: 'Pipeline automation', category: 'automations', project: 'Ops Automation', agent: 'Operations', status: 'DONE', priority: 'MEDIUM', createdAt: '2026-08-13T20:00:00.000Z', updatedAt: '2026-08-13T20:18:00.000Z', duration: '18m', result: 'Pipeline deployed', events: ['Created workflow', 'Validated triggers', 'Deployed'] },
  { id: 'task-6', title: 'Playbook review', category: 'playbooks', project: 'Hermes Core', agent: 'Hermes', status: 'BACKLOG', priority: 'LOW', createdAt: '2026-08-13T19:00:00.000Z', updatedAt: '2026-08-13T19:00:00.000Z', nextAction: 'Schedule review' },
  { id: 'task-7', title: 'Approval queue', category: 'agents', project: 'Governance', agent: 'Governance', status: 'WAITING', priority: 'CRITICAL', createdAt: '2026-08-13T21:44:00.000Z', updatedAt: '2026-08-13T21:44:00.000Z', blocker: 'External side effect detected', nextAction: 'Manual approval' },
];
const initialApprovals: ApprovalRequest[] = [];
const initialKPIs: KPIs = { totalMissions: 12, running: 4, blocked: 2, waitingApproval: 1, completed: 38, activeAgents: 5, recentExecutions: 16, alerts: 3 };

const steps: Array<{ afterMs: number; apply: (s: State) => State }> = [
  { afterMs: 300, apply: (s) => pushEvent(s, { executionId: 'exec-1', parentId: null, actor: 'Hermes', actorType: 'hermes', eventType: 'MISSION_STARTED', status: 'running', message: 'Mission received: LinkedIn Prospecting', metadata: { mission: 'LinkedIn Prospecting' } }) },
  { afterMs: 1400, apply: (s) => pushEvent(s, { executionId: 'exec-1', parentId: null, actor: 'Hermes', actorType: 'hermes', eventType: 'SKILL_SELECTED', status: 'completed', message: 'Intent classified', skill: 'LinkedIn Opportunity Hunter', agent: 'Growth' }) },
  { afterMs: 2400, apply: (s) => pushEvent(s, { executionId: 'exec-1', parentId: null, actor: 'Hermes', actorType: 'hermes', eventType: 'AGENT_DELEGATED', status: 'completed', message: 'Delegating to Agent Zero', agent: 'Agent Zero' }) },
  { afterMs: 3400, apply: (s) => pushEvent(s, { executionId: 'exec-1', parentId: null, actor: 'Agent Zero', actorType: 'agent', eventType: 'AGENT_STARTED', status: 'running', message: 'Browser initialized', tool: 'Browser Automation' }) },
  { afterMs: 4400, apply: (s) => pushEvent(s, { executionId: 'exec-1', parentId: null, actor: 'Agent Zero', actorType: 'agent', eventType: 'TOOL_STARTED', status: 'running', message: 'LinkedIn detected', tool: 'Browser Automation' }) },
  { afterMs: 5600, apply: (s) => ({ ...s, approvals: [{ id: 'appr-1', actor: 'Governance', action: 'External interaction', risk: 'medium', reason: 'External side effect detected', status: 'PENDING' }] }) },
];

function pushEvent(state: State, event: Omit<ExecutionEvent, 'id' | 'timestamp'>): State {
  const e: ExecutionEvent = { id: `evt-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), ...event };
  const updatedAt = new Date().toISOString();
  const agents = state.agents.map((a) => {
    if (event.actor === a.name && event.eventType === 'AGENT_STARTED') return { ...a, status: 'RUNNING' } as Agent;
    if (event.eventType === 'APPROVAL_REQUIRED' && a.name === 'Governance') return { ...a, status: 'REQUIRES_APPROVAL' } as Agent;
    return a;
  });
  const mission = { ...state.mission, progress: Math.min(72, state.mission.progress + 11), updatedAt } as Mission;
  return { ...state, events: [...state.events, e], agents, mission };
}

export interface State {
  events: ExecutionEvent[];
  mission: Mission;
  agents: Agent[];
  skills: Skill[];
  tools: Tool[];
  approvals: ApprovalRequest[];
  tasks: Task[];
  kpis: KPIs;
  categories: Category[];
}

export function useMockStream() {
  const [state, setState] = useState<State>({
    events: [],
    mission: { ...initialMission },
    agents: initialAgents.map((a) => ({ ...a } as Agent)),
    skills: initialSkills.map((s) => ({ ...s })),
    tools: initialTools.map((t) => ({ ...t })),
    approvals: initialApprovals.map((a) => ({ ...a })),
    tasks: initialTasks.map((t) => ({ ...t })),
    kpis: { ...initialKPIs },
    categories,
  });

  useEffect(() => {
    const timeouts: number[] = [];
    steps.forEach((step) => {
      const id = window.setTimeout(() => setState((prev: State) => step.apply(prev)), step.afterMs);
      timeouts.push(id);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return state;
}
