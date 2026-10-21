'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Panel,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Play, ShieldAlert } from 'lucide-react';
import { useMockStream } from '@/mock/mockEngine';

function hexToRgba(hex: string, alpha: number) {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

const NODE_COLORS: Record<string, string> = {
  hermes: '#3b82f6',
  agent: '#10b981',
  skill: '#f59e0b',
  tool: '#8b5cf6',
  system: '#6b7280',
  governance: '#ef4444',
};

const NODE_ICON: Record<string, string> = {
  hermes: '⚕',
  agent: '◉',
  skill: '◆',
  tool: '⌨',
  system: '◈',
  governance: '🛡',
};

function CustomNode({ data }: { data: Record<string, unknown> }) {
  const type = String(data.type || '');
  const accent = NODE_COLORS[type] || '#3b82f6';
  return (
    <motion.div
      animate={{ scale: data.status === 'RUNNING' || data.status === 'REQUIRES_APPROVAL' ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="min-w-[180px] rounded-xl border border-white/10 bg-command-elevated/90 p-3 shadow-glow"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">{NODE_ICON[type] || '○'}</span>
        <div>
          <div className="text-xs font-medium text-command-text">{String(data.label)}</div>
          <div className="text-[10px] font-mono text-command-muted">{String(data.role)}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono"
          style={{
            color: accent,
            borderColor: `${accent}33`,
            backgroundColor: `${hexToRgba(accent, 0.08)}`,
          }}
        >
          <StatusDot status={String(data.status)} />
          {String(data.status)}
        </span>
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'RUNNING' || status === 'ACTIVE'
      ? '#10b981'
      : status === 'ERROR' || status === 'BLOCKED' || status === 'REQUIRES_APPROVAL'
        ? '#ef4444'
        : status === 'WAITING'
          ? '#f59e0b'
          : '#6b7280';
  return (
    <span
      className="inline-flex h-2 w-2 rounded-full"
      style={{
        backgroundColor: color,
        animation:
          status === 'RUNNING' || status === 'ACTIVE'
            ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite'
            : 'none',
      }}
    />
  );
}

export function ExecutionGraph() {
  const { agents, events } = useMockStream();

  const initialNodes: Node[] = useMemo(() => {
    const top = agents.find((item) => item.name === 'Hermes') || agents[0];
    const children = agents.filter((item) => item.name !== 'Hermes');
    const out: Node[] = [
      {
        id: 'hermes',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          label: top.name,
          role: top.role,
          type: 'hermes',
          status: top.status,
        },
      },
    ];
    children.forEach((a) => {
      out.push({
        id: a.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          label: a.name,
          role: a.role,
          type: a.name.toLowerCase().replace(/\s+/g, '-'),
          status: a.status,
        },
      });
    });
    return out;
  }, [agents]);

  const initialEdges: Edge[] = useMemo(
    () =>
      agents
        .filter((a) => a.name !== 'Hermes')
        .map((a) => ({
          id: `e-hermes-${a.id}`,
          source: 'hermes',
          target: a.id,
          type: 'smoothstep',
          animated: events.length > 0,
          style: { stroke: '#1f252e', strokeWidth: 1.5 },
        })) as Edge[],
    [agents, events.length]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ custom: CustomNode  as unknown as any }), []);

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs font-semibold text-command-text">EXECUTION GRAPH</div>
          <div className="text-[11px] text-command-muted">Live orchestration view</div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-command-border bg-command-elevated px-3 py-1.5 text-xs text-command-text hover:border-command-accent">
          <Play size={14} /> Run simulation
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodeTypes={nodeTypes as any}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1f252e" gap={24} />
        <Controls className="rounded-lg border border-command-border bg-command-elevated" />
        <Panel position="top-right">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-lg border border-command-border bg-command-elevated px-3 py-1.5 text-xs text-command-text"
          >
            <ShieldAlert size={14} /> Governance layer
          </motion.button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
