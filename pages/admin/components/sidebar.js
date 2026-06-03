function adminSidebar(activePage){
  const items=[
    {type:'item',key:'dashboard',href:'index.html',label:'Dashboard',icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'},
    {type:'label',label:'Operasional'},
    {type:'group',key:'penerimaan',href:'penerimaan.html',label:'Penerimaan',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>',children:[
      {key:'penerimaan-log',href:'penerimaan-log.html',label:'Penerimaan Log'},
      {key:'penerimaan-sawtimber',href:'penerimaan-sawtimber.html',label:'Penerimaan Sawtimber'},
      {key:'penerimaan-cross',href:'penerimaan.html?tab=cross',label:'Penerimaan Crosscut'},
      {key:'penerimaan-kaca',href:'penerimaan.html?tab=kaca',label:'Penerimaan Kaca'}
    ]},
    {type:'item',key:'konversi',href:'konversi.html',label:'Konversi Log',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>'},
    {type:'item',key:'produksi',href:'produksi.html',label:'Produksi',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>'},
    {type:'item',key:'penjualan',href:'penjualan.html',label:'Penjualan Produk',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7M9 7V5a3 3 0 016 0v2"/>'},
    {type:'label',label:'Inventaris'},
    {type:'item',key:'stok',href:'stok.html',label:'Manajemen Stok',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>'},
    {type:'label',label:'Master Data'},
    {type:'item',key:'master-produk',href:'master-produk.html',label:'Produk & Varian',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>'},
    {type:'item',key:'master-material',href:'master-material.html',label:'Ukuran & Material',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>'},
    {type:'item',key:'master-user',href:'master-user.html',label:'Pengguna & Grader',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'},
    {type:'label',label:'Laporan'},
    {type:'item',key:'riwayat',href:'riwayat.html',label:'Riwayat Transaksi',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>'},
    {type:'label',label:'Akun'},
    {type:'item',key:'settings',href:'settings.html',label:'Pengaturan',icon:'<path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm6.364 2.25a6.003 6.003 0 01-.474 2.25l1.562 1.21a.75.75 0 01.177 1.029l-1.477 2.556a.75.75 0 01-.938.342l-1.84-.737a6.036 6.036 0 01-1.95 1.13l-.28 1.945a.75.75 0 01-.74.63h-2.954a.75.75 0 01-.74-.63l-.28-1.945a6.036 6.036 0 01-1.95-1.13l-1.84.737a.75.75 0 01-.938-.342L4.37 15.24a.75.75 0 01.177-1.029l1.562-1.21a6.003 6.003 0 01-.474-2.25 6.003 6.003 0 01.474-2.25L4.547 8.5a.75.75 0 01-.177-1.029L5.847 4.915a.75.75 0 01.938-.342l1.84.737a6.036 6.036 0 011.95-1.13l.28-1.945A.75.75 0 0111.82 2h2.954a.75.75 0 01.74.63l.28 1.945a6.036 6.036 0 011.95 1.13l1.84-.737a.75.75 0 01.938.342l1.477 2.556a.75.75 0 01-.177 1.029l-1.562 1.21a6.003 6.003 0 01.474 2.25z"/>'}
  ];
  return `<aside id="sidebar">
    <section class="sidebar-brand">
      <section class="sidebar-brand-main">
        <section class="sidebar-logo" aria-hidden="true"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/></svg></section>
        <section class="brand-copy"><p class="sidebar-title">WoodTrack</p><p class="sidebar-subtitle">Pro Edition</p></section>
      </section>
      <button class="sidebar-collapse-btn js-toggle-sidebar" type="button" aria-label="Collapse sidebar" aria-expanded="true"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
    </section>
    <nav style="padding:10px 0" aria-label="Sidebar admin">${items.map(item=>{
      if(item.type==='label')return `<section class="nav-label">${item.label}</section>`;
      if(item.type==='group')return `<section class="nav-group ${item.key===activePage?'active':''}">
        <a class="nav-item ${item.key===activePage?'active':''}" href="${item.href}" data-nav="${item.key}" title="${item.label}" ${item.key===activePage?'aria-current="page"':''}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${item.icon}</svg><span class="nav-text">${item.label}</span></a>
        <section class="nav-submenu" aria-label="Submenu ${item.label}">${item.children.map(child=>`<a class="nav-subitem ${child.key===activePage?'active':''}" href="${child.href}" title="${child.label}" ${child.key===activePage?'aria-current="page"':''}><span class="nav-subdot" aria-hidden="true"></span><span class="nav-text">${child.label}</span></a>`).join('')}</section>
      </section>`;
      return `<a class="nav-item ${item.key===activePage?'active':''}" href="${item.href}" data-nav="${item.key}" title="${item.label}" ${item.key===activePage?'aria-current="page"':''}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${item.icon}</svg><span class="nav-text">${item.label}</span></a>`;
    }).join('')}</nav>
  </aside>`;
}
function mountAdminShell(activePage){
  const isCollapsed=localStorage.getItem('wt_sidebar_collapsed')==='1';
  document.body.classList.toggle('sidebar-collapsed',isCollapsed);
  document.body.insertAdjacentHTML('afterbegin', adminSidebar(activePage));
  document.body.insertAdjacentHTML('beforeend', '<section class="toast-wrap" id="toast-wrap"></section><header id="topbar"><section style="display:flex;align-items:center;gap:10px"><span id="tb-path" style="font-size:13px;color:#0f172a;font-weight:800">Dashboard</span></section><section style="display:flex;align-items:center;gap:12px"><span id="tb-date" style="font-size:12px;color:#94a3b8"></span><section id="tb-action"></section><section class="topbar-profile" id="topbar-profile"><button id="topbar-profile-btn" class="topbar-profile-btn" type="button" aria-haspopup="true" aria-expanded="false"><span class="profile-avatar" aria-hidden="true">A</span><span class="profile-name">Admin</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button><div id="topbar-profile-menu" class="topbar-profile-menu hidden"><a href="settings.html">Pengaturan Akun</a><a href="../login.html">Logout</a></div></section></section></header><main id="content"></main>');
  const toggle=document.querySelector('.js-toggle-sidebar');
  toggle?.setAttribute('aria-expanded', String(!isCollapsed));
  toggle?.addEventListener('click',()=>{const collapsed=!document.body.classList.contains('sidebar-collapsed');document.body.classList.toggle('sidebar-collapsed',collapsed);localStorage.setItem('wt_sidebar_collapsed',collapsed?'1':'0');toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');});
  const profileBtn=document.getElementById('topbar-profile-btn');
  const profileMenu=document.getElementById('topbar-profile-menu');
  profileBtn?.addEventListener('click',()=>{const expanded=profileBtn.getAttribute('aria-expanded')==='true';profileBtn.setAttribute('aria-expanded',String(!expanded));profileMenu?.classList.toggle('hidden');});
  document.addEventListener('click',e=>{if(!profileMenu?.contains(e.target)&&!profileBtn?.contains(e.target)){profileMenu?.classList.add('hidden');profileBtn?.setAttribute('aria-expanded','false');}});
}
