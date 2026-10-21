import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { RadarStatus } from './components/RadarStatus';
import { JobCard } from './components/JobCard';
import { NetworkCard } from './components/NetworkCard';
import { deduplicar, aplicarOrdemPrioridade, limite } from './services/jobEngine';
import './styles/radar.css';
import { useRadar } from './hooks/useRadar';

type View = 'radar' | 'novas' | 'prioritarias' | 'todas' | 'buscas' | 'acompanhamento' | 'network';

function App() {
  const { todos, mode, stats, ultimaAtualizacao, updating, atualizar, networkContacts } = useRadar();

  const [view, setView] = useState<View>('radar');

  const radarList = useMemo(() => {
    const combined = deduplicar([...todos]);
    const ranked = aplicarOrdemPrioridade(combined);
    return limite(ranked);
  }, [todos]);

  const novasList = useMemo(() => radarList.filter(item => item.ageMinutes <= 5), [radarList]);
  const prioritariasList = useMemo(() => radarList.filter(item => (item.prioridade ?? 'Baixa') === 'Muito alta' || (item.prioridade ?? 'Baixa') === 'Alta'), [radarList]);
  const acompanhamentoList = useMemo(() => radarList.filter(item => ['Nova', 'Avaliar', 'Interessante', 'Candidatar', 'Candidatado', 'Entrevista', 'Processo encerrado', 'Ignorada'].includes(item.candidaturaStatus ?? 'Nova')), [radarList]);

  const lista = useMemo(() => {
    if (view === 'novas') return novasList;
    if (view === 'prioritarias') return prioritariasList;
    if (view === 'todas') return radarList;
    if (view === 'acompanhamento') return acompanhamentoList;
    if (view === 'network') return [];
    return radarList;
  }, [view, radarList, novasList, prioritariasList, acompanhamentoList]);

  const networkList = useMemo(() => networkContacts.map((contact: any) => ({ contact, score: contact.networkScore ?? 0, level: contact.networkLevel ?? 'CONEXÃO SECUNDÁRIA' })), [networkContacts]);
  const showEmptyNetwork = view === 'network' && networkList.length === 0;

  return (
    <div className={`app ${updating ? 'updating' : ''}`}>
      <Header mode={mode} ultimaAtualizacao={ultimaAtualizacao || '--:--:--'} />
      <main className="main">
        <SearchBar mode={mode} />
        <div className="section-bar">
          <button className={`mode-button ${view === 'radar' ? 'active' : ''}`} onClick={() => { setView('radar'); atualizar(mode); }} disabled={updating}>📡 RADAR</button>
          <button className={`mode-button ${view === 'novas' ? 'active' : ''}`} onClick={() => { setView('novas'); atualizar(mode); }} disabled={updating}>✨ NOVAS</button>
          <button className={`mode-button ${view === 'prioritarias' ? 'active' : ''}`} onClick={() => { setView('prioritarias'); atualizar(mode); }} disabled={updating}>🔥 PRIORITÁRIAS</button>
          <button className={`mode-button ${view === 'todas' ? 'active' : ''}`} onClick={() => { setView('todas'); atualizar(mode); }} disabled={updating}>📋 TODAS</button>
          <button className={`mode-button ${view === 'buscas' ? 'active' : ''}`} onClick={() => { setView('buscas'); atualizar(mode); }} disabled={updating}>🔎 BUSCAS</button>
          <button className={`mode-button ${view === 'acompanhamento' ? 'active' : ''}`} onClick={() => { setView('acompanhamento'); atualizar(mode); }} disabled={updating}>🗂 ACOMPANHAMENTO</button>
          <button className={`mode-button ${view === 'network' ? 'active' : ''}`} onClick={() => { setView('network'); atualizar(mode); }} disabled={updating}>🤝 NETWORK</button>
        </div>

        {view !== 'network' && view !== 'buscas' && (
          <div className="status-panel">
            <div className="status-header">RADAR ATIVO</div>
            <div className="section-grid">
              <div className="status-item"><span className="status-label">🔥 Muito alta</span><span className="status-value">{stats.muitoAlta}</span></div>
              <div className="status-item"><span className="status-label">🟢 Alta</span><span className="status-value">{stats.alta}</span></div>
              <div className="status-item"><span className="status-label">🟡 Média</span><span className="status-value">{stats.media}</span></div>
              <div className="status-item"><span className="status-label">⚪ Baixa</span><span className="status-value">{stats.baixa}</span></div>
              <div className="status-item"><span className="status-label">🔴 Descartar</span><span className="status-value">{stats.descartar}</span></div>
              <div className="status-item"><span className="status-label">✨ Novas</span><span className="status-value">{stats.novas}</span></div>
            </div>
            <div style={{ marginTop: 10 }} className="status-header">Acompanhamento</div>
            <div className="section-grid">
              {(Object.keys(stats.acompanhamento) as Array<keyof typeof stats.acompanhamento>).map(status => (
                <div className="status-item" key={status}><span className="status-label">{status}</span><span className="status-value">{stats.acompanhamento[status]}</span></div>
              ))}
            </div>
            <RadarStatus stats={stats} />
          </div>
        )}

        {view === 'buscas' ? (
          <div className="report-panel">
            <div className="t">Buscas configuradas</div>
            <div className="row">Nenhuma estratégia listada no momento.</div>
          </div>
        ) : view === 'network' ? (
          <div className="jobs-grid">
            {networkList.map((item: any) => <NetworkCard key={item.contact.id} contact={item.contact} score={item.score} level={item.level} />)}
          </div>
        ) : (
          <div className="jobs-grid">
            {lista.map((job: any) => <JobCard key={`${job.source}-${job.id}`} job={job} score={job.score} />)}
          </div>
        )}

        {showEmptyNetwork && (
          <div className="empty">
            <div>Network Intelligence sem contatos no momento.</div>
            <div style={{ marginTop: 8, color: '#5b6f88', fontWeight: 600 }}>Acione o fallback após Caçar Agora.</div>
          </div>
        )}

        {lista.length > 0 && lista.length < 5 && view !== 'network' && view !== 'buscas' && (
          <div className="status-panel" style={{ marginTop: 12 }}>
            <div className="status-value">{lista.length} oportunidade(s) elegível(is) agora. Para completar 5, aguarde novas publicações.</div>
          </div>
        )}
      </main>
      <footer className="footer-bar">
        <button className="button button-primary" onClick={() => atualizar(mode)} disabled={updating}>
          {updating ? 'Atualizando...' : '⚡ CAÇAR AGORA'}
        </button>
        <div style={{ color: '#5b6f88', fontWeight: 800, fontSize: 14 }}>{updating ? 'Atualizando...' : `Radar atualizado às ${ultimaAtualizacao || '--:--:--'}`}</div>
      </footer>
    </div>
  );
}

export default App;
