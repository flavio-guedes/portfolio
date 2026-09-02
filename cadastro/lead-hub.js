/**
 * Lead Hub Central — módulo unificado de captura
 *
 * Uso:
 *   <script src="lead-hub.js" data-origem="lp-consultoria" data-projeto="portfolio"></script>
 *   <form id="lead-form" data-lead-fields='{"nome":"name","whatsapp":"whatsapp","email":"email","empresa":"company","area":"area"}'>...</form>
 *
 * Configuração global: .lead-hub/config.json
 */

(function () {
  'use strict';

  if (window.__LEAD_HUB__) return;
  window.__LEAD_HUB__ = true;

  const DEFAULT_CONFIG_URL = '/.lead-hub/config.json';
  const ALT_CONFIG_URL = '../.lead-hub/config.json';
  const STORAGE_KEY = 'lead_hub_config_cache';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hora

  let config = null;
  let ready = false;

  function getScriptOrigin() {
    const scripts = Array.from(document.querySelectorAll('script'));
    const hub = scripts.find(s => s.src && s.src.indexOf('lead-hub.js') !== -1);
    if (!hub || !hub.src) return location.origin;
    try {
      const url = new URL(hub.src);
      return url.origin;
    } catch (_e) {
      return location.origin;
    }
  }

  function resolveConfigUrl(origin) {
    var candidates = [origin + DEFAULT_CONFIG_URL];
    if (location.pathname && location.pathname.indexOf('/pages/') !== -1) {
      candidates.push(origin + '/cadastro' + DEFAULT_CONFIG_URL);
      candidates.push(origin + ALT_CONFIG_URL);
    }
    return candidates[0];
  }

  function buildConfigUrl() {
    const origin = getScriptOrigin();
    return resolveConfigUrl(origin);
  }

  function loadConfig() {
    return new Promise(function (resolve, reject) {
      const configUrl = buildConfigUrl();

      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.config && parsed.ts && (Date.now() - parsed.ts < CACHE_TTL)) {
            resolve(parsed.config);
            return;
          }
        } catch (_e) {
          // ignore cache parse error
        }
      }

      fetch(buildConfigUrl(), { method: 'GET', mode: 'cors' })
        .then(function (res) {
          if (!res.ok) throw new Error('config http ' + res.status);
          return res.json();
        })
        .then(function (json) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ config: json, ts: Date.now() }));
          resolve(json);
        })
        .catch(function (err) {
          console.warn('[LeadHub] Primary config failed:', err, 'Trying next candidate...');
          const origin = getScriptOrigin();
          const candidates = [origin + DEFAULT_CONFIG_URL];
          if (location.pathname && location.pathname.indexOf('/pages/') !== -1) {
            candidates.push(origin + '/cadastro' + DEFAULT_CONFIG_URL);
            candidates.push(origin + ALT_CONFIG_URL);
          }
          const next = (candidates.indexOf(buildConfigUrl()) + 1) % candidates.length;
          const fallback = candidates[next];
          if (fallback && fallback !== buildConfigUrl()) {
            fetch(fallback, { method: 'GET', mode: 'cors' })
              .then(function (res) {
                if (!res.ok) throw new Error('fallback config http ' + res.status);
                return res.json();
              })
              .then(function (json) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ config: json, ts: Date.now() }));
                resolve(json);
              })
              .catch(function () {
                console.warn('[LeadHub] Fallback config failed. Using local fallback.', err);
                resolve({
                  provider: 'local_panel',
                  status: 'active',
                  web_app_url: '',
                  default_sheet: 'LEADS_MASTER',
                  endpoints: { webhook: '', googleSheets: '' }
                });
              });
          } else {
            resolve({
              provider: 'local_panel',
              status: 'active',
              web_app_url: '',
              default_sheet: 'LEADS_MASTER',
              endpoints: { webhook: '', googleSheets: '' }
            });
          }
        });
    });
  }

  function getUTMs() {
    const params = new URLSearchParams(location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || ''
    };
  }

  function getPageInfo() {
    const scripts = Array.from(document.querySelectorAll('script'));
    const hub = scripts.find(s => s.src && s.src.indexOf('lead-hub.js') !== -1);
    const origem = hub && hub.dataset && hub.dataset.origem ? hub.dataset.origem : 'unknown';
    const projeto = hub && hub.dataset && hub.dataset.projeto ? hub.dataset.projeto : 'portfolio';
    const path = location.pathname || '';
    const page = path.substring(path.lastIndexOf('/') + 1) || path;
    return { origem: origem, projeto: projeto, pagina: page };
  }

  function serializeLead(lead) {
    try {
      return JSON.stringify(lead);
    } catch (_e) {
      return '';
    }
  }

  function saveLocal(lead) {
    try {
      const key = 'lead_hub_leads_' + (lead.origem || 'global');
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push(Object.assign({ savedAt: new Date().toISOString() }, lead));
      localStorage.setItem(key, JSON.stringify(current));
    } catch (_e) {
      console.warn('[LeadHub] Falha ao salvar lead local.', _e);
    }
  }

  function sendLead(payload) {
    return new Promise(function (resolve, reject) {
      const lead = Object.assign({
        timestamp: new Date().toISOString(),
        origem: payload.origem,
        projeto: payload.projeto,
        pagina: payload.pagina,
        nome: payload.nome || '',
        whatsapp: payload.whatsapp || '',
        email: payload.email || '',
        empresa: payload.empresa || '',
        area: payload.area || '',
        campanha: payload.campanha || '',
        utm_source: payload.utm_source || '',
        utm_medium: payload.utm_medium || '',
        utm_campaign: payload.utm_campaign || '',
        utm_content: payload.utm_content || ''
      }, getUTMs());

      saveLocal(lead);

      if (!config || !config.endpoints) {
        resolve({ ok: true, local: true, semIntegracao: true });
        return;
      }

      const url = config.endpoints.webhook || config.endpoints.googleSheets || config.web_app_url || '';
      if (!url) {
        console.warn('[LeadHub] Nenhum endpoint configurado. Lead salvo localmente.');
        resolve({ ok: true, local: true, semIntegracao: true });
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead)
      })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (resultado) {
            const ok = res.ok && (!resultado || resultado.success !== false);
            resolve({ ok: ok, local: true });
          });
        })
        .catch(function () {
          resolve({ ok: false, local: true });
        });
    });
  }

  function bindForms() {
    const forms = document.querySelectorAll('form[data-lead-fields], form#lead-form, form#lp-form');
    forms.forEach(function (form) {
      if (form.dataset.leadHubBound) return;
      form.dataset.leadHubBound = 'true';

      const pageInfo = getPageInfo();
      let fieldMap = {};
      try {
        const attr = form.getAttribute('data-lead-fields');
        if (attr) fieldMap = JSON.parse(attr);
      } catch (_e) {
        fieldMap = {};
      }
      const defaults = {
        nome: 'nome',
        whatsapp: 'whatsapp',
        email: 'email',
        empresa: 'empresa',
        area: 'area'
      };
      const map = Object.assign({}, defaults, fieldMap);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!ready || !config) {
          console.warn('[LeadHub] Config não carregada ainda.');
          return;
        }

        const data = new FormData(form);
        const payload = {
          origem: pageInfo.origem,
          projeto: pageInfo.projeto,
          pagina: pageInfo.pagina,
          campanha: document.title || ''
        };

        Object.keys(map).forEach(function (key) {
          const fieldName = map[key];
          const el = form.querySelector('[name="' + fieldName + '"]');
          if (el) payload[key] = (el.value || '').trim();
        });

        const feedback = form.querySelector('[data-lead-feedback], .form-feedback');
        const btn = form.querySelector('[type="submit"]');
        const originalText = btn ? btn.textContent : '';

        if (btn) {
          btn.disabled = true;
          if (btn.textContent) btn.textContent = 'Enviando...';
        }

        sendLead(payload)
          .then(function (res) {
            if (feedback) feedback.textContent = res.ok ? 'Solicitação recebida!' : 'Não foi possível enviar. Tente novamente.';
            if (res.ok) form.reset();
          })
          .catch(function () {
            if (feedback) feedback.textContent = 'Não foi possível enviar. Tente novamente.';
          })
          .finally(function () {
            if (btn) {
              btn.disabled = false;
              if (originalText) btn.textContent = originalText;
            }
          });
      });
    });
  }

  function init() {
    loadConfig().then(function (cfg) {
      config = cfg || {};
      ready = true;
      bindForms();
      console.info('[LeadHub] Pronto. origem:', getPageInfo().origem, 'projeto:', getPageInfo().projeto);
    });
  }

  if (document.readyState && document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
