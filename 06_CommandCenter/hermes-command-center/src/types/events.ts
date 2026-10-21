export type ActorType = 'hermes' | 'agent' | 'skill' | 'tool' | 'system' | 'governance';
export type EventType = 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'AGENT_STARTED' | 'AGENT_COMPLETED' | 'AGENT_DELEGATED' | 'SKILL_SELECTED' | 'SKILL_STARTED' | 'SKILL_COMPLETED' | 'TOOL_SELECTED' | 'TOOL_STARTED' | 'TOOL_COMPLETED' | 'APPROVAL_REQUIRED' | 'ACTION_BLOCKED' | 'ERROR' | 'SUCCESS';
export type AgentStatus = 'IDLE' | 'RUNNING' | 'THINKING' | 'DELEGATING' | 'WAITING' | 'BLOCKED' | 'REQUIRES_APPROVAL' | 'SUCCESS' | 'ERROR';
export type MissionStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR';
export type TaskStatus = 'BACKLOG' | 'READY' | 'RUNNING' | 'WAITING' | 'BLOCKED' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CategoryId = 'dashboard' | 'playbooks' | 'frameworks' | 'automations' | 'agents' | 'integrations' | 'research' | 'creative' | 'development' | 'jobs';

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  executionId: string;
  parentId: string | null;
  actor: string;
  actorType: ActorType;
  eventType: EventType;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'waiting';
  message: string;
  agent?: string;
  skill?: string;
  tool?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  mission?: string;
  skills?: string[];
  tools?: string[];
}

export interface Category {
  id: CategoryId;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  enabled?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: CategoryId;
  active: boolean;
  lastUsed?: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  agent?: string;
  status: 'idle' | 'active' | 'error';
  lastRun?: string;
}

export interface ApprovalRequest {
  id: string;
  actor: string;
  action: string;
  risk: 'low' | 'medium' | 'high';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  startedAt?: string;
  elapsed?: number;
  progress: number;
  currentAgent?: string;
  currentSkill?: string;
  currentTool?: string;
  governance: 'CLEAR' | 'PENDING' | 'BLOCKED';
}

export interface Task {
  id: string;
  title: string;
  category: CategoryId;
  project: string;
  agent: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  dueDate?: string;
  progress?: number;
  duration?: string;
  blocker?: string;
  nextAction?: string;
  toolsUsed?: string[];
  result?: string;
  events?: string[];
}

export interface TaskFilters {
  search: string;
  status: string;
  assignee: string;
  priority: string;
  project: string;
  category: string;
}

export interface KPIs {
  totalMissions: number;
  running: number;
  blocked: number;
  waitingApproval: number;
  completed: number;
  activeAgents: number;
  recentExecutions: number;
  alerts: number;
}
