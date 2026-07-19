/* ============================================================
   Painel dos noivos — layout compartilhado
   ============================================================ */

const MENU = [
  { section: 'Visão geral' },
  { id: 'dashboard',    label: 'Dashboard',      ico: '📊', href: 'index.html' },
  { section: 'Convidados' },
  { id: 'convidados',   label: 'Lista de convidados', ico: '📋', href: 'convidados.html' },
  { id: 'rsvp',         label: 'Confirmações',   ico: '✅', href: 'convidados.html' },
  { id: 'infantil',     label: 'Espaço infantil', ico: '🧸', href: '#', soon: true },
  { id: 'checkin',      label: 'Check-in',       ico: '📷', href: 'checkin.html' },
  { id: 'comunicacao',  label: 'Comunicação',    ico: '✉️', href: '#', soon: true },
  { section: 'Presentes' },
  { id: 'presentes',    label: 'Lista de presentes', ico: '🎁', href: '#', soon: true },
  { id: 'pagamentos',   label: 'Pagamentos (Asaas)', ico: '💳', href: '#', soon: true },
  { section: 'Gestão' },
  { id: 'financeiro',   label: 'Controle financeiro', ico: '💰', href: 'financeiro.html' },
  { id: 'projecao',     label: 'Projeção mensal', ico: '📈', href: 'financeiro.html' },
  { id: 'fornecedores', label: 'Fornecedores',   ico: '🤝', href: '#', soon: true },
  { id: 'contratos',    label: 'Contratos',      ico: '📄', href: '#', soon: true },
  { id: 'documentos',   label: 'Documentos',     ico: '🗂️', href: '#', soon: true },
];

function renderShell(activeId, title) {
  const links = MENU.map((item) => {
    if (item.section) return `<div class="sidebar__section">${item.section}</div>`;
    const active = item.id === activeId ? ' is-active' : '';
    const soon = item.soon ? '<span class="soon">em breve</span>' : '';
    return `<a class="sidebar__link${active}" href="${item.href}"><span class="ico">${item.ico}</span>${item.label}${soon}</a>`;
  }).join('');

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <a class="sidebar__brand" href="../index.html">
      <img src="../assets/logo.svg" alt="HG" /><span>Helena &amp; Guilherme</span>
    </a>
    ${links}`;

  document.body.classList.add('has-shell');
  document.body.prepend(sidebar);

  const menuBtn = document.querySelector('.menu-btn');
  menuBtn?.addEventListener('click', () => sidebar.classList.toggle('is-open'));
  document.querySelector('.topbar__title') && (document.querySelector('.topbar__title').textContent = title);
}
