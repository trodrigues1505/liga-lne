// privacidade.js — Aviso de Privacidade (LGPD) LNE 2026
// Módulo independente: não precisa ser registrado no main.js.
// Qualquer elemento com o atributo  data-privacidade  abre o aviso ao clicar.

// ══════════════════════════════════════════════════════════
// PREENCHA ANTES DE PUBLICAR  ← obrigatório para o aviso valer
// ══════════════════════════════════════════════════════════
export const PRIVACIDADE = {
  versao:      '2026-10',
  atualizadoEm:'07/10/2026',
  controlador: 'Liga de Natação Escolar (LNE)',   // nome da entidade responsável pela liga
  contato:     '',                                // e-mail do encarregado / canal para pedidos de titulares
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function _html() {
  const contato = PRIVACIDADE.contato
    ? `<a href="mailto:${esc(PRIVACIDADE.contato)}">${esc(PRIVACIDADE.contato)}</a>`
    : '<em>o canal de contato informado pela organização da liga</em>';
  return `
  <div class="priv-doc">
    <h4>1. Quem é o responsável</h4>
    <p>${esc(PRIVACIDADE.controlador)} é a responsável (controladora) pelo tratamento dos dados descritos neste aviso. Dúvidas e pedidos: ${contato}.</p>

    <h4>2. Quais dados tratamos</h4>
    <ul>
      <li><b>Atletas:</b> nome, escola, categoria, vínculo (federado ou não) e resultados (tempos, posições e pontos).</li>
      <li><b>Responsáveis das escolas:</b> nome, e-mail e telefone, usados para o cadastro e o acesso ao sistema.</li>
      <li>Outros dados de inscrição exigidos pelo regulamento de cada etapa.</li>
    </ul>

    <h4>3. Para que usamos</h4>
    <p>Organizar as etapas da liga: inscrições, balizamento, cronometragem, classificação, pontuação, ranking e divulgação dos resultados; e manter contato com as escolas participantes.</p>

    <h4>4. Atletas menores de idade</h4>
    <p>A maioria dos atletas tem menos de 18 anos. O tratamento dos dados de crianças e adolescentes é feito em seu melhor interesse (LGPD, art. 14). Ao inscrever atletas, a escola declara ter autorização dos pais ou responsáveis legais para essa participação e para a divulgação dos resultados.</p>

    <h4>5. Com quem compartilhamos</h4>
    <ul>
      <li><b>Resultados e rankings</b> são divulgados às escolas e aos participantes somente depois de liberados pela organização.</li>
      <li><b>Consulta de atleta:</b> sem login, exige nome completo do atleta e escola; escolas logadas veem apenas os próprios atletas.</li>
      <li><b>Infraestrutura:</b> os dados ficam armazenados no Google Firebase, em servidores em São Paulo (Brasil). O site é hospedado no GitHub Pages, cujos servidores podem estar fora do Brasil.</li>
    </ul>

    <h4>6. Por quanto tempo guardamos</h4>
    <p>Pelo tempo necessário às finalidades acima. Quando deixarem de ser necessários, os dados são eliminados ou anonimizados.</p>

    <h4>7. Seus direitos</h4>
    <p>Você pode pedir confirmação de que tratamos seus dados, acesso, correção, anonimização, eliminação, informações sobre compartilhamento e a revogação do consentimento (LGPD, art. 18). Para atletas menores, o pedido pode ser feito pelos pais ou responsáveis. Envie para ${contato}.</p>

    <h4>8. Segurança</h4>
    <p>Adotamos medidas técnicas e administrativas para proteger os dados contra acesso indevido. Em caso de incidente que possa causar risco relevante, os envolvidos serão avisados.</p>

    <p class="priv-ver">Versão ${esc(PRIVACIDADE.versao)} · atualizado em ${esc(PRIVACIDADE.atualizadoEm)}</p>
  </div>`;
}

function _garantirModal() {
  let modal = document.getElementById('modalPrivacidade');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.className = 'mover';
  modal.id = 'modalPrivacidade';
  modal.innerHTML = `
    <div class="mdl mdl-panel" style="max-width:640px;max-height:90vh;" role="dialog" aria-modal="true" aria-labelledby="privTitulo">
      <div class="mdl-hd mdl-bar">
        <h3 id="privTitulo">Aviso de Privacidade</h3>
        <button class="mdl-x" type="button" aria-label="Fechar" data-priv-fechar>×</button>
      </div>
      <div class="mdl-scroll" style="padding:22px;">${_html()}</div>
      <div class="mdl-ft"><button class="btn b-pri" type="button" data-priv-fechar>Entendi</button></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

export function abrirPrivacidade() { _garantirModal().classList.add('open'); }
export function fecharPrivacidade() { document.getElementById('modalPrivacidade')?.classList.remove('open'); }

// Delegação: funciona também para botões criados depois (modais dinâmicos)
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-privacidade]')) { e.preventDefault(); abrirPrivacidade(); }
  else if (e.target.closest('[data-priv-fechar]')) { fecharPrivacidade(); }
  else if (e.target.id === 'modalPrivacidade') { fecharPrivacidade(); }   // clique no fundo
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharPrivacidade(); });

if (!PRIVACIDADE.contato) console.warn('[LNE] Aviso de privacidade: preencha PRIVACIDADE.contato em js/privacidade.js');
