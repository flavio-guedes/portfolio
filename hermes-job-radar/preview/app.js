import { createApp } from '../src/services/app.js';
import { loadStore, saveStore, createEmptyStore } from '../src/storage/store.js';
import {
  badgeForJob,
  modalityBadge,
  recencyBadge,
  formatJobAge,
  shortMatchReasons,
  escapeHtml
} from '../src/utils/helpers.js';
import { pipelineStages, stageLabels, nextStage, isTerminalStage } from '../src/pipeline/stage.js';
import { RadarEngine } from '../src/services/radar.js';
import { defaultProfile } from '../src/profile/profile.js';

const app = createApp();
const { engine, state } = app;
const store = engine.store;

function init() {
  seedIfEmpty();
  renderView();
  bindNav();
  bindHunt();
  bindDetail();
  bindReset();
  showRuntimeDiagnostics();
  showOfflineModeNotice();
}

function showRuntimeDiagnostics() {
  const el = document.getElementById('runtimeDiagnostics');
  if (!el) return;
  try {
    const top = engine.getTopJobs(state.filters);
    el.textContent = `Módulos OK · ${store.jobs.length} vagas · ${top.length} visíveis`;
    el.style.color = 'var(--success)';
  } catch (error) {
    el.textContent = 'Falha na inicialização: ' + error.message;
    el.style.color = 'var(--danger)';
    console.error('[HermesJobRadar] init failure', error);
  }
}

function showOfflineModeNotice() {
  if (typeof window === 'undefined') return;
  const hint = document.createElement('div');
  hint.style.cssText = 'margin:10px 0; padding:10px; border-radius:14px; border:1px dashed var(--border-hover); color:var(--text-2); font-size:12px; background:rgba(255,255,255,0.04);';
  hint.textContent = 'Se o painel estiver vazio, abra pelo servidor local: cd preview && python3 -m http.server 8080 e acesse http://localhost:8080';
  const target = document.getElementById('viewSub')?.parentElement || document.body;
  target.appendChild(hint);
}

function seedIfEmpty() {
  if (store.jobs.length === 0) {
    engine.importJobs([
      { source: 'seed', title: 'Head de Design', company: 'Lumina', area: 'Design', seniority: 'HEAD', modality: 'REMOTO', description: 'Liderar design e marca.', tags: ['design'] },
      { source: 'seed', title: 'Art Director', company: 'Boulevard', area: 'Design', seniority: 'DIRETOR', modality: 'HÍBRIDO', description: 'Direção visual.', tags: ['design'] },
      { source: 'seed', title: 'Head of Content', company: 'Rizon', area: 'Conteúdo', seniority: 'HEAD', modality: 'REMOTO', description: 'Estratégia de conteúdo.', tags: ['conteúdo'] }
    ]);
  }
}

function renderView(view = 'radar') {
  if (view === 'pipeline') renderPipeline();
  else if (view === 'profile') renderProfile();
  else if (view === 'manual') renderManual();
  else if (view === 'import') renderImport();
  else renderRadar();
}

function renderRadar() {
  setActiveNav('radar');
  document.getElementById('viewTitle').textContent = 'RADAR';
  document.getElementById('viewSub').textContent = 'Coleta, filtros, ranking e priorização.';

  const top = engine.getTopJobs(state.filters);
  renderStats(top);
  renderFilterPills();
  renderJobs(top);
}

function renderStats(jobs) {
  const heads = jobs.filter((j) => j.seniority === 'HEAD').length;
  const remotes = jobs.filter((j) => j.modality === 'REMOTO').length;
  const live = jobs.filter((j) => classifyRecency(j) === 'LIVE').length;
  const pipelineCount = store.jobs.filter((j) => j.stage !== 'RADAR').length;
  const stats = [
    { label: '🔥 Heads', value: heads },
    { label: '🎯 Matches', value: jobs.length },
    { label: '🌎 Remotas', value: remotes },
    { label: '⚡ Live', value: live },
    { label: '📋 Pipeline', value: pipelineCount }
  ];
  document.getElementById('stats').innerHTML = stats
    .map((s) => `<div class="stat"><div class="stat-title">${escapeHtml(s.label)}</div><div class="stat-value">${s.value}</div></div>`)
    .join('');
}

function renderFilterPills() {
  const pills = [
    { label: 'Todas', key: 'recency', value: 'ALL' },
    { label: '🔥 HEAD', key: 'seniorities', value: 'HEAD' },
    { label: '👑 DIRETOR', key: 'seniorities', value: 'DIRETOR' },
    { label: '⚡ LEAD', key: 'seniorities', value: 'LEAD' },
    { label: '🎯 COORDENADOR', key: 'seniorities', value: 'COORDENADOR' },
    { label: '🏆 SÊNIOR', key: 'seniorities', value: 'SENIOR' },
    { label: '📈 PLENO', key: 'seniorities', value: 'PLENO' },
    { label: '🌱 JÚNIOR', key: 'seniorities', value: 'JUNIOR' },
    { label: 'DESIGN', key: 'areas', value: 'design' },
    { label: 'PRODUCT DESIGN', key: 'areas', value: 'product design' },
    { label: 'PRODUTO', key: 'areas', value: 'produto' },
    { label: 'MARKETING', key: 'areas', value: 'marketing' },
    { label: 'CONTEÚDO', key: 'areas', value: 'conteúdo' },
    { label: 'COMUNICAÇÃO', key: 'areas', value: 'comunicação' },
    { label: 'PROJETOS', key: 'areas', value: 'projetos' },
    { label: 'AGILIDADE', key: 'areas', value: 'agile' },
    { label: '🌎 REMOTO', key: 'modalities', value: 'REMOTO' },
    { label: '🏢 HÍBRIDO', key: 'modalities', value: 'HÍBRIDO' },
    { label: '📍 PRESENCIAL', key: 'modalities', value: 'PRESENCIAL' }
  ];

  document.getElementById('filterPills').innerHTML = pills
    .map((p) => `<button class="pill" data-filter-key="${p.key}" data-filter-value="${escapeHtml(p.value)}">${escapeHtml(p.label)}</button>`)
    .join('');

  document.getElementById('filterPills').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter-key]');
    if (!button) return;
    const key = button.dataset.filterKey;
    const value = button.dataset.filterValue;
    toggleFilter(key, value);
    renderRadar();
  });
}

function toggleFilter(key, value) {
  const list = Array.isArray(state.filters[key]) ? state.filters[key] : [];
  const idx = list.indexOf(value);
  if (key === 'recency') {
    state.filters.recency = state.filters.recency === value ? 'ALL' : value;
    return;
  }
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  state.filters[key] = list;
}

function renderJobs(jobs) {
  const container = document.getElementById('contentArea');
  if (!jobs.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma oportunidade para os filtros atuais.</div>`;
    return;
  }

  container.innerHTML = jobs
    .map((job) => {
      const recencia = classifyRecency(job);
      return `<article class="job-card" data-id="${job.id}">
        <div class="job-top">
          <div>
            <div class="job-title">${escapeHtml(job.title)}</div>
            <div class="job-company">${escapeHtml(job.company)}</div>
          </div>
          <div class="job-match">${job.matchPercent ?? '--'}%</div>
        </div>
        <div class="job-meta">
          <span class="badge ${job.seniority === 'HEAD' ? 'head' : ''}">${badgeForJob(job)}</span>
          <span class="badge">${modalityBadge(job.modality)}</span>
          <span class="badge ${recencia === 'LIVE' ? 'live' : ''}">${recencyBadge(job)}</span>
          <span class="badge">🎯 ${escapeHtml(job.area || '—')}</span>
          <span class="badge">⏱ ${escapeHtml(formatJobAge(job))}</span>
        </div>
        <div class="job-desc">${escapeHtml(job.description)}</div>
        <div style="margin-top:10px; color:var(--text-2); font-size:12px;">${escapeHtml(shortMatchReasons(job.matchReasons))}</div>
        <div class="job-actions">
          <button class="btn primary open-detail" data-id="${job.id}">VER</button>
          <button class="btn save-job" data-id="${job.id}">SALVAR</button>
          <button class="btn apply-job" data-id="${job.id}">CANDIDATAR</button>
          <button class="btn ghost ignore-job" data-id="${job.id}">IGNORAR</button>
        </div>
      </article>`;
    })
    .join('');

  container.querySelectorAll('.open-detail').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetail(btn.dataset.id);
    });
  });

  container.querySelectorAll('.save-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'SALVA'); }));
  container.querySelectorAll('.apply-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'CANDIDATEI'); }));
  container.querySelectorAll('.ignore-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'RECUSADO'); }));
  container.querySelectorAll('.job-card').forEach((card) => card.addEventListener('click', () => openDetail(card.dataset.id)));
}

function classifyRecency(job) {
  const minutes = computeJobAgeMinutes(job);
  if (minutes <= 10) return 'LIVE';
  if (minutes <= 60) return 'FRESH';
  if (minutes <= 24 * 60) return 'TODAY';
  return 'OLDER';
}

function computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

function renderPipeline() {
  setActiveNav('pipeline');
  document.getElementById('viewTitle').textContent = 'PIPELINE';
  document.getElementById('viewSub').textContent = 'Acompanhamento por estágio.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  if (!store.jobs.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma oportunidade registrada ainda.</div>`;
    return;
  }

  container.innerHTML = pipelineStages
    .map((stage) => {
      const jobs = store.jobs.filter((j) => j.stage === stage);
      const cards = jobs.map((job) => {
        const recencia = classifyRecency(job);
        return `<div class="job-card" style="border:1px solid var(--border); background:rgba(255,255,255,0.02);">
          <div style="font-weight:700;">${escapeHtml(job.title)}</div>
          <div style="color:var(--text-2); font-size:12px;">${escapeHtml(job.company)}</div>
          <div class="job-meta" style="margin-top:8px;">
            <span class="badge">${stageLabels[stage]}</span>
            <span class="badge">${badgeForJob(job)}</span>
            <span class="badge">${modalityBadge(job.modality)}</span>
          </div>
          <div class="job-actions" style="margin-top:10px;">
            <button class="btn primary pipeline-move" data-id="${job.id}" data-to="${nextStage(stage)}">${nextStage(stage)}</button>
          </div>
        </div>`;
      }).join('');

      return `<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
        <div class="section-title">${stageLabels[stage]} · ${jobs.length}</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px;">${cards || '<div class="empty-state">Vazio</div>'}</div>
      </div>`;
    })
    .join('');

  container.querySelectorAll('.pipeline-move').forEach((btn) => btn.addEventListener('click', () => moveToStage(btn.dataset.id, btn.dataset.to)));
}

function renderProfile() {
  setActiveNav('profile');
  document.getElementById('viewTitle').textContent = 'PERFIL';
  document.getElementById('viewSub').textContent = 'Configuração de preferências profissionais.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Prefências aplicadas</div>
    <div style="color:var(--text-1); font-size:13px;">Senioridades priorizadas: ${defaultProfile.seniorityPriority.join(', ')}</div>
    <div style="color:var(--text-1); font-size:13px;">Áreas prioritárias: ${[...defaultProfile.areas.max, ...defaultProfile.areas.high].join(', ')}</div>
    <div style="color:var(--text-1); font-size:13px;">Modalidades: ${defaultProfile.modalities.join(', ')}</div>
  </div>`;
}

function renderManual() {
  setActiveNav('manual');
  document.getElementById('viewTitle').textContent = 'ADICIONAR VAGA';
  document.getElementById('viewSub').textContent = 'Cadastro manual para coleta off-line.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Inserir oportunidade</div>
    <form class="manual-form" id="manualForm">
      <div class="field"><label>Título</label><input name="title" required></div>
      <div class="field"><label>Empresa</label><input name="company"></div>
      <div class="field"><label>Área</label><input name="area"></div>
      <div class="field"><label>Senioridade</label><select name="seniority">
        <option>HEAD</option><option>DIRETOR</option><option>LEAD</option><option>COORDENADOR</option><option>SÊNIOR</option><option>PLENO</option><option>JÚNIOR</option>
      </select></div>
      <div class="field"><label>Modalidade</label><select name="modality">
        <option>REMOTO</option><option>HÍBRIDO</option><option>PRESENCIAL</option>
      </select></div>
      <div class="field"><label>Localização</label><input name="location"></div>
      <div class="field full"><label>Descrição</label><textarea name="description" rows="4"></textarea></div>
      <div class="field full"><button class="btn primary" type="submit">Salvar vaga</button></div>
    </form>
  </div>`;

  document.getElementById('manualForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    engine.addManualJob(form);
    alert('Vaga adicionada ao Radar.');
    renderRadar();
  });
}

function renderImport() {
  setActiveNav('import');
  document.getElementById('viewTitle').textContent = 'IMPORTAR';
  document.getElementById('viewSub').textContent = 'JSON, CSV ou texto livre.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Importar texto</div>
    <textarea id="importText" rows="8" style="width:100%; background:rgba(255,255,255,0.04); color:var(--text-0); border:1px solid var(--border); border-radius:14px; padding:10px;" placeholder="Cole vagas separadas por linha em branco..."></textarea>
    <div style="margin-top:10px;"><button class="btn primary" id="importSubmit">Importar</button></div>
  </div>`;

  document.getElementById('importSubmit').addEventListener('click', () => {
    const text = document.getElementById('importText').value || '';
    engine.importJobs([{ source: 'import-text', description: text }]);
    alert('Importação concluída.');
    renderRadar();
  });
}

function moveToStage(id, stage) {
  const job = engine.updateJobStage(id, stage);
  if (!job) return;
  renderView(document.querySelector('.nav-item.active')?.dataset.view || 'radar');
}

function openDetail(id) {
  const job = store.jobs.find((j) => j.id === id) || engine.getTopJobs().find((j) => j.id === id);
  if (!job) return;
  state.detailJobId = id;
  document.getElementById('detailContent').innerHTML = `<h3 class="modal-title">${escapeHtml(job.title)} · ${escapeHtml(job.company)}</h3>
    <div class="detail-grid">
      <div class="detail-block">
        <h4>Identidade</h4>
        <div>${escapeHtml(badgeForJob(job))} · ${escapeHtml(modalityBadge(job.modality))} · ${escapeHtml(recencyBadge(job))}</div>
        <div style="margin-top:6px;">${escapeHtml(formatJobAge(job))}</div>
      </div>
      <div class="detail-block">
        <h4>Match</h4>
        <div>${job.matchPercent ?? '--'}%</div>
        <div style="margin-top:6px;">${(job.matchReasons || []).map((r) => `• ${escapeHtml(r)}`).join('<br>') || '—'}</div>
      </div>
      <div class="detail-block full">
        <h4>Descrição</h4>
        <div>${escapeHtml(job.description)}</div>
      </div>
      <div class="detail-block">
        <h4>Localização / Faixa</h4>
        <div>${escapeHtml(job.location || '—')}</div>
        <div style="margin-top:6px;">${escapeHtml(job.salary || '—')}</div>
      </div>
      <div class="detail-block">
        <h4>Ações</h4>
        <div class="job-actions">
          <button class="btn primary detail-save" data-id="${job.id}">SALVAR</button>
          <button class="btn primary detail-apply" data-id="${job.id}">CANDIDATAR</button>
          <button class="btn ghost detail-ignore" data-id="${job.id}">IGNORAR</button>
        </div>
      </div>
    </div>`;

  document.getElementById('detailModal').classList.add('open');
  document.getElementById('closeDetail').onclick = closeDetail;
  document.getElementById('detailModal').addEventListener('click', (event) => {
    if (event.target.id === 'detailModal') closeDetail();
  });

  document.getElementById('detailContent').querySelector('.detail-save')?.addEventListener('click', () => { moveToStage(job.id, 'SALVA'); closeDetail(); });
  document.getElementById('detailContent').querySelector('.detail-apply')?.addEventListener('click', () => { moveToStage(job.id, 'CANDIDATEI'); closeDetail(); });
  document.getElementById('detailContent').querySelector('.detail-ignore')?.addEventListener('click', () => { moveToStage(job.id, 'RECUSADO'); closeDetail(); });
}

function closeDetail() { document.getElementById('detailModal').classList.remove('open'); state.detailJobId = null; }

function setActiveNav(view) {
  document.querySelectorAll('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
}

function bindNav() {
  document.querySelectorAll('.nav-item').forEach((btn) => btn.addEventListener('click', () => renderView(btn.dataset.view)));
}

function bindDetail() {
  // Already handled inside openDetail.
}

function bindReset() {
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reiniciar dados locais?')) return;
    saveStore(createEmptyStore());
    location.reload();
  });
}

function bindHunt() {
  const overlay = document.getElementById('huntOverlay');
  const open = document.getElementById('huntBtn');
  const close = document.getElementById('closeHunt');

  open.addEventListener('click', async () => {
    overlay.classList.add('open');
    const log = document.getElementById('huntLog');
    const progress = document.getElementById('huntProgress');
    log.innerHTML = '';
    progress.style.width = '0%';

    const steps = [
      'CONECTANDO FONTES',
      'BUSCANDO',
      'NORMALIZANDO',
      'FILTRANDO',
      'REMOVENDO DUPLICADAS',
      'CALCULANDO MATCH',
      'RANKEANDO',
      'RADAR PRONTO'
    ];

    for (let i = 0; i < steps.length; i++) {
      await delay(280);
      const el = document.createElement('div');
      el.className = 'hunt-step';
      el.textContent = steps[i];
      log.appendChild(el);
      progress.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
      el.classList.add('done');
    }

    await delay(260);
    await engine.runHunt({ mode: 'assistido' });
    renderRadar();
  });

  close.addEventListener('click', () => overlay.classList.remove('open'));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

init();
