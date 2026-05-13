'use strict';

// ── PHOTO MAPPING dari Google Drive ──
// Folder Wanita: https://drive.google.com/drive/folders/1f45BbsmdGuTKjgiyz75H9wGbDEVWDhQB
// Folder Pria:   https://drive.google.com/drive/folders/1lXAU4agkP_xI-xzvjGFG8OBsErQMc4o-
//
// CARA ISI FOTO:
// 1. Buka folder Google Drive
// 2. Klik kanan foto → "Get link" → pastikan "Anyone with the link"
// 3. Copy FILE_ID dari URL: drive.google.com/file/d/FILE_ID/view
// 4. Tempel di bawah: GDRIVE_BASE + 'FILE_ID_KAMU' + GDRIVE_SZ

const GDRIVE_BASE = 'https://drive.google.com/thumbnail?id=';
const GDRIVE_SZ = '&sz=w400';

// Ganti null dengan: GDRIVE_BASE + 'FILE_ID' + GDRIVE_SZ
const TALENT_PHOTOS = {
  't001': { main: null, gallery: [null, null, null] }, // Ara Salsabila (wanita)
  't002': { main: null, gallery: [null, null, null] }, // Nara Putri (wanita)
  't003': { main: null, gallery: [null, null, null] }, // Dira Cantika (wanita)
  't004': { main: null, gallery: [null, null, null] }, // Luna Safira (wanita)
  't005': { main: null, gallery: [null, null, null] }, // Kira Mahesa (pria)
  't006': { main: null, gallery: [null, null, null] }, // Reva Anindita (wanita)
  't007': { main: null, gallery: [null, null, null] }, // Zara Najwa (wanita)
  't008': { main: null, gallery: [null, null, null] }, // Dani Pratama (pria)
  't009': { main: null, gallery: [null, null, null] }, // Sari Melati (wanita)
  't010': { main: null, gallery: [null, null, null] }, // Rio Ardiansyah (pria)
};

const TALENT_GRADIENTS = {
  't001': ['#fce4ed','#e8a4c0'], 't002': ['#ede4fc','#b0a0e8'],
  't003': ['#fce4f0','#f8a0c8'], 't004': ['#e4ecfc','#a0b0e8'],
  't005': ['#e4fce8','#90d8a0'], 't006': ['#fce4f8','#d8a0e8'],
  't007': ['#fce8e4','#f0a890'], 't008': ['#e4f8fc','#90c8d8'],
  't009': ['#f8fce4','#c8d890'], 't010': ['#f8e4e4','#e09090'],
};

function getTalentPhotoUrl(id) {
  const p = TALENT_PHOTOS[id]; return p && p.main ? p.main : null;
}
function getTalentGallery(id) {
  const p = TALENT_PHOTOS[id]; return p ? p.gallery : [null,null,null];
}

// ── STATE ──
let currentUser=null, currentPage='landing', musicPlaying=false,
    bookingStep=1, bookingData={}, currentPriceFilter='all';

const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const getTalents=()=>lsGet('lovia_talents',DEFAULT_TALENTS);
const setTalents=d=>lsSet('lovia_talents',d);
const getOrders=()=>lsGet('lovia_orders',DEFAULT_ORDERS);
const setOrders=d=>lsSet('lovia_orders',d);
const getTestimonials=()=>lsGet('lovia_testimonials',DEFAULT_TESTIMONIALS);
const setTestimonials=d=>lsSet('lovia_testimonials',d);
const getPricelist=()=>lsGet('lovia_pricelist',DEFAULT_PRICELIST);
const setPricelist=d=>lsSet('lovia_pricelist',d);

const DEFAULT_TALENTS=[
  {id:'t001',name:'Ara Salsabila',nickname:'Ara',age:22,gender:'Perempuan',location:'Jakarta',bio:'Suka ngobrol, nonton film, dan kulineran. Aku orangnya humoris dan easygoing! Yuk cerita apapun 💕',hobbies:'Film, Music, Kuliner',services:['Chatting','Calling','Video Call','Offline Date'],schedule:['Siang (12-17)','Sore (17-20)','Malam (20-24)'],rating:4.9,bookings:234,price:'26K',status:'online',avatar:'🌸',ig:'@ara.sal',tiktok:'@ara.salsabila',verified:true,username:'talent01',password:'talent123'},
  {id:'t002',name:'Nara Putri',nickname:'Nara',age:20,gender:'Perempuan',location:'Bandung',bio:'Music lover dan gaming enthusiast. Yuk mabar bareng! Teman ngobrol seru dan gak boring 🎵',hobbies:'Gaming, Music, Anime',services:['Chatting','Calling','Mabar','Video Call'],schedule:['Pagi (06-12)','Malam (20-24)'],rating:4.8,bookings:189,price:'26K',status:'online',avatar:'🎵',ig:'@naraputri',tiktok:'@nara.music',verified:true,username:'nara01',password:'nara123'},
  {id:'t003',name:'Dira Cantika',nickname:'Dira',age:23,gender:'Perempuan',location:'Surabaya',bio:'Ceria, aktif, dan selalu ada buat dengerin ceritamu. Offline date ke mana aja siap! 🌺',hobbies:'Travel, Photography, Cafe Hopping',services:['Chatting','Calling','Video Call','Offline Date'],schedule:['Pagi (06-12)','Siang (12-17)','Sore (17-20)'],rating:5.0,bookings:312,price:'26K',status:'online',avatar:'🌺',ig:'@dira.cantika',tiktok:'@dira_travel',verified:true,username:'dira01',password:'dira123'},
  {id:'t004',name:'Luna Safira',nickname:'Luna',age:21,gender:'Perempuan',location:'Yogyakarta',bio:'Introvert tapi asik diajak ngobrol. Suka sastra, kopi, dan hujan. Percakapan bermakna is my thing 🌙',hobbies:'Membaca, Menulis, Kopi',services:['Chatting','Calling','Video Call'],schedule:['Sore (17-20)','Malam (20-24)'],rating:4.7,bookings:145,price:'26K',status:'offline',avatar:'🌙',ig:'@luna.safira',tiktok:'@luna_writes',verified:true,username:'luna01',password:'luna123'},
  {id:'t005',name:'Kira Mahesa',nickname:'Kira',age:24,gender:'Laki-laki',location:'Bali',bio:'Pro gamer, bisa bantu carry rank kamu. Juga bisa jadi teman jalan yang asik dan seru! 🎮',hobbies:'Gaming, Surfing, Photography',services:['Mabar','Chatting','Offline Date'],schedule:['Pagi (06-12)','Malam (20-24)'],rating:4.8,bookings:278,price:'26K',status:'online',avatar:'🎮',ig:'@kira.mahesa',tiktok:'@kira_pro',verified:true,username:'kira01',password:'kira123'},
  {id:'t006',name:'Reva Anindita',nickname:'Reva',age:22,gender:'Perempuan',location:'Jakarta',bio:'Aktris teater, punya banyak cerita seru. Yuk ngobrol dan temukan warna baru dalam hidupmu! 🎭',hobbies:'Teater, Seni, Kuliner',services:['Chatting','Calling','Video Call','Offline Date'],schedule:['Siang (12-17)','Sore (17-20)'],rating:4.9,bookings:201,price:'26K',status:'online',avatar:'🎭',ig:'@reva.anin',tiktok:'@reva_art',verified:true,username:'reva01',password:'reva123'},
  {id:'t007',name:'Zara Najwa',nickname:'Zara',age:19,gender:'Perempuan',location:'Medan',bio:'Foodie banget! Selalu update tempat makan enak. Asik banget buat teman jalan! 🍜',hobbies:'Kuliner, Vlogging, Dance',services:['Chatting','Calling','Offline Date'],schedule:['Siang (12-17)','Malam (20-24)'],rating:4.6,bookings:97,price:'26K',status:'busy',avatar:'🍜',ig:'@zara.najwa',tiktok:'@zara_food',verified:false,username:'zara01',password:'zara123'},
  {id:'t008',name:'Dani Pratama',nickname:'Dani',age:25,gender:'Laki-laki',location:'Semarang',bio:'Teman ngobrol yang hangat dan supportif. Pendengar terbaik buat kamu yang butuh teman cerita 🌟',hobbies:'Olahraga, Musik, Traveling',services:['Chatting','Calling','Video Call','Offline Date'],schedule:['Pagi (06-12)','Sore (17-20)','Malam (20-24)'],rating:4.7,bookings:156,price:'26K',status:'online',avatar:'🌟',ig:'@dani.prat',tiktok:'@dani_vibe',verified:true,username:'dani01',password:'dani123'},
  {id:'t009',name:'Sari Melati',nickname:'Sari',age:21,gender:'Perempuan',location:'Bandung',bio:'Pecinta kopi dan buku. Conversation bermakna adalah hal yang paling aku suka ☕',hobbies:'Kopi, Buku, Hiking',services:['Chatting','Calling','Video Call'],schedule:['Pagi (06-12)','Sore (17-20)'],rating:4.8,bookings:118,price:'26K',status:'online',avatar:'☕',ig:'@sari.mel',tiktok:'@sari_reads',verified:true,username:'sari01',password:'sari123'},
  {id:'t010',name:'Rio Ardiansyah',nickname:'Rio',age:26,gender:'Laki-laki',location:'Jakarta',bio:'Fotografer dan traveler. Yuk cerita perjalanan seru atau foto bareng jalan-jalan! 📸',hobbies:'Fotografi, Travel, Kuliner',services:['Chatting','Calling','Offline Date'],schedule:['Siang (12-17)','Sore (17-20)'],rating:4.6,bookings:89,price:'26K',status:'offline',avatar:'📸',ig:'@rio.ardi',tiktok:'@rio_lens',verified:true,username:'rio01',password:'rio123'},
];

const DEFAULT_TESTIMONIALS=[
  {name:'Amel R.',avatar:'👧',rating:5,text:'Pengalaman pertama sewa talent di Lovia Partner dan langsung ketagihan! Ara super asik, responsif banget. Highly recommended!',service:'Chatting 7 Hari'},
  {name:'Budi S.',avatar:'👦',rating:5,text:'Mabar sama Kira tuh seru banget, dia pro abis! Rank langsung naik. Dijamin ga nyesel booking di sini.',service:'Mabar Session'},
  {name:'Citra M.',avatar:'👩',rating:5,text:'Offline date sama Dira sangat menyenangkan! Dia asik, friendly, dan tahu banyak spot kece. Rekomen banget!',service:'Offline Date 4 Jam'},
  {name:'Dodi F.',avatar:'👨',rating:4,text:'Platform yang profesional dan aman. Proses booking mudah, talent responsif. Pasti bakal order lagi!',service:'Video Call 30 Mnt'},
  {name:'Erlin P.',avatar:'👧',rating:5,text:'Udah coba beberapa platform, tapi Lovia Partner yang paling nyaman dan terpercaya. Talent-nya berkualitas!',service:'PDKT Package 2'},
  {name:'Fajar K.',avatar:'👦',rating:5,text:'Reva teman ngobrol yang luar biasa! Ceritanya seru, wawasannya luas. Satu jam kayak lima menit aja.',service:'Calling 60 Menit'},
];

const DEFAULT_PRICELIST={
  chatting:[{label:'1 Hari',price:'26.000',popular:false},{label:'3 Hari',price:'50.000',popular:false},{label:'7 Hari',price:'93.000',popular:true},{label:'14 Hari',price:'185.000',popular:false},{label:'30 Hari',price:'370.000',popular:false}],
  calling:[{label:'15 Menit',price:'12.000',popular:false},{label:'30 Menit',price:'23.000',popular:true},{label:'60 Menit',price:'45.000',popular:false},{label:'90 Menit',price:'60.000',popular:false},{label:'120 Menit',price:'100.000',popular:false}],
  videocall:[{label:'15 Menit',price:'30.000',popular:false},{label:'30 Menit',price:'55.000',popular:false},{label:'60 Menit',price:'95.000',popular:true},{label:'90 Menit',price:'125.000',popular:false},{label:'120 Menit',price:'160.000',popular:false}],
  offline:[{label:'2 Jam',price:'150.000',popular:false},{label:'4 Jam',price:'270.000',popular:true},{label:'6 Jam',price:'400.000',popular:false},{label:'8 Jam',price:'530.000',popular:false},{label:'Tambahan 1 Jam',price:'100.000',popular:false}],
  pap:[{label:'1x PAP',price:'10.000',popular:false}],
  mabar:[{label:'1x Mabar',price:'10.000',popular:false}],
  paket:[
    {label:'Relationship 1',price:'220.000',popular:false,items:['Chat 3 Hari','Offline Date 1x (2 Jam)','PAP 1x','Call 15 Menit'],featured:false},
    {label:'Relationship 2',price:'400.000',popular:true,items:['Chat 7 Hari','Offline Date 1x (4 Jam)','PAP 3x','Call 15 Menit'],featured:false},
    {label:'Relationship 3',price:'600.000',popular:false,items:['Chat 14 Hari','Offline Date 2x (2 Jam)','Call 30 Menit (2x)','PAP 7x'],featured:true},
  ],
  pdkt:[
    {label:'PDKT 1',price:'100.000',popular:false,items:['Chat 3 Hari','PAP 1x','Call 15 Menit','VC 15 Menit'],featured:false},
    {label:'PDKT 2',price:'165.000',popular:true,items:['Chat 7 Hari','PAP 3x','Call 30 Menit','VC 15 Menit'],featured:false},
    {label:'PDKT 3',price:'380.000',popular:false,items:['Chat 14 Hari','PAP 10x','Call 30 Mnt (2x)','VC 15 Mnt (2x)','VN Sepuasnya'],featured:false},
    {label:'PDKT VIP',price:'700.000',popular:false,items:['Chat 30 Hari','PAP 20x','Call 30 Mnt (3x)','VC 15 Mnt (4x)','VN Sepuasnya','Prioritas Fast Response'],featured:true},
  ],
};

const DEFAULT_ORDERS=[
  {id:'ORD001',customer:'Amel R.',wa:'0812-0000-0001',talent:'Ara Salsabila',service:'Chatting 7 Hari',date:'2026-05-01',status:'Selesai',total:'93.000'},
  {id:'ORD002',customer:'Budi S.',wa:'0812-0000-0002',talent:'Kira Mahesa',service:'Mabar 1x',date:'2026-05-03',status:'Aktif',total:'10.000'},
  {id:'ORD003',customer:'Citra M.',wa:'0812-0000-0003',talent:'Dira Cantika',service:'Offline Date 4 Jam',date:'2026-05-10',status:'Menunggu',total:'270.000'},
  {id:'ORD004',customer:'Dodi F.',wa:'0812-0000-0004',talent:'Reva Anindita',service:'Video Call 30 Mnt',date:'2026-05-08',status:'Selesai',total:'55.000'},
  {id:'ORD005',customer:'Erlin P.',wa:'0812-0000-0005',talent:'Luna Safira',service:'PDKT 2',date:'2026-05-12',status:'Aktif',total:'165.000'},
];

// ── INIT ── (FIX: semua di dalam DOMContentLoaded)
document.addEventListener('DOMContentLoaded',()=>{
  initLoading(); initCursor(); initNavbar(); initTheme();
  // FIX KRITIS: themeToggle listener dipindah ke sini
  const tt=document.getElementById('themeToggle');
  if(tt) tt.addEventListener('click',()=>{
    const c=document.documentElement.getAttribute('data-theme'),n=c==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',n);
    localStorage.setItem('lovia_theme',n); updateThemeIcon(n);
    toast('Mode '+(n==='dark'?'Gelap 🌙':'Terang ☀️')+' aktif','info');
  });
  renderHome(); initCounters(); initScrollReveal(); initTyping(); schedulePopup();
  const sess=lsGet('lovia_session',null);
  if(sess){currentUser=sess;if(sess.role==='admin')showPage('admin');else if(sess.role==='talent')showPage('talent-dash');}
});

function initLoading(){setTimeout(()=>{const ls=document.getElementById('loadingScreen');if(ls)ls.classList.add('hidden');},1900);}

function initCursor(){
  if(window.innerWidth<=768)return;
  const dot=document.getElementById('cursorDot'),ring=document.getElementById('cursorRing');
  if(!dot||!ring)return;
  document.addEventListener('mousemove',e=>{dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';setTimeout(()=>{ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';},80);});
  document.addEventListener('mouseover',e=>{if(e.target.matches('button,a,.talent-card,.service-card,.price-item-card,.package-card')){ring.style.width='50px';ring.style.height='50px';ring.style.borderColor='var(--pink-deep)';}});
  document.addEventListener('mouseout',e=>{if(e.target.matches('button,a,.talent-card,.service-card,.price-item-card,.package-card')){ring.style.width='32px';ring.style.height='32px';ring.style.borderColor='var(--pink)';}});
}

function initNavbar(){window.addEventListener('scroll',()=>{const nb=document.getElementById('navbar');if(nb)nb.classList.toggle('scrolled',window.scrollY>20);});}
function toggleMobileMenu(){const nl=document.getElementById('navLinks');if(nl)nl.classList.toggle('open');}
function initTheme(){const s=localStorage.getItem('lovia_theme')||'light';document.documentElement.setAttribute('data-theme',s);updateThemeIcon(s);}
function updateThemeIcon(t){const i=document.getElementById('themeIcon');if(i)i.className=t==='dark'?'fas fa-sun':'fas fa-moon';}

function initScrollReveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el=>obs.observe(el));
}

function initTyping(){
  const phrases=['Terbaik Untukmu ✨','untuk Menemanimu 💫','untuk Ngobrol Seru 💬','untuk Offline Date 📍','untuk Mabar Bareng 🎮'];
  let pi=0,ci=0,del=false;
  const el=document.querySelector('.hero-title em');
  if(!el)return;
  function type(){
    const p=phrases[pi];
    el.textContent=del?p.slice(0,ci-1):p.slice(0,ci+1);
    del?ci--:ci++;
    if(!del&&ci===p.length){setTimeout(()=>{del=true;type();},2200);return;}
    if(del&&ci===0){del=false;pi=(pi+1)%phrases.length;}
    setTimeout(type,del?55:85);
  }
  setTimeout(type,2000);
}

function initCounters(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;e.target.querySelectorAll('.stat-num').forEach(n=>{const target=+n.dataset.target;let cur=0;const iv=setInterval(()=>{cur=Math.min(cur+target/60,target);n.textContent=Math.floor(cur).toLocaleString('id');if(cur>=target)clearInterval(iv);},20);});obs.unobserve(e.target);});},{threshold:.3});
  const s=document.querySelector('.hero-stats');if(s)obs.observe(s);
}

// ── PAGE ROUTING ──
function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+page);if(!el)return;
  el.classList.add('active');currentPage=page;
  const dash=page==='admin'||page==='talent-dash';
  const footer=document.getElementById('mainFooter');
  const navbar=document.getElementById('navbar');
  const floatWa=document.querySelector('.float-wa');
  const floatMusic=document.getElementById('floatMusic');
  if(footer)footer.style.display=dash?'none':'block';
  if(navbar)navbar.style.display=dash?'none':'';
  if(floatWa)floatWa.style.display=dash?'none':'';
  if(floatMusic)floatMusic.style.display=dash?'none':'';
  // Close any open drawer when navigating
  closeDashSidebar('admin');
  closeDashSidebar('talent');
  document.body.style.overflow='';
  if(!dash) window.scrollTo({top:0,behavior:'smooth'});
  const nl=document.getElementById('navLinks');if(nl)nl.classList.remove('open');
  if(page==='talents')renderSkeletonTalents();
  else if(page==='pricelist')renderPricelist();
  else if(page==='admin'){
    if(!currentUser||currentUser.role!=='admin'){toast('Login sebagai admin dulu!','error');showLoginModal();return;}
    renderAdminDash();
  }
  else if(page==='talent-dash'){
    if(!currentUser||currentUser.role!=='talent'){toast('Login sebagai talent dulu!','error');showLoginModal();return;}
    renderTalentDash();
  }
  setTimeout(initScrollReveal,100);
}

// ── HOME ──
function renderHome(){renderHomeTalents();renderTestimonials();}

function renderHomeTalents(){
  const grid=document.getElementById('homeTalentGrid');
  if(grid)grid.innerHTML=getTalents().slice(0,4).map(talentCard).join('');
}

function renderTestimonials(){
  const grid=document.getElementById('testimonialGrid');
  if(!grid)return;
  grid.innerHTML=getTestimonials().map(t=>`
    <div class="testi-card reveal">
      <div class="testi-header">
        <div class="testi-avatar">${t.avatar}</div>
        <div><div class="testi-name">${t.name}</div><div class="testi-stars">${'⭐'.repeat(t.rating)}</div></div>
      </div>
      <p class="testi-text">"${t.text}"</p>
      <span class="testi-service">${t.service}</span>
    </div>`).join('');
}

// ── TALENT CARD (dengan foto nyata jika ada) ──
function talentCard(t){
  const sc={online:'status-online',offline:'status-offline',busy:'status-busy'};
  const si={online:'🟢 Online',offline:'⚫ Offline',busy:'🟠 Sibuk'};
  const tc={'Chatting':'tag-chat','Calling':'tag-call','Video Call':'tag-vc','Offline Date':'tag-offline','Mabar':'tag-mabar'};
  const photoUrl=getTalentPhotoUrl(t.id);
  const grad=TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  const imgContent=photoUrl
    ?`<img src="${photoUrl}" alt="${t.name}" class="talent-real-photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    :``;
  const fallback=`<div class="talent-avatar-fallback" style="background:linear-gradient(135deg,${grad[0]},${grad[1]});display:${photoUrl?'none':'flex'}"><span>${t.avatar}</span></div>`;

  return `<div class="talent-card neon-hover" onclick="showTalentDetail('${t.id}')">
    <div class="talent-img">
      ${imgContent}${fallback}
      <div class="talent-img-overlay"></div>
      <div class="talent-status ${sc[t.status]||'status-offline'}">${si[t.status]||t.status}</div>
      ${t.verified?'<div class="talent-verified-badge">✓ Verified</div>':''}
    </div>
    <div class="talent-body">
      <div class="talent-name">${t.name}</div>
      <div class="talent-meta"><span><i class="fas fa-map-marker-alt"></i> ${t.location}</span><span><i class="fas fa-birthday-cake"></i> ${t.age} thn</span><span>${t.gender==='Perempuan'?'👧':'👦'}</span></div>
      <p class="talent-bio">${t.bio}</p>
      <div class="talent-tags">${(t.services||[]).slice(0,3).map(s=>`<span class="talent-tag ${tc[s]||''}">${s}</span>`).join('')}</div>
      <div class="talent-footer"><div class="talent-price">Mulai <strong>${t.price}</strong>/hari</div><div class="talent-rating"><i class="fas fa-star"></i> ${t.rating} <span style="color:var(--text-muted)">(${t.bookings}x)</span></div></div>
    </div>
  </div>`;
}

// ── TALENT LIST ──
function renderSkeletonTalents(){
  const grid=document.getElementById('talentGrid');
  if(grid)grid.innerHTML=Array(8).fill(0).map(()=>`<div class="skeleton-card"><div class="skeleton skel-img"></div><div style="padding:1rem"><div class="skeleton skel-line"></div><div class="skeleton skel-line-sm"></div><div class="skeleton skel-line" style="width:75%"></div></div></div>`).join('');
  setTimeout(renderTalents,650);
}

// FIX: Filter gender, service, status, sort semua bekerja
function renderTalents(){
  const q=(document.getElementById('searchTalent')||{}).value||'';
  const gender=(document.getElementById('filterGender')||{}).value||'';
  const service=(document.getElementById('filterService')||{}).value||'';
  const status=(document.getElementById('filterStatus')||{}).value||'';
  const location=(document.getElementById('filterLocation')||{}).value||'';
  const sort=(document.getElementById('sortTalent')||{}).value||'';
  let list=getTalents().filter(t=>{
    const mQ=!q||t.name.toLowerCase().includes(q.toLowerCase())||t.location.toLowerCase().includes(q.toLowerCase())||t.bio.toLowerCase().includes(q.toLowerCase());
    const mG=!gender||t.gender===gender;
    const mS=!service||(t.services||[]).includes(service);
    const mSt=!status||t.status===status;
    const mL=!location||t.location===location;
    return mQ&&mG&&mS&&mSt&&mL;
  });
  if(sort==='rating')list=list.sort((a,b)=>b.rating-a.rating);
  else if(sort==='bookings')list=list.sort((a,b)=>b.bookings-a.bookings);
  else if(sort==='name')list=list.sort((a,b)=>a.name.localeCompare(b.name));
  const grid=document.getElementById('talentGrid');if(!grid)return;
  const count=document.getElementById('talentCount');if(count)count.textContent=list.length;
  if(!list.length){grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)"><div style="font-size:3rem">🔍</div><h3>Talent tidak ditemukan</h3><p>Coba ubah filter</p></div>`;return;}
  grid.innerHTML=list.map(talentCard).join('');
  setTimeout(initScrollReveal,100);
}

// ── TALENT DETAIL ──
function showTalentDetail(id){
  const t=getTalents().find(x=>x.id===id);if(!t)return;
  const sc={online:'status-online',offline:'status-offline',busy:'status-busy'};
  const si={online:'🟢 Online',offline:'⚫ Offline',busy:'🟠 Sibuk'};
  const vi={'Chatting':'💬','Calling':'📞','Video Call':'🎥','Offline Date':'📍','Mabar':'🎮','PAP':'📸'};
  const revs=[
    {u:'Amel R.',s:5,tx:'Sangat asik diajak ngobrol, responsif dan ramah!',d:'2 hari lalu',av:'👧'},
    {u:'Budi K.',s:5,tx:'Sesuai ekspektasi, profesional dan menyenangkan.',d:'5 hari lalu',av:'👦'},
    {u:'Citra M.',s:4,tx:'Bagus! Teman ngobrol seru dan tidak membosankan.',d:'1 minggu lalu',av:'👩'},
  ];
  const galleryPhotos=getTalentGallery(t.id);
  const grad=TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  const mainPhotoUrl=getTalentPhotoUrl(t.id);

  const renderGalleryItem=(url,index)=>{
    const emojis=['✨','🌟','💫'];
    const bgs=[`linear-gradient(135deg,${grad[0]},${grad[1]})`,`linear-gradient(135deg,var(--purple-light),var(--pink-light))`,`linear-gradient(135deg,var(--peach-light),var(--cream))`];
    return url
      ?`<div class="gallery-img"><img src="${url}" alt="Foto ${index+1}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=font-size:2rem>${emojis[index%3]}</span>'"></div>`
      :`<div class="gallery-img" style="background:${bgs[index%3]}"><span style="font-size:2rem">${emojis[index%3]}</span></div>`;
  };

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const detPage=document.getElementById('page-talent-detail');
  if(!detPage)return;
  detPage.classList.add('active');
  const navbar=document.getElementById('navbar');
  const footer=document.getElementById('mainFooter');
  if(navbar)navbar.style.display='';
  if(footer)footer.style.display='block';

  const content=document.getElementById('talentDetailContent');
  if(!content)return;

  content.innerHTML=`
    <div class="talent-detail-layout">
      <div class="td-sidebar">
        <div class="td-main-img">
          ${mainPhotoUrl?`<img src="${mainPhotoUrl}" alt="${t.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg)" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}
          <div class="td-avatar-fallback" style="background:linear-gradient(135deg,${grad[0]},${grad[1]});display:${mainPhotoUrl?'none':'flex'}"><span>${t.avatar}</span></div>
        </div>
        <div class="td-info-card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">
            <div class="td-name">${t.name}</div>
            <div class="talent-status ${sc[t.status]||'status-offline'}" style="flex-shrink:0">${si[t.status]||t.status}</div>
          </div>
          <div class="td-meta-row"><span><i class="fas fa-map-marker-alt"></i> ${t.location}</span><span><i class="fas fa-birthday-cake"></i> ${t.age} thn</span></div>
          <div class="td-meta-row"><span><i class="fas fa-venus-mars"></i> ${t.gender}</span><span>⭐ ${t.rating} · ${t.bookings}x booking</span></div>
          <div class="td-badge-row">
            ${t.verified?'<span class="talent-tag" style="background:rgba(59,130,246,.1);color:#3b82f6">✓ Verified</span>':''}
            <span class="talent-tag" style="background:var(--pink-light);color:var(--pink-deep)">⚡ Fast Response</span>
            ${t.rating>=4.9?'<span class="talent-tag" style="background:var(--gold-light);color:#8b6914">🏆 Top Rated</span>':''}
          </div>
          <p style="font-size:.85rem;color:var(--text-sec);margin:.75rem 0;line-height:1.7">${t.bio}</p>
          <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.5rem">❤️ <strong>Hobi:</strong> ${t.hobbies}</div>
          ${t.ig?`<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.25rem"><i class="fab fa-instagram" style="color:#e1306c"></i> ${t.ig}</div>`:''}
          ${t.tiktok?`<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.75rem"><i class="fab fa-tiktok"></i> ${t.tiktok}</div>`:''}
          <div style="font-weight:700;color:var(--pink-deep);font-size:1.2rem;margin:1rem 0 1.1rem">💰 Mulai <span style="font-family:var(--font-display)">${t.price}</span>/hari</div>
          <button class="btn-primary glow-btn" style="width:100%;justify-content:center;margin-bottom:.6rem" onclick="openBooking('${t.id}')"><i class="fas fa-calendar-plus"></i> Booking Sekarang</button>
          <a href="https://wa.me/6281200000000?text=Halo,+saya+ingin+booking+${encodeURIComponent(t.name)}" target="_blank" class="btn-outline" style="width:100%;justify-content:center;display:flex"><i class="fab fa-whatsapp"></i> Tanya via WhatsApp</a>
        </div>
      </div>
      <div class="td-main">
        <div class="td-info-card">
          <div class="td-section-title">📸 Galeri</div>
          <div class="gallery-grid">${galleryPhotos.map((url,i)=>renderGalleryItem(url,i)).join('')}</div>
        </div>
        <div class="td-info-card">
          <div class="td-section-title">🛎️ Layanan Tersedia</div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem">${(t.services||[]).map(s=>`<span class="talent-tag" style="font-size:.82rem;padding:.35rem .85rem">${vi[s]||'✦'} ${s}</span>`).join('')}</div>
        </div>
        <div class="td-info-card">
          <div class="td-section-title">📅 Jadwal Available</div>
          <div class="schedule-grid">${['Pagi (06-12)','Siang (12-17)','Sore (17-20)','Malam (20-24)'].map(s=>`<div class="sched-chip ${(t.schedule||[]).includes(s)?'sched-available':'sched-busy'}">${s.includes('Pagi')?'🌅':s.includes('Siang')?'☀️':s.includes('Sore')?'🌆':'🌙'} ${s}</div>`).join('')}</div>
        </div>
        <div class="td-info-card">
          <div class="td-section-title">💬 Review Customer</div>
          ${revs.map(r=>`<div class="review-card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.45rem"><div style="display:flex;align-items:center;gap:.6rem"><span style="font-size:1.2rem">${r.av}</span><strong style="font-size:.88rem">${r.u}</strong></div><span style="font-size:.72rem;color:var(--text-muted)">${r.d}</span></div><div style="color:#f59e0b;font-size:.8rem;margin-bottom:.3rem">${'⭐'.repeat(r.s)}</div><p style="font-size:.83rem;color:var(--text-sec);font-style:italic">"${r.tx}"</p></div>`).join('')}
        </div>
      </div>
    </div>`;
  currentPage='talent-detail';
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── PRICELIST ──
function renderPricelist(){
  const pl=getPricelist();
  const sections=[
    {key:'chatting',label:'Chatting',icon:'💬',pkg:false},{key:'calling',label:'Calling',icon:'📞',pkg:false},
    {key:'videocall',label:'Video Call',icon:'🎥',pkg:false},{key:'offline',label:'Offline Date',icon:'📍',pkg:false},
    {key:'pap',label:'PAP (Pose A Photo)',icon:'📸',pkg:false},{key:'mabar',label:'Mabar / Gaming',icon:'🎮',pkg:false},
    {key:'paket',label:'Paket Relationship',icon:'💝',pkg:true},{key:'pdkt',label:'Paket PDKT',icon:'💌',pkg:true},
  ];
  const filtered=sections.filter(s=>currentPriceFilter==='all'||s.key===currentPriceFilter);
  const container=document.getElementById('pricelistContainer');if(!container)return;
  container.innerHTML=filtered.map(s=>{
    const items=pl[s.key]||[];
    return `<div class="price-section reveal" data-cat="${s.key}">
      <div class="price-section-title"><span>${s.icon}</span> ${s.label} <span style="font-size:.72rem;font-family:var(--font-body);color:var(--text-muted);font-weight:400">${items.length} pilihan</span></div>
      ${s.pkg?`<div class="package-cards-row">${items.map(pkg=>`
        <div class="package-card ${pkg.featured?'featured-pkg':''} neon-hover">
          ${pkg.popular?'<div class="pkg-badge">⭐ Best Seller</div>':''}
          <div class="pkg-icon">${s.icon}</div>
          <div class="pkg-name">${pkg.label}</div>
          <div class="pkg-price">Rp ${pkg.price}</div>
          <div class="pkg-items">${(pkg.items||[]).map(i=>`<div class="pkg-item">${i}</div>`).join('')}</div>
          <div style="display:flex;gap:.5rem;margin-top:.5rem">
            <button class="${pkg.featured?'btn-outline':'btn-primary'}" style="${pkg.featured?'border-color:#fff;color:#fff;':''}flex:1;justify-content:center" onclick="openBookingFromPrice('${pkg.label}','${pkg.price}')">Pesan</button>
            <a href="https://wa.me/6281200000000?text=Mau+pesan+${encodeURIComponent(pkg.label)}" target="_blank" style="width:40px;height:40px;background:${pkg.featured?'rgba(255,255,255,.2)':'var(--pink-light)'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${pkg.featured?'#fff':'var(--pink-deep)'};font-size:1.1rem;flex-shrink:0;text-decoration:none"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>`).join('')}</div>`
      :`<div class="price-cards-row">${items.map(item=>`
        <div class="price-item-card ${item.popular?'popular':''} neon-hover">
          ${item.popular?'<div class="price-item-badge">🔥 Populer</div>':''}
          <div class="price-item-label">${item.label}</div>
          <div class="price-item-price">Rp ${item.price}<small>/sesi</small></div>
          <div style="display:flex;gap:.4rem;margin-top:.75rem">
            <button class="btn-sm" style="flex:1;justify-content:center" onclick="openBookingFromPrice('${s.label} — ${item.label}','${item.price}')">Pesan</button>
            <a href="https://wa.me/6281200000000?text=Mau+pesan+${encodeURIComponent(s.label+' '+item.label)}" target="_blank" style="width:34px;height:34px;background:var(--pink-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--pink-deep);font-size:.9rem;flex-shrink:0;text-decoration:none"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>`).join('')}</div>`}
    </div>`;
  }).join('');
  setTimeout(initScrollReveal,60);
}

function filterPrice(cat,btn){currentPriceFilter=cat;document.querySelectorAll('.price-filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPricelist();}

// ── BOOKING ──
function openBookingFromPrice(svc,price){bookingData={talent:null,serviceName:svc,servicePrice:price};buildBookingModal();openModal('bookingModal');}
function openBooking(id){
  const t=getTalents().find(x=>x.id===id);if(!t)return;
  if(t.status==='offline'){toast('Talent sedang offline, pilih talent lain','error');return;}
  if(t.status==='busy'){toast('Talent sedang sibuk, coba lagi nanti','error');return;}
  bookingData={talent:t,serviceName:null,servicePrice:null};buildBookingModal();openModal('bookingModal');
}

function buildBookingModal(){
  bookingStep=1;
  const{talent,serviceName,servicePrice}=bookingData;
  const minDate=new Date().toISOString().split('T')[0];
  const photoUrl=talent?getTalentPhotoUrl(talent.id):null;
  const grad=talent?(TALENT_GRADIENTS[talent.id]||['#fce4ed','#e8a4c0']):['#fce4ed','#e8a4c0'];
  const talentPreview=talent?`
    <div style="display:flex;align-items:center;gap:1rem;padding:.85rem;background:var(--pink-light);border-radius:var(--radius-sm);margin-bottom:1.25rem">
      <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center">
        ${photoUrl?`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:1.5rem">${talent.avatar}</span>`}
      </div>
      <div><strong>${talent.name}</strong><div style="font-size:.78rem;color:var(--text-muted)">${talent.location} · ⭐ ${talent.rating}</div></div>
    </div>
    <div class="form-group"><label>Pilih Layanan</label>
      <select id="bkService" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)">
        ${(talent.services||[]).map(s=>`<option>${s}</option>`).join('')}
      </select>
    </div>`
  :`<div style="padding:.85rem;background:var(--purple-light);border-radius:var(--radius-sm);margin-bottom:1.25rem">
      <strong>📦 ${serviceName}</strong>
      <div style="font-size:.82rem;color:var(--text-muted);margin-top:.25rem">Harga: Rp ${servicePrice}</div>
    </div>
    <div class="form-group"><label>Pilih Talent (Opsional)</label>
      <select id="bkTalent" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)">
        <option value="">Pilihkan oleh admin</option>
        ${getTalents().filter(t=>t.status==='online').map(t=>`<option value="${t.id}">${t.avatar} ${t.name} — ${t.location}</option>`).join('')}
      </select>
    </div>`;
  const content=document.getElementById('bookingContent');if(!content)return;
  content.innerHTML=`
    <div class="booking-progress"><div class="bp-dot active" id="bp1"></div><div class="bp-dot" id="bp2"></div><div class="bp-dot" id="bp3"></div></div>
    <div class="booking-step active" id="bkStep1">
      <h4 style="font-family:var(--font-display);margin-bottom:1.25rem">1. Pilih Layanan</h4>
      ${talentPreview}
      <button class="btn-primary" style="width:100%;justify-content:center;margin-top:.75rem" onclick="bkNext(1)">Lanjut <i class="fas fa-arrow-right"></i></button>
    </div>
    <div class="booking-step" id="bkStep2">
      <h4 style="font-family:var(--font-display);margin-bottom:1.25rem">2. Pilih Jadwal</h4>
      <div class="form-group"><label>Tanggal</label><input type="date" id="bkDate" min="${minDate}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)" /></div>
      <div class="form-group" style="margin-top:.75rem"><label>Jam</label><select id="bkTime" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)"><option>09:00 — Pagi</option><option>12:00 — Siang</option><option>15:00 — Sore</option><option>18:00 — Petang</option><option>20:00 — Malam</option></select></div>
      <div class="form-group" style="margin-top:.75rem"><label>Lokasi/Platform</label><select id="bkLocation" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)"><option>Online (WhatsApp)</option><option>Online (Discord)</option><option>Online (Zoom)</option><option>Offline — Cafe</option><option>Offline — Mall</option><option>Offline — Taman</option></select></div>
      <div style="display:flex;gap:.75rem;margin-top:1rem">
        <button class="btn-outline" style="flex:1;justify-content:center" onclick="bkPrev(2)"><i class="fas fa-arrow-left"></i> Kembali</button>
        <button class="btn-primary" style="flex:1;justify-content:center" onclick="bkNext(2)">Lanjut <i class="fas fa-arrow-right"></i></button>
      </div>
    </div>
    <div class="booking-step" id="bkStep3">
      <h4 style="font-family:var(--font-display);margin-bottom:1.25rem">3. Data Pemesan</h4>
      <div class="form-group"><label>Nama Lengkap *</label><input type="text" id="bkName" placeholder="Nama lengkapmu" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)" /></div>
      <div class="form-group" style="margin-top:.75rem"><label>WhatsApp *</label><input type="text" id="bkWa" placeholder="08xxxxxxxxxx" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)" /></div>
      <div class="form-group" style="margin-top:.75rem"><label>Catatan</label><textarea id="bkNote" rows="2" placeholder="Pesan untuk talent..." style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);resize:vertical"></textarea></div>
      <div style="padding:.7rem;background:var(--pink-light);border-radius:var(--radius-sm);font-size:.78rem;color:var(--pink-deep);margin:.75rem 0"><i class="fas fa-shield-alt"></i> Data kamu aman & hanya untuk keperluan booking.</div>
      <div style="display:flex;gap:.75rem">
        <button class="btn-outline" style="flex:1;justify-content:center" onclick="bkPrev(3)"><i class="fas fa-arrow-left"></i> Kembali</button>
        <button class="btn-primary glow-btn" style="flex:1;justify-content:center" onclick="submitBookingFinal()"><i class="fas fa-check"></i> Konfirmasi</button>
      </div>
    </div>`;
}

// FIX: Validasi date di step 2, bkTalent null-safe
function bkNext(step){
  if(step===2){const d=document.getElementById('bkDate');if(!d||!d.value){toast('Pilih tanggal dulu!','error');return;}}
  const curr=document.getElementById('bkStep'+step);
  const next=document.getElementById('bkStep'+(step+1));
  if(curr)curr.classList.remove('active');if(next)next.classList.add('active');
  bookingStep=step+1;updateBkProgress();
}
function bkPrev(step){
  const curr=document.getElementById('bkStep'+step);
  const prev=document.getElementById('bkStep'+(step-1));
  if(curr)curr.classList.remove('active');if(prev)prev.classList.add('active');
  bookingStep=step-1;updateBkProgress();
}
function updateBkProgress(){[1,2,3].forEach(i=>{const d=document.getElementById('bp'+i);if(d){d.classList.toggle('active',i===bookingStep);d.classList.toggle('done',i<bookingStep);}});}

function submitBookingFinal(){
  const name=(document.getElementById('bkName')||{}).value||'';
  const wa=(document.getElementById('bkWa')||{}).value||'';
  if(!name.trim()||!wa.trim()){toast('Lengkapi nama dan WhatsApp!','error');return;}
  const{talent,serviceName,servicePrice}=bookingData;
  const serviceEl=document.getElementById('bkService');
  const talentEl=document.getElementById('bkTalent');
  const service=talent?(serviceEl?serviceEl.value:'Chatting'):serviceName;
  // FIX: null-safe talent selection
  let talentName='Ditentukan Admin';
  if(talent){talentName=talent.name;}
  else if(talentEl&&talentEl.value){const sel=getTalents().find(x=>x.id===talentEl.value);talentName=sel?sel.name:'Ditentukan Admin';}
  const date=(document.getElementById('bkDate')||{}).value||new Date().toISOString().split('T')[0];
  const orders=getOrders();
  orders.unshift({id:'ORD'+String(Date.now()).slice(-6),customer:name.trim(),wa:wa.trim(),talent:talentName,service,date,location:(document.getElementById('bkLocation')||{}).value||'Online',note:(document.getElementById('bkNote')||{}).value||'',status:'Menunggu',total:servicePrice||(talent?talent.price:'0'),createdAt:new Date().toISOString()});
  setOrders(orders);closeModal('bookingModal');toast('Booking berhasil dikirim! 🎉','success');
  setTimeout(()=>showNotifModal(`Booking <strong>${service}</strong> dengan <strong>${talentName}</strong> berhasil!<br><br>Konfirmasi dikirim ke WhatsApp <strong>${wa.trim()}</strong> dalam 5–15 menit.`,talent?talent.avatar:'💝'),400);
}

// ── REGISTER ──
function regNext(step){
  if(step===1){const fields=['reg_nama','reg_umur','reg_gender','reg_kota','reg_wa','reg_email'];for(const f of fields){const el=document.getElementById(f);if(!el||!el.value.trim()){toast('Lengkapi semua field *!','error');return;}}const u=document.getElementById('reg_umur');if(u&&+u.value<18){toast('Minimal usia 18 tahun!','error');return;}}
  else if(step===2){const b=document.getElementById('reg_bio');if(!b||b.value.trim().length<20){toast('Bio minimal 20 karakter!','error');return;}}
  goRegStep(step+1);
}
function regPrev(step){goRegStep(step-1);}
function goRegStep(n){
  document.querySelectorAll('.reg-step').forEach(s=>s.classList.remove('active'));
  const s=document.getElementById('regStep'+n);if(s)s.classList.add('active');
  document.querySelectorAll('.step-indicator .step:not(.step-line)').forEach((s,i)=>{s.classList.toggle('active',i+1===n);s.classList.toggle('done',i+1<n);});
  document.querySelectorAll('.step-indicator .step-line').forEach((l,i)=>l.classList.toggle('filled',i+1<n));
}

function submitRegister(){
  const services=Array.from(document.querySelectorAll('.reg-service:checked')).map(c=>c.value);
  const schedule=Array.from(document.querySelectorAll('.reg-schedule:checked')).map(c=>c.value);
  if(!services.length){toast('Pilih minimal 1 layanan!','error');return;}
  if(!schedule.length){toast('Pilih minimal 1 jadwal!','error');return;}
  const talents=getTalents();const newId='t'+String(Date.now()).slice(-5);const pass='talent'+Math.floor(1000+Math.random()*9000);
  const emojis=['🌸','🌺','🌙','⭐','✨','🎵','💫','🦋'];
  const g=f=>document.getElementById(f);
  const newT={id:newId,name:g('reg_nama').value.trim(),nickname:g('reg_panggilan').value.trim(),age:+g('reg_umur').value,gender:g('reg_gender').value,location:g('reg_kota').value.trim(),bio:g('reg_bio').value.trim(),hobbies:'Belum diisi',services,schedule,rating:0,bookings:0,price:'26K',status:'offline',avatar:emojis[Math.floor(Math.random()*emojis.length)],verified:false,pendingApproval:true,ig:g('reg_ig')?g('reg_ig').value:'',tiktok:g('reg_tiktok')?g('reg_tiktok').value:'',username:'talent_'+newId,password:pass,email:g('reg_email').value.trim(),wa:g('reg_wa').value.trim()};
  talents.push(newT);setTalents(talents);
  toast('Pendaftaran berhasil! 🎉','success');
  showNotifModal(`Pendaftaran berhasil!<br><br>Admin akan menghubungi via WhatsApp dalam 1×24 jam.<br><br><strong>Username:</strong> ${newT.username}<br><strong>Password:</strong> ${pass}<br><small style="color:var(--text-muted)">Simpan dengan aman</small>`,'🌟');
  setTimeout(()=>showPage('landing'),3000);
}


// ── DASHBOARD DRAWER (Mobile) ──
function openDashSidebar(type) {
  const sidebar = document.getElementById(type === 'admin' ? 'adminSidebar' : 'talentSidebar');
  const overlay = document.getElementById(type === 'admin' ? 'adminOverlay' : 'talentOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDashSidebar(type) {
  const sidebar = document.getElementById(type === 'admin' ? 'adminSidebar' : 'talentSidebar');
  const overlay = document.getElementById(type === 'admin' ? 'adminOverlay' : 'talentOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close drawer on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDashSidebar('admin');
    closeDashSidebar('talent');
  }
});

// ── AUTH ──
function showLoginModal(){openModal('loginModal');}
function handleLogin(){
  const user=(document.getElementById('loginUser')||{}).value||'';
  const pass=(document.getElementById('loginPass')||{}).value||'';
  if(!user.trim()||!pass.trim()){toast('Isi username dan password!','error');return;}
  if(user==='admin'&&pass==='admin123'){currentUser={role:'admin',name:'Admin Lovia',username:'admin'};lsSet('lovia_session',currentUser);closeModal('loginModal');toast('Selamat datang, Admin! 👑','success');setTimeout(()=>showPage('admin'),500);return;}
  const t=getTalents().find(x=>x.username===user&&x.password===pass);
  if(t){if(t.pendingApproval&&!t.verified){toast('Akunmu masih dalam proses seleksi','error');return;}currentUser={role:'talent',name:t.name,talentId:t.id,username:t.username};lsSet('lovia_session',currentUser);closeModal('loginModal');toast(`Selamat datang, ${t.nickname||t.name}! ✨`,'success');setTimeout(()=>showPage('talent-dash'),500);return;}
  toast('Username atau password salah!','error');
}
function logout(){
  currentUser=null;
  localStorage.removeItem('lovia_session');
  closeDashSidebar('admin');
  closeDashSidebar('talent');
  document.body.style.overflow='';
  toast('Berhasil logout! 👋','info');
  setTimeout(()=>showPage('landing'),300);
}

// ── ADMIN ──
function renderAdminDash(){showAdminTab('overview');}
function showAdminTab(tab){
  // Close drawer on mobile
  closeDashSidebar('admin');
  // Hide all tabs
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  const el=document.getElementById('admin-tab-'+tab);if(el)el.classList.add('active');
  // Update active link
  document.querySelectorAll('#adminSidebar .db-link').forEach(l=>{
    const onclick=l.getAttribute('onclick')||'';
    l.classList.toggle('active', onclick.includes("'"+tab+"'"));
  });
  const c=document.getElementById('admin-tab-'+tab);if(!c)return;
  if(tab==='overview')renderAdminOverview(c);
  else if(tab==='talents')renderAdminTalents(c);
  else if(tab==='orders')renderAdminOrders(c);
  else if(tab==='pricelist')renderAdminPricelist(c);
  else if(tab==='testimonials')renderAdminTestimonials(c);
  else if(tab==='settings')renderAdminSettings(c);
  // Scroll content to top
  const content=document.getElementById('adminContent');
  if(content)content.scrollTop=0;
}

function renderAdminOverview(el){
  const talents=getTalents(),orders=getOrders(),pending=talents.filter(t=>t.pendingApproval);
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem;flex-wrap:wrap;gap:.75rem">
      <div><h2 style="font-family:var(--font-display);font-size:1.5rem">Selamat datang, Admin! 👑</h2><p style="color:var(--text-muted);font-size:.83rem">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
      <div style="display:flex;gap:.6rem"><button class="btn-sm" onclick="showAdminTab('talents')"><i class="fas fa-users"></i> Kelola Talent</button><button class="btn-primary" onclick="showAdminTab('orders')"><i class="fas fa-shopping-bag"></i> Pesanan</button></div>
    </div>
    <div class="dash-grid-4">
      <div class="dash-stat-card" style="border-top:3px solid var(--pink-deep)"><div class="dsc-icon">👥</div><div class="dsc-val">${talents.length}</div><div class="dsc-label">Total Talent</div></div>
      <div class="dash-stat-card" style="border-top:3px solid #48bb78"><div class="dsc-icon">🟢</div><div class="dsc-val">${talents.filter(t=>t.status==='online').length}</div><div class="dsc-label">Talent Online</div></div>
      <div class="dash-stat-card" style="border-top:3px solid #f59e0b"><div class="dsc-icon">📦</div><div class="dsc-val">${orders.length}</div><div class="dsc-label">Total Order</div></div>
      <div class="dash-stat-card" style="border-top:3px solid var(--purple-deep)"><div class="dsc-icon">⏳</div><div class="dsc-val">${pending.length}</div><div class="dsc-label">Pending Daftar</div></div>
    </div>
    <div class="admin-2col-grid">
      <div class="dash-section"><h3>📋 Pendaftar Baru</h3>${pending.length?pending.map(t=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--border)"><div style="display:flex;align-items:center;gap:.6rem"><span style="font-size:1.4rem">${t.avatar}</span><div><strong style="font-size:.85rem">${t.name}</strong><div style="font-size:.75rem;color:var(--text-muted)">${t.location} · ${t.age}thn</div></div></div><div style="display:flex;gap:.3rem"><button class="btn-sm" onclick="approveTalent('${t.id}')" style="border-color:#48bb78;color:#48bb78;padding:.3rem .6rem">✓</button><button class="btn-sm" onclick="rejectTalent('${t.id}')" style="border-color:#ef4444;color:#ef4444;padding:.3rem .6rem">✗</button></div></div>`).join(''):'<p style="color:var(--text-muted);font-size:.85rem">Tidak ada pendaftar baru</p>'}</div>
      <div class="dash-section"><h3>📈 Statistik Pesanan</h3><div style="font-size:.85rem;display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between"><span>Menunggu</span><strong style="color:#d97706">${orders.filter(o=>o.status==='Menunggu').length}</strong></div><div style="display:flex;justify-content:space-between"><span>Aktif</span><strong style="color:#059669">${orders.filter(o=>o.status==='Aktif').length}</strong></div><div style="display:flex;justify-content:space-between"><span>Selesai</span><strong style="color:#2563eb">${orders.filter(o=>o.status==='Selesai').length}</strong></div><div style="display:flex;justify-content:space-between"><span>Ditolak</span><strong style="color:#dc2626">${orders.filter(o=>o.status==='Ditolak').length}</strong></div></div></div>
    </div>`;
}

function renderAdminTalents(el){
  const talents=getTalents();
  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem"><h2 style="font-family:var(--font-display)">Kelola Talent 👥</h2><div class="search-wrap" style="min-width:220px"><i class="fas fa-search"></i><input type="text" placeholder="Cari nama / kota..." oninput="adminSearchTalent(this.value)" /></div></div>
    <div class="dash-section"><div class="table-scroll"><table class="admin-table"><thead><tr><th>Talent</th><th>Kota</th><th>Status</th><th>Rating</th><th>Verified</th><th>Pending</th><th>Aksi</th></tr></thead><tbody id="adminTalentRows">${buildTalentRows(talents)}</tbody></table></div></div>`;
}

function buildTalentRows(talents){
  return talents.map(t=>{
    const photoUrl=getTalentPhotoUrl(t.id);
    const grad=TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
    const avatarHtml=photoUrl?`<img src="${photoUrl}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`:`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center;font-size:1.2rem">${t.avatar}</div>`;
    return `<tr><td><div style="display:flex;align-items:center;gap:.6rem">${avatarHtml}<div><strong>${t.name}</strong><br><small style="color:var(--text-muted)">${t.age}thn·${t.gender}·<em>${t.username}</em></small></div></div></td><td>${t.location}</td><td><span class="status-badge ${t.status==='online'?'badge-active':t.status==='busy'?'badge-pending':'badge-rejected'}">${t.status}</span></td><td>⭐${t.rating||'—'}</td><td>${t.verified?'<span style="color:#48bb78">✓</span>':'<span style="color:var(--text-muted)">—</span>'}</td><td>${t.pendingApproval?'<span style="color:#d97706">⏳</span>':'<span style="color:var(--text-muted)">—</span>'}</td><td><div style="display:flex;gap:.3rem;flex-wrap:wrap"><button class="btn-sm" onclick="toggleVerify('${t.id}')">${t.verified?'Unverify':'Verify'}</button>${t.pendingApproval?`<button class="btn-sm" onclick="approveTalent('${t.id}')" style="border-color:#48bb78;color:#48bb78">OK</button>`:''}<button class="btn-sm" onclick="deleteTalent('${t.id}')" style="border-color:#ef4444;color:#ef4444">Del</button></div></td></tr>`;
  }).join('');
}

function adminSearchTalent(q){const r=document.getElementById('adminTalentRows');if(r)r.innerHTML=buildTalentRows(getTalents().filter(t=>t.name.toLowerCase().includes(q.toLowerCase())||t.location.toLowerCase().includes(q.toLowerCase())));}

function renderAdminOrders(el){
  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem"><h2 style="font-family:var(--font-display)">Kelola Pesanan 📦</h2><select onchange="filterAdminOrders(this.value)" style="padding:.45rem .85rem;border:1px solid var(--border);border-radius:50px;background:var(--bg);color:var(--text);font-size:.83rem"><option value="">Semua Status</option><option>Menunggu</option><option>Aktif</option><option>Selesai</option><option>Ditolak</option></select></div>
    <div class="dash-section"><div class="table-scroll" id="ordersTableWrap">${ordersTable(getOrders(),true)}</div></div>`;
}
function filterAdminOrders(status){const orders=status?getOrders().filter(o=>o.status===status):getOrders();const w=document.getElementById('ordersTableWrap');if(w)w.innerHTML=ordersTable(orders,true);}
function ordersTable(orders,editable=false){
  return `<table class="admin-table"><thead><tr><th>ID</th><th>Customer</th><th>Talent</th><th>Layanan</th><th>Tanggal</th><th>Total</th><th>Status</th>${editable?'<th>Ubah</th>':''}</tr></thead><tbody>${orders.map(o=>`<tr><td style="font-size:.72rem;color:var(--text-muted);font-family:monospace">${o.id}</td><td><strong>${o.customer}</strong>${o.wa?`<br><small style="color:var(--text-muted)">${o.wa}</small>`:''}</td><td>${o.talent}</td><td style="font-size:.82rem">${o.service}</td><td style="font-size:.82rem">${o.date}</td><td style="font-weight:700;color:var(--pink-deep)">Rp ${o.total}</td><td><span class="status-badge ${o.status==='Selesai'?'badge-done':o.status==='Aktif'?'badge-active':o.status==='Ditolak'?'badge-rejected':'badge-pending'}">${o.status}</span></td>${editable?`<td><select style="font-size:.78rem;border:1px solid var(--border);border-radius:8px;padding:.3rem .5rem;background:var(--bg);color:var(--text)" onchange="updateOrderStatus('${o.id}',this.value)"><option ${o.status==='Menunggu'?'selected':''}>Menunggu</option><option ${o.status==='Aktif'?'selected':''}>Aktif</option><option ${o.status==='Selesai'?'selected':''}>Selesai</option><option ${o.status==='Ditolak'?'selected':''}>Ditolak</option></select></td>`:''}</tr>`).join('')}</tbody></table>`;
}
function updateOrderStatus(id,status){const orders=getOrders();const i=orders.findIndex(o=>o.id===id);if(i>=0){orders[i].status=status;setOrders(orders);toast('Status diperbarui ✓','success');}}

function renderAdminPricelist(el){
  const pl=getPricelist();
  const cats=[['chatting','💬 Chatting'],['calling','📞 Calling'],['videocall','🎥 Video Call'],['offline','📍 Offline Date'],['pap','📸 PAP'],['mabar','🎮 Mabar']];
  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem"><h2 style="font-family:var(--font-display)">Kelola Pricelist 💰</h2><span style="font-size:.8rem;color:var(--text-muted)">Edit langsung → tersimpan otomatis</span></div>
    ${cats.map(([cat,label])=>`<div class="dash-section"><h3 style="display:flex;align-items:center;justify-content:space-between">${label}<button class="btn-sm" onclick="addPrice('${cat}')"><i class="fas fa-plus"></i> Tambah</button></h3><div class="table-scroll"><table class="admin-table"><thead><tr><th>Label</th><th>Harga (Rp)</th><th>Populer</th><th>Hapus</th></tr></thead><tbody>${(pl[cat]||[]).map((item,i)=>`<tr><td><input type="text" value="${item.label}" onchange="updatePrice('${cat}',${i},'label',this.value)" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.3rem .6rem;width:100%;color:var(--text);font-size:.83rem"/></td><td><input type="text" value="${item.price}" onchange="updatePrice('${cat}',${i},'price',this.value)" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.3rem .6rem;width:120px;color:var(--text);font-size:.83rem"/></td><td style="text-align:center"><input type="checkbox" ${item.popular?'checked':''} onchange="updatePrice('${cat}',${i},'popular',this.checked)"/></td><td><button class="btn-sm" onclick="deletePrice('${cat}',${i})" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div></div>`).join('')}`;
}
function updatePrice(cat,i,field,val){const pl=getPricelist();if(!pl[cat]||!pl[cat][i])return;pl[cat][i][field]=field==='popular'?Boolean(val):val;setPricelist(pl);toast('Tersimpan ✓','success');}
function deletePrice(cat,i){const pl=getPricelist();pl[cat].splice(i,1);setPricelist(pl);renderAdminPricelist(document.getElementById('admin-tab-pricelist'));toast('Dihapus','info');}
function addPrice(cat){const pl=getPricelist();if(!pl[cat])pl[cat]=[];pl[cat].push({label:'Item Baru',price:'0',popular:false});setPricelist(pl);renderAdminPricelist(document.getElementById('admin-tab-pricelist'));}

function renderAdminTestimonials(el){
  const ts=getTestimonials();
  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem"><h2 style="font-family:var(--font-display)">Kelola Testimoni ⭐</h2></div>
    <div class="dash-section"><div class="table-scroll"><table class="admin-table"><thead><tr><th>User</th><th>Rating</th><th>Teks</th><th>Layanan</th><th>Aksi</th></tr></thead><tbody>${ts.map((t,i)=>`<tr><td>${t.avatar} <strong>${t.name}</strong></td><td>${'⭐'.repeat(t.rating)}</td><td style="max-width:200px;font-size:.78rem;color:var(--text-sec)">${t.text.slice(0,90)}...</td><td><span class="testi-service">${t.service}</span></td><td><button class="btn-sm" onclick="deleteTestimonial(${i})" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function deleteTestimonial(i){const ts=getTestimonials();ts.splice(i,1);setTestimonials(ts);renderAdminTestimonials(document.getElementById('admin-tab-testimonials'));toast('Dihapus','info');}

function renderAdminSettings(el){
  el.innerHTML=`<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Pengaturan ⚙️</h2>
    <div class="admin-2col-grid">
      <div class="dash-section"><h3>🔐 Akun Admin</h3><div style="font-size:.88rem;display:flex;flex-direction:column;gap:.5rem"><div>Username: <strong>admin</strong></div><div>Password: <strong>admin123</strong></div><div>Role: <strong>Super Admin</strong></div></div></div>
      <div class="dash-section"><h3>📊 Platform</h3><div style="font-size:.88rem;display:flex;flex-direction:column;gap:.5rem"><div>Versi: <strong>Lovia Partner v2.1</strong></div><div>Storage: <strong>LocalStorage</strong></div><div>Deploy: <strong>GitHub Pages Ready</strong></div></div></div>
      <div class="dash-section"><h3>🎨 Tema</h3><div style="display:flex;gap:.75rem"><button class="btn-sm" onclick="document.documentElement.setAttribute('data-theme','light');localStorage.setItem('lovia_theme','light');updateThemeIcon('light');toast('Terang aktif','info')">☀️ Terang</button><button class="btn-sm" onclick="document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('lovia_theme','dark');updateThemeIcon('dark');toast('Gelap aktif','info')">🌙 Gelap</button></div></div>
      <div class="dash-section"><h3>🗑️ Reset Data</h3><p style="font-size:.82rem;color:var(--text-muted);margin-bottom:1rem">Reset semua data ke kondisi awal</p><button class="btn-outline" onclick="resetData()" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-redo"></i> Reset Semua</button></div>
      <div class="dash-section" style="grid-column:1/-1"><h3>📸 Panduan Foto Talent (Google Drive)</h3>
        <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:.75rem">Edit objek <code style="background:var(--bg);padding:.1rem .4rem;border-radius:4px">TALENT_PHOTOS</code> di <strong>app.js</strong> untuk menambahkan foto dari Google Drive.</p>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;font-family:monospace;font-size:.77rem;line-height:1.9">
          📁 Folder Wanita ID: <strong>1f45BbsmdGuTKjgiyz75H9wGbDEVWDhQB</strong><br>
          📁 Folder Pria ID: <strong>1lXAU4agkP_xI-xzvjGFG8OBsErQMc4o-</strong><br>
          🔗 Format URL: <code>https://drive.google.com/thumbnail?id=FILE_ID&sz=w400</code><br>
          ✏️ Contoh pengisian: <code>main: GDRIVE_BASE + 'abc123xyz' + GDRIVE_SZ</code>
        </div>
      </div>
    </div>`;
}

function resetData(){if(confirm('Reset semua data?\nTidak bisa dibatalkan.')){['lovia_talents','lovia_orders','lovia_pricelist','lovia_testimonials'].forEach(k=>localStorage.removeItem(k));toast('Data direset!','info');renderAdminDash();}}
function approveTalent(id){const t=getTalents();const i=t.findIndex(x=>x.id===id);if(i>=0){t[i].pendingApproval=false;t[i].verified=true;setTalents(t);}toast('Talent disetujui ✓','success');renderAdminDash();}
function rejectTalent(id){const t=getTalents();const i=t.findIndex(x=>x.id===id);if(i>=0){t[i].pendingApproval=false;t[i].verified=false;setTalents(t);}toast('Talent ditolak','info');renderAdminDash();}
function toggleVerify(id){const t=getTalents();const i=t.findIndex(x=>x.id===id);if(i>=0){t[i].verified=!t[i].verified;setTalents(t);}toast('Verifikasi diperbarui!','info');renderAdminTalents(document.getElementById('admin-tab-talents'));}
function deleteTalent(id){if(!confirm('Hapus talent ini?'))return;setTalents(getTalents().filter(t=>t.id!==id));toast('Talent dihapus','info');renderAdminTalents(document.getElementById('admin-tab-talents'));}

// ── TALENT DASHBOARD ──
function renderTalentDash(){
  showTalentTab('overview');
  // Update topbar user name
  const tId = currentUser ? currentUser.talentId : null;
  const t = tId ? getTalents().find(x => x.id === tId) : null;
  const el = document.getElementById('talentTopbarUser');
  if (el && t) el.textContent = (t.avatar || '✨') + ' ' + (t.nickname || t.name);
}
function showTalentTab(tab){
  // Close drawer on mobile
  closeDashSidebar('talent');
  // Hide all tabs
  document.querySelectorAll('.talent-tab').forEach(t=>t.classList.remove('active'));
  const el=document.getElementById('talent-tab-'+tab);if(el)el.classList.add('active');
  // Update active link
  document.querySelectorAll('#talentSidebar .db-link').forEach(l=>{
    const onclick=l.getAttribute('onclick')||'';
    l.classList.toggle('active', onclick.includes("'"+tab+"'"));
  });
  const tId=currentUser?currentUser.talentId:null;
  const t=tId?getTalents().find(x=>x.id===tId):getTalents()[0];
  const c=document.getElementById('talent-tab-'+tab);if(!c)return;
  if(tab==='overview')renderTalentOverview(c,t);
  else if(tab==='orders')renderTalentOrders(c,t);
  else if(tab==='profile')renderTalentProfile(c,t);
  else if(tab==='earnings')renderTalentEarnings(c,t);
  // Scroll content to top
  const content=document.getElementById('talentContent');
  if(content)content.scrollTop=0;
}

function renderTalentOverview(el,t){
  if(!t){el.innerHTML='<p style="padding:2rem;color:var(--text-muted)">Data tidak ditemukan</p>';return;}
  const myOrders=getOrders().filter(o=>o.talent===t.name);
  const photoUrl=getTalentPhotoUrl(t.id);
  const grad=TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem">
      <div><h2 style="font-family:var(--font-display)">Halo, ${t.nickname||t.name}! ${t.avatar}</h2><p style="color:var(--text-muted);font-size:.83rem">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}</p></div>
      <button class="btn-sm ${t.status==='online'?'':'btn-primary'}" onclick="toggleTalentStatus('${t.id}')" style="${t.status==='online'?'border-color:#48bb78;color:#48bb78':''}">${t.status==='online'?'🟢 Online — klik Offline':'⚫ Offline — klik Online'}</button>
    </div>
    <div class="dash-grid-4">
      <div class="dash-stat-card" style="border-top:3px solid var(--pink-deep)"><div class="dsc-icon">📦</div><div class="dsc-val">${myOrders.length}</div><div class="dsc-label">Total Booking</div></div>
      <div class="dash-stat-card" style="border-top:3px solid #f59e0b"><div class="dsc-icon">⏳</div><div class="dsc-val">${myOrders.filter(o=>o.status==='Menunggu').length}</div><div class="dsc-label">Menunggu</div></div>
      <div class="dash-stat-card" style="border-top:3px solid #48bb78"><div class="dsc-icon">✅</div><div class="dsc-val">${myOrders.filter(o=>o.status==='Aktif').length}</div><div class="dsc-label">Aktif</div></div>
      <div class="dash-stat-card" style="border-top:3px solid #2563eb"><div class="dsc-icon">🏅</div><div class="dsc-val">${myOrders.filter(o=>o.status==='Selesai').length}</div><div class="dsc-label">Selesai</div></div>
    </div>
    <div class="admin-2col-grid" style="margin-bottom:1rem">
      <div class="dash-section" style="background:linear-gradient(135deg,var(--pink-light),var(--purple-light))">
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center">
            ${photoUrl?`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:2rem">${t.avatar}</span>`}
          </div>
          <div><div style="font-family:var(--font-display);font-size:1.1rem">${t.name}</div><div style="font-size:.8rem;color:var(--text-muted);margin:.3rem 0">⭐ ${t.rating} · 📍 ${t.location}</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.75rem">${(t.services||[]).map(s=>`<span style="padding:.2rem .6rem;background:rgba(255,255,255,.5);border-radius:50px;font-size:.7rem">${s}</span>`).join('')}</div>
      </div>
      <div class="dash-section"><h3 style="font-size:1rem;margin-bottom:1rem">⚡ Aksi Cepat</h3>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          <button class="btn-sm" onclick="showTalentTab('orders')" style="justify-content:flex-start;gap:.6rem"><i class="fas fa-calendar-check"></i> Lihat Booking</button>
          <button class="btn-sm" onclick="showTalentTab('profile')" style="justify-content:flex-start;gap:.6rem"><i class="fas fa-user-edit"></i> Edit Profil</button>
          <button class="btn-sm" onclick="showTalentTab('earnings')" style="justify-content:flex-start;gap:.6rem"><i class="fas fa-wallet"></i> Pendapatan</button>
          <button class="btn-sm" onclick="toggleTalentStatus('${t.id}')" style="justify-content:flex-start;gap:.6rem;${t.status==='online'?'border-color:#ef4444;color:#ef4444':'border-color:#48bb78;color:#48bb78'}">${t.status==='online'?'<i class="fas fa-moon"></i> Set Offline':'<i class="fas fa-circle"></i> Set Online'}</button>
        </div>
      </div>
    </div>
    <div class="dash-section"><h3>📅 Booking Terbaru</h3>${myOrders.length?`<div class="table-scroll">${ordersTable(myOrders.slice(0,5))}</div>`:'<div style="text-align:center;padding:2rem;color:var(--text-muted)"><div style="font-size:2rem">📭</div><p>Belum ada booking</p></div>'}</div>`;
}

function toggleTalentStatus(id){
  const talents=getTalents();const i=talents.findIndex(x=>x.id===id);
  if(i>=0){talents[i].status=talents[i].status==='online'?'offline':'online';setTalents(talents);toast(`Status: ${talents[i].status}`,'info');}
  renderTalentDash();
}

function renderTalentOrders(el,t){
  if(!t){el.innerHTML='<p style="padding:2rem">Data tidak ditemukan</p>';return;}
  const myOrders=getOrders().filter(o=>o.talent===t.name);
  el.innerHTML=`<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Daftar Booking 📅</h2><div class="dash-section">${myOrders.length?`<div class="table-scroll">${ordersTable(myOrders)}</div>`:'<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem">📭</div><p>Belum ada booking</p></div>'}</div>`;
}

function renderTalentProfile(el,t){
  if(!t){el.innerHTML='<p>Data tidak ditemukan</p>';return;}
  const photoUrl=getTalentPhotoUrl(t.id);const grad=TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  el.innerHTML=`<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Edit Profil ✏️</h2>
    <div class="admin-2col-grid">
      <div class="dash-section">
        <div style="text-align:center;padding:1.5rem;background:linear-gradient(135deg,var(--pink-light),var(--purple-light));border-radius:var(--radius);margin-bottom:1.25rem">
          <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto .75rem;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center">
            ${photoUrl?`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:2.5rem">${t.avatar}</span>`}
          </div>
          <h3 style="font-family:var(--font-display)">${t.name}</h3>
          <p style="color:var(--text-muted);font-size:.82rem;margin:.3rem 0">${t.location} · ${t.gender} · ${t.age} thn</p>
          <span class="status-badge ${t.verified?'badge-active':'badge-pending'}">${t.verified?'✓ Verified':'⏳ Menunggu'}</span>
        </div>
        <h3 style="font-size:.95rem;margin-bottom:.75rem">🔐 Kredensial Login</h3>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.85rem;font-size:.83rem">
          <div style="margin-bottom:.4rem">Username: <strong>${t.username}</strong></div>
          <div>Password: <strong>${t.password}</strong></div>
        </div>
        <p style="font-size:.75rem;color:var(--text-muted);margin-top:.5rem">⚠️ Simpan data login dengan aman</p>
      </div>
      <div class="dash-section">
        <h3 style="font-size:.95rem;margin-bottom:1rem">📝 Edit Info</h3>
        <div class="form-group"><label>Bio</label><textarea rows="3" id="editBio" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem;resize:vertical">${t.bio}</textarea></div>
        <div class="form-group" style="margin-top:.75rem"><label>Hobi</label><input type="text" id="editHobi" value="${t.hobbies||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem"/></div>
        <div class="form-group" style="margin-top:.75rem"><label>Instagram</label><input type="text" id="editIg" value="${t.ig||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem"/></div>
        <div class="form-group" style="margin-top:.75rem"><label>TikTok</label><input type="text" id="editTiktok" value="${t.tiktok||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem"/></div>
        <button class="btn-primary" style="margin-top:1.25rem;width:100%;justify-content:center" onclick="saveTalentProfile('${t.id}')"><i class="fas fa-save"></i> Simpan Perubahan</button>
      </div>
    </div>`;
}

function saveTalentProfile(id){
  const t=getTalents();const i=t.findIndex(x=>x.id===id);
  if(i>=0){const b=document.getElementById('editBio');const h=document.getElementById('editHobi');const ig=document.getElementById('editIg');const tk=document.getElementById('editTiktok');if(b)t[i].bio=b.value;if(h)t[i].hobbies=h.value;if(ig)t[i].ig=ig.value;if(tk)t[i].tiktok=tk.value;setTalents(t);}
  toast('Profil tersimpan! ✓','success');
}

function renderTalentEarnings(el,t){
  if(!t){el.innerHTML='<p>Data tidak ditemukan</p>';return;}
  const done=getOrders().filter(o=>o.talent===t.name&&o.status==='Selesai');
  let total=0;done.forEach(o=>{const raw=(o.total||'').replace(/\./g,'').replace(/[^0-9]/g,'');total+=parseInt(raw||0,10);});
  el.innerHTML=`<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Pendapatan 💰</h2>
    <div class="dash-grid-4">
      <div class="dash-stat-card" style="background:linear-gradient(135deg,var(--pink-light),var(--purple-light));border:none"><div class="dsc-icon">💵</div><div class="dsc-val" style="font-size:1.2rem">Rp ${total.toLocaleString('id-ID')}</div><div class="dsc-label">Total Pendapatan</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">📊</div><div class="dsc-val">${done.length}</div><div class="dsc-label">Order Selesai</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">⭐</div><div class="dsc-val">${t.rating}</div><div class="dsc-label">Rating</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">🏅</div><div class="dsc-val">${t.bookings}</div><div class="dsc-label">All Time Booking</div></div>
    </div>
    <div class="dash-section"><h3>📋 Histori Order Selesai</h3>${done.length?`<div class="table-scroll">${ordersTable(done)}</div>`:'<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem">💰</div><p>Belum ada pendapatan</p></div>'}</div>`;
}

// ── MODALS ──
function openModal(id){const el=document.getElementById(id);if(el)el.classList.add('open');}
function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('open');}
function showNotifModal(msg,icon='🎉'){
  const c=document.getElementById('notifContent');
  if(c)c.innerHTML=`<div style="text-align:center;padding:1rem"><div style="font-size:3.5rem;margin-bottom:1rem">${icon}</div><p style="font-size:.9rem;line-height:1.7;color:var(--text-sec)">${msg}</p><div style="margin-top:1.25rem;padding:.85rem;background:var(--pink-light);border-radius:var(--radius-sm);font-size:.8rem;color:var(--pink-deep);display:flex;align-items:center;gap:.5rem;justify-content:center"><i class="fab fa-whatsapp"></i> Konfirmasi dikirim via WhatsApp dalam 5–15 menit</div></div>`;
  openModal('notifModal');
}

function toast(msg,type='info'){
  const c=document.getElementById('toastContainer');if(!c)return;
  const el=document.createElement('div');el.className='toast '+type;
  el.innerHTML=`<span>${{success:'✅',error:'❌',info:'ℹ️'}[type]||'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(120%)';el.style.transition='all .4s';setTimeout(()=>el.remove(),400);},3200);
}

function toggleMusic(){
  musicPlaying=!musicPlaying;
  const icon=document.getElementById('musicIcon');const btn=document.getElementById('floatMusic');
  if(icon)icon.className=musicPlaying?'fas fa-pause':'fas fa-music';
  if(btn)btn.classList.toggle('playing',musicPlaying);
  toast(musicPlaying?'🎵 Ambient music diputar...':'🎵 Musik dimatikan','info');
}

function schedulePopup(){
  const msgs=[{icon:'🌸',title:'Ara online!',body:'Talent favoritmu siap menemanimu'},{icon:'🎉',title:'Booking masuk!',body:'Platform makin ramai, yuk pilih talent'},{icon:'💌',title:'Promo spesial!',body:'Diskon 20% untuk PDKT Package'},{icon:'🎮',title:'Kira siap Mabar!',body:'Pro gamer online sekarang'}];
  let i=0;
  function next(){if(currentPage==='admin'||currentPage==='talent-dash'){setTimeout(next,15000);return;}const m=msgs[i++%msgs.length];showPopup(m.icon,m.title,m.body);setTimeout(next,18000+Math.random()*10000);}
  setTimeout(next,10000);
}

function showPopup(icon,title,body){
  let p=document.getElementById('globalPopup');
  if(!p){p=document.createElement('div');p.id='globalPopup';p.className='popup-notif';p.innerHTML=`<div class="popup-notif-header"><div class="popup-notif-title"><span id="pnIcon"></span><span id="pnTitle"></span></div><span class="popup-notif-close" onclick="this.parentElement.parentElement.classList.remove('show')">✕</span></div><p id="pnBody"></p>`;document.body.appendChild(p);}
  const pi=document.getElementById('pnIcon'),pt=document.getElementById('pnTitle'),pb=document.getElementById('pnBody');
  if(pi)pi.textContent=icon+' ';if(pt)pt.textContent=title;if(pb)pb.textContent=body;
  p.classList.add('show');setTimeout(()=>p.classList.remove('show'),5500);
}

