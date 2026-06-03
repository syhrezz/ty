// ═══════════════════════════════════
//  DATA LAYER
// ═══════════════════════════════════
const KEY = 'wt_pro_v1';
const SEED = {
  logs:[],
  sawtimbers:[],
  sizes:[
    {id:'s1',code:'5×10×200',p:200,l:10,t:5},
    {id:'s2',code:'5×15×200',p:200,l:15,t:5},
    {id:'s3',code:'7×15×400',p:400,l:15,t:7},
    {id:'s4',code:'3×7×300', p:300,l:7, t:3},
    {id:'s5',code:'4×10×400',p:400,l:10,t:4},
  ],
  woodTypes:['Jati','Meranti','Merbau','Sengon','Mahoni','Kamper'],
  conversions:[],
  products:[
    {id:'p1',name:'Pintu Panel',cat:'Pintu',desc:'Konstruksi panel solid dengan frame kayu'},
    {id:'p2',name:'Pintu Flush',cat:'Pintu',desc:'Permukaan rata dengan isian honeycomb/solid'},
    {id:'p3',name:'Pintu Krepyak',cat:'Pintu',desc:'Daun pintu dengan kisi-kisi ventilasi'},
    {id:'p4',name:'Jendela Casement',cat:'Jendela',desc:'Jendela engsel samping, buka ke luar'},
  ],
  variants:[
    {id:'v1',pid:'p1',code:'PP-210-90',name:'Pintu Panel 210×90',p:210,l:90,t:4,finish:'Raw',m3Est:0.082},
    {id:'v2',pid:'p1',code:'PP-200-80',name:'Pintu Panel 200×80',p:200,l:80,t:4,finish:'Raw',m3Est:0.070},
    {id:'v3',pid:'p1',code:'PP-210-90-CD',name:'Pintu Panel 210×90 Cat Dasar',p:210,l:90,t:4,finish:'Cat Dasar',m3Est:0.082},
    {id:'v4',pid:'p2',code:'PF-210-90',name:'Pintu Flush 210×90',p:210,l:90,t:3.5,finish:'Raw',m3Est:0.065},
    {id:'v5',pid:'p2',code:'PF-200-80',name:'Pintu Flush 200×80',p:200,l:80,t:3.5,finish:'Raw',m3Est:0.058},
    {id:'v6',pid:'p3',code:'PK-210-80',name:'Pintu Krepyak 210×80',p:210,l:80,t:4.5,finish:'Raw',m3Est:0.075},
    {id:'v7',pid:'p4',code:'JC-120-80',name:'Jendela Casement 120×80',p:120,l:80,t:3.5,finish:'Raw',m3Est:0.040},
  ],
  productions:[],
  sales:[]
};

function loadDb(){try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):JSON.parse(JSON.stringify(SEED))}catch{return JSON.parse(JSON.stringify(SEED))}}
function saveDb(){localStorage.setItem(KEY,JSON.stringify(db))}

let db=loadDb();
db.sales=db.sales||[];

// ═══════════════════════════════════
//  UTILS
// ═══════════════════════════════════
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date().toISOString().split('T')[0];
const fmtDate=d=>new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
const m3Size=id=>{const s=db.sizes.find(x=>x.id===id);return s?+(s.p*s.l*s.t/1e6).toFixed(6):0};
const logM3Est=(sz,qty)=>{const d={A1:.10,A2:.20,A3:.30,A4:.40,A5:.50}[sz]||0;return+(Math.PI*(d/2)**2*4*qty).toFixed(3)};

function toast(msg,type='ok'){
  const w=document.getElementById('toast-wrap');
  const el=document.createElement('div');
  el.className=`toast-item ${type}`;
  el.textContent=msg;
  w.appendChild(el);
  setTimeout(()=>{el.style.animation='toastIn .3s ease reverse both';setTimeout(()=>el.remove(),300)},2800);
}

// Stock aggregators
function logStock(){
  const m={};
  db.logs.forEach(l=>{const k=`${l.wt}|${l.gr}|${l.sz}`;if(!m[k])m[k]={wt:l.wt,gr:l.gr,sz:l.sz,qty:0,m3:0};m[k].qty+=l.qty;m[k].m3+=l.m3||0});
  db.conversions.forEach(c=>{const k=`${c.lwt}|${c.lgr}|${c.lsz}`;if(m[k]){m[k].qty-=c.lqty;m[k].m3-=c.lm3||0}});
  return Object.values(m).filter(s=>s.qty>0);
}
function sawStock(){
  const m={};
  db.sawtimbers.forEach(s=>{const k=`${s.wt}|${s.gr}|${s.sid}`;if(!m[k])m[k]={wt:s.wt,gr:s.gr,sid:s.sid,qty:0,m3:0};m[k].qty+=s.qty;m[k].m3+=s.m3||0});
  db.productions.forEach(p=>{if(!p.sawSid)return;const k=`${p.sawWt||'?'}|${p.sawGr||'?'}|${p.sawSid}`;if(m[k]){m[k].qty-=p.sawQtyUsed||0;m[k].m3-=(p.sawM3Used||0)}});
  return Object.values(m).filter(s=>s.qty>0);
}
function prodStock(){
  const m={};
  db.productions.forEach(p=>{const k=`${p.vid}|${p.gr}`;if(!m[k])m[k]={vid:p.vid,gr:p.gr,qty:0};m[k].qty+=p.qty});
  return Object.values(m).filter(s=>s.qty>0);
}
const sizeLabel=id=>{const s=db.sizes.find(x=>x.id===id);return s?s.code:id};
const variantLabel=id=>{const v=db.variants.find(x=>x.id===id);return v?v.name:id};
const productName=id=>{const p=db.products.find(x=>x.id===id);return p?p.name:id};

// ═══════════════════════════════════
//  ROUTER & SELECTION STATE
// ═══════════════════════════════════
let page=window.ADMIN_PAGE || 'dashboard', tabs={}, grSel={}, szSel={};
  const PAGE_URLS={dashboard:'index.html',penerimaan:'penerimaan.html','penerimaan-log':'penerimaan-log.html','penerimaan-sawtimber':'penerimaan-sawtimber.html',konversi:'konversi.html',produksi:'produksi.html',penjualan:'penjualan.html',stok:'stok.html','master-produk':'master-produk.html','master-material':'master-material.html',riwayat:'riwayat.html',settings:'settings.html'};

function go(p,tab=null){
  if(PAGE_URLS[p] && p!==page && !tab){ window.location.href=PAGE_URLS[p]; return; }
  if(PAGE_URLS[p] && p!==page && tab){ window.location.href=PAGE_URLS[p] + '?tab=' + encodeURIComponent(tab); return; }
  page=p; if(tab)tabs[p]=tab;
  grSel={}; szSel={};
  document.querySelectorAll('[data-nav]').forEach(n=>{
    n.classList.toggle('active',n.dataset.nav===p);
    n.setAttribute('aria-current', n.dataset.nav===p ? 'page' : 'false');
  });
  const titles={
    dashboard:'Dashboard',penerimaan:'Penerimaan Bahan Baku','penerimaan-log':'Penerimaan Log','penerimaan-sawtimber':'Penerimaan Sawtimber',konversi:'Konversi Log → Sawtimber',
    produksi:'Produksi',penjualan:'Penjualan Produk',stok:'Manajemen Stok','master-produk':'Master Produk & Varian',
    'master-material':'Master Ukuran & Material',riwayat:'Riwayat Transaksi',settings:'Pengaturan Akun'
  };
  document.getElementById('tb-path').textContent=titles[p]||p;
  render();
}

function render(){
  const renders={dashboard:pgDashboard,penerimaan:pgPenerimaan,'penerimaan-log':pgPenerimaan,'penerimaan-sawtimber':pgPenerimaan,konversi:pgKonversi,produksi:pgProduksi,penjualan:pgPenjualan,stok:pgStok,'master-produk':pgMasterProduk,'master-material':pgMasterMaterial,riwayat:pgRiwayat,settings:pgSettings};
  document.getElementById('content').innerHTML=`<div class="fade-in">${(renders[page]||pgDashboard)()}</div>`;
  document.getElementById('tb-date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  restoreVis();
}

function restoreVis(){
  Object.entries(grSel).forEach(([pfx,g])=>applyGrVis(pfx,g));
  Object.entries(szSel).forEach(([pfx,id])=>{
    if(pfx==='log'){document.querySelectorAll('.szbtn-log').forEach(b=>b.classList.toggle('sel',b.dataset.sz===id))}
    if(pfx==='saw'||pfx==='co'){document.querySelectorAll(`.sz-card-${pfx}`).forEach(b=>b.classList.toggle('sel',b.dataset.sid===id))}
  });
}

// ═══════════════════════════════════
//  DASHBOARD DETAIL HELPERS
// ═══════════════════════════════════
function getLogDetailTable(ls){
  if(ls.length===0)return `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">Tidak ada stok log</td></tr>`;
  const grouped={};
  ls.forEach(s=>{const k=`${s.wt}|${s.sz}|${s.gr}`;if(!grouped[k])grouped[k]={wt:s.wt,sz:s.sz,gr:s.gr,qty:0,m3:0};grouped[k].qty+=s.qty;grouped[k].m3+=s.m3});
  return Object.values(grouped).map(s=>`<tr><td style="font-weight:600;color:#0f172a">${s.wt}</td><td style="font-weight:600;color:#0f172a">${s.sz}</td><td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td><td style="text-align:right;font-weight:700;color:#92400e">${s.qty}</td><td style="text-align:right;color:#64748b;font-size:12px">${s.m3.toFixed(2)} m³</td></tr>`).join('');
}
function getSawDetailTable(ss){
  if(ss.length===0)return `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">Tidak ada stok sawtimber</td></tr>`;
  const grouped={};
  ss.forEach(s=>{const k=`${s.wt}|${s.sid}|${s.gr}`;if(!grouped[k])grouped[k]={wt:s.wt,sid:s.sid,sz:sizeLabel(s.sid),gr:s.gr,qty:0,m3:0};grouped[k].qty+=s.qty;grouped[k].m3+=s.m3});
  return Object.values(grouped).map(s=>`<tr><td style="font-weight:600;color:#0f172a">${s.wt}</td><td style="font-weight:600;color:#0f172a">${s.sz}</td><td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td><td style="text-align:right;font-weight:700;color:#15803d">${s.qty}</td><td style="text-align:right;color:#64748b;font-size:12px">${s.m3.toFixed(4)} m³</td></tr>`).join('');
}
function getBahanBakuDetailTable(ss){
  const bahanBaku=ss.filter(x=>x.gr==='A'||x.gr==='B');
  if(bahanBaku.length===0)return `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">Tidak ada bahan baku siap produksi</td></tr>`;
  const grouped={};
  bahanBaku.forEach(s=>{const k=`${s.wt}|${s.sid}|${s.gr}`;if(!grouped[k])grouped[k]={wt:s.wt,sid:s.sid,sz:sizeLabel(s.sid),gr:s.gr,qty:0,m3:0};grouped[k].qty+=s.qty;grouped[k].m3+=s.m3});
  return Object.values(grouped).map(s=>`<tr><td style="font-weight:600;color:#0f172a">${s.wt}</td><td style="font-weight:600;color:#0f172a">${s.sz}</td><td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td><td style="text-align:right;font-weight:700;color:#0891b2">${s.qty}</td><td style="text-align:right;color:#64748b;font-size:12px">${s.m3.toFixed(4)} m³</td></tr>`).join('');
}
function getFinishedProductDetailTable(ps){
  if(ps.length===0)return `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:20px">Tidak ada produk jadi</td></tr>`;
  const grouped={};
  ps.forEach(p=>{const k=`${p.vid}`;if(!grouped[k])grouped[k]={vid:p.vid,vname:variantLabel(p.vid),qty:0,grades:{}};grouped[k].qty+=p.qty;if(!grouped[k].grades[p.gr])grouped[k].grades[p.gr]=0;grouped[k].grades[p.gr]+=p.qty});
  return Object.values(grouped).map(p=>`<tr><td style="font-weight:600">${p.vname}</td><td style="text-align:right;font-weight:700;color:#1e3a8a">${p.qty}</td><td style="font-size:12px;color:#64748b">${Object.entries(p.grades).map(([g,q])=>`<span class="gr-badge gr-${g}">${g}:${q}</span>`).join(' ')}</td></tr>`).join('');
}

// ═══════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════
function pgDashboard(){
  const ls=logStock(),ss=sawStock(),ps=prodStock();
  const bahanBaku=ss.filter(x=>x.gr==='A'||x.gr==='B');
  const lq=ls.reduce((a,b)=>a+b.qty,0), lm=ls.reduce((a,b)=>a+b.m3,0).toFixed(2);
  const sq=ss.reduce((a,b)=>a+b.qty,0), sm=ss.reduce((a,b)=>a+b.m3,0).toFixed(4);
  const bq=bahanBaku.reduce((a,b)=>a+b.qty,0), bm=bahanBaku.reduce((a,b)=>a+b.m3,0).toFixed(4);
  const pq=ps.reduce((a,b)=>a+b.qty,0);
  const convTotal=db.conversions.length, prodTotal=db.productions.length;
  const txTotal=convTotal+prodTotal+db.logs.length+db.sawtimbers.length;
  const grColors={A:'#16a34a',B:'#2563eb',C:'#ca8a04',D:'#dc2626'};
  const acts=[...db.logs.map(x=>({...x,_t:'log',_d:x.date})),...db.sawtimbers.map(x=>({...x,_t:'saw',_d:x.date})),...db.conversions.map(x=>({...x,_t:'conv',_d:x.date})),...db.productions.map(x=>({...x,_t:'prod',_d:x.date}))].sort((a,b)=>new Date(b._d)-new Date(a._d)).slice(0,8);

  return `
  <section class="dashboard-kpi-grid">
    ${kpiCard('kpi-log','Raw Log',lq,'batang',`${lm} m³ tersedia`,'#fffbeb','#92400e','M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7')}
    ${kpiCard('kpi-saw','Sawtimber',sq,'lembar',`${sm} m³ tersedia`,'#f0fdf4','#15803d','M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2')}
    ${kpiCard('kpi-material','Bahan Baku',bq,'lembar grade A/B',`${bm} m³ siap produksi`,'#ecfeff','#0891b2','M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4')}
    ${kpiCard('kpi-door','Produk Jadi',pq,'unit',`pintu & jendela siap jual`,'#eff6ff','#2563eb','M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3')}
  </section>

  <section class="dashboard-detail-grid">
    <section class="card">
      <section class="card-header"><span style="font-size:13px;font-weight:800">🪵 RAW LOG - Detail Stok</span></section>
      <section class="card-body" style="padding:0">
        <table class="tbl"><thead><tr><th>Jenis Kayu</th><th>Size</th><th>Grade</th><th>Qty (batang)</th><th>Volume</th></tr></thead><tbody>${getLogDetailTable(ls)}</tbody></table>
      </section>
    </section>

    <section class="card">
      <section class="card-header"><span style="font-size:13px;font-weight:800">🪚 SAWTIMBER - Detail Stok</span></section>
      <section class="card-body" style="padding:0">
        <table class="tbl"><thead><tr><th>Jenis Kayu</th><th>Size</th><th>Grade</th><th>Qty (lembar)</th><th>Volume</th></tr></thead><tbody>${getSawDetailTable(ss)}</tbody></table>
      </section>
    </section>

    <section class="card">
      <section class="card-header"><span style="font-size:13px;font-weight:800">📦 BAHAN BAKU (Grade A/B) - Detail Stok</span></section>
      <section class="card-body" style="padding:0">
        <table class="tbl"><thead><tr><th>Jenis Kayu</th><th>Size</th><th>Grade</th><th>Qty (lembar)</th><th>Volume</th></tr></thead><tbody>${getBahanBakuDetailTable(ss)}</tbody></table>
      </section>
    </section>

    <section class="card">
      <section class="card-header"><span style="font-size:13px;font-weight:800">🚪 PRODUK JADI - Detail Varian</span></section>
      <section class="card-body" style="padding:0">
        <table class="tbl"><thead><tr><th>Varian Produk</th><th>Total (unit)</th><th>Grade Breakdown</th></tr></thead><tbody>${getFinishedProductDetailTable(ps)}</tbody></table>
      </section>
    </section>
  </section>


  <section class="card">
    <section class="card-header"><span style="font-size:13px;font-weight:800">Aktivitas Terkini</span><button class="btn btn-ghost btn-sm" onclick="go('riwayat')">Lihat Semua</button></section>
    <section class="card-body" style="padding:0">${acts.length===0?`<section class="empty"><p style="font-size:13px">Belum ada aktivitas</p></section>`:`<table class="tbl"><thead><tr><th>Jenis</th><th>Material / Produk</th><th>Grade</th><th>Qty</th><th>Tanggal</th></tr></thead><tbody>${acts.map(a=>activityRow(a)).join('')}</tbody></table>`}</section>
  </section>`;
}

function pgSettings(){
  return `
  <section class="card">
    <section class="card-header"><span style="font-size:14px;font-weight:800">Profil & Pengaturan Akun</span><span style="font-size:12px;color:#64748b">Kelola akses dan preferensi admin</span></section>
    <section class="card-body" style="display:grid;gap:20px">
      <section class="card" style="border:1px solid #f1f5f9;box-shadow:none">
        <section class="card-header"><span style="font-size:13px;font-weight:800">Akun saya</span></section>
        <section class="card-body" style="display:grid;gap:14px">
          <section style="display:grid;gap:8px"><span class="sec-head">Informasi pengguna</span><div style="display:grid;gap:8px"><div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:#f8fafc;border-radius:14px"><span style="color:#475569">Nama</span><strong>Administrator</strong></div><div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:#f8fafc;border-radius:14px"><span style="color:#475569">Email</span><strong>admin@woodtrack.local</strong></div><div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:#f8fafc;border-radius:14px"><span style="color:#475569">Peran</span><strong>Super Admin</strong></div></div></section>
          <section style="display:grid;gap:8px"><span class="sec-head">Keamanan</span><div style="display:grid;gap:12px"><button class="btn btn-ghost" onclick="location.href='../login.html'">Ubah Password</button><button class="btn btn-danger" onclick="location.href='../login.html'">Logout Sekarang</button></div></section>
        </section>
      </section>
      <section class="card" style="border:1px solid #f1f5f9;box-shadow:none">
        <section class="card-header"><span style="font-size:13px;font-weight:800">Preferensi tampilan</span></section>
        <section class="card-body" style="display:grid;gap:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px;background:#f8fafc;border-radius:14px"><div><strong>Mode ringkas</strong><p style="margin:4px 0 0;color:#64748b;font-size:12px">Sederhanakan tampilan panel untuk pengelolaan cepat.</p></div><button class="btn btn-ghost btn-sm">Aktifkan</button></div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px;background:#f8fafc;border-radius:14px"><div><strong>Pemberitahuan</strong><p style="margin:4px 0 0;color:#64748b;font-size:12px">Tampilkan ringkasan aktivitas di dashboard.</p></div><button class="btn btn-ghost btn-sm">Aktifkan</button></div>
        </section>
      </section>
    </section>
  </section>
  `;
}
function flowArrow(label){return `<section class="flow-arrow-block"><span class="flow-arrow-icon" aria-hidden="true">→</span><span>${label}</span></section>`}
function gradeBars(title,stock,total,unit,colors){return `<section><p style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px">${title}</p>${['A','B','C','D'].map(g=>{const n=stock.filter(s=>s.gr===g).reduce((a,b)=>a+b.qty,0);const pct=total>0?Math.round(n/total*100):0;return `<section style="display:flex;align-items:center;gap:9px;margin-bottom:8px"><span class="gr-badge gr-${g}">${g}</span><section style="flex:1;background:#f1f5f9;border-radius:999px;height:10px;overflow:hidden"><section style="height:100%;width:${pct}%;background:${colors[g]};border-radius:999px"></section></section><span style="font-size:11px;font-weight:700;color:#475569;min-width:56px;text-align:right">${n} ${unit}</span></section>`}).join('')}</section>`}
function activityRow(a){const badges={log:'bg-amber-100 text-amber-800',saw:'bg-green-100 text-green-800',conv:'bg-blue-100 text-blue-800',prod:'bg-purple-100 text-purple-800'};const labels={log:'Terima Log',saw:'Terima Sawtimber',conv:'Konversi',prod:'Produksi'};const mat={log:`${a.wt} · ${a.sz}`,saw:`${a.wt} · ${sizeLabel(a.sid)}`,conv:`${a.lwt} → ${a.owt||a.lwt}`,prod:variantLabel(a.vid)};const qty={log:`${a.qty} btg`,saw:`${a.qty} lbr`,conv:`${a.lqty}btg→${a.oqty}lbr`,prod:`${a.qty} unit`};const gr={log:a.gr,saw:a.gr,conv:a.lgr,prod:a.gr};return `<tr><td><span style="font-size:11px;font-weight:700;padding:4px 9px;border-radius:7px" class="${badges[a._t]}">${labels[a._t]}</span></td><td style="font-weight:600">${mat[a._t]}</td><td><span class="gr-badge gr-${gr[a._t]}">${gr[a._t]}</span></td><td style="font-weight:700">${qty[a._t]}</td><td style="color:#94a3b8">${fmtDate(a._d)}</td></tr>`}

function kpiCard(cls,label,val,unit,sub,bg,color,icon){
  return `<div class="kpi-card ${cls}" style="background:${bg}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
      <p style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.07em">${label}</p>
      <div style="width:32px;height:32px;background:${color};border-radius:9px;display:flex;align-items:center;justify-content:center;opacity:.8">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${icon}"/></svg>
      </div>
    </div>
    <div style="font-size:34px;font-weight:800;color:${color};line-height:1;margin-bottom:4px">${val}</div>
    <div style="font-size:12px;color:${color};opacity:.7;font-weight:500">${unit}</div>
    <div style="font-size:11px;color:${color};opacity:.5;margin-top:6px">${sub}</div>
  </div>`;
}

// ═══════════════════════════════════
//  PENERIMAAN
// ═══════════════════════════════════
function pgPenerimaan(){
  const t=page==='penerimaan-sawtimber'?'saw':page==='penerimaan-log'?'log':tabs.penerimaan||new URLSearchParams(location.search).get('tab')||'log';
  if(page==='penerimaan-log')return frmLog();
  if(page==='penerimaan-sawtimber')return frmSaw();
  return `
  <div style="display:flex;gap:24px;border-bottom:1px solid #e2e8f0;margin-bottom:28px">
    <button class="tab-btn ${t==='log'?'active':''}" onclick="go('penerimaan','log')">Penerimaan Log</button>
    <button class="tab-btn ${t==='saw'?'active':''}" onclick="go('penerimaan','saw')">Penerimaan Sawtimber</button>
  </div>
  ${t==='log'?frmLog():frmSaw()}`;
}

function frmLog(){
  return `
  <div style="display:grid;grid-template-columns:1fr 400px;gap:20px;align-items:start">
    <!-- Form -->
    <div class="card">
      <div class="card-header">
        <div><p style="font-size:14px;font-weight:700">Input Penerimaan Log</p><p style="font-size:12px;color:#94a3b8;margin-top:2px">Catat penerimaan raw log dari supplier</p></div>
      </div>
      <form onsubmit="submitLog(event)" style="padding:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Tanggal Terima</label><input type="date" id="ld-date" value="${today()}" class="field"></div>
          <div><label class="lbl">Jenis Kayu</label><input type="text" id="ld-wt" placeholder="cth: Jati, Meranti…" list="wt-l1" class="field"><datalist id="wt-l1">${db.woodTypes.map(w=>`<option value="${w}">`).join('')}</datalist></div>
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Wood Grade</label>
          <div style="display:flex;gap:10px">
            ${['A','B','C','D'].map(g=>`<button type="button" onclick="pickGr('log','${g}')" data-gr="${g}" class="gbtn gbtn-${g} gbr-log" style="flex:1"><div style="font-size:16px;font-weight:800">${g}</div><div style="font-size:10px;margin-top:2px">${{A:'Tinggi',B:'Sedang',C:'Rendah',D:'Ditolak'}[g]}</div></button>`).join('')}
          </div>
          <input type="hidden" id="log-gr">
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Wood Size <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#94a3b8">(diameter batang)</span></label>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
            ${['A1','A2','A3','A4','A5'].map((s,i)=>`<button type="button" onclick="pickSzLog('${s}')" data-sz="${s}" class="szbtn szbtn-log"><div style="font-size:13px;font-weight:700">${s}</div><div style="font-size:10px;color:inherit;margin-top:2px">${(i+1)*10}cm</div></button>`).join('')}
          </div>
          <input type="hidden" id="log-sz">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Jumlah Batang</label><input type="number" id="ld-qty" placeholder="0" min="1" class="field"></div>
          <div><label class="lbl">M³ <span style="font-weight:400;text-transform:none;letter-spacing:0">(opsional)</span></label><input type="number" id="ld-m3" placeholder="estimasi otomatis" step="0.001" class="field"></div>
          <div><label class="lbl">No. Surat Jalan</label><input type="text" id="ld-sj" placeholder="opsional" class="field"></div>
        </div>
        <div style="margin-bottom:20px"><label class="lbl">Catatan</label><textarea id="ld-notes" rows="2" placeholder="Catatan tambahan…" class="field"></textarea></div>
        <button type="submit" class="btn btn-amber btn-lg" style="width:100%">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Simpan Penerimaan Log
        </button>
      </form>
    </div>
    <!-- Right: recent log entries -->
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Penerimaan Log Terbaru</span></div>
      <div style="padding:0">
        ${db.logs.length===0?`<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada data</p></div>`:`
        <table class="tbl">
          <thead><tr><th>Jenis</th><th>Gr</th><th>Sz</th><th>Qty</th><th>M³</th><th>Tanggal</th></tr></thead>
          <tbody>${[...db.logs].reverse().slice(0,10).map(l=>`<tr>
            <td style="font-weight:500">${l.wt}</td>
            <td><span class="gr-badge gr-${l.gr}">${l.gr}</span></td>
            <td style="font-weight:600">${l.sz}</td>
            <td style="font-weight:700;color:#92400e">${l.qty}</td>
            <td style="color:#64748b">${(l.m3||0).toFixed(2)}</td>
            <td style="color:#94a3b8;font-size:12px">${fmtDate(l.date)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
  </div>`;
}

function frmSaw(){
  return `
  <div style="display:grid;grid-template-columns:1fr 420px;gap:20px;align-items:start">
    <div class="card">
      <div class="card-header">
        <div><p style="font-size:14px;font-weight:700">Input Penerimaan Sawtimber</p><p style="font-size:12px;color:#94a3b8;margin-top:2px">Catat penerimaan sawtimber dari supplier</p></div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="openSzModal()">+ Ukuran Baru</button>
      </div>
      <form onsubmit="submitSaw(event)" style="padding:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Tanggal Terima</label><input type="date" id="sd-date" value="${today()}" class="field field-green"></div>
          <div><label class="lbl">Jenis Kayu</label><input type="text" id="sd-wt" placeholder="cth: Jati, Meranti…" list="wt-l2" class="field field-green"><datalist id="wt-l2">${db.woodTypes.map(w=>`<option value="${w}">`).join('')}</datalist></div>
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Quality Grade</label>
          <div style="display:flex;gap:10px">
            ${['A','B','C','D'].map(g=>`<button type="button" onclick="pickGr('saw','${g}')" data-gr="${g}" class="gbtn gbtn-${g} gbr-saw" style="flex:1"><div style="font-size:16px;font-weight:800">${g}</div><div style="font-size:10px;margin-top:2px">${{A:'Tinggi',B:'Sedang',C:'Rendah',D:'Ditolak'}[g]}</div></button>`).join('')}
          </div>
          <input type="hidden" id="saw-gr">
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Ukuran Sawtimber <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#94a3b8">(pilih standar)</span></label>
          ${db.sizes.length===0?`<div style="border:2px dashed #e2e8f0;border-radius:10px;padding:16px;text-align:center;color:#94a3b8;font-size:12px">Belum ada ukuran standar. <button type="button" onclick="openSzModal()" style="color:#15803d;font-weight:600;background:none;border:none;cursor:pointer">Tambah ukuran</button></div>`:`
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${db.sizes.map(sz=>`<button type="button" onclick="pickSzSaw('${sz.id}')" data-sid="${sz.id}" class="sz-card sz-card-saw">
              <p style="font-size:12px;font-weight:700;color:#0f172a">${sz.code}</p>
              <p style="font-size:10px;color:#64748b;margin-top:3px">${sz.p}×${sz.l}×${sz.t} cm</p>
              <p style="font-size:10px;color:#15803d;font-weight:600;margin-top:2px">${+(sz.p*sz.l*sz.t/1e6).toFixed(4)} m³</p>
            </button>`).join('')}
          </div>`}
          <input type="hidden" id="saw-sz">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
          <div><label class="lbl">Jumlah (lembar)</label><input type="number" id="sd-qty" placeholder="0" min="1" oninput="autoSawM3()" class="field field-green"></div>
          <div><label class="lbl">M³ (opsional)</label><input type="number" id="sd-m3" placeholder="estimasi otomatis" step="0.0001" class="field field-green"></div>
          <div><label class="lbl">No. Surat Jalan</label><input type="text" id="sd-sj" placeholder="opsional" class="field field-green"></div>
        </div>
        <button type="submit" class="btn btn-green btn-lg" style="width:100%">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Simpan Penerimaan Sawtimber
        </button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Penerimaan Sawtimber Terbaru</span></div>
      <div style="padding:0">
        ${db.sawtimbers.length===0?`<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada data</p></div>`:`
        <table class="tbl">
          <thead><tr><th>Jenis</th><th>Gr</th><th>Ukuran</th><th>Qty</th><th>M³</th><th>Tgl</th></tr></thead>
          <tbody>${[...db.sawtimbers].reverse().slice(0,10).map(s=>`<tr>
            <td style="font-weight:500">${s.wt}</td>
            <td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td>
            <td style="font-size:12px">${sizeLabel(s.sid)}</td>
            <td style="font-weight:700;color:#15803d">${s.qty}</td>
            <td style="color:#64748b">${(s.m3||0).toFixed(4)}</td>
            <td style="color:#94a3b8;font-size:12px">${fmtDate(s.date)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
  </div>
  ${modalSzForm()}`;
}

// ═══════════════════════════════════
//  KONVERSI
// ═══════════════════════════════════
function pgKonversi(){
  const ls=logStock();
  return `
  <div style="display:grid;grid-template-columns:1fr 400px;gap:20px;align-items:start">
    <div class="card">
      <div class="card-header">
        <div><p style="font-size:14px;font-weight:700">Konversi Log → Sawtimber</p><p style="font-size:12px;color:#94a3b8;margin-top:2px">Input hasil pengolahan log menjadi sawtimber</p></div>
      </div>
      <form onsubmit="submitKonv(event)" style="padding:24px">
        <div class="sec-head" style="margin-bottom:16px">Input Log</div>
        ${ls.length===0?`<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:16px;font-size:13px;color:#92400e">Tidak ada stok log tersedia. <button type="button" onclick="go('penerimaan','log')" style="font-weight:700;text-decoration:underline;background:none;border:none;cursor:pointer;color:#78350f;font-family:Poppins">Terima log terlebih dahulu.</button></div>`:``}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Tanggal Konversi</label><input type="date" id="kv-date" value="${today()}" class="field field-blue"></div>
          <div><label class="lbl">Pilih Stok Log</label>
            <select id="kv-log" class="field field-blue" onchange="onKvLogChange()">
              <option value="">-- Pilih stok log --</option>
              ${ls.map((s,i)=>`<option value="${i}">${s.wt} · Grade ${s.gr} · ${s.sz} · ${s.qty} batang</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-bottom:20px">
          <label class="lbl">Jumlah Log Dipakai (batang)</label>
          <input type="number" id="kv-lqty" placeholder="0" min="1" class="field field-blue" style="max-width:240px">
          <div id="kv-avail" style="font-size:11px;color:#64748b;margin-top:4px"></div>
        </div>
        <div class="sec-head" style="margin:20px 0 16px">Output Sawtimber</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Jenis Kayu Output</label><input type="text" id="kv-owt" placeholder="Ikuti dari log" list="kv-wt-l" class="field field-blue"><datalist id="kv-wt-l">${db.woodTypes.map(w=>`<option value="${w}">`).join('')}</datalist></div>
          <div><label class="lbl">Quality Grade Output</label>
            <div style="display:flex;gap:8px">
              ${['A','B','C','D'].map(g=>`<button type="button" onclick="pickGr('co','${g}')" data-gr="${g}" class="gbtn gbtn-${g} gbr-co" style="flex:1;padding:6px 4px"><div style="font-size:13px;font-weight:800">${g}</div></button>`).join('')}
            </div>
            <input type="hidden" id="co-gr">
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Ukuran Sawtimber Output</label>
          ${db.sizes.length===0?`<p style="font-size:12px;color:#94a3b8">Tambah ukuran di Master Material</p>`:`
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${db.sizes.map(sz=>`<button type="button" onclick="pickSzCo('${sz.id}')" data-sid="${sz.id}" class="sz-card sz-card-co sz-card-blue">
              <p style="font-size:11px;font-weight:700">${sz.code}</p>
              <p style="font-size:10px;color:#64748b;margin-top:2px">${sz.p}×${sz.l}×${sz.t}cm</p>
            </button>`).join('')}
          </div>`}
          <input type="hidden" id="co-sz">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div><label class="lbl">Jumlah Output (lembar)</label><input type="number" id="kv-oqty" placeholder="0" min="1" class="field field-blue"></div>
          <div><label class="lbl">M³ Output (opsional)</label><input type="number" id="kv-om3" placeholder="estimasi otomatis" step="0.0001" class="field field-blue"></div>
        </div>
        <div style="margin-bottom:20px"><label class="lbl">Catatan</label><textarea id="kv-notes" rows="2" placeholder="cth: rendemen, kondisi, operator…" class="field field-blue"></textarea></div>
        <button type="submit" class="btn btn-blue btn-lg" style="width:100%">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          Simpan Konversi
        </button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Histori Konversi Terbaru</span></div>
      <div style="padding:0">
        ${db.conversions.length===0?`<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada konversi</p></div>`:`
        <table class="tbl">
          <thead><tr><th>Log In</th><th>Output</th><th>Qty</th><th>Tgl</th></tr></thead>
          <tbody>${[...db.conversions].reverse().slice(0,10).map(c=>`<tr>
            <td><p style="font-size:12px;font-weight:600">${c.lwt} ${c.lgr} ${c.lsz}</p><p style="font-size:11px;color:#94a3b8">${c.lqty} batang</p></td>
            <td><p style="font-size:12px;font-weight:600">${sizeLabel(c.osid)}</p><p style="font-size:11px;color:#94a3b8">Grade ${c.ogr}</p></td>
            <td style="font-weight:700;color:#2563eb">${c.oqty} lbr</td>
            <td style="color:#94a3b8;font-size:12px">${fmtDate(c.date)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════
//  PRODUKSI
// ═══════════════════════════════════
function pgProduksi(){
  const ss=sawStock();
  return `
  <div style="display:grid;grid-template-columns:1fr 420px;gap:20px;align-items:start">
    <div class="card">
      <div class="card-header">
        <div><p style="font-size:14px;font-weight:700">Input Produksi</p><p style="font-size:12px;color:#94a3b8;margin-top:2px">Catat hasil produksi dari sawtimber menjadi produk jadi</p></div>
      </div>
      <form onsubmit="submitProd(event)" style="padding:24px">
        <div class="sec-head" style="margin-bottom:16px">Pilih Produk</div>
        <div style="margin-bottom:16px">
          <label class="lbl">Kategori Produk</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px" id="prod-cat-grid">
            ${[...new Set(db.products.map(p=>p.cat))].map(cat=>`
            <button type="button" onclick="filterProdCat('${cat}')" data-cat="${cat}" class="prod-cat-btn btn btn-ghost btn-sm" style="justify-content:center">${cat}</button>`).join('')}
            <button type="button" onclick="filterProdCat('')" data-cat="" class="prod-cat-btn btn btn-ghost btn-sm" style="justify-content:center">Semua</button>
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Produk &amp; Varian</label>
          <select id="prod-vid" class="field" onchange="onVarChange()">
            <option value="">-- Pilih varian produk --</option>
            ${db.variants.map(v=>{const p=db.products.find(x=>x.id===v.pid);return `<option value="${v.id}">[${p?p.cat:''}] ${v.name} (${v.code})</option>`}).join('')}
          </select>
          <div id="var-info" style="display:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-top:8px;font-size:12px;color:#1e40af">
            <span id="var-info-text"></span>
          </div>
        </div>
        <div class="sec-head" style="margin:20px 0 16px">Detail Produksi</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Tanggal Produksi</label><input type="date" id="pd-date" value="${today()}" class="field"></div>
          <div><label class="lbl">Jumlah Diproduksi (unit)</label><input type="number" id="pd-qty" placeholder="0" min="1" oninput="onPdQtyChange()" class="field"></div>
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Grade Produk Output</label>
          <div style="display:flex;gap:10px">
            ${['A','B','C','D'].map(g=>`<button type="button" onclick="pickGr('pd','${g}')" data-gr="${g}" class="gbtn gbtn-${g} gbr-pd" style="flex:1"><div style="font-size:16px;font-weight:800">${g}</div><div style="font-size:10px;margin-top:2px">${{A:'Sempurna',B:'Baik',C:'Cukup',D:'Ditolak'}[g]}</div></button>`).join('')}
          </div>
          <input type="hidden" id="pd-gr">
        </div>
        <div class="sec-head" style="margin:20px 0 16px">Sawtimber Digunakan</div>
        ${ss.length===0?`<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;color:#92400e">Stok sawtimber kosong. Lakukan konversi log terlebih dahulu.</div>`:`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><label class="lbl">Pilih Stok Sawtimber</label>
            <select id="pd-saw-src" class="field" onchange="onSawSrcChange()">
              <option value="">-- Pilih sawtimber --</option>
              ${ss.map((s,i)=>`<option value="${i}">${s.wt} · Grade ${s.gr} · ${sizeLabel(s.sid)} · ${s.qty} lbr</option>`).join('')}
            </select>
          </div>
          <div><label class="lbl">Sawtimber Dipakai (lembar)</label><input type="number" id="pd-saw-qty" placeholder="estimasi otomatis" step="1" class="field"></div>
        </div>`}
        <div id="pd-saw-est" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#14532d"></div>
        <div style="margin-bottom:20px"><label class="lbl">Catatan</label><textarea id="pd-notes" rows="2" placeholder="cth: operator, mesin, batch…" class="field"></textarea></div>
        <button type="submit" class="btn btn-lg" style="width:100%;background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Simpan Data Produksi
        </button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Produksi Terbaru</span></div>
      <div style="padding:0">
        ${db.productions.length===0?`<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada data produksi</p></div>`:`
        <table class="tbl">
          <thead><tr><th>Produk</th><th>Grade</th><th>Qty</th><th>Sawtimber</th><th>Tgl</th></tr></thead>
          <tbody>${[...db.productions].reverse().slice(0,10).map(p=>`<tr>
            <td><p style="font-size:12px;font-weight:600;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${variantLabel(p.vid)}</p><p style="font-size:10px;color:#94a3b8">${p.code||''}</p></td>
            <td><span class="gr-badge gr-${p.gr}">${p.gr}</span></td>
            <td style="font-weight:700;color:#7c3aed">${p.qty} unit</td>
            <td style="font-size:11px;color:#64748b">${p.sawQtyUsed||0} lbr</td>
            <td style="color:#94a3b8;font-size:12px">${fmtDate(p.date)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
  </div>`;
}

function pgPenjualan(){
  const stock=prodStock();
  const totalStock=stock.reduce((a,b)=>a+b.qty,0);
  const variants=db.variants;
  const baseMsg=stock.length===0?'<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada produk jadi untuk dijual</p></div>':'<table class="tbl"><thead><tr><th>Produk & Varian</th><th>Grade</th><th>Qty</th></tr></thead><tbody>'+stock.map(s=>`<tr><td style="font-weight:600;color:#0f172a">${variantLabel(s.vid)}</td><td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td><td style="text-align:right;font-weight:700;color:#1e3a8a">${s.qty} unit</td></tr>`).join('')+'</tbody></table>';
  return `
  <div style="display:grid;gap:20px">
    <section class="card">
      <div class="card-header"><div><p style="font-size:14px;font-weight:700">Penjualan Produk Jadi</p><p style="font-size:12px;color:#64748b;margin-top:4px">Catat penjualan unit tanpa mengubah stok log atau sawtimber secara langsung.</p></div></div>
      <div class="card-body" style="padding:24px;display:grid;gap:20px">
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">
          <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:18px;padding:18px">
            <p style="font-size:11px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Varian siap jual</p>
            <p style="font-size:24px;font-weight:800;margin:0">${stock.length}</p>
            <p style="margin:6px 0 0;color:#475569;font-size:13px">kombinasi produk/grade</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;padding:18px">
            <p style="font-size:11px;font-weight:700;color:#14532d;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Total stok</p>
            <p style="font-size:24px;font-weight:800;margin:0">${totalStock}</p>
            <p style="margin:6px 0 0;color:#475569;font-size:13px">unit produk jadi</p>
          </div>
          <div style="background:#fff7ed;border:1px solid #fee2b3;border-radius:18px;padding:18px">
            <p style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Catatan</p>
            <p style="margin:0;color:#7c2d12;font-size:13px;line-height:1.6">Penjualan hanya mengurangi stok produk jadi. Pastikan barang tersedia sebelum konfirmasi.</p>
          </div>
        </div>
        <form onsubmit="submitSale(event)" style="display:grid;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div><label class="lbl">Produk &amp; Varian</label><select id="sale-vid" class="field" onchange="onSaleVariantChange()"><option value="">-- Pilih varian produk --</option>${variants.map(v=>{const p=db.products.find(x=>x.id===v.pid);return `<option value="${v.id}">[${p?p.cat:''}] ${v.name} (${v.code})</option>`}).join('')}</select></div>
            <div><label class="lbl">Grade penjualan</label><div style="display:flex;gap:10px">${['A','B','C','D'].map(g=>`<button type="button" onclick="pickGr('sl','${g}')" data-gr="${g}" class="gbtn gbtn-${g} gbr-sl" style="flex:1"><div style="font-size:16px;font-weight:800">${g}</div></button>`).join('')}</div><input type="hidden" id="sl-gr"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div><label class="lbl">Jumlah terjual (unit)</label><input type="number" id="sale-qty" min="1" placeholder="0" class="field"></div>
            <div><label class="lbl">Tanggal Penjualan</label><input type="date" id="sale-date" value="${today()}" class="field"></div>
          </div>
          <div><label class="lbl">Pembeli / Pelanggan</label><input type="text" id="sale-customer" placeholder="cth: Toko Beringin" class="field"></div>
          <div><label class="lbl">Catatan penjualan</label><textarea id="sale-notes" rows="3" placeholder="cth: pengiriman, kondisi barang" class="field"></textarea></div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;font-size:13px;color:#475569" id="sale-variant-info">Pilih varian untuk melihat detail stok dan informasi.</div>
          <button type="submit" class="btn btn-blue btn-lg" style="width:100%">Simpan Penjualan</button>
        </form>
      </div>
    </section>
    <section class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:800">Stok Produk Siap Jual</span></div>
      <div class="card-body" style="padding:0">${baseMsg}</div>
    </section>
    <section class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:800">Histori Penjualan</span></div>
      <div class="card-body" style="padding:0">${db.sales.length===0?`<div class="empty" style="padding:40px 20px"><p style="font-size:13px">Belum ada penjualan</p></div>`:`<table class="tbl"><thead><tr><th>Pelanggan</th><th>Produk</th><th>Grade</th><th>Qty</th><th>Tgl</th></tr></thead><tbody>${[...db.sales].reverse().slice(0,10).map(s=>`<tr><td style="font-weight:600;color:#0f172a">${s.customer||'Umum'}</td><td>${variantLabel(s.vid)}</td><td><span class="gr-badge gr-${s.gr}">${s.gr}</span></td><td style="text-align:right;font-weight:700;color:#92400e">${s.qty}</td><td style="color:#94a3b8;font-size:12px">${fmtDate(s.date)}</td></tr>`).join('')}</tbody></table>`}</div>
    </section>
  </div>`;
}

function onSaleVariantChange(){
  const vid=document.getElementById('sale-vid')?.value;
  const info=document.getElementById('sale-variant-info');
  if(!vid){info.textContent='Pilih varian untuk melihat detail stok dan informasi.';return}
  const v=db.variants.find(x=>x.id===vid);
  if(!v){info.textContent='Varian tidak ditemukan.';return}
  const p=db.products.find(x=>x.id===v.pid);
  const total=prodStock().filter(x=>x.vid===vid).reduce((a,b)=>a+b.qty,0);
  info.textContent=`${p?p.name:''} · ${v.code} · Finish ${v.finish} · tersedia ${total} unit`;
}

function submitSale(e){
  e.preventDefault();
  const vid=document.getElementById('sale-vid')?.value;
  const gr=document.getElementById('sl-gr')?.value;
  const qty=parseInt(document.getElementById('sale-qty')?.value||0,10);
  const date=document.getElementById('sale-date')?.value||today();
  const customer=document.getElementById('sale-customer')?.value.trim();
  const notes=document.getElementById('sale-notes')?.value.trim();
  if(!vid||!gr||qty<=0){alert('Lengkapi produk, grade, dan jumlah penjualan.');return}
  const available=prodStock().filter(x=>x.vid===vid&&x.gr===gr).reduce((a,b)=>a+b.qty,0);
  if(qty>available){alert(`Stok tidak cukup. Tersedia ${available} unit untuk varian ini grade ${gr}.`);return}
  let remaining=qty;
  db.productions.filter(p=>p.vid===vid&&p.gr===gr&&p.qty>0).sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(p=>{if(remaining<=0) return; const cut=Math.min(remaining,p.qty); p.qty-=cut; remaining-=cut;});
  db.sales.push({id:uid(),date,vid,gr,qty,customer,notes});
  saveDb();
  toast(`Penjualan ${qty} unit ${variantLabel(vid)} grade ${gr} tersimpan`,'ok');
  render();
}

// ═══════════════════════════════════
//  STOK
// ═══════════════════════════════════
function pgStok(){
  const t=tabs.stok||new URLSearchParams(location.search).get('tab')||'log';
  return `
  <div style="display:flex;gap:24px;border-bottom:1px solid #e2e8f0;margin-bottom:28px">
    <button class="tab-btn ${t==='log'?'active':''}" onclick="go('stok','log')">Stok Log</button>
    <button class="tab-btn ${t==='saw'?'active':''}" onclick="go('stok','saw')">Stok Sawtimber</button>
    <button class="tab-btn ${t==='produk'?'active':''}" onclick="go('stok','produk')">Stok Produk Jadi</button>
  </div>
  ${t==='log'?stokLog():t==='saw'?stokSaw():stokProduk()}`;
}

function stokLog(){
  const ls=logStock();
  const totalQty=ls.reduce((a,b)=>a+b.qty,0), totalM3=ls.reduce((a,b)=>a+b.m3,0).toFixed(2);
  if(!ls.length) return `<div class="empty"><p>Stok log kosong</p><button class="btn btn-amber" style="margin-top:16px" onclick="go('penerimaan','log')">+ Terima Log</button></div>`;
  const grouped={};
  ls.forEach(s=>{if(!grouped[s.wt])grouped[s.wt]=[];grouped[s.wt].push(s)});
  return `
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${['A','B','C','D'].map(g=>{const n=ls.filter(s=>s.gr===g).reduce((a,b)=>a+b.qty,0);const m=ls.filter(s=>s.gr===g).reduce((a,b)=>a+b.m3,0).toFixed(2);return `<div class="kpi-card" style="flex:1;padding:14px;background:${g==='A'?'#f0fdf4':g==='B'?'#eff6ff':g==='C'?'#fefce8':'#fef2f2'}"><p style="font-size:10px;font-weight:700;margin-bottom:6px"><span class="gr-badge gr-${g}">${g}</span></p><p style="font-size:22px;font-weight:800">${n}</p><p style="font-size:11px;color:#64748b">batang · ${m} m³</p></div>`;}).join('')}
    <div class="kpi-card" style="flex:1;padding:14px;background:#f8fafc"><p style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Total</p><p style="font-size:22px;font-weight:800">${totalQty}</p><p style="font-size:11px;color:#64748b">batang · ${totalM3} m³</p></div>
  </div>
  ${Object.entries(grouped).map(([wt,items])=>`
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:8px;height:8px;border-radius:50%;background:#d97706"></div>
        <span style="font-size:13px;font-weight:700">${wt}</span>
        <span style="font-size:11px;color:#94a3b8">${items.reduce((a,b)=>a+b.qty,0)} batang total</span>
      </div>
    </div>
    <table class="tbl">
      <thead><tr><th style="width:120px">Jenis Kayu</th><th>Grade</th><th>Wood Size</th><th>Qty (batang)</th><th>Volume (m³)</th><th>M³/btg est.</th></tr></thead>
      <tbody>${items.map(it=>`<tr>
        <td style="font-weight:600;color:#0f172a">${it.wt}</td>
        <td><span class="gr-badge gr-${it.gr}">${it.gr}</span></td>
        <td style="font-weight:700;font-size:14px">${it.sz}</td>
        <td style="font-weight:800;font-size:16px;color:#92400e">${it.qty}</td>
        <td style="font-weight:600;color:#64748b">${it.m3.toFixed(3)}</td>
        <td style="color:#94a3b8;font-size:12px">${it.qty>0?(it.m3/it.qty).toFixed(3):'-'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`).join('')}`;
}

function stokSaw(){
  const ss=sawStock();
  const totalQty=ss.reduce((a,b)=>a+b.qty,0),totalM3=ss.reduce((a,b)=>a+b.m3,0).toFixed(4);
  if(!ss.length) return `<div class="empty"><p>Stok sawtimber kosong</p><button class="btn btn-green" style="margin-top:16px" onclick="go('penerimaan','saw')">+ Terima Sawtimber</button></div>`;
  const grouped={};
  ss.forEach(s=>{if(!grouped[s.wt])grouped[s.wt]=[];grouped[s.wt].push(s)});
  return `
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${['A','B','C','D'].map(g=>{const n=ss.filter(s=>s.gr===g).reduce((a,b)=>a+b.qty,0);return `<div class="kpi-card" style="flex:1;padding:14px;background:${g==='A'?'#f0fdf4':g==='B'?'#eff6ff':g==='C'?'#fefce8':'#fef2f2'}"><p style="font-size:10px;font-weight:700;margin-bottom:6px"><span class="gr-badge gr-${g}">${g}</span></p><p style="font-size:22px;font-weight:800">${n}</p><p style="font-size:11px;color:#64748b">lembar</p></div>`;}).join('')}
    <div class="kpi-card" style="flex:1;padding:14px;background:#f8fafc"><p style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Total</p><p style="font-size:22px;font-weight:800">${totalQty}</p><p style="font-size:11px;color:#64748b">lembar · ${totalM3} m³</p></div>
  </div>
  ${Object.entries(grouped).map(([wt,items])=>`
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:8px;height:8px;border-radius:50%;background:#15803d"></div>
        <span style="font-size:13px;font-weight:700">${wt}</span>
        <span style="font-size:11px;color:#94a3b8">${items.reduce((a,b)=>a+b.qty,0)} lembar total</span>
      </div>
    </div>
    <table class="tbl">
      <thead><tr><th style="width:120px">Jenis Kayu</th><th>Grade</th><th>Ukuran Standar</th><th>Dimensi</th><th>Qty (lembar)</th><th>Volume (m³)</th></tr></thead>
      <tbody>${items.map(it=>{const sz=db.sizes.find(x=>x.id===it.sid);return `<tr>
        <td style="font-weight:600;color:#0f172a">${it.wt}</td>
        <td><span class="gr-badge gr-${it.gr}">${it.gr}</span></td>
        <td style="font-weight:700">${sizeLabel(it.sid)}</td>
        <td style="font-size:12px;color:#64748b">${sz?`${sz.p}×${sz.l}×${sz.t} cm`:'-'}</td>
        <td style="font-weight:800;font-size:16px;color:#15803d">${it.qty}</td>
        <td style="font-weight:600;color:#64748b">${it.m3.toFixed(4)}</td>
      </tr>`}).join('')}</tbody>
    </table>
  </div>`).join('')}`;
}

function stokProduk(){
  const ps=prodStock();
  if(!ps.length) return `<div class="empty"><p>Stok produk jadi kosong</p><button class="btn btn-blue" style="margin-top:16px" onclick="go('produksi')">+ Input Produksi</button></div>`;
  const grouped={};
  ps.forEach(s=>{
    const v=db.variants.find(x=>x.id===s.vid);
    const p=v?db.products.find(x=>x.id===v.pid):null;
    const cat=p?p.cat:'Lainnya';
    if(!grouped[cat])grouped[cat]=[];grouped[cat].push({...s,v,p});
  });
  const totalUnit=ps.reduce((a,b)=>a+b.qty,0);
  return `
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${['A','B','C','D'].map(g=>{const n=ps.filter(s=>s.gr===g).reduce((a,b)=>a+b.qty,0);return `<div class="kpi-card" style="flex:1;padding:14px;background:${g==='A'?'#f0fdf4':g==='B'?'#eff6ff':g==='C'?'#fefce8':'#fef2f2'}"><p style="font-size:10px;font-weight:700;margin-bottom:6px"><span class="gr-badge gr-${g}">${g}</span></p><p style="font-size:22px;font-weight:800">${n}</p><p style="font-size:11px;color:#64748b">unit</p></div>`;}).join('')}
    <div class="kpi-card" style="flex:1;padding:14px;background:#eff6ff"><p style="font-size:10px;font-weight:700;color:#1e3a8a;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Total</p><p style="font-size:22px;font-weight:800;color:#1e3a8a">${totalUnit}</p><p style="font-size:11px;color:#64748b">unit siap jual</p></div>
  </div>
  ${Object.entries(grouped).map(([cat,items])=>`
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:8px;height:8px;border-radius:50%;background:#2563eb"></div>
        <span style="font-size:13px;font-weight:700">${cat}</span>
        <span style="font-size:11px;color:#94a3b8">${items.reduce((a,b)=>a+b.qty,0)} unit total</span>
      </div>
    </div>
    <table class="tbl">
      <thead><tr><th>Produk</th><th>Kode Varian</th><th>Grade</th><th>Dimensi</th><th>Finish</th><th>Stok (unit)</th></tr></thead>
      <tbody>${items.map(it=>`<tr>
        <td style="font-weight:600">${it.p?it.p.name:'-'}</td>
        <td><code style="background:#f1f5f9;padding:2px 7px;border-radius:5px;font-size:11px">${it.v?it.v.code:'-'}</code></td>
        <td><span class="gr-badge gr-${it.gr}">${it.gr}</span></td>
        <td style="font-size:12px;color:#64748b">${it.v?`${it.v.p}×${it.v.l}×${it.v.t} cm`:'-'}</td>
        <td style="font-size:12px;color:#64748b">${it.v?it.v.finish:'-'}</td>
        <td style="font-weight:800;font-size:18px;color:#1e3a8a">${it.qty}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`).join('')}`;
}

// ═══════════════════════════════════
//  MASTER PRODUK
// ═══════════════════════════════════
let selProd=null;
function pgMasterProduk(){
  const t=tabs['master-produk']||new URLSearchParams(location.search).get('tab')||'produk';
  return `
  <div style="display:flex;gap:24px;border-bottom:1px solid #e2e8f0;margin-bottom:28px">
    <button class="tab-btn ${t==='produk'?'active':''}" onclick="go('master-produk','produk')">Produk</button>
    <button class="tab-btn ${t==='varian'?'active':''}" onclick="go('master-produk','varian')">Varian</button>
  </div>
  ${t==='produk'?masterProdukList():masterVarianList()}`;
}

function masterProdukList(){
  return `
  <div style="display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start">
    <div>
      <button class="btn btn-blue" style="width:100%;justify-content:center;margin-bottom:14px" onclick="openProdModal()">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Tambah Produk
      </button>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${db.products.length===0?`<div class="empty" style="padding:30px"><p style="font-size:13px">Belum ada produk</p></div>`:`
        ${db.products.map(p=>`
        <div class="prod-card ${selProd===p.id?'sel':''}" onclick="selProd='${p.id}';render()">
          <div style="display:flex;align-items:start;justify-content:space-between">
            <div>
              <p style="font-size:13px;font-weight:700">${p.name}</p>
              <p style="font-size:11px;color:#94a3b8;margin-top:2px">${p.cat}</p>
            </div>
            <div style="display:flex;gap:4px">
              <span style="font-size:10px;background:#f1f5f9;color:#475569;padding:2px 7px;border-radius:5px;font-weight:600">${db.variants.filter(v=>v.pid===p.id).length} varian</span>
              <button onclick="event.stopPropagation();delProd('${p.id}')" class="btn btn-danger btn-sm" style="padding:3px 8px">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16"/></svg>
              </button>
            </div>
          </div>
          <p style="font-size:11px;color:#64748b;margin-top:8px">${p.desc||''}</p>
        </div>`).join('')}`}
      </div>
    </div>
    <div class="card">
      ${!selProd?`<div class="empty" style="padding:60px"><p style="font-size:13px">Pilih produk untuk melihat detail</p></div>`:`
      ${(()=>{const p=db.products.find(x=>x.id===selProd);const vars=db.variants.filter(v=>v.pid===selProd);return `
      <div class="card-header">
        <div><p style="font-size:14px;font-weight:700">${p.name}</p><p style="font-size:12px;color:#94a3b8">${p.cat} · ${vars.length} varian</p></div>
        <button class="btn btn-blue btn-sm" onclick="openVarModal('${p.id}')">+ Tambah Varian</button>
      </div>
      <div style="padding:0">
        ${vars.length===0?`<div class="empty" style="padding:40px"><p>Belum ada varian</p><button class="btn btn-blue btn-sm" style="margin-top:12px" onclick="openVarModal('${p.id}')">Tambah Varian</button></div>`:`
        <table class="tbl">
          <thead><tr><th>Kode</th><th>Nama Varian</th><th>Dimensi (cm)</th><th>Tebal (cm)</th><th>Finish</th><th>M³ Est.</th><th></th></tr></thead>
          <tbody>${vars.map(v=>`<tr>
            <td><code style="background:#f1f5f9;padding:2px 7px;border-radius:5px;font-size:11px">${v.code}</code></td>
            <td style="font-weight:600">${v.name}</td>
            <td>${v.p} × ${v.l}</td>
            <td>${v.t}</td>
            <td><span style="font-size:11px;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:5px;font-weight:600">${v.finish}</span></td>
            <td style="font-weight:600;color:#2563eb">${v.m3Est}</td>
            <td><button onclick="delVar('${v.id}')" class="btn btn-danger btn-sm" style="padding:4px 8px">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16"/></svg>
            </button></td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>`;})()}`}
    </div>
  </div>
  ${modalProdForm()}
  ${modalVarForm()}`;
}

function masterVarianList(){
  return `
  <div class="card">
    <div class="card-header">
      <span style="font-size:13px;font-weight:600">Semua Varian Produk (${db.variants.length})</span>
      <button class="btn btn-blue btn-sm" onclick="go('master-produk','produk')">Kelola Produk</button>
    </div>
    <div style="padding:0">
      ${db.variants.length===0?`<div class="empty" style="padding:60px"><p>Belum ada varian</p></div>`:`
      <table class="tbl">
        <thead><tr><th>Produk</th><th>Kode</th><th>Nama Varian</th><th>P×L (cm)</th><th>Tebal</th><th>Finish</th><th>M³ Est./unit</th></tr></thead>
        <tbody>${db.variants.map(v=>{const p=db.products.find(x=>x.id===v.pid);return `<tr>
          <td style="font-size:12px;color:#64748b">${p?p.name:'-'}</td>
          <td><code style="background:#f1f5f9;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:600">${v.code}</code></td>
          <td style="font-weight:600">${v.name}</td>
          <td>${v.p} × ${v.l}</td>
          <td>${v.t} cm</td>
          <td><span style="font-size:11px;background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:6px;font-weight:600">${v.finish}</span></td>
          <td style="font-weight:700;color:#2563eb">${v.m3Est} m³</td>
        </tr>`}).join('')}</tbody>
      </table>`}
    </div>
  </div>`;
}

// ═══════════════════════════════════
//  MASTER MATERIAL
// ═══════════════════════════════════
function pgMasterMaterial(){
  const t=tabs['master-material']||new URLSearchParams(location.search).get('tab')||'ukuran';
  return `
  <div style="display:flex;gap:24px;border-bottom:1px solid #e2e8f0;margin-bottom:28px">
    <button class="tab-btn ${t==='ukuran'?'active':''}" onclick="go('master-material','ukuran')">Ukuran Standar Sawtimber</button>
    <button class="tab-btn ${t==='jenis'?'active':''}" onclick="go('master-material','jenis')">Jenis Kayu</button>
  </div>
  ${t==='ukuran'?masterUkuran():masterJenis()}`;
}

function masterUkuran(){
  return `
  <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">
    <div class="card">
      <div class="card-header">
        <span style="font-size:13px;font-weight:600">Ukuran Standar Sawtimber (${db.sizes.length})</span>
      </div>
      <div style="padding:0">
        ${db.sizes.length===0?`<div class="empty" style="padding:60px"><p>Belum ada ukuran standar</p></div>`:`
        <table class="tbl">
          <thead><tr><th>Kode Ukuran</th><th>Panjang (cm)</th><th>Lebar (cm)</th><th>Tebal (cm)</th><th>Volume/pcs</th><th>Aksi</th></tr></thead>
          <tbody>${db.sizes.map(sz=>`<tr>
            <td><strong>${sz.code}</strong></td>
            <td>${sz.p}</td><td>${sz.l}</td><td>${sz.t}</td>
            <td style="font-weight:700;color:#15803d">${+(sz.p*sz.l*sz.t/1e6).toFixed(6)} m³</td>
            <td><button onclick="delSz('${sz.id}')" class="btn btn-danger btn-sm" style="padding:4px 8px">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16"/></svg>
            </button></td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Tambah Ukuran Standar</span></div>
      <div class="card-body">
        <div style="margin-bottom:14px"><label class="lbl">Kode/Nama Ukuran</label><input type="text" id="nsz-code" placeholder="cth: 5×10×200" class="field field-green"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
          <div><label class="lbl">Panjang (cm)</label><input type="number" id="nsz-p" placeholder="200" oninput="prevSzM3()" class="field field-green"></div>
          <div><label class="lbl">Lebar (cm)</label><input type="number" id="nsz-l" placeholder="10" oninput="prevSzM3()" class="field field-green"></div>
          <div><label class="lbl">Tebal (cm)</label><input type="number" id="nsz-t" placeholder="5" oninput="prevSzM3()" class="field field-green"></div>
        </div>
        <div id="nsz-prev" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#14532d;font-weight:600"></div>
        <button onclick="saveSzInline()" class="btn btn-green" style="width:100%;justify-content:center">Simpan Ukuran</button>
      </div>
    </div>
  </div>`;
}

function masterJenis(){
  return `
  <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Daftar Jenis Kayu (${db.woodTypes.length})</span></div>
      <div style="padding:0">
        <table class="tbl">
          <thead><tr><th>Nama Jenis Kayu</th><th>Digunakan</th><th>Aksi</th></tr></thead>
          <tbody>${db.woodTypes.map((w,i)=>{const cnt=db.logs.filter(l=>l.wt===w).length+db.sawtimbers.filter(s=>s.wt===w).length;return `<tr>
            <td style="font-weight:600">${w}</td>
            <td><span style="font-size:11px;background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:5px">${cnt} entri</span></td>
            <td><button onclick="delWt(${i})" class="btn btn-danger btn-sm" style="padding:4px 8px" ${cnt>0?'disabled title="Sedang digunakan"':''}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button></td>
          </tr>`}).join('')}</tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span style="font-size:13px;font-weight:600">Tambah Jenis Kayu</span></div>
      <div class="card-body">
        <label class="lbl">Nama Jenis Kayu</label>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <input type="text" id="new-wt" placeholder="cth: Ulin, Bangkirai…" class="field" style="flex:1">
          <button onclick="addWt()" class="btn btn-amber">Tambah</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════
//  RIWAYAT
// ═══════════════════════════════════
function pgRiwayat(){
  const all=[
    ...db.logs.map(x=>({...x,_t:'log',_d:x.date})),
    ...db.sawtimbers.map(x=>({...x,_t:'saw',_d:x.date})),
    ...db.conversions.map(x=>({...x,_t:'conv',_d:x.date})),
    ...db.productions.map(x=>({...x,_t:'prod',_d:x.date})),
  ].sort((a,b)=>new Date(b._d)-new Date(a._d));
  const chips={log:'bg-amber-100 text-amber-800',saw:'bg-green-100 text-green-800',conv:'bg-blue-100 text-blue-800',prod:'bg-purple-100 text-purple-800'};
  const labels={log:'Terima Log',saw:'Terima Sawtimber',conv:'Konversi Log',prod:'Produksi'};
  return `
  <div class="card">
    <div class="card-header">
      <span style="font-size:13px;font-weight:600">Semua Transaksi (${all.length})</span>
      <div style="display:flex;gap:8px">
        ${['','log','saw','conv','prod'].map(t=>`<button onclick="filterRiwayat('${t}')" class="btn btn-ghost btn-sm" id="rw-${t||'all'}">${t?labels[t]:'Semua'}</button>`).join('')}
      </div>
    </div>
    <div style="padding:0">
      ${all.length===0?`<div class="empty" style="padding:60px"><p>Belum ada transaksi</p></div>`:`
      <table class="tbl" id="riwayat-tbl">
        <thead><tr><th>Tipe</th><th>Material / Produk</th><th>Grade</th><th>Qty</th><th>Volume</th><th>Tanggal</th><th>Catatan</th></tr></thead>
        <tbody>${all.map(a=>{
          const mat={log:`${a.wt} · ${a.sz}`,saw:`${a.wt} · ${sizeLabel(a.sid)}`,conv:`${a.lwt} Grade ${a.lgr} ${a.lsz}`,prod:variantLabel(a.vid)};
          const qty={log:`${a.qty} batang`,saw:`${a.qty} lembar`,conv:`${a.lqty} btg → ${a.oqty} lbr`,prod:`${a.qty} unit`};
          const vol={log:`${(a.m3||0).toFixed(3)} m³`,saw:`${(a.m3||0).toFixed(4)} m³`,conv:`${a.oqty} lbr output`,prod:'-'};
          const gr={log:a.gr,saw:a.gr,conv:a.lgr,prod:a.gr};
          return `<tr data-type="${a._t}">
            <td><span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px" class="${chips[a._t]}">${labels[a._t]}</span></td>
            <td style="font-weight:500;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mat[a._t]}</td>
            <td><span class="gr-badge gr-${gr[a._t]}">${gr[a._t]}</span></td>
            <td style="font-weight:600">${qty[a._t]}</td>
            <td style="color:#64748b;font-size:12px">${vol[a._t]}</td>
            <td style="color:#94a3b8;font-size:12px">${fmtDate(a._d)}</td>
            <td style="color:#94a3b8;font-size:11px;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.notes||a.sjNum||'-'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    </div>
  </div>`;
}
function filterRiwayat(type){
  document.querySelectorAll('[id^="rw-"]').forEach(b=>b.classList.remove('btn-amber'));
  document.getElementById(`rw-${type||'all'}`).classList.add('btn-amber');
  document.querySelectorAll('#riwayat-tbl tbody tr').forEach(r=>{
    r.style.display=(!type||r.dataset.type===type)?'':'none';
  });
}

// ═══════════════════════════════════
//  MODALS
// ═══════════════════════════════════
function modalSzForm(){
  return `<div id="modal-sz" class="modal-bg hidden">
    <div class="modal-box">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700">Tambah Ukuran Standar</h3>
        <button onclick="document.getElementById('modal-sz').classList.add('hidden')" class="btn btn-ghost btn-sm">Tutup</button>
      </div>
      <div style="margin-bottom:14px"><label class="lbl">Kode/Nama Ukuran</label><input type="text" id="msz-code" placeholder="cth: 5×10×200" class="field"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
        <div><label class="lbl">Panjang (cm)</label><input type="number" id="msz-p" placeholder="200" oninput="prevMszM3()" class="field"></div>
        <div><label class="lbl">Lebar (cm)</label><input type="number" id="msz-l" placeholder="10" oninput="prevMszM3()" class="field"></div>
        <div><label class="lbl">Tebal (cm)</label><input type="number" id="msz-t" placeholder="5" oninput="prevMszM3()" class="field"></div>
      </div>
      <div id="msz-prev" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#14532d;font-weight:600"></div>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('modal-sz').classList.add('hidden')" class="btn btn-ghost" style="flex:1;justify-content:center">Batal</button>
        <button onclick="saveSzModal()" class="btn btn-green" style="flex:1;justify-content:center">Simpan</button>
      </div>
    </div>
  </div>`;
}

function modalProdForm(){
  return `<div id="modal-prod" class="modal-bg hidden">
    <div class="modal-box" style="max-width:460px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700">Tambah Produk Baru</h3>
        <button onclick="document.getElementById('modal-prod').classList.add('hidden')" class="btn btn-ghost btn-sm">Tutup</button>
      </div>
      <div style="margin-bottom:14px"><label class="lbl">Nama Produk</label><input type="text" id="mp-name" placeholder="cth: Pintu Panel" class="field field-blue"></div>
      <div style="margin-bottom:14px"><label class="lbl">Kategori</label>
        <select id="mp-cat" class="field field-blue">
          <option value="Pintu">Pintu</option>
          <option value="Jendela">Jendela</option>
          <option value="Kusen">Kusen</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>
      <div style="margin-bottom:20px"><label class="lbl">Deskripsi</label><textarea id="mp-desc" rows="2" placeholder="Deskripsi singkat produk…" class="field field-blue"></textarea></div>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('modal-prod').classList.add('hidden')" class="btn btn-ghost" style="flex:1;justify-content:center">Batal</button>
        <button onclick="saveProd()" class="btn btn-blue" style="flex:1;justify-content:center">Simpan Produk</button>
      </div>
    </div>
  </div>`;
}

function modalVarForm(){
  return `<div id="modal-var" class="modal-bg hidden">
    <div class="modal-box" style="max-width:560px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700">Tambah Varian Produk</h3>
        <button onclick="document.getElementById('modal-var').classList.add('hidden')" class="btn btn-ghost btn-sm">Tutup</button>
      </div>
      <input type="hidden" id="mv-pid">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label class="lbl">Kode Varian</label><input type="text" id="mv-code" placeholder="cth: PP-210-90" class="field field-blue"></div>
        <div><label class="lbl">Nama Varian</label><input type="text" id="mv-name" placeholder="cth: Pintu Panel 210×90" class="field field-blue"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
        <div><label class="lbl">Panjang (cm)</label><input type="number" id="mv-p" placeholder="210" oninput="prevVarM3()" class="field field-blue"></div>
        <div><label class="lbl">Lebar (cm)</label><input type="number" id="mv-l" placeholder="90" oninput="prevVarM3()" class="field field-blue"></div>
        <div><label class="lbl">Tebal (cm)</label><input type="number" id="mv-t" placeholder="4" oninput="prevVarM3()" class="field field-blue"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label class="lbl">Tipe Finish</label>
          <select id="mv-finish" class="field field-blue">
            <option>Raw</option><option>Cat Dasar</option><option>Cat Akhir</option><option>Veneer</option><option>HPL</option>
          </select>
        </div>
        <div><label class="lbl">Est. Sawtimber/unit (m³)</label><input type="number" id="mv-m3" placeholder="0.082" step="0.001" class="field field-blue"></div>
      </div>
      <div id="mv-prev" style="display:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#1e40af;font-weight:600"></div>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('modal-var').classList.add('hidden')" class="btn btn-ghost" style="flex:1;justify-content:center">Batal</button>
        <button onclick="saveVar()" class="btn btn-blue" style="flex:1;justify-content:center">Simpan Varian</button>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════
//  INTERACTION HELPERS
// ═══════════════════════════════════
function pickGr(pfx,g){
  grSel[pfx]=g;
  applyGrVis(pfx,g);
  const inp=document.getElementById(`${pfx}-gr`);
  if(inp)inp.value=g;
}
function applyGrVis(pfx,g){
  document.querySelectorAll(`.gbr-${pfx}`).forEach(b=>b.classList.toggle('sel',b.dataset.gr===g));
}
function pickSzLog(sz){
  szSel.log=sz;
  document.querySelectorAll('.szbtn-log').forEach(b=>b.classList.toggle('sel',b.dataset.sz===sz));
  document.getElementById('log-sz').value=sz;
}
function pickSzSaw(sid){
  szSel.saw=sid;
  document.querySelectorAll('.sz-card-saw').forEach(b=>b.classList.toggle('sel',b.dataset.sid===sid));
  document.getElementById('saw-sz').value=sid;
  autoSawM3();
}
function pickSzCo(sid){
  szSel.co=sid;
  document.querySelectorAll('.sz-card-co').forEach(b=>b.classList.toggle('sel',b.dataset.sid===sid));
  document.getElementById('co-sz').value=sid;
}
function autoSawM3(){
  const sid=document.getElementById('saw-sz')?.value;
  const qty=parseInt(document.getElementById('sd-qty')?.value||0);
  const m3inp=document.getElementById('sd-m3');
  if(sid&&qty>0&&m3inp&&!m3inp._m) m3inp.value=+(m3Size(sid)*qty).toFixed(4);
}
function onKvLogChange(){
  const idx=document.getElementById('kv-log')?.value;
  if(idx===''){document.getElementById('kv-avail').textContent='';return;}
  const ls=logStock();const s=ls[parseInt(idx)];
  if(s){
    document.getElementById('kv-avail').textContent=`Tersedia: ${s.qty} batang`;
    const owt=document.getElementById('kv-owt');
    if(owt&&!owt.value)owt.value=s.wt;
  }
}
function onVarChange(){
  const vid=document.getElementById('prod-vid')?.value;
  const v=db.variants.find(x=>x.id===vid);
  const infoEl=document.getElementById('var-info');
  const infoTxt=document.getElementById('var-info-text');
  if(v&&infoEl&&infoTxt){
    infoEl.style.display='block';
    infoTxt.textContent=`${v.name} · Dimensi: ${v.p}×${v.l}×${v.t} cm · Finish: ${v.finish} · Est. sawtimber: ${v.m3Est} m³/unit`;
    updatePdSawEst();
  } else if(infoEl) infoEl.style.display='none';
}
function onPdQtyChange(){updatePdSawEst()}
function updatePdSawEst(){
  const vid=document.getElementById('prod-vid')?.value;
  const qty=parseInt(document.getElementById('pd-qty')?.value||0);
  const v=db.variants.find(x=>x.id===vid);
  const el=document.getElementById('pd-saw-est');
  if(v&&qty>0&&el){
    el.style.display='block';
    el.textContent=`Estimasi sawtimber dibutuhkan: ${(v.m3Est*qty).toFixed(4)} m³ (${qty} unit × ${v.m3Est} m³)`;
  } else if(el) el.style.display='none';
}
function onSawSrcChange(){}
function filterProdCat(cat){
  const sel=document.getElementById('prod-vid');
  if(!sel)return;
  sel.innerHTML=`<option value="">-- Pilih varian produk --</option>`;
  const vars=cat?db.variants.filter(v=>{const p=db.products.find(x=>x.id===v.pid);return p&&p.cat===cat}):db.variants;
  vars.forEach(v=>{const p=db.products.find(x=>x.id===v.pid);const opt=document.createElement('option');opt.value=v.id;opt.textContent=`[${p?p.cat:''}] ${v.name} (${v.code})`;sel.appendChild(opt)});
  document.querySelectorAll('.prod-cat-btn').forEach(b=>b.classList.toggle('btn-amber',b.dataset.cat===cat));
}

function prevSzM3(){
  const p=parseFloat(document.getElementById('nsz-p')?.value||0);
  const l=parseFloat(document.getElementById('nsz-l')?.value||0);
  const t=parseFloat(document.getElementById('nsz-t')?.value||0);
  const el=document.getElementById('nsz-prev');
  if(p>0&&l>0&&t>0&&el){el.style.display='block';el.textContent=`Volume per pcs: ${+(p*l*t/1e6).toFixed(6)} m³`}
}
function prevMszM3(){
  const p=parseFloat(document.getElementById('msz-p')?.value||0);
  const l=parseFloat(document.getElementById('msz-l')?.value||0);
  const t=parseFloat(document.getElementById('msz-t')?.value||0);
  const el=document.getElementById('msz-prev');
  if(p>0&&l>0&&t>0&&el){el.style.display='block';el.textContent=`Volume per pcs: ${+(p*l*t/1e6).toFixed(6)} m³`}
}
function prevVarM3(){
  const p=parseFloat(document.getElementById('mv-p')?.value||0);
  const l=parseFloat(document.getElementById('mv-l')?.value||0);
  const t=parseFloat(document.getElementById('mv-t')?.value||0);
  const el=document.getElementById('mv-prev');
  if(p>0&&l>0&&t>0&&el){el.style.display='block';el.textContent=`Dimensi produk: ${p}×${l}×${t} cm = ${+(p*l*t/1e6).toFixed(6)} m³ solid`}
}

function openSzModal(){const m=document.getElementById('modal-sz');if(m)m.classList.remove('hidden')}
function openProdModal(){const m=document.getElementById('modal-prod');if(m)m.classList.remove('hidden')}
function openVarModal(pid){
  const m=document.getElementById('modal-var');if(!m)return;
  const el=document.getElementById('mv-pid');if(el)el.value=pid;
  m.classList.remove('hidden');
}

// ═══════════════════════════════════
//  SUBMIT HANDLERS
// ═══════════════════════════════════
function submitLog(e){
  e.preventDefault();
  const date=document.getElementById('ld-date').value;
  const wt=document.getElementById('ld-wt').value.trim();
  const gr=document.getElementById('log-gr').value;
  const sz=document.getElementById('log-sz').value;
  const qty=parseInt(document.getElementById('ld-qty').value);
  const m3v=document.getElementById('ld-m3').value;
  const sj=document.getElementById('ld-sj').value;
  const notes=document.getElementById('ld-notes').value;
  if(!wt){toast('Isi jenis kayu terlebih dahulu','err');return}
  if(!gr){toast('Pilih grade kualitas','err');return}
  if(!sz){toast('Pilih wood size (A1–A5)','err');return}
  if(!qty||qty<1){toast('Isi jumlah batang','err');return}
  const m3=m3v?parseFloat(m3v):logM3Est(sz,qty);
  db.logs.push({id:uid(),date,wt,gr,sz,qty,m3,sjNum:sj,notes,src:'received'});
  if(!db.woodTypes.includes(wt))db.woodTypes.push(wt);
  saveDb(); toast(`Log ${wt} Grade ${gr} · ${qty} batang tersimpan`,'ok');
  go('penerimaan','log');
}

function submitSaw(e){
  e.preventDefault();
  const date=document.getElementById('sd-date').value;
  const wt=document.getElementById('sd-wt').value.trim();
  const gr=document.getElementById('saw-gr').value;
  const sid=document.getElementById('saw-sz').value;
  const qty=parseInt(document.getElementById('sd-qty').value);
  const m3v=document.getElementById('sd-m3').value;
  const sj=document.getElementById('sd-sj').value;
  if(!wt){toast('Isi jenis kayu','err');return}
  if(!gr){toast('Pilih grade','err');return}
  if(!sid){toast('Pilih ukuran sawtimber','err');return}
  if(!qty||qty<1){toast('Isi jumlah lembar','err');return}
  const m3=m3v?parseFloat(m3v):+(m3Size(sid)*qty).toFixed(4);
  db.sawtimbers.push({id:uid(),date,wt,gr,sid,qty,m3,sjNum:sj,src:'received'});
  if(!db.woodTypes.includes(wt))db.woodTypes.push(wt);
  saveDb(); toast(`Sawtimber ${wt} Grade ${gr} · ${qty} lembar tersimpan`,'ok');
  go('penerimaan','saw');
}

function submitKonv(e){
  e.preventDefault();
  const date=document.getElementById('kv-date').value;
  const logIdx=document.getElementById('kv-log').value;
  const lqty=parseInt(document.getElementById('kv-lqty').value);
  const owt=document.getElementById('kv-owt').value.trim();
  const ogr=document.getElementById('co-gr').value;
  const osid=document.getElementById('co-sz').value;
  const oqty=parseInt(document.getElementById('kv-oqty').value);
  const om3v=document.getElementById('kv-om3').value;
  const notes=document.getElementById('kv-notes').value;
  if(logIdx===''){toast('Pilih stok log','err');return}
  if(!lqty||lqty<1){toast('Isi jumlah log','err');return}
  if(!ogr){toast('Pilih grade output','err');return}
  if(!osid){toast('Pilih ukuran output','err');return}
  if(!oqty||oqty<1){toast('Isi jumlah output','err');return}
  const ls=logStock();const src=ls[parseInt(logIdx)];
  if(!src){toast('Stok tidak ditemukan','err');return}
  if(lqty>src.qty){toast(`Stok tidak cukup (tersedia: ${src.qty} batang)`,'err');return}
  const lm3=src.qty>0?+(src.m3/src.qty*lqty).toFixed(3):0;
  const finalWt=owt||src.wt;
  const om3=om3v?parseFloat(om3v):+(m3Size(osid)*oqty).toFixed(4);
  db.conversions.push({id:uid(),date,lwt:src.wt,lgr:src.gr,lsz:src.sz,lqty,lm3,owt:finalWt,ogr,osid,oqty,om3,notes});
  db.sawtimbers.push({id:uid(),date,wt:finalWt,gr:ogr,sid:osid,qty:oqty,m3:om3,src:'converted'});
  saveDb(); toast(`Konversi berhasil: ${lqty} batang → ${oqty} lembar`,'ok');
  go('stok','saw');
}

function submitProd(e){
  e.preventDefault();
  const date=document.getElementById('pd-date').value;
  const vid=document.getElementById('prod-vid').value;
  const qty=parseInt(document.getElementById('pd-qty').value);
  const gr=document.getElementById('pd-gr').value;
  const sawSrcIdx=document.getElementById('pd-saw-src')?.value;
  const sawQty=parseInt(document.getElementById('pd-saw-qty')?.value||0);
  const notes=document.getElementById('pd-notes').value;
  if(!vid){toast('Pilih varian produk','err');return}
  if(!qty||qty<1){toast('Isi jumlah produksi','err');return}
  if(!gr){toast('Pilih grade produk','err');return}
  const v=db.variants.find(x=>x.id===vid);
  const ss=sawStock();
  let sawWt=null,sawGr=null,sawSid=null,sawM3Used=0;
  if(sawSrcIdx!==undefined&&sawSrcIdx!==''){
    const src=ss[parseInt(sawSrcIdx)];
    if(src){
      const actualSawQty=sawQty||Math.ceil(v.m3Est*qty/(m3Size(src.sid)||0.001));
      if(actualSawQty>src.qty){toast(`Sawtimber tidak cukup (tersedia: ${src.qty} lembar)`,'err');return}
      sawWt=src.wt;sawGr=src.gr;sawSid=src.sid;
      sawM3Used=+(m3Size(src.sid)*actualSawQty).toFixed(4);
      db.productions.push({id:uid(),date,vid,code:v.code,qty,gr,sawWt,sawGr,sawSid,sawQtyUsed:actualSawQty,sawM3Used,notes});
    }
  } else {
    db.productions.push({id:uid(),date,vid,code:v.code,qty,gr,sawQtyUsed:sawQty||0,sawM3Used,notes});
  }
  saveDb(); toast(`Produksi ${v.name} · ${qty} unit Grade ${gr} tersimpan`,'ok');
  go('stok','produk');
}

function saveSzInline(){
  const code=document.getElementById('nsz-code')?.value.trim();
  const p=parseFloat(document.getElementById('nsz-p')?.value);
  const l=parseFloat(document.getElementById('nsz-l')?.value);
  const t=parseFloat(document.getElementById('nsz-t')?.value);
  if(!code||!p||!l||!t){toast('Lengkapi semua data ukuran','err');return}
  db.sizes.push({id:uid(),code,p,l,t});saveDb();
  toast('Ukuran standar ditambahkan','ok');render();
}
function saveSzModal(){
  const code=document.getElementById('msz-code')?.value.trim();
  const p=parseFloat(document.getElementById('msz-p')?.value);
  const l=parseFloat(document.getElementById('msz-l')?.value);
  const t=parseFloat(document.getElementById('msz-t')?.value);
  if(!code||!p||!l||!t){toast('Lengkapi semua data ukuran','err');return}
  db.sizes.push({id:uid(),code,p,l,t});saveDb();
  document.getElementById('modal-sz').classList.add('hidden');
  toast('Ukuran standar ditambahkan','ok');render();
}
function delSz(id){
  if(!confirm('Hapus ukuran ini?'))return;
  db.sizes=db.sizes.filter(s=>s.id!==id);saveDb();render();
  toast('Ukuran dihapus','ok');
}
function saveProd(){
  const name=document.getElementById('mp-name')?.value.trim();
  const cat=document.getElementById('mp-cat')?.value;
  const desc=document.getElementById('mp-desc')?.value.trim();
  if(!name){toast('Isi nama produk','err');return}
  db.products.push({id:uid(),name,cat,desc});saveDb();
  document.getElementById('modal-prod').classList.add('hidden');
  toast('Produk berhasil ditambahkan','ok');render();
}
function delProd(id){
  if(!confirm('Hapus produk dan semua variannya?'))return;
  db.products=db.products.filter(p=>p.id!==id);
  db.variants=db.variants.filter(v=>v.pid!==id);
  if(selProd===id)selProd=null;
  saveDb();render();toast('Produk dihapus','ok');
}
function saveVar(){
  const pid=document.getElementById('mv-pid')?.value;
  const code=document.getElementById('mv-code')?.value.trim();
  const name=document.getElementById('mv-name')?.value.trim();
  const p=parseFloat(document.getElementById('mv-p')?.value);
  const l=parseFloat(document.getElementById('mv-l')?.value);
  const t=parseFloat(document.getElementById('mv-t')?.value);
  const finish=document.getElementById('mv-finish')?.value;
  const m3Est=parseFloat(document.getElementById('mv-m3')?.value)||(p&&l&&t?+(p*l*t/1e6*1.3).toFixed(3):0);
  if(!code||!name||!p||!l||!t){toast('Lengkapi semua data varian','err');return}
  db.variants.push({id:uid(),pid,code,name,p,l,t,finish,m3Est});saveDb();
  document.getElementById('modal-var').classList.add('hidden');
  toast('Varian berhasil ditambahkan','ok');render();
}
function delVar(id){
  if(!confirm('Hapus varian ini?'))return;
  db.variants=db.variants.filter(v=>v.id!==id);saveDb();render();toast('Varian dihapus','ok');
}
function addWt(){
  const inp=document.getElementById('new-wt');const v=inp?.value.trim();
  if(!v)return;
  if(db.woodTypes.includes(v)){toast('Jenis kayu sudah ada','err');return}
  db.woodTypes.push(v);saveDb();inp.value='';render();toast('Jenis kayu ditambahkan','ok');
}
function delWt(i){
  const w=db.woodTypes[i];
  const used=db.logs.some(l=>l.wt===w)||db.sawtimbers.some(s=>s.wt===w);
  if(used){toast('Jenis kayu sedang digunakan','err');return}
  db.woodTypes.splice(i,1);saveDb();render();
}

// BOOT is handled by each HTML page after the shared shell is mounted.
