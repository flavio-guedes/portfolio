import { useState } from "react";

export default function App() {
  const [tab, setTab] = useState<
    "guide" | "inspect" | "learn" | "queue" | "progress"
  >("guide");

  return (
    <div className="hg-root">
      <nav className="hg-nav">
        <button
          className={`hg-tab ${tab === "guide" ? "active" : ""}`}
          onClick={() => setTab("guide")}
        >
          Guia
        </button>
        <button
          className={`hg-tab ${tab === "inspect" ? "active" : ""}`}
          onClick={() => setTab("inspect")}
        >
          Inspecionar
        </button>
        <button
          className={`hg-tab ${tab === "learn" ? "active" : ""}`}
          onClick={() => setTab("learn")}
        >
          Aprender
        </button>
        <button
          className={`hg-tab ${tab === "queue" ? "active" : ""}`}
          onClick={() => setTab("queue")}
        >
          Fila
        </button>
        <button
          className={`hg-tab ${tab === "progress" ? "active" : ""}`}
          onClick={() => setTab("progress")}
        >
          Progresso
        </button>
      </nav>

      <main className="hg-main">
        {tab === "guide" && <Guide />}
        {tab === "inspect" && <Inspect />}
        {tab === "learn" && <Learn />}
        {tab === "queue" && <Queue />}
        {tab === "progress" && <Progress />}
      </main>
    </div>
  );
}

function Guide() {
  return (
    <section className="hg-section">
      <h1 className="hg-title">Hermes Guide</h1>
      <p className="hg-text">
        Esta camada ajuda você a entender o Hermes enquanto usa o Hermes.
      </p>
      <div className="hg-card">
        <h2 className="hg-subtitle">Como usar</h2>
        <ul className="hg-list">
          <li>Navegue pelo Hermes normalmente.</li>
          <li>Use a aba <strong>Inspecionar</strong> para entender elementos.</li>
          <li>Use <strong>Aprender</strong> para explicações em camadas.</li>
          <li>Salve itens em <strong>Fila</strong> para estudar depois.</li>
          <li>Acompanhe o <strong>Progresso</strong> da sua jornada.</li>
        </ul>
      </div>
    </section>
  );
}

function Inspect() {
  return (
    <section className="hg-section">
      <h2 className="hg-subtitle">Modo: O que é isso?</h2>
      <p className="hg-text">
        Passe o mouse sobre elementos do Hermes. A extensão tentará explicar.
      </p>
      <div className="hg-card">
        <h3 className="hg-label">Inspeção ativa</h3>
        <p className="hg-muted">
          Nenhum elemento selecionado ainda. Quando o content script detectar um
          elemento alvo, a explicação aparecerá aqui.
        </p>
      </div>
    </section>
  );
}

function Learn() {
  const [depth, setDepth] = useState<"quick" | "deep" | "technical">("quick");
  return (
    <section className="hg-section">
      <h2 className="hg-subtitle">Aprendizado contextual</h2>
      <div className="hg-toggle">
        <button
          className={`hg-chip ${depth === "quick" ? "active" : ""}`}
          onClick={() => setDepth("quick")}
        >
          Rápido
        </button>
        <button
          className={`hg-chip ${depth === "deep" ? "active" : ""}`}
          onClick={() => setDepth("deep")}
        >
          Entender melhor
        </button>
        <button
          className={`hg-chip ${depth === "technical" ? "active" : ""}`}
          onClick={() => setDepth("technical")}
        >
          Aprofundar
        </button>
      </div>
      <div className="hg-card">
        <p className="hg-muted">
          A explicação aparecerá aqui conforme o contexto atual.
        </p>
      </div>
    </section>
  );
}

function Queue() {
  return (
    <section className="hg-section">
      <h2 className="hg-subtitle">Minha fila de aprendizado</h2>
      <p className="hg-muted">Salve itens para estudar depois.</p>
      <ul className="hg-list">
        <li>Automação</li>
        <li>Configuração de agentes</li>
        <li>Integrações</li>
      </ul>
    </section>
  );
}

function Progress() {
  return (
    <section className="hg-section">
      <h2 className="hg-subtitle">Minha jornada no Hermes</h2>
      <div className="hg-progress">
        <div className="hg-progress-item">
          <span className="hg-progress-label">Fundamentos</span>
          <div className="hg-bar"><div className="hg-fill" style={{width:"35%"}} /></div>
        </div>
        <div className="hg-progress-item">
          <span className="hg-progress-label">Operação</span>
          <div className="hg-bar"><div className="hg-fill" style={{width:"20%"}} /></div>
        </div>
      </div>
    </section>
  );
}
