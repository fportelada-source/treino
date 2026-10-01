/* ================================================================
   APRESENTAÇÃO (onboarding) — Discoteca
   ================================================================
   Reaproveita o sistema de modal que já existe no app (.modal-overlay,
   .modal, .modal-close e o botão dourado .form-btn do style.css); aqui
   só ficam as 3 etapas, a troca animada entre elas e o ajuste de
   celular — por isso o CSS vai embutido neste arquivo, sem mexer no
   style.css (que obrigaria a subir as 9 páginas).

   Quem viu fica salvo NO SERVIDOR, por usuário (rota /onboarding): não
   volta ao atualizar a página, ao fechar o navegador, nem ao sair e
   entrar de novo, em qualquer aparelho. Uma cópia local evita perguntar
   ao servidor toda vez.

   Uso:
     <script src="onboarding.js" data-auto="1"></script>  -> mostra
       sozinho na 1ª vez que o usuário logado entra (Início).
     DiscotecaOnboarding.abrir()  -> abre a qualquer momento
       (Configurações → "Rever apresentação").
   ================================================================ */
(function () {
  const PASSOS = [
    { n: '01', pergunta: 'O que é o Discoteca?',
      titulo: 'Transforme suas playlists em uma coleção de mídias físicas.',
      texto: 'Um companion app para organizar sua coleção, gerenciar sua wishlist e descobrir música nova.' },
    { n: '02', pergunta: 'Por que usar?',
      titulo: 'Tudo em um só lugar.',
      texto: 'Chega de ficar pulando de um lugar para outro. Uma experiência simples, bonita e fácil de usar.' },
    { n: '03', pergunta: 'Como começar?',
      titulo: 'Importe suas playlists. Descubra o que comprar. Construa sua coleção.',
      texto: 'O Discoteca transforma seu gosto musical em uma experiência de colecionismo personalizada.' }
  ];

  const CSS = `
    #onbOverlay { padding: 16px; box-sizing: border-box; }
    #onbOverlay .onb-modal:focus { outline: none; }
    #onbOverlay .onb-modal { max-width: 480px; width: 100%; padding: 26px 30px 28px; box-sizing: border-box; }
    #onbOverlay.open .onb-modal { animation: onbEntra 0.28s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    @keyframes onbEntra { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
    .onb-topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .onb-passos { display: flex; gap: 4px; }
    .onb-passo { position: relative; background: none; border: 0; color: var(--paper); opacity: 0.35; cursor: pointer;
      font: 600 12px 'Inter', sans-serif; letter-spacing: 0.08em; padding: 8px 9px; border-radius: 8px; transition: opacity 0.2s ease, color 0.2s ease; }
    .onb-passo:hover { opacity: 0.7; }
    .onb-passo.on { opacity: 1; color: var(--terracotta); }
    .onb-passo.on::after { content: ""; position: absolute; left: 9px; right: 9px; bottom: 2px; height: 2px; border-radius: 2px; background: var(--terracotta); }
    .onb-passo:focus-visible, #onbOverlay .modal-close:focus-visible, #onbAvancar:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 2px; }
    #onbOverlay .modal-close { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: -8px; }
    .onb-conteudo { min-height: 168px; }
    .onb-conteudo.anima { animation: onbPasso 0.24s ease both; }
    @keyframes onbPasso { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .onb-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--terracotta); margin-bottom: 12px; }
    .onb-titulo { font-size: clamp(22px, 3vw, 27px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.16; margin: 0; }
    .onb-texto { font-size: 14.5px; line-height: 1.6; opacity: 0.6; margin: 12px 0 0; }
    .onb-acoes { margin-top: 26px; }
    #onbOverlay .onb-acoes .form-btn { margin-top: 0; min-height: 48px; }
    @media (max-width: 600px) {
      #onbOverlay { align-items: flex-end; padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px)); }
      #onbOverlay .onb-modal { padding: 20px 20px 22px; max-height: calc(100vh - 24px); }
      .onb-conteudo { min-height: 190px; }
    }
    @media (prefers-reduced-motion: reduce) {
      #onbOverlay.open .onb-modal, .onb-conteudo.anima { animation: none; }
      .onb-passo { transition: none; }
    }
  `;

  let overlay = null, atual = 0, focoAnterior = null, aberto = false;

  function chaveLocal() {
    const uid = localStorage.getItem('discoteca_user_id');
    return uid ? 'discoteca_onboarding_visto_' + uid : null;
  }
  function chamarApi(caminho, opcoes) {
    if (typeof apiFetch !== 'function' || typeof API_URL === 'undefined') return Promise.reject(new Error('sem API'));
    return apiFetch(API_URL + caminho, opcoes || {});
  }

  function montar() {
    if (overlay) return;
    const estilo = document.createElement('style');
    estilo.id = 'onbEstilo';
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'onbOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'onbTitulo');
    overlay.innerHTML = `
      <div class="modal onb-modal" tabindex="-1">
        <div class="onb-topo">
          <div class="onb-passos" role="tablist" aria-label="Etapas da apresentação">
            ${PASSOS.map((p, i) => `<button type="button" class="onb-passo" role="tab" data-i="${i}" aria-label="Etapa ${i + 1} de ${PASSOS.length}: ${p.pergunta}">${p.n}</button>`).join('')}
          </div>
          <button type="button" class="modal-close" id="onbFechar" aria-label="Fechar apresentação">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="onb-conteudo" id="onbConteudo" aria-live="polite">
          <div class="onb-eyebrow" id="onbEyebrow"></div>
          <h2 class="onb-titulo" id="onbTitulo"></h2>
          <p class="onb-texto" id="onbTexto"></p>
        </div>
        <div class="onb-acoes">
          <button type="button" class="form-btn" id="onbAvancar"></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.onb-passo').forEach(b => b.addEventListener('click', () => irPara(Number(b.dataset.i))));
    overlay.querySelector('#onbFechar').addEventListener('click', () => fechar());
    overlay.querySelector('#onbAvancar').addEventListener('click', () => {
      if (atual < PASSOS.length - 1) irPara(atual + 1);
      else fechar();
    });
    document.addEventListener('keydown', e => {
      if (!aberto) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      else if (e.key === 'Tab') {
        // mantém o Tab dentro do modal enquanto ele está aberto
        const foco = [...overlay.querySelectorAll('button')];
        const i = foco.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); foco[foco.length - 1].focus(); }
        else if (!e.shiftKey && i === foco.length - 1) { e.preventDefault(); foco[0].focus(); }
      }
    });
  }

  function irPara(i) {
    atual = Math.max(0, Math.min(PASSOS.length - 1, i));
    const p = PASSOS[atual];
    const conteudo = overlay.querySelector('#onbConteudo');
    overlay.querySelector('#onbEyebrow').textContent = `${p.n} — ${p.pergunta}`;
    overlay.querySelector('#onbTitulo').textContent = p.titulo;
    overlay.querySelector('#onbTexto').textContent = p.texto;
    overlay.querySelector('#onbAvancar').textContent = atual === PASSOS.length - 1 ? 'Começar a usar o Discoteca' : 'Continuar';
    overlay.querySelectorAll('.onb-passo').forEach((b, k) => {
      b.classList.toggle('on', k === atual);
      b.setAttribute('aria-selected', k === atual ? 'true' : 'false');
    });
    conteudo.classList.remove('anima'); void conteudo.offsetWidth; conteudo.classList.add('anima');
  }

  function abrir() {
    montar();
    focoAnterior = document.activeElement;
    irPara(0);
    overlay.classList.add('open');
    aberto = true;
    // foco no card (sem contorno visível): leitor de tela anuncia o conteúdo e o Tab leva aos botões
    setTimeout(() => { const m = overlay.querySelector('.onb-modal'); if (m) m.focus(); }, 30);
  }

  function marcarVisto() {
    const k = chaveLocal();
    if (k) { try { localStorage.setItem(k, '1'); } catch (e) {} }
    chamarApi('/onboarding/visto', { method: 'POST' }).catch(() => {});
  }

  function fechar() {
    if (!overlay || !aberto) return;
    overlay.classList.remove('open');
    aberto = false;
    marcarVisto();   // fechou pelo X, pelo Esc ou terminou: não aparece de novo sozinho
    if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
  }

  function verificarPrimeiraVez() {
    const k = chaveLocal();
    if (!k || !localStorage.getItem('discoteca_session_token')) return;   // só logado
    if (localStorage.getItem(k) === '1') return;                          // já visto neste aparelho
    chamarApi('/onboarding')
      .then(r => r.json())
      .then(d => {
        if (d && d.visto === false) abrir();
        else if (d && d.visto === true) { try { localStorage.setItem(k, '1'); } catch (e) {} }
      })
      .catch(() => {});   // sem servidor: não mostra (melhor que mostrar sempre)
  }

  // Modo automático: espera a tela do app aparecer (= sessão confirmada)
  // em vez de depender da ordem dos scripts de cada página.
  function quandoLogado(fn) {
    const app = document.getElementById('appScreen');
    if (!app) return;
    const visivel = () => app.style.display === 'block';
    if (visivel()) return fn();
    const obs = new MutationObserver(() => { if (visivel()) { obs.disconnect(); fn(); } });
    obs.observe(app, { attributes: true, attributeFilter: ['style'] });
  }

  const auto = document.currentScript && document.currentScript.dataset.auto === '1';
  window.DiscotecaOnboarding = { abrir, verificarPrimeiraVez };
  if (auto) {
    const iniciar = () => quandoLogado(() => setTimeout(verificarPrimeiraVez, 400));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
  }
})();
