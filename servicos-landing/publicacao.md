# Publicação · Landing Pages de Serviços

## Arquivos criados
- `/Users/mac/repo-portfolio/servicos-landing/pages/index.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/produto-ux-design.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/design-system.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/direcao-criativa.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/estrategia-conteudo.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/trafego-pago.html`
- `/Users/mac/repo-portfolio/servicos-landing/pages/consultoria.html`

## Estrutura
```
/Users/mac/repo-portfolio/servicos-landing/
  /assets
    master-design-tokens.css
    master.css
  /components
    hero.html
    problem.html
    solution.html
    services.html
    cases.html
    process.html
    testimonials.html
    faq.html
    cta.html
    leadform.html
    related-services.html
    footer.html
  /data
    services.json
    cases.json
    testimonials.json
    faq.json
  /pages
    index.html
    produto-ux-design.html
    design-system.html
    direcao-criativa.html
    estrategia-conteudo.html
    trafego-pago.html
    consultoria.html
```

## URLs sugeridas
- `/servicos` → `servicos-landing/pages/index.html`
- `/servicos/produto-ux-design`
- `/servicos/design-system`
- `/servicos/direcao-criativa`
- `/servicos/estrategia-conteudo`
- `/servicos/trafego-pago`
- `/servicos/consultoria`

## Como publicar
1. Mover a pasta `servicos-landing` para o root do repositório público, se o hosting for por pasta.
2. Ou manter em `servicos-landing/` e usar o caminho completo.
3. Se usar GitHub Pages com domínio custom, basta manter como subpasta.
4. Não alterar `produto.html`, `designhead.html`, `parceria.html` ou `index.html` agora; o ecossistema cresce em paralelo.

## Integração futura
- O formulário já prepara o payload estruturado no console.
- Próximos passos:
  - Enviar para Google Sheets
  - Disparar webhook
  - Encaminhar para WhatsApp/CRM
  - Validar UTM no envio
