(function(){
  if(window.__diag) return; window.__diag=true;
  var t0 = Date.now();
  var tent = 0;
  function check(){
    tent++;
    var ms = Date.now() - t0;
    var s = window.state;
    var opp = (s && s.opportunities) ? s.opportunities.length : 'null';
    var ls  = (s && s.listas) ? s.listas.length : 'null';
    var cp  = (s && s.campaigns) ? s.campaigns.length : 'null';
    var ac  = (s && s.actions) ? s.actions.length : 'null';
    var wha = 0;
    if(s && s.actions) wha = s.actions.filter(function(a){return a.campaign_id==='WHA-MIXDEC';}).length;
    var view = (s && s.view) || '?';
    var titulo = 'opps=' + opp + ' listas=' + ls + ' camps=' + cp + ' acoes=' + ac + ' wha=' + wha + ' view=' + view + ' t=' + Math.round(ms/1000) + 's';
    document.title = titulo;
    if(tent < 120) setTimeout(check, 1000);
  }
  check();
})();
