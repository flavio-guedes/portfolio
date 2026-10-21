export const OFFICE_ZONES = {
  Command: { label: 'Command Desk', icon: '🧑‍💼' },
  Operations: { label: 'Operations Station', icon: '⚙️' },
  Product: { label: 'Product Lab', icon: '🧩' },
  Creative: { label: 'Creative Studio', icon: '🎨' },
  Strategy: { label: 'Strategy Room', icon: '♟️' }
};

export const STAGE_SLOTS = [
  { x: 2, y: 1, w: 3, h: 3, entityId: 'pixelion', entityType: 'human', zone: 'Command' },
  { x: 7, y: 1, w: 3, h: 3, entityId: 'logix', entityType: 'agent', zone: 'Operations' },
  { x: 2, y: 5, w: 3, h: 3, entityId: 'uxel', entityType: 'agent', zone: 'Product' },
  { x: 7, y: 5, w: 3, h: 3, entityId: 'visiona', entityType: 'agent', zone: 'Creative' }
];

export const OFFICE_DECORS = [
  { key: 'shelf', x: 10, y: 1, w: 2, h: 3, label: 'Projetos' },
  { key: 'board', x: 1, y: 5, w: 3, h: 3, label: 'Aprovações' },
  { key: 'meeting', x: 1, y: 1, w: 2, h: 2, label: 'Reuniões' },
  { key: 'screen', x: 10, y: 6, w: 2, h: 2, label: 'Ferramentas' }
];

export function resolveEntity(data, slot) {
  if (slot.entityType === 'human') {
    return (data.humans || []).find(x => x.id === slot.entityId) || null;
  }
  return (data.agents || []).find(x => x.id === slot.entityId) || null;
}
