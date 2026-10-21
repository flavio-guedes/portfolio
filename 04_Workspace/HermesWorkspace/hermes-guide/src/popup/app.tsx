declare const chrome: any;

export default function App() {
  return (
    <div>
      <h1 className="hg-title">Hermes Guide</h1>
      <p className="hg-text">
        Extensão ativa. Vá até o painel do Hermes para usar o guia.
      </p>
      <div className="hg-actions">
        <button className="primary" onClick={() => chrome.tabs.create({ url: "http://localhost:9119" })}>
          Abrir Hermes
        </button>
      </div>
    </div>
  );
}
