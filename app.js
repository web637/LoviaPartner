'use strict';

// ══════════════════════════════════════════════════════
//  FOTO TALENT — Google Drive Thumbnail System
// ══════════════════════════════════════════════════════

const G = id => id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : null;

const PHOTO_IDS = {
  't001': { main: null, gallery: [null, null, null] },
  't002': { main: null, gallery: [null, null, null] },
  't003': { main: null, gallery: [null, null, null] },
  't004': { main: null, gallery: [null, null, null] },
  't005': { main: null, gallery: [null, null, null] },
  't006': { main: null, gallery: [null, null, null] },
  't007': { main: null, gallery: [null, null, null] },
  't008': { main: null, gallery: [null, null, null] },
  't009': { main: null, gallery: [null, null, null] },
  't010': { main: null, gallery: [null, null, null] },
  't011': { main: null, gallery: [null, null, null] },
};

const TALENT_PHOTOS = Object.fromEntries(
  Object.entries(PHOTO_IDS).map(([id, p]) => [id, {
    main:    G(p.main),
    gallery: (p.gallery||[]).map(G)
  }])
);

const TALENT_GRADIENTS = {
  't001': ['#fce4ed','#e8a4c0'], 't002': ['#ede4fc','#b0a0e8'],
  't003': ['#fce4f0','#f8a0c8'], 't004': ['#e4ecfc','#a0b0e8'],
  't005': ['#fce4f8','#d8a0e8'], 't006': ['#fce8e4','#f0a890'],
  't007': ['#f8fce4','#c8d890'], 't008': ['#fce8f4','#e4a8d0'],
  't009': ['#e4fce8','#90d8a0'], 't010': ['#e4f8fc','#90c8d8'],
  't011': ['#f8e4e4','#e09090'],
};

// ══════════════════════════════════════════════════════
//  FIREBASE HELPERS — Real-time Database
// ══════════════════════════════════════════════════════

// Cache lokal agar UI tetap responsif
let _talentsCache  = null;
let _ordersCache   = null;
let _priceCache    = null;
let _testiCache    = null;
let _photosCache   = {};

// Listener aktif untuk auto-refresh UI
function initFirebaseListeners() {
  // ── TALENTS ──
  db.ref('talents').on('value', snap => {
    const val = snap.val();
    if (val) {
      _talentsCache = Object.values(val);
    } else {
      // Jika database kosong, seed dari DEFAULT
      _talentsCache = DEFAULT_TALENTS;
      DEFAULT_TALENTS.forEach(t => db.ref('talents/' + t.id).set(t));
    }
    // Refresh UI jika ada halaman yang terbuka
    const talentGrid = document.getElementById('talentGrid');
    if (talentGrid && talentGrid.children.length > 0) renderTalents();
    const showcase = document.getElementById('talentShowcase');
    if (showcase && showcase.children.length > 0) renderShowcase();
  });

  // ── ORDERS ──
  db.ref('orders').on('value', snap => {
    const val = snap.val();
    _ordersCache = val ? Object.values(val).sort((a,b) => (b.createdAt||0)-(a.createdAt||0)) : DEFAULT_ORDERS;
    if (!val) {
      DEFAULT_ORDERS.forEach(o => db.ref('orders/' + o.id).set(o));
    }
  });

  // ── PRICELIST ──
  db.ref('pricelist').on('value', snap => {
    const val = snap.val();
    if (val) {
      _priceCache = val;
    } else {
      _priceCache = DEFAULT_PRICELIST;
      db.ref('pricelist').set(DEFAULT_PRICELIST);
    }
  });

  // ── TESTIMONIALS ──
  db.ref('testimonials').on('value', snap => {
    const val = snap.val();
    if (val) {
      _testiCache = Object.values(val);
    } else {
      _testiCache = DEFAULT_TESTIMONIALS;
      DEFAULT_TESTIMONIALS.forEach((t,i) => db.ref('testimonials/t'+i).set(t));
    }
    const tGrid = document.getElementById('testimonialsGrid');
    if (tGrid && tGrid.children.length > 0) renderTestimonials();
  });

  // ── CUSTOM PHOTOS ──
  db.ref('customPhotos').on('value', snap => {
    _photosCache = snap.val() || {};
  });
}

// ── GETTER/SETTER FIREBASE ──

function getTalents() {
  return _talentsCache || DEFAULT_TALENTS;
}

function setTalents(arr) {
  _talentsCache = arr;
  // Simpan ke Firebase sebagai map id -> data
  const map = {};
  arr.forEach(t => { map[t.id] = t; });
  db.ref('talents').set(map).catch(e => console.error('setTalents error:', e));
}

function updateTalent(id, updates) {
  _talentsCache = (_talentsCache || DEFAULT_TALENTS).map(t => t.id===id ? {...t,...updates} : t);
  db.ref('talents/' + id).update(updates).catch(e => console.error('updateTalent error:', e));
}

function getOrders() {
  return _ordersCache || DEFAULT_ORDERS;
}

function setOrders(arr) {
  _ordersCache = arr;
  const map = {};
  arr.forEach(o => { map[o.id] = o; });
  db.ref('orders').set(map).catch(e => console.error('setOrders error:', e));
}

function addOrder(order) {
  _ordersCache = [order, ...(_ordersCache || [])];
  db.ref('orders/' + order.id).set(order).catch(e => console.error('addOrder error:', e));
}

function updateOrderStatus(id, status) {
  _ordersCache = (_ordersCache || []).map(o => o.id===id ? {...o, status} : o);
  db.ref('orders/' + id + '/status').set(status)
    .then(() => toast('Status diperbarui ✓', 'success'))
    .catch(e => { console.error(e); toast('Gagal update status', 'error'); });
}

function getTestimonials() {
  return _testiCache || DEFAULT_TESTIMONIALS;
}

function setTestimonials(arr) {
  _testiCache = arr;
  const map = {};
  arr.forEach((t,i) => { map['t'+i] = t; });
  db.ref('testimonials').set(map).catch(e => console.error('setTestimonials error:', e));
}

function getPricelist() {
  return _priceCache || DEFAULT_PRICELIST;
}

function setPricelist(pl) {
  _priceCache = pl;
  db.ref('pricelist').set(pl).catch(e => console.error('setPricelist error:', e));
}

// ── CUSTOM PHOTOS via Firebase DB (bukan localStorage lagi) ──
function getCustomPhotos() {
  return _photosCache || {};
}

function getCustomPhotoData(talentId) {
  return (_photosCache || {})[talentId] || { main: null, gallery: [null, null] };
}

function saveCustomPhotoData(talentId, data) {
  if (!_photosCache) _photosCache = {};
  _photosCache[talentId] = data;
  db.ref('customPhotos/' + talentId).set(data).catch(e => console.error('saveCustomPhotoData error:', e));
}

// ── PHOTO UPLOAD ke Firebase Storage ──
async function uploadPhotoToStorage(file, talentId, slotType, slotIdx) {
  const ext = file.name.split('.').pop();
  const path = `talent-photos/${talentId}/${slotType}${slotIdx >= 0 ? '_'+slotIdx : ''}.${ext}`;
  const ref = storage.ref(path);
  toast('Mengupload foto...', 'info');
  try {
    const snap = await ref.put(file);
    const url = await snap.ref.getDownloadURL();
    return url;
  } catch(e) {
    console.error('Upload error:', e);
    toast('Gagal upload ke server, simpan lokal saja', 'error');
    // Fallback ke base64 local
    return null;
  }
}

// ══════════════════════════════════════════════════════
//  GOOGLE DRIVE HELPERS
// ══════════════════════════════════════════════════════
function extractDriveId(input) {
  if (!input) return null;
  input = input.trim();
  let m = input.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]{20,})/);
  if (m) return m[1];
  m = input.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  return null;
}

function driveUrlFromInput(input) {
  if (!input) return null;
  const id = extractDriveId(input);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  if (input.startsWith('http')) return input;
  return null;
}

function getTalentPhotoUrl(id) {
  const custom = getCustomPhotoData(id);
  if (custom.main) return custom.main;
  const p = TALENT_PHOTOS[id];
  return (p && p.main) ? p.main : null;
}

function getTalentGallery(id) {
  const custom = getCustomPhotoData(id);
  const customGallery = custom.gallery || [null, null];
  const staticP = TALENT_PHOTOS[id];
  const staticGallery = (staticP && staticP.gallery) ? staticP.gallery : [null, null];
  return [
    customGallery[0] || staticGallery[0] || null,
    customGallery[1] || staticGallery[1] || null,
  ];
}

function photoImgTag(url, name, extraStyle) {
  if (!url) return '';
  return `<img src="${url}" alt="${name||''}" style="width:100%;height:100%;object-fit:cover;display:block;${extraStyle||''}" loading="lazy" onerror="this.style.display='none';var n=this.nextElementSibling;if(n&&n.classList&&n.classList.contains('talent-avatar-fallback'))n.style.display='flex';">`;
}

// ── STATE ──
let currentUser = null, currentPage = 'landing', musicPlaying = false,
    bookingStep = 1, bookingData = {}, currentPriceFilter = 'all';

// ── Legacy localStorage helpers (untuk session saja) ──
const lsGet = (k,d) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };

// ══════════════════════════════════════════════════════
//  DEFAULT DATA
// ══════════════════════════════════════════════════════
const DEFAULT_TALENTS = [
  {id:'t001',name:'Ara Salsabila',nickname:'Ara',age:22,gender:'Perempuan',location:'Jakarta',
   bio:'Hii, aku Ara! Suka ngobrol, nonton film, dan kulineran. Orangnya humoris dan easygoing. Dijamin gak bakal bosen ngobrol sama aku 💕',
   hobbies:'Film, Music, Kuliner',services:['Chatting','Calling','Video Call','Offline Date'],
   schedule:['Siang (12-17)','Sore (17-20)','Malam (20-24)'],
   rating:4.9,bookings:234,price:'26K',status:'online',avatar:'🌸',
   ig:'@ara.salsabila',tiktok:'@ara.sal',verified:true,username:'ara01',password:'ara123'},

  {id:'t002',name:'Nara Putri',nickname:'Nara',age:20,gender:'Perempuan',location:'Bandung',
   bio:'Music lover & gaming enthusiast! Yuk mabar bareng atau sekadar dengerin curhat. Aku teman ngobrol yang gak pernah boring 🎵',
   hobbies:'Gaming, Music, Anime',services:['Chatting','Calling','Mabar','Video Call'],
   schedule:['Pagi (06-12)','Malam (20-24)'],
   rating:4.8,bookings:189,price:'26K',status:'online',avatar:'🎵',
   ig:'@naraputri_',tiktok:'@nara.music',verified:true,username:'nara01',password:'nara123'},

  {id:'t003',name:'Dira Cantika',nickname:'Dira',age:23,gender:'Perempuan',location:'Surabaya',
   bio:'Ceria, aktif, dan selalu ada buat dengerin ceritamu! Suka cafe hopping & travel. Offline date ke mana aja, aku siap! 🌺',
   hobbies:'Travel, Photography, Cafe Hopping',services:['Chatting','Calling','Video Call','Offline Date'],
   schedule:['Pagi (06-12)','Siang (12-17)','Sore (17-20)'],
   rating:5.0,bookings:312,price:'26K',status:'online',avatar:'🌺',
   ig:'@dira.cantika',tiktok:'@dira_travel',verified:true,username:'dira01',password:'dira123'},

  {id:'t004',name:'Luna Safira',nickname:'Luna',age:21,gender:'Perempuan',location:'Yogyakarta',
   bio:'Introvert tapi asik banget diajak ngobrol. Suka sastra, kopi hangat, dan hujan. Deep conversation adalah hal favoritku 🌙',
   hobbies:'Membaca, Menulis, Kopi',services:['Chatting','Calling','Video Call'],
   schedule:['Sore (17-20)','Malam (20-24)'],
   rating:4.7,bookings:145,price:'26K',status:'offline',avatar:'🌙',
   ig:'@luna.safira_',tiktok:'@luna_writes',verified:true,username:'luna01',password:'luna123'},

  {id:'t005',name:'Reva Anindita',nickname:'Reva',age:22,gender:'Perempuan',location:'Jakarta',
   bio:'Aktris teater yang punya segudang cerita seru! Yuk ngobrol dan temukan warna baru dalam hidupmu 🎭',
   hobbies:'Teater, Seni, Kuliner',services:['Chatting','Calling','Video Call','Offline Date'],
   schedule:['Siang (12-17)','Sore (17-20)'],
   rating:4.9,bookings:201,price:'26K',status:'online',avatar:'🎭',
   ig:'@reva.anindita',tiktok:'@reva_art',verified:true,username:'reva01',password:'reva123'},

  {id:'t006',name:'Zara Najwa',nickname:'Zara',age:19,gender:'Perempuan',location:'Medan',
   bio:'Foodie sejati! Selalu tau tempat makan enak yang lagi hits. Asik banget buat teman jalan & konten bareng 🍜',
   hobbies:'Kuliner, Vlogging, Dance',services:['Chatting','Calling','Offline Date'],
   schedule:['Siang (12-17)','Malam (20-24)'],
   rating:4.6,bookings:97,price:'26K',status:'online',avatar:'🍜',
   ig:'@zara.najwa',tiktok:'@zara_food',verified:true,username:'zara01',password:'zara123'},

  {id:'t007',name:'Sari Melati',nickname:'Sari',age:21,gender:'Perempuan',location:'Bandung',
   bio:'Pecinta kopi & buku. Deep conversation adalah hal yang paling aku suka. Ayo ngobrol sambil nongkrong! ☕',
   hobbies:'Kopi, Buku, Hiking',services:['Chatting','Calling','Video Call'],
   schedule:['Pagi (06-12)','Sore (17-20)'],
   rating:4.8,bookings:118,price:'26K',status:'online',avatar:'☕',
   ig:'@sari.melati_',tiktok:'@sari_reads',verified:true,username:'sari01',password:'sari123'},

  {id:'t008',name:'Kaia Rizky',nickname:'Kaia',age:20,gender:'Perempuan',location:'Jakarta',
   bio:'Dancer & content creator! Energi positif 24/7. Seru banget buat teman ngobrol soal apapun — fashion, lifestyle, atau sekadar ketawa bareng 🦋',
   hobbies:'Dance, Content Creation, Fashion',services:['Chatting','Calling','Video Call','Offline Date'],
   schedule:['Siang (12-17)','Malam (20-24)'],
   rating:4.7,bookings:163,price:'26K',status:'online',avatar:'🦋',
   ig:'@kaia.rizky',tiktok:'@kaia_dance',verified:true,username:'kaia01',password:'kaia123'},

  {id:'t009',name:'Kira Mahesa',nickname:'Kira',age:24,gender:'Laki-laki',location:'Bali',
   bio:'Pro gamer yang bisa bantu carry rank kamu! Juga seru buat teman jalan atau ngobrol soal game & lifestyle 🎮',
   hobbies:'Gaming, Surfing, Photography',services:['Mabar','Chatting','Offline Date'],
   schedule:['Pagi (06-12)','Malam (20-24)'],
   rating:4.8,bookings:278,price:'26K',status:'online',avatar:'🎮',
   ig:'@kira.mahesa',tiktok:'@kira_pro',verified:true,username:'kira01',password:'kira123'},

  {id:'t010',name:'Dani Pratama',nickname:'Dani',age:25,gender:'Laki-laki',location:'Semarang',
   bio:'Teman ngobrol yang hangat dan supportif. Pendengar terbaik buat kamu yang butuh teman cerita 🌟',
   hobbies:'Olahraga, Musik, Traveling',services:['Chatting','Calling','Video Call','Offline Date'],
   schedule:['Pagi (06-12)','Sore (17-20)','Malam (20-24)'],
   rating:4.7,bookings:156,price:'26K',status:'online',avatar:'🌟',
   ig:'@dani.pratama_',tiktok:'@dani_vibe',verified:true,username:'dani01',password:'dani123'},

  {id:'t011',name:'Rio Ardiansyah',nickname:'Rio',age:26,gender:'Laki-laki',location:'Jakarta',
   bio:'Fotografer & traveler dengan seribu cerita! Yuk cerita soal perjalanan atau foto bareng jalan-jalan 📸',
   hobbies:'Fotografi, Travel, Kuliner',services:['Chatting','Calling','Offline Date'],
   schedule:['Siang (12-17)','Sore (17-20)'],
   rating:4.6,bookings:89,price:'26K',status:'offline',avatar:'📸',
   ig:'@rio.ardiansyah',tiktok:'@rio_lens',verified:true,username:'rio01',password:'rio123'},
];

const DEFAULT_TESTIMONIALS = [
  {name:'Amel R.',avatar:'👧',rating:5,text:'Pengalaman pertama sewa talent di Lovia Partner dan langsung ketagihan! Ara super asik, responsif banget. Highly recommended!',service:'Chatting 7 Hari'},
  {name:'Budi S.',avatar:'👦',rating:5,text:'Mabar sama Kira tuh seru banget, dia pro abis! Rank langsung naik. Dijamin ga nyesel booking di sini.',service:'Mabar Session'},
  {name:'Citra M.',avatar:'👩',rating:5,text:'Offline date sama Dira sangat menyenangkan! Dia asik, friendly, dan tahu banyak spot kece. Rekomen banget!',service:'Offline Date 4 Jam'},
  {name:'Dodi F.',avatar:'👨',rating:4,text:'Platform yang profesional dan aman. Proses booking mudah, talent responsif. Pasti bakal order lagi!',service:'Video Call 30 Mnt'},
  {name:'Erlin P.',avatar:'👧',rating:5,text:'Udah coba beberapa platform, tapi Lovia Partner yang paling nyaman dan terpercaya. Talent-nya berkualitas!',service:'PDKT Package 2'},
  {name:'Fajar K.',avatar:'👦',rating:5,text:'Reva teman ngobrol yang luar biasa! Ceritanya seru, wawasannya luas. Satu jam kayak lima menit aja.',service:'Calling 60 Menit'},
];

const DEFAULT_PRICELIST = {
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

const DEFAULT_ORDERS = [
  {id:'ORD001',customer:'Amel R.',wa:'0812-0000-0001',talent:'Ara Salsabila',service:'Chatting 7 Hari',date:'2026-05-01',status:'Selesai',total:'93.000',createdAt:1746057600000},
  {id:'ORD002',customer:'Budi S.',wa:'0812-0000-0002',talent:'Kira Mahesa',service:'Mabar 1x',date:'2026-05-03',status:'Aktif',total:'10.000',createdAt:1746230400000},
  {id:'ORD003',customer:'Citra M.',wa:'0812-0000-0003',talent:'Dira Cantika',service:'Offline Date 4 Jam',date:'2026-05-10',status:'Menunggu',total:'270.000',createdAt:1746835200000},
  {id:'ORD004',customer:'Dodi F.',wa:'0812-0000-0004',talent:'Reva Anindita',service:'Video Call 30 Mnt',date:'2026-05-08',status:'Selesai',total:'55.000',createdAt:1746662400000},
  {id:'ORD005',customer:'Erlin P.',wa:'0812-0000-0005',talent:'Luna Safira',service:'PDKT 2',date:'2026-05-12',status:'Aktif',total:'165.000',createdAt:1747008000000},
];

// ══════════════════════════════════════════════════════
//  INIT — DOM READY
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Init Firebase listeners PERTAMA — sebelum render apa pun
  initFirebaseListeners();

  initLoading();
  initCursor();
  initNavbar();
  initTheme();

  // Theme toggle
  const tt = document.getElementById('themeToggle');
  if (tt) tt.addEventListener('click', () => {
    const c = document.documentElement.getAttribute('data-theme');
    const n = c === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('lovia_theme', n);
    updateThemeIcon(n);
    toast('Mode ' + (n==='dark'?'Gelap 🌙':'Terang ☀️') + ' aktif', 'info');
  });

  renderHome();
  initCounters();
  initScrollReveal();
  initTyping();
  schedulePopup();

  // ESC menutup drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDashSidebar('admin');
      closeDashSidebar('talent');
    }
  });

  // Cek session tersimpan
  const sess = lsGet('lovia_session', null);
  if (sess) {
    currentUser = sess;
    if (sess.role === 'admin') showPage('admin');
    else if (sess.role === 'talent') showPage('talent-dash');
  }
});

function initLoading() {
  setTimeout(() => { const ls = document.getElementById('loadingScreen'); if (ls) ls.classList.add('hidden'); }, 1900);
}

function initCursor() {
  if (window.innerWidth <= 768) return;
  const dot = document.getElementById('cursorDot'), ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  document.addEventListener('mousemove', e => { dot.style.left=e.clientX+'px'; dot.style.top=e.clientY+'px'; setTimeout(()=>{ ring.style.left=e.clientX+'px'; ring.style.top=e.clientY+'px'; },80); });
  document.addEventListener('mouseover', e => { if (e.target.matches('button,a,.talent-card,.service-card,.price-item-card,.package-card')) { ring.style.width='50px'; ring.style.height='50px'; ring.style.borderColor='var(--pink-deep)'; }});
  document.addEventListener('mouseout',  e => { if (e.target.matches('button,a,.talent-card,.service-card,.price-item-card,.package-card')) { ring.style.width='32px'; ring.style.height='32px'; ring.style.borderColor='var(--pink)'; }});
}

function initNavbar() {
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) nb.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function toggleMobileMenu() {
  const nl = document.getElementById('navLinks');
  if (nl) nl.classList.toggle('open');
}

function initTheme() {
  const s = localStorage.getItem('lovia_theme') || 'light';
  document.documentElement.setAttribute('data-theme', s);
  updateThemeIcon(s);
}

function updateThemeIcon(t) {
  const i = document.getElementById('themeIcon');
  if (i) i.className = t==='dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }});
  }, {threshold:.1, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => obs.observe(el));
}

function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; const target = +el.dataset.target;
      let cur = 0; const step = Math.ceil(target/60);
      const timer = setInterval(() => { cur = Math.min(cur+step, target); el.textContent = cur.toLocaleString('id-ID'); if(cur>=target) clearInterval(timer); }, 25);
      obs.unobserve(el);
    });
  }, {threshold:.5});
  document.querySelectorAll('.hstat-num').forEach(el => obs.observe(el));
}

function initTyping() {
  const el = document.querySelector('.hero-title em');
  if (!el) return;
  const words = ['Partner','Teman','Sahabat','Teman Curhat'];
  let wi = 0, ci = 0, deleting = false;
  function type() {
    const w = words[wi]; el.textContent = deleting ? w.slice(0,ci--) : w.slice(0,ci++);
    if (!deleting && ci > w.length) { deleting = true; setTimeout(type, 1200); return; }
    if (deleting && ci < 0)        { deleting = false; wi = (wi+1)%words.length; setTimeout(type, 300); return; }
    setTimeout(type, deleting ? 60 : 100);
  }
  type();
}

// ── PAGE NAVIGATION ──
function showPage(p) {
  currentPage = p;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const pg = document.getElementById('page-'+p);
  if (pg) pg.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
  const footer = document.getElementById('mainFooter');
  if (footer) footer.style.display = (p==='admin'||p==='talent-dash') ? 'none' : '';
  if (p==='landing')       renderHome();
  if (p==='talents')       renderTalents();
  if (p==='pricelist')     renderPricelist();
  if (p==='admin')         renderAdminDash();
  if (p==='talent-dash')   renderTalentDash();
}

// ── RENDER HOME ──
function renderHome() {
  renderShowcase();
  renderTestimonials();
}

function renderShowcase() {
  const el = document.getElementById('talentShowcase'); if (!el) return;
  const featured = getTalents().filter(t => t.verified && t.status==='online').slice(0,4);
  el.innerHTML = featured.map(t => {
    const photoUrl = getTalentPhotoUrl(t.id);
    const grad = TALENT_GRADIENTS[t.id] || ['#fce4ed','#e8a4c0'];
    return `<div class="talent-card reveal" onclick="openTalentDetail('${t.id}')">
      <div class="tc-photo" style="background:linear-gradient(135deg,${grad[0]},${grad[1]})">
        ${photoUrl ? `<img src="${photoUrl}" alt="${t.name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="tc-avatar-fallback" style="${photoUrl?'display:none':''}"><span>${t.avatar}</span></div>
        <div class="tc-status ${t.status==='online'?'online':''}">${t.status==='online'?'🟢 Online':'⚫ Offline'}</div>
      </div>
      <div class="tc-info">
        <div class="tc-header"><strong>${t.name}</strong>${t.verified?'<span class="verified-badge">✓</span>':''}</div>
        <div class="tc-meta">${t.location} · ${t.age}thn</div>
        <div class="tc-rating">⭐ ${t.rating} · ${t.bookings} booking</div>
        <div class="tc-services">${(t.services||[]).slice(0,3).map(s=>`<span>${s}</span>`).join('')}</div>
        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:.75rem" onclick="event.stopPropagation();openBooking('${t.id}')">Booking Sekarang</button>
      </div>
    </div>`;
  }).join('');
  setTimeout(initScrollReveal, 60);
}

function renderTestimonials() {
  const el = document.getElementById('testimonialsGrid'); if (!el) return;
  el.innerHTML = getTestimonials().map(t => `
    <div class="testi-card reveal">
      <div class="testi-header"><div class="testi-avatar">${t.avatar}</div><div><strong>${t.name}</strong><div class="testi-stars">${'⭐'.repeat(t.rating)}</div></div></div>
      <p>"${t.text}"</p>
      <div class="testi-service">${t.service}</div>
    </div>`).join('');
  setTimeout(initScrollReveal, 60);
}

// ── RENDER TALENTS PAGE ──
function renderTalents() {
  const grid = document.getElementById('talentGrid'); if (!grid) return;
  let talents = getTalents();
  const search  = (document.getElementById('searchTalent')  ||{}).value||'';
  const gender  = (document.getElementById('filterGender')  ||{}).value||'';
  const service = (document.getElementById('filterService') ||{}).value||'';
  const loc     = (document.getElementById('filterLocation')||{}).value||'';
  const sort    = (document.getElementById('sortTalent')    ||{}).value||'';

  if (search)  talents = talents.filter(t => t.name.toLowerCase().includes(search.toLowerCase())||t.nickname.toLowerCase().includes(search.toLowerCase()));
  if (gender)  talents = talents.filter(t => t.gender===gender);
  if (service) talents = talents.filter(t => (t.services||[]).includes(service));
  if (loc)     talents = talents.filter(t => t.location.includes(loc));
  if (sort==='rating')   talents = [...talents].sort((a,b)=>b.rating-a.rating);
  if (sort==='bookings') talents = [...talents].sort((a,b)=>b.bookings-a.bookings);
  if (sort==='name')     talents = [...talents].sort((a,b)=>a.name.localeCompare(b.name));

  const cnt = document.getElementById('talentCount'); if (cnt) cnt.textContent = talents.length;

  if (!talents.length) { grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)"><div style="font-size:3rem">🔍</div><p>Tidak ada talent yang sesuai</p></div>'; return; }

  grid.innerHTML = talents.map(t => {
    const photoUrl = getTalentPhotoUrl(t.id);
    const grad = TALENT_GRADIENTS[t.id] || ['#fce4ed','#e8a4c0'];
    return `<div class="talent-card" onclick="openTalentDetail('${t.id}')">
      <div class="tc-photo" style="background:linear-gradient(135deg,${grad[0]},${grad[1]})">
        ${photoUrl ? `<img src="${photoUrl}" alt="${t.name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="tc-avatar-fallback" style="${photoUrl?'display:none':''}"><span>${t.avatar}</span></div>
        <div class="tc-status ${t.status==='online'?'online':t.status==='busy'?'busy':''}">${t.status==='online'?'🟢 Online':t.status==='busy'?'🟡 Sibuk':'⚫ Offline'}</div>
        ${t.verified?'<div class="tc-verified">✓ Verified</div>':''}
        ${t.pendingApproval?'<div class="tc-pending">⏳ Review</div>':''}
      </div>
      <div class="tc-info">
        <div class="tc-header"><strong>${t.name}</strong><span style="font-size:.75rem;color:var(--text-muted)">${t.gender}</span></div>
        <div class="tc-meta"><i class="fas fa-map-marker-alt" style="font-size:.7rem"></i> ${t.location} · ${t.age}thn</div>
        <div class="tc-rating">⭐ ${t.rating} <span style="color:var(--text-muted);font-size:.78rem">· ${t.bookings} booking</span></div>
        <p style="font-size:.78rem;color:var(--text-sec);margin:.4rem 0;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${t.bio}</p>
        <div class="tc-services">${(t.services||[]).slice(0,3).map(s=>`<span>${s}</span>`).join('')}${(t.services||[]).length>3?`<span>+${t.services.length-3}</span>`:''}</div>
        <div style="display:flex;gap:.5rem;margin-top:.75rem">
          <button class="btn-primary" style="flex:1;justify-content:center;font-size:.8rem" onclick="event.stopPropagation();openBooking('${t.id}')">Booking</button>
          <a href="https://wa.me/628988995637?text=Halo+saya+tertarik+dengan+${encodeURIComponent(t.name)}" target="_blank" style="width:36px;height:36px;background:var(--pink-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--pink-deep);font-size:1rem;flex-shrink:0;text-decoration:none" onclick="event.stopPropagation()"><i class="fab fa-whatsapp"></i></a>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── TALENT DETAIL ──
function openTalentDetail(id) {
  const t = getTalents().find(x => x.id===id); if (!t) return;
  showPage('talent-detail');
  const el = document.getElementById('talentDetailContent'); if (!el) return;
  const photoUrl = getTalentPhotoUrl(id);
  const gallery  = getTalentGallery(id);
  const grad = TALENT_GRADIENTS[id] || ['#fce4ed','#e8a4c0'];
  el.innerHTML = `
    <div class="talent-detail-grid">
      <div class="td-photos">
        <div style="width:100%;aspect-ratio:4/5;border-radius:var(--radius);overflow:hidden;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center;margin-bottom:.75rem">
          ${photoUrl?`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`:''}
          <span style="font-size:5rem${photoUrl?';display:none':''}">${t.avatar}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          ${gallery.filter(Boolean).map(u=>`<div style="aspect-ratio:1;border-radius:var(--radius-sm);overflow:hidden;background:var(--card)"><img src="${u}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'"></div>`).join('')}
        </div>
      </div>
      <div class="td-info">
        <div style="display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
          <h1 style="font-family:var(--font-display);font-size:1.8rem;flex:1">${t.name} <span style="font-size:1.4rem">${t.avatar}</span></h1>
          ${t.verified?'<span class="status-badge badge-active">✓ Verified</span>':''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;font-size:.85rem;color:var(--text-muted)">
          <span><i class="fas fa-map-marker-alt"></i> ${t.location}</span>
          <span><i class="fas fa-birthday-cake"></i> ${t.age} tahun</span>
          <span><i class="fas fa-venus-mars"></i> ${t.gender}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
          <div><span style="font-size:1.5rem;font-weight:700;color:var(--pink-deep)">⭐ ${t.rating}</span></div>
          <div style="color:var(--text-muted);font-size:.85rem">${t.bookings}+ booking berhasil</div>
          <div class="tc-status ${t.status}" style="position:relative;transform:none">${t.status==='online'?'🟢 Online':'⚫ Offline'}</div>
        </div>
        <p style="color:var(--text-sec);line-height:1.75;margin-bottom:1.25rem">${t.bio}</p>
        <div style="display:flex;flex-direction:column;gap:.65rem;margin-bottom:1.25rem">
          <div><strong style="font-size:.82rem;color:var(--text-muted)">HOBI</strong><div style="margin-top:.3rem;font-size:.88rem">${t.hobbies}</div></div>
          <div><strong style="font-size:.82rem;color:var(--text-muted)">LAYANAN</strong><div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.3rem">${(t.services||[]).map(s=>`<span class="tc-services"><span>${s}</span></span>`).join('')}</div></div>
          <div><strong style="font-size:.82rem;color:var(--text-muted)">JADWAL AKTIF</strong><div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.3rem">${(t.schedule||[]).map(s=>`<span style="padding:.2rem .6rem;background:var(--purple-light);border-radius:50px;font-size:.78rem">${s}</span>`).join('')}</div></div>
          ${t.ig?`<div><strong style="font-size:.82rem;color:var(--text-muted)">SOSMED</strong><div style="margin-top:.3rem;font-size:.85rem"><i class="fab fa-instagram"></i> ${t.ig}${t.tiktok?` &nbsp; <i class="fab fa-tiktok"></i> ${t.tiktok}`:''}</div></div>`:''}
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn-primary glow-btn" style="flex:1;justify-content:center" onclick="openBooking('${t.id}')"><i class="fas fa-calendar-plus"></i> Booking Sekarang</button>
          <a href="https://wa.me/628988995637?text=Halo+saya+ingin+booking+${encodeURIComponent(t.name)}" target="_blank" class="btn-outline" style="flex:1;justify-content:center;text-decoration:none;display:flex;align-items:center;gap:.4rem"><i class="fab fa-whatsapp"></i> WhatsApp Admin</a>
        </div>
      </div>
    </div>`;
}

// ── PRICELIST ──
function renderPricelist() {
  const el = document.getElementById('pricelistContainer'); if (!el) return;
  const pl = getPricelist();
  const SERVICES = [
    {key:'chatting',label:'💬 Chatting',desc:'Chat santai & asik'},
    {key:'calling',label:'📞 Calling',desc:'Telepon langsung'},
    {key:'videocall',label:'🎥 Video Call',desc:'Tatap muka virtual'},
    {key:'offline',label:'📍 Offline Date',desc:'Jalan bareng'},
    {key:'pap',label:'📸 PAP',desc:'Photo & proof'},
    {key:'mabar',label:'🎮 Mabar',desc:'Main game bareng'},
    {key:'paket',label:'💎 Paket Relationship',desc:'Bundle terlengkap',isPackage:true},
    {key:'pdkt',label:'💌 PDKT Package',desc:'Paket spesial PDKT',isPackage:true},
  ];
  const filtered = currentPriceFilter==='all' ? SERVICES : SERVICES.filter(s=>s.key===currentPriceFilter);
  el.innerHTML = filtered.map(s => {
    const items = pl[s.key] || [];
    if (!items.length) return '';
    if (s.isPackage) {
      return `<div class="price-section reveal"><h3 class="price-section-title">${s.label} <span style="font-size:.8rem;font-weight:400;color:var(--text-muted)">${s.desc}</span></h3>
        <div class="package-grid">${items.map(pkg=>`<div class="package-card${pkg.featured?' featured':''}">
          ${pkg.featured?'<div class="pkg-badge">⭐ Best Value</div>':''}
          ${pkg.popular?'<div class="pkg-badge popular">🔥 Popular</div>':''}
          <h4>${pkg.label}</h4>
          <div class="pkg-price">Rp ${pkg.price}</div>
          <ul class="pkg-items">${(pkg.items||[]).map(i=>`<li><i class="fas fa-check"></i> ${i}</li>`).join('')}</ul>
          <div style="display:flex;gap:.4rem;margin-top:auto">
            <button class="btn-primary" style="flex:1;justify-content:center" onclick="openBookingFromPrice('${s.label} — ${pkg.label}','${pkg.price}')">Pesan</button>
            <a href="https://wa.me/628988995637?text=Mau+pesan+${encodeURIComponent(s.label+' '+pkg.label)}" target="_blank" style="width:36px;height:36px;background:var(--pink-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--pink-deep);font-size:1rem;text-decoration:none"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>`).join('')}</div></div>`;
    }
    return `<div class="price-section reveal"><h3 class="price-section-title">${s.label} <span style="font-size:.8rem;font-weight:400;color:var(--text-muted)">${s.desc}</span></h3>
      <div class="price-items-grid">${items.map(item=>`<div class="price-item-card${item.popular?' popular':''}">
        ${item.popular?'<div class="popular-badge">🔥 Terpopuler</div>':''}
        <div class="price-item-label">${item.label}</div>
        <div class="price-item-price">Rp ${item.price}<small>/sesi</small></div>
        <div style="display:flex;gap:.4rem;margin-top:.75rem">
          <button class="btn-sm" style="flex:1;justify-content:center" onclick="openBookingFromPrice('${s.label} — ${item.label}','${item.price}')">Pesan</button>
          <a href="https://wa.me/628988995637?text=Mau+pesan+${encodeURIComponent(s.label+' '+item.label)}" target="_blank" style="width:34px;height:34px;background:var(--pink-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--pink-deep);font-size:.9rem;flex-shrink:0;text-decoration:none"><i class="fab fa-whatsapp"></i></a>
        </div>
      </div>`).join('')}</div></div>`;
  }).join('');
  setTimeout(initScrollReveal, 60);
}

function filterPrice(cat, btn) {
  currentPriceFilter = cat;
  document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPricelist();
}

// ── BOOKING ──
function openBookingFromPrice(svc, price) {
  bookingData = {talent:null, serviceName:svc, servicePrice:price};
  buildBookingModal();
  openModal('bookingModal');
}

function openBooking(id) {
  const t = getTalents().find(x => x.id===id); if (!t) return;
  if (t.status==='offline') { toast('Talent sedang offline, pilih talent lain','error'); return; }
  if (t.status==='busy')    { toast('Talent sedang sibuk, coba lagi nanti','error'); return; }
  bookingData = {talent:t, serviceName:null, servicePrice:null};
  buildBookingModal();
  openModal('bookingModal');
}

function buildBookingModal() {
  bookingStep = 1;
  const {talent, serviceName, servicePrice} = bookingData;
  const minDate = new Date().toISOString().split('T')[0];
  const photoUrl = talent ? getTalentPhotoUrl(talent.id) : null;
  const grad = talent ? (TALENT_GRADIENTS[talent.id]||['#fce4ed','#e8a4c0']) : ['#fce4ed','#e8a4c0'];
  const talentPreview = talent ? `
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
  : `<div style="padding:.85rem;background:var(--purple-light);border-radius:var(--radius-sm);margin-bottom:1.25rem">
      <strong>📦 ${serviceName}</strong>
      <div style="font-size:.82rem;color:var(--text-muted);margin-top:.25rem">Harga: Rp ${servicePrice}</div>
    </div>
    <div class="form-group"><label>Pilih Talent (Opsional)</label>
      <select id="bkTalent" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)">
        <option value="">Pilihkan oleh admin</option>
        ${getTalents().filter(t=>t.status==='online').map(t=>`<option value="${t.id}">${t.avatar} ${t.name} — ${t.location}</option>`).join('')}
      </select>
    </div>`;

  const content = document.getElementById('bookingContent'); if (!content) return;
  content.innerHTML = `
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

function bkNext(step) {
  if (step===2) { const d=document.getElementById('bkDate'); if(!d||!d.value){toast('Pilih tanggal dulu!','error');return;} }
  const curr = document.getElementById('bkStep'+step);
  const next  = document.getElementById('bkStep'+(step+1));
  if (curr) curr.classList.remove('active');
  if (next) next.classList.add('active');
  bookingStep = step+1; updateBkProgress();
}

function bkPrev(step) {
  const curr = document.getElementById('bkStep'+step);
  const prev  = document.getElementById('bkStep'+(step-1));
  if (curr) curr.classList.remove('active');
  if (prev) prev.classList.add('active');
  bookingStep = step-1; updateBkProgress();
}

function updateBkProgress() {
  [1,2,3].forEach(i => {
    const d = document.getElementById('bp'+i);
    if (d) { d.classList.toggle('active', i===bookingStep); d.classList.toggle('done', i<bookingStep); }
  });
}

function submitBookingFinal() {
  const name = (document.getElementById('bkName')||{}).value||'';
  const wa   = (document.getElementById('bkWa')  ||{}).value||'';
  if (!name.trim()||!wa.trim()) { toast('Lengkapi nama dan WhatsApp!','error'); return; }

  const {talent, serviceName, servicePrice} = bookingData;
  const serviceEl = document.getElementById('bkService');
  const talentEl  = document.getElementById('bkTalent');
  const service   = talent ? (serviceEl?serviceEl.value:'Chatting') : serviceName;

  let talentName = 'Ditentukan Admin';
  if (talent) { talentName = talent.name; }
  else if (talentEl && talentEl.value) {
    const sel = getTalents().find(x => x.id===talentEl.value);
    talentName = sel ? sel.name : 'Ditentukan Admin';
  }

  const date = (document.getElementById('bkDate')||{}).value || new Date().toISOString().split('T')[0];
  const newOrder = {
    id:       'ORD' + String(Date.now()).slice(-8),
    customer: name.trim(),
    wa:       wa.trim(),
    talent:   talentName,
    service,
    date,
    location: (document.getElementById('bkLocation')||{}).value||'Online',
    note:     (document.getElementById('bkNote')||{}).value||'',
    status:   'Menunggu',
    total:    servicePrice || (talent?talent.price:'0'),
    createdAt: Date.now()
  };

  // Simpan ke Firebase Realtime Database
  addOrder(newOrder);

  // Juga kirim ke talentApplications jika daftar talent
  closeModal('bookingModal');
  toast('Booking berhasil dikirim! 🎉', 'success');
  setTimeout(() => showNotifModal(
    `Booking <strong>${service}</strong> dengan <strong>${talentName}</strong> berhasil!<br><br>Konfirmasi dikirim ke WhatsApp <strong>${wa.trim()}</strong> dalam 5–15 menit.`,
    talent ? talent.avatar : '💝'
  ), 400);
}

// ── REGISTER TALENT ──
function regNext(step) {
  if (step===1) {
    const fields=['reg_nama','reg_umur','reg_gender','reg_kota','reg_wa','reg_email'];
    for (const f of fields) { const el=document.getElementById(f); if(!el||!el.value.trim()){toast('Lengkapi semua field *!','error');return;} }
    const u=document.getElementById('reg_umur'); if(u&&+u.value<18){toast('Minimal usia 18 tahun!','error');return;}
  } else if (step===2) {
    const b=document.getElementById('reg_bio'); if(!b||b.value.trim().length<20){toast('Bio minimal 20 karakter!','error');return;}
  }
  goRegStep(step+1);
}

function regPrev(step) { goRegStep(step-1); }

function goRegStep(n) {
  document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
  const s = document.getElementById('regStep'+n); if (s) s.classList.add('active');
  document.querySelectorAll('.step-indicator .step:not(.step-line)').forEach((s,i) => {
    s.classList.toggle('active', i+1===n); s.classList.toggle('done', i+1<n);
  });
  document.querySelectorAll('.step-indicator .step-line').forEach((l,i) => l.classList.toggle('filled', i+1<n));
}

function submitRegister() {
  const services  = Array.from(document.querySelectorAll('.reg-service:checked')).map(c=>c.value);
  const schedule  = Array.from(document.querySelectorAll('.reg-schedule:checked')).map(c=>c.value);
  if (!services.length) { toast('Pilih minimal 1 layanan!','error'); return; }
  if (!schedule.length) { toast('Pilih minimal 1 jadwal!','error'); return; }

  const g = f => document.getElementById(f);
  const newId = 'ta' + String(Date.now()).slice(-7);
  const pass  = 'talent' + Math.floor(1000+Math.random()*9000);
  const emojis = ['🌸','🌺','🌙','⭐','✨','🎵','💫','🦋'];

  const newT = {
    id:newId, name:g('reg_nama').value.trim(), nickname:g('reg_panggilan').value.trim(),
    age:+g('reg_umur').value, gender:g('reg_gender').value, location:g('reg_kota').value.trim(),
    bio:g('reg_bio').value.trim(), hobbies:'Belum diisi', services, schedule,
    rating:0, bookings:0, price:'26K', status:'offline',
    avatar:emojis[Math.floor(Math.random()*emojis.length)],
    verified:false, pendingApproval:true,
    ig:    g('reg_ig')     ? g('reg_ig').value     : '',
    tiktok:g('reg_tiktok') ? g('reg_tiktok').value : '',
    username:'talent_'+newId, password:pass,
    email:g('reg_email').value.trim(), wa:g('reg_wa').value.trim(),
    createdAt: Date.now()
  };

  // Simpan ke Firebase
  const talents = getTalents();
  talents.push(newT);
  setTalents(talents);

  // Simpan juga ke talentApplications (untuk admin review)
  db.ref('talentApplications/' + newId).set({
    ...newT,
    status: 'Menunggu Seleksi'
  }).catch(e => console.error('talentApplications error:', e));

  toast('Pendaftaran berhasil! 🎉', 'success');
  showNotifModal(`Pendaftaran berhasil!<br><br>Admin akan menghubungi via WhatsApp dalam 1×24 jam.<br><br><strong>Username:</strong> ${newT.username}<br><strong>Password:</strong> ${pass}<br><small style="color:var(--text-muted)">Simpan dengan aman</small>`, '🌟');
  setTimeout(() => showPage('landing'), 3000);
}

// ── DASHBOARD DRAWER ──
function openDashSidebar(type) {
  const sidebar  = document.getElementById(type==='admin'?'adminSidebar':'talentSidebar');
  const overlay  = document.getElementById(type==='admin'?'adminOverlay':'talentOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDashSidebar(type) {
  const sidebar  = document.getElementById(type==='admin'?'adminSidebar':'talentSidebar');
  const overlay  = document.getElementById(type==='admin'?'adminOverlay':'talentOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── AUTH ──
function showLoginModal() { openModal('loginModal'); }

function handleLogin() {
  const user = (document.getElementById('loginUser')||{}).value||'';
  const pass = (document.getElementById('loginPass')||{}).value||'';
  if (!user.trim()||!pass.trim()) { toast('Isi username dan password!','error'); return; }

  if (user==='admin' && pass==='admin123') {
    currentUser = {role:'admin', name:'Admin Lovia', username:'admin'};
    lsSet('lovia_session', currentUser);
    closeModal('loginModal');
    toast('Selamat datang, Admin! 👑','success');
    setTimeout(() => showPage('admin'), 500);
    return;
  }

  const t = getTalents().find(x => x.username===user && x.password===pass);
  if (t) {
    if (t.pendingApproval && !t.verified) { toast('Akunmu masih dalam proses seleksi','error'); return; }
    currentUser = {role:'talent', name:t.name, talentId:t.id, username:t.username};
    lsSet('lovia_session', currentUser);
    closeModal('loginModal');
    toast(`Selamat datang, ${t.nickname||t.name}! ✨`,'success');
    setTimeout(() => showPage('talent-dash'), 500);
    return;
  }
  toast('Username atau password salah!','error');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('lovia_session');
  closeDashSidebar('admin');
  closeDashSidebar('talent');
  document.body.style.overflow = '';
  toast('Berhasil logout! 👋','info');
  setTimeout(() => showPage('landing'), 300);
}

// ══════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════
function renderAdminDash() { showAdminTab('overview'); }

function showAdminTab(tab) {
  closeDashSidebar('admin');
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById('admin-tab-'+tab); if (el) el.classList.add('active');
  document.querySelectorAll('#adminSidebar .db-link').forEach(l => {
    const oc = l.getAttribute('onclick')||'';
    l.classList.toggle('active', oc.includes("'"+tab+"'"));
  });
  const c = document.getElementById('admin-tab-'+tab); if (!c) return;
  if (tab==='overview')     renderAdminOverview(c);
  else if (tab==='talents') renderAdminTalents(c);
  else if (tab==='orders')  renderAdminOrders(c);
  else if (tab==='pricelist')     renderAdminPricelist(c);
  else if (tab==='testimonials')  renderAdminTestimonials(c);
  else if (tab==='settings')      renderAdminSettings(c);
  const content = document.getElementById('adminContent');
  if (content) content.scrollTop = 0;
}

function renderAdminOverview(el) {
  const talents = getTalents(), orders = getOrders(), pending = talents.filter(t=>t.pendingApproval&&!t.verified);
  el.innerHTML = `
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
      <div class="dash-section"><h3>📋 Pendaftar Baru</h3>${pending.length?pending.map(t=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--border)"><div style="display:flex;align-items:center;gap:.6rem"><span style="font-size:1.4rem">${t.avatar}</span><div><strong style="font-size:.85rem">${t.name}</strong><div style="font-size:.75rem;color:var(--text-muted)">${t.location} · ${t.age}thn</div></div></div><div style="display:flex;gap:.3rem"><button class="btn-sm" onclick="approveTalent('${t.id}')" style="border-color:#48bb78;color:#48bb78;padding:.3rem .6rem">✓ Setuju</button><button class="btn-sm" onclick="rejectTalent('${t.id}')" style="border-color:#ef4444;color:#ef4444;padding:.3rem .6rem">✗ Tolak</button></div></div>`).join(''):'<p style="color:var(--text-muted);font-size:.85rem">Tidak ada pendaftar baru</p>'}</div>
      <div class="dash-section"><h3>📈 Statistik Pesanan</h3><div style="font-size:.85rem;display:flex;flex-direction:column;gap:.5rem">
        <div style="display:flex;justify-content:space-between"><span>Menunggu</span><strong style="color:#d97706">${orders.filter(o=>o.status==='Menunggu').length}</strong></div>
        <div style="display:flex;justify-content:space-between"><span>Aktif</span><strong style="color:#059669">${orders.filter(o=>o.status==='Aktif').length}</strong></div>
        <div style="display:flex;justify-content:space-between"><span>Selesai</span><strong style="color:#2563eb">${orders.filter(o=>o.status==='Selesai').length}</strong></div>
        <div style="display:flex;justify-content:space-between"><span>Ditolak</span><strong style="color:#dc2626">${orders.filter(o=>o.status==='Ditolak').length}</strong></div>
      </div></div>
    </div>
    <div class="dash-section"><h3>📋 Order Terbaru</h3><div class="table-scroll">${ordersTable(orders.slice(0,10), true)}</div></div>`;
}

function renderAdminTalents(el) {
  const talents = getTalents();
  const cewe = talents.filter(t=>t.gender==='Perempuan');
  const cowo  = talents.filter(t=>t.gender==='Laki-laki');
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem">
      <h2 style="font-family:var(--font-display)">Kelola Talent 👥</h2>
      <div class="search-wrap" style="min-width:220px"><i class="fas fa-search"></i><input type="text" placeholder="Cari nama / kota..." oninput="adminSearchTalent(this.value)" /></div>
    </div>
    <div class="dash-section">
      <div class="table-scroll"><table class="admin-table"><thead><tr><th>Talent</th><th>Kota</th><th>Status</th><th>Rating</th><th>Verified</th><th>Pending</th><th>Aksi</th></tr></thead>
      <tbody id="adminTalentRows">${buildTalentRows(talents)}</tbody></table></div>
    </div>
    <div class="dash-section" style="margin-top:1.5rem">
      <h3 style="font-family:var(--font-display);font-size:1rem;margin-bottom:1rem">🔐 Akun Login Talent — RAHASIA</h3>
      <h4 style="font-size:.85rem;font-weight:700;color:var(--pink-deep);margin-bottom:.6rem">👧 Talent Cewe</h4>
      <div class="table-scroll" style="margin-bottom:1.25rem">
        <table class="admin-table"><thead><tr><th>#</th><th>Nama</th><th>Username</th><th>Password</th><th>Status</th></tr></thead>
        <tbody>${cewe.map((t,i)=>`<tr><td style="color:var(--text-muted);font-size:.78rem">${i+1}</td><td><strong>${t.name}</strong></td><td><code style="background:var(--bg);padding:.15rem .4rem;border-radius:4px;font-size:.83rem">${t.username}</code></td><td><code style="background:var(--bg);padding:.15rem .4rem;border-radius:4px;font-size:.83rem">${t.password}</code></td><td><span class="status-badge ${t.status==='online'?'badge-active':'badge-rejected'}">${t.status}</span></td></tr>`).join('')}</tbody>
        </table>
      </div>
      <h4 style="font-size:.85rem;font-weight:700;color:var(--purple);margin-bottom:.6rem">👦 Talent Cowo</h4>
      <div class="table-scroll">
        <table class="admin-table"><thead><tr><th>#</th><th>Nama</th><th>Username</th><th>Password</th><th>Status</th></tr></thead>
        <tbody>${cowo.map((t,i)=>`<tr><td style="color:var(--text-muted);font-size:.78rem">${i+1}</td><td><strong>${t.name}</strong></td><td><code style="background:var(--bg);padding:.15rem .4rem;border-radius:4px;font-size:.83rem">${t.username}</code></td><td><code style="background:var(--bg);padding:.15rem .4rem;border-radius:4px;font-size:.83rem">${t.password}</code></td><td><span class="status-badge ${t.status==='online'?'badge-active':'badge-rejected'}">${t.status}</span></td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

function buildTalentRows(talents) {
  return talents.map(t => `<tr>
    <td><div style="display:flex;align-items:center;gap:.6rem"><span style="font-size:1.3rem">${t.avatar}</span><div><strong style="font-size:.85rem">${t.name}</strong><div style="font-size:.73rem;color:var(--text-muted)">${t.gender} · ${t.age}thn</div></div></div></td>
    <td style="font-size:.83rem">${t.location}</td>
    <td><span class="status-badge ${t.status==='online'?'badge-active':t.status==='busy'?'badge-pending':'badge-rejected'}">${t.status}</span></td>
    <td>⭐ ${t.rating}</td>
    <td><span class="status-badge ${t.verified?'badge-done':'badge-pending'}">${t.verified?'✓ Ya':'Belum'}</span></td>
    <td><span class="status-badge ${t.pendingApproval?'badge-pending':'badge-done'}">${t.pendingApproval?'⏳ Ya':'Tidak'}</span></td>
    <td><div style="display:flex;gap:.3rem;flex-wrap:wrap">
      <button class="btn-sm" onclick="toggleVerify('${t.id}')" style="font-size:.72rem;padding:.25rem .5rem">${t.verified?'Unverify':'Verify'}</button>
      ${t.pendingApproval?`<button class="btn-sm" onclick="approveTalent('${t.id}')" style="border-color:#48bb78;color:#48bb78;font-size:.72rem;padding:.25rem .5rem">✓</button><button class="btn-sm" onclick="rejectTalent('${t.id}')" style="border-color:#ef4444;color:#ef4444;font-size:.72rem;padding:.25rem .5rem">✗</button>`:''}
      <button class="btn-sm" onclick="deleteTalent('${t.id}')" style="border-color:#ef4444;color:#ef4444;font-size:.72rem;padding:.25rem .5rem"><i class="fas fa-trash"></i></button>
    </div></td>
  </tr>`).join('');
}

function adminSearchTalent(q) {
  const talents = getTalents().filter(t => t.name.toLowerCase().includes(q.toLowerCase())||t.location.toLowerCase().includes(q.toLowerCase()));
  const rows = document.getElementById('adminTalentRows');
  if (rows) rows.innerHTML = buildTalentRows(talents);
}

function renderAdminOrders(el) {
  const orders = getOrders();
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem"><h2 style="font-family:var(--font-display)">Kelola Pesanan 📦</h2><span style="font-size:.8rem;color:var(--text-muted)">Total: ${orders.length} pesanan · Data real-time Firebase</span></div>
    <div class="dash-section"><div class="table-scroll">${ordersTable(orders, true)}</div></div>`;
}

function ordersTable(orders, editable=false) {
  if (!orders.length) return '<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem">📭</div><p>Belum ada order</p></div>';
  return `<table class="admin-table"><thead><tr><th>ID</th><th>Customer</th><th>Talent</th><th>Layanan</th><th>Tanggal</th><th>Total</th><th>Status</th>${editable?'<th>Ubah</th>':''}</tr></thead><tbody>
    ${orders.map(o=>`<tr>
      <td style="font-size:.72rem;color:var(--text-muted);font-family:monospace">${o.id}</td>
      <td><strong>${o.customer}</strong>${o.wa?`<br><small style="color:var(--text-muted)">${o.wa}</small>`:''}</td>
      <td>${o.talent}</td>
      <td style="font-size:.82rem">${o.service}</td>
      <td style="font-size:.82rem">${o.date}</td>
      <td style="font-weight:700;color:var(--pink-deep)">Rp ${o.total}</td>
      <td><span class="status-badge ${o.status==='Selesai'?'badge-done':o.status==='Aktif'?'badge-active':o.status==='Ditolak'?'badge-rejected':'badge-pending'}">${o.status}</span></td>
      ${editable?`<td><select style="font-size:.78rem;border:1px solid var(--border);border-radius:8px;padding:.3rem .5rem;background:var(--bg);color:var(--text)" onchange="updateOrderStatus('${o.id}',this.value)"><option ${o.status==='Menunggu'?'selected':''}>Menunggu</option><option ${o.status==='Aktif'?'selected':''}>Aktif</option><option ${o.status==='Selesai'?'selected':''}>Selesai</option><option ${o.status==='Ditolak'?'selected':''}>Ditolak</option></select></td>`:''}
    </tr>`).join('')}
  </tbody></table>`;
}

function renderAdminPricelist(el) {
  const pl = getPricelist();
  const cats=[['chatting','💬 Chatting'],['calling','📞 Calling'],['videocall','🎥 Video Call'],['offline','📍 Offline Date'],['pap','📸 PAP'],['mabar','🎮 Mabar']];
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem"><h2 style="font-family:var(--font-display)">Kelola Pricelist 💰</h2><span style="font-size:.8rem;color:var(--text-muted)">Edit langsung → tersimpan ke Firebase</span></div>
    ${cats.map(([cat,label])=>`<div class="dash-section"><h3 style="display:flex;align-items:center;justify-content:space-between">${label}<button class="btn-sm" onclick="addPrice('${cat}')"><i class="fas fa-plus"></i> Tambah</button></h3>
    <div class="table-scroll"><table class="admin-table"><thead><tr><th>Label</th><th>Harga (Rp)</th><th>Populer</th><th>Hapus</th></tr></thead><tbody>
    ${(pl[cat]||[]).map((item,i)=>`<tr>
      <td><input type="text" value="${item.label}" onchange="updatePrice('${cat}',${i},'label',this.value)" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.3rem .6rem;width:100%;color:var(--text);font-size:.83rem"/></td>
      <td><input type="text" value="${item.price}" onchange="updatePrice('${cat}',${i},'price',this.value)" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.3rem .6rem;width:120px;color:var(--text);font-size:.83rem"/></td>
      <td style="text-align:center"><input type="checkbox" ${item.popular?'checked':''} onchange="updatePrice('${cat}',${i},'popular',this.checked)"/></td>
      <td><button class="btn-sm" onclick="deletePrice('${cat}',${i})" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('')}
    </tbody></table></div></div>`).join('')}`;
}

function updatePrice(cat, i, field, val) {
  const pl = getPricelist();
  if (!pl[cat]||!pl[cat][i]) return;
  pl[cat][i][field] = field==='popular' ? Boolean(val) : val;
  setPricelist(pl);
  toast('Tersimpan ke Firebase ✓','success');
}

function deletePrice(cat, i) {
  const pl = getPricelist();
  pl[cat].splice(i,1);
  setPricelist(pl);
  renderAdminPricelist(document.getElementById('admin-tab-pricelist'));
  toast('Dihapus','info');
}

function addPrice(cat) {
  const pl = getPricelist();
  if (!pl[cat]) pl[cat]=[];
  pl[cat].push({label:'Item Baru',price:'0',popular:false});
  setPricelist(pl);
  renderAdminPricelist(document.getElementById('admin-tab-pricelist'));
}

function renderAdminTestimonials(el) {
  const ts = getTestimonials();
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem"><h2 style="font-family:var(--font-display)">Kelola Testimoni ⭐</h2></div>
    <div class="dash-section"><div class="table-scroll"><table class="admin-table"><thead><tr><th>User</th><th>Rating</th><th>Teks</th><th>Layanan</th><th>Aksi</th></tr></thead><tbody>
    ${ts.map((t,i)=>`<tr>
      <td>${t.avatar} <strong>${t.name}</strong></td>
      <td>${'⭐'.repeat(t.rating)}</td>
      <td style="max-width:200px;font-size:.78rem;color:var(--text-sec)">${t.text.slice(0,90)}...</td>
      <td><span class="testi-service">${t.service}</span></td>
      <td><button class="btn-sm" onclick="deleteTestimonial(${i})" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('')}
    </tbody></table></div></div>`;
}

function deleteTestimonial(i) {
  const ts = getTestimonials(); ts.splice(i,1); setTestimonials(ts);
  renderAdminTestimonials(document.getElementById('admin-tab-testimonials'));
  toast('Dihapus','info');
}

function renderAdminSettings(el) {
  el.innerHTML = `<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Pengaturan ⚙️</h2>
    <div class="admin-2col-grid">
      <div class="dash-section"><h3>🔐 Akun Admin</h3><div style="font-size:.88rem;display:flex;flex-direction:column;gap:.5rem"><div>Username: <strong>admin</strong></div><div>Password: <strong>admin123</strong></div><div>Role: <strong>Super Admin</strong></div></div></div>
      <div class="dash-section"><h3>📊 Platform</h3><div style="font-size:.88rem;display:flex;flex-direction:column;gap:.5rem"><div>Versi: <strong>Lovia Partner v3.0</strong></div><div>Storage: <strong>Firebase Realtime Database ✅</strong></div><div>Deploy: <strong>GitHub Pages Ready</strong></div></div></div>
      <div class="dash-section"><h3>🎨 Tema</h3><div style="display:flex;gap:.75rem"><button class="btn-sm" onclick="document.documentElement.setAttribute('data-theme','light');localStorage.setItem('lovia_theme','light');updateThemeIcon('light');toast('Terang aktif','info')">☀️ Terang</button><button class="btn-sm" onclick="document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('lovia_theme','dark');updateThemeIcon('dark');toast('Gelap aktif','info')">🌙 Gelap</button></div></div>
      <div class="dash-section"><h3>🗑️ Reset Data Firebase</h3><p style="font-size:.82rem;color:var(--text-muted);margin-bottom:1rem">Hapus semua data dari Firebase (tidak bisa dibatalkan)</p><button class="btn-outline" onclick="resetData()" style="border-color:#ef4444;color:#ef4444"><i class="fas fa-redo"></i> Reset Semua</button></div>
    </div>`;
}

function resetData() {
  if (!confirm('Reset semua data di Firebase?\nTidak bisa dibatalkan.')) return;
  db.ref('talents').remove();
  db.ref('orders').remove();
  db.ref('pricelist').remove();
  db.ref('testimonials').remove();
  db.ref('customPhotos').remove();
  _talentsCache = null; _ordersCache = null; _priceCache = null; _testiCache = null; _photosCache = {};
  toast('Data Firebase direset!','info');
  renderAdminDash();
}

function approveTalent(id) {
  updateTalent(id, {pendingApproval:false, verified:true});
  // Juga update talentApplications
  db.ref('talentApplications/' + id + '/status').set('Disetujui').catch(()=>{});
  toast('Talent disetujui ✓','success');
  renderAdminDash();
}

function rejectTalent(id) {
  updateTalent(id, {pendingApproval:false, verified:false});
  db.ref('talentApplications/' + id + '/status').set('Ditolak').catch(()=>{});
  toast('Talent ditolak','info');
  renderAdminDash();
}

function toggleVerify(id) {
  const t = getTalents().find(x=>x.id===id);
  if (t) updateTalent(id, {verified:!t.verified});
  toast('Verifikasi diperbarui!','info');
  renderAdminTalents(document.getElementById('admin-tab-talents'));
}

function deleteTalent(id) {
  if (!confirm('Hapus talent ini dari database?')) return;
  const talents = getTalents().filter(t=>t.id!==id);
  setTalents(talents);
  db.ref('talents/'+id).remove().catch(()=>{});
  toast('Talent dihapus','info');
  renderAdminTalents(document.getElementById('admin-tab-talents'));
}

// ══════════════════════════════════════════════════════
//  TALENT DASHBOARD
// ══════════════════════════════════════════════════════
function renderTalentDash() {
  showTalentTab('overview');
  const tId = currentUser ? currentUser.talentId : null;
  const t   = tId ? getTalents().find(x=>x.id===tId) : null;
  const el  = document.getElementById('talentTopbarUser');
  if (el && t) el.textContent = (t.avatar||'✨') + ' ' + (t.nickname||t.name);
}

function showTalentTab(tab) {
  closeDashSidebar('talent');
  document.querySelectorAll('.talent-tab').forEach(t=>t.classList.remove('active'));
  const el = document.getElementById('talent-tab-'+tab); if (el) el.classList.add('active');
  document.querySelectorAll('#talentSidebar .db-link').forEach(l=>{
    const oc=l.getAttribute('onclick')||'';
    l.classList.toggle('active', oc.includes("'"+tab+"'"));
  });
  const tId = currentUser ? currentUser.talentId : null;
  const t   = tId ? getTalents().find(x=>x.id===tId) : getTalents()[0];
  const c   = document.getElementById('talent-tab-'+tab); if (!c) return;
  if (tab==='overview')  renderTalentOverview(c,t);
  else if (tab==='orders')   renderTalentOrders(c,t);
  else if (tab==='profile')  renderTalentProfile(c,t);
  else if (tab==='earnings') renderTalentEarnings(c,t);
  const content = document.getElementById('talentContent');
  if (content) content.scrollTop = 0;
}

function renderTalentOverview(el,t) {
  if (!t) { el.innerHTML='<p style="padding:2rem;color:var(--text-muted)">Data tidak ditemukan</p>'; return; }
  const myOrders = getOrders().filter(o=>o.talent===t.name);
  const photoUrl = getTalentPhotoUrl(t.id);
  const grad = TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  el.innerHTML = `
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
          <button class="btn-sm" onclick="showTalentTab('profile')" style="justify-content:flex-start;gap:.6rem;border-color:var(--pink);color:var(--pink-deep)"><i class="fas fa-camera"></i> Kelola Foto</button>
          <button class="btn-sm" onclick="showTalentTab('earnings')" style="justify-content:flex-start;gap:.6rem"><i class="fas fa-wallet"></i> Pendapatan</button>
          <button class="btn-sm" onclick="toggleTalentStatus('${t.id}')" style="justify-content:flex-start;gap:.6rem;${t.status==='online'?'border-color:#ef4444;color:#ef4444':'border-color:#48bb78;color:#48bb78'}">${t.status==='online'?'<i class="fas fa-moon"></i> Set Offline':'<i class="fas fa-circle"></i> Set Online'}</button>
        </div>
      </div>
    </div>
    <div class="dash-section"><h3>📅 Booking Terbaru</h3>${myOrders.length?`<div class="table-scroll">${ordersTable(myOrders.slice(0,5))}</div>`:'<div style="text-align:center;padding:2rem;color:var(--text-muted)"><div style="font-size:2rem">📭</div><p>Belum ada booking</p></div>'}</div>`;
}

function toggleTalentStatus(id) {
  const t = getTalents().find(x=>x.id===id); if (!t) return;
  const newStatus = t.status==='online' ? 'offline' : 'online';
  updateTalent(id, {status: newStatus});
  toast(`Status: ${newStatus}`,'info');
  renderTalentDash();
}

function renderTalentOrders(el,t) {
  if (!t) { el.innerHTML='<p style="padding:2rem">Data tidak ditemukan</p>'; return; }
  const myOrders = getOrders().filter(o=>o.talent===t.name);
  el.innerHTML = `<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Daftar Booking 📅</h2>
    <div class="dash-section">${myOrders.length?`<div class="table-scroll">${ordersTable(myOrders)}</div>`:'<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem">📭</div><p>Belum ada booking</p></div>'}</div>`;
}

// ── PROFILE & FOTO ──
function renderTalentProfile(el, t) {
  if (!t) { el.innerHTML='<p>Data tidak ditemukan</p>'; return; }
  const grad = TALENT_GRADIENTS[t.id]||['#fce4ed','#e8a4c0'];
  const photoUrl = getTalentPhotoUrl(t.id);
  const gallery  = getTalentGallery(t.id);

  const photoSlot = (url, slotType, slotIdx) => {
    const isMain   = slotType==='main';
    const label    = isMain ? 'Foto Profil (Utama)' : ('Galeri Foto '+(slotIdx+1));
    const idSuffix = isMain ? 'main' : ('gal'+slotIdx);
    return `
    <div class="photo-slot" id="slot-${idSuffix}-${t.id}">
      <div class="photo-slot-label">${isMain?'🖼️':'📸'} ${label}</div>
      <div class="photo-slot-preview" id="preview-${idSuffix}-${t.id}">
        ${url
          ? `<img src="${url}" alt="${label}" onerror="this.parentElement.innerHTML='<div class=photo-slot-empty>${t.avatar}</div>'">
             <button class="photo-slot-del" onclick="deleteSlotPhoto('${t.id}','${slotType}',${isMain?-1:slotIdx})" title="Hapus foto"><i class='fas fa-trash'></i></button>`
          : `<div class="photo-slot-empty">${isMain?t.avatar:'+'}</div>`
        }
      </div>
      <div class="photo-slot-actions">
        <label class="photo-upload-btn" title="Upload file PNG/JPG">
          <i class="fas fa-upload"></i> Upload File
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style="display:none"
            onchange="handlePhotoFileUpload(event,'${t.id}','${slotType}',${isMain?-1:slotIdx})">
        </label>
        <button class="photo-link-btn" onclick="showDriveLinkInput('${t.id}','${slotType}',${isMain?-1:slotIdx})">
          <i class="fab fa-google-drive"></i> Google Drive
        </button>
      </div>
      <div class="photo-drive-input" id="drive-input-${idSuffix}-${t.id}" style="display:none">
        <input type="text" id="drive-url-${idSuffix}-${t.id}" placeholder="Paste link Google Drive atau File ID..."
          style="width:100%;padding:.55rem .85rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.82rem">
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <button class="btn-sm" style="flex:1;justify-content:center" onclick="applyDriveLink('${t.id}','${slotType}',${isMain?-1:slotIdx})"><i class="fas fa-check"></i> Terapkan</button>
          <button class="btn-sm" style="flex:1;justify-content:center" onclick="document.getElementById('drive-input-${idSuffix}-${t.id}').style.display='none'">Batal</button>
        </div>
      </div>
    </div>`;
  };

  el.innerHTML = `<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Edit Profil ✏️</h2>
    <div class="dash-section" style="margin-bottom:1.5rem">
      <h3 style="font-size:1rem;margin-bottom:.5rem">📸 Kelola Foto</h3>
      <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:1.25rem">Upload PNG/JPG dari perangkat atau tempel link Google Drive. Foto tersimpan langsung ke Firebase Storage. 1 foto profil + 2 foto galeri.</p>
      <div class="photo-slots-grid">
        ${photoSlot(photoUrl,'main',-1)}
        ${photoSlot(gallery[0],'gallery',0)}
        ${photoSlot(gallery[1],'gallery',1)}
      </div>
    </div>
    <div class="admin-2col-grid">
      <div class="dash-section">
        <div style="text-align:center;padding:1.25rem;background:linear-gradient(135deg,var(--pink-light),var(--purple-light));border-radius:var(--radius);margin-bottom:1.25rem">
          <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;margin:0 auto .6rem;background:linear-gradient(135deg,${grad[0]},${grad[1]});display:flex;align-items:center;justify-content:center">
            ${photoUrl?`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`:''}
            <span style="font-size:2.2rem${photoUrl?';display:none':''}">${t.avatar}</span>
          </div>
          <h3 style="font-family:var(--font-display)">${t.name}</h3>
          <p style="color:var(--text-muted);font-size:.8rem;margin:.3rem 0">${t.location} · ${t.gender} · ${t.age} thn</p>
          <span class="status-badge ${t.verified?'badge-active':'badge-pending'}">${t.verified?'✓ Verified':'⏳ Menunggu'}</span>
        </div>
        <h3 style="font-size:.9rem;margin-bottom:.65rem">🔐 Kredensial Login</h3>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.8rem;font-size:.82rem">
          <div style="margin-bottom:.4rem">Username: <strong>${t.username}</strong></div>
          <div>Password: <strong>${t.password}</strong></div>
        </div>
      </div>
      <div class="dash-section">
        <h3 style="font-size:.95rem;margin-bottom:1rem">📝 Edit Info</h3>
        <div class="form-group"><label>Bio</label>
          <textarea rows="3" id="editBio" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem;resize:vertical">${t.bio}</textarea>
        </div>
        <div class="form-group" style="margin-top:.75rem"><label>Hobi</label>
          <input type="text" id="editHobi" value="${t.hobbies||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem">
        </div>
        <div class="form-group" style="margin-top:.75rem"><label>Instagram</label>
          <input type="text" id="editIg" value="${t.ig||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem">
        </div>
        <div class="form-group" style="margin-top:.75rem"><label>TikTok</label>
          <input type="text" id="editTiktok" value="${t.tiktok||''}" style="width:100%;padding:.65rem 1rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:.85rem">
        </div>
        <button class="btn-primary" style="margin-top:1.25rem;width:100%;justify-content:center" onclick="saveTalentProfile('${t.id}')">
          <i class="fas fa-save"></i> Simpan ke Firebase
        </button>
      </div>
    </div>`;
}

// ── PHOTO HELPERS ──
function showDriveLinkInput(talentId, slotType, slotIdx) {
  const suffix = slotType==='main'?'main':('gal'+slotIdx);
  const el = document.getElementById(`drive-input-${suffix}-${talentId}`);
  if (el) el.style.display = el.style.display==='none' ? 'block' : 'none';
}

async function handlePhotoFileUpload(event, talentId, slotType, slotIdx) {
  const file = event.target.files[0]; if (!file) return;
  if (!file.type.match(/image\/(png|jpeg|jpg|webp)/)) { toast('Format tidak didukung! Gunakan PNG/JPG/WEBP','error'); return; }
  if (file.size > 5*1024*1024) { toast('Ukuran file max 5MB!','error'); return; }

  // Coba upload ke Firebase Storage dulu
  const storageUrl = await uploadPhotoToStorage(file, talentId, slotType, slotIdx);

  if (storageUrl) {
    // Berhasil upload ke Firebase Storage
    applyPhotoToSlot(talentId, slotType, slotIdx, storageUrl);
    toast('📸 Foto berhasil diupload ke Firebase!','success');
  } else {
    // Fallback ke base64 jika Storage gagal
    const reader = new FileReader();
    reader.onload = (e) => {
      applyPhotoToSlot(talentId, slotType, slotIdx, e.target.result);
      toast('📸 Foto tersimpan (lokal)','success');
    };
    reader.onerror = () => toast('Gagal membaca file!','error');
    reader.readAsDataURL(file);
  }
}

function applyDriveLink(talentId, slotType, slotIdx) {
  const suffix  = slotType==='main'?'main':('gal'+slotIdx);
  const inputEl = document.getElementById(`drive-url-${suffix}-${talentId}`);
  if (!inputEl||!inputEl.value.trim()) { toast('Masukkan link Google Drive!','error'); return; }
  const url = driveUrlFromInput(inputEl.value.trim());
  if (!url) { toast('Link tidak valid! Pastikan link Google Drive benar.','error'); return; }
  applyPhotoToSlot(talentId, slotType, slotIdx, url);
  const driveInput = document.getElementById(`drive-input-${suffix}-${talentId}`);
  if (driveInput) driveInput.style.display='none';
  toast('🔗 Foto Google Drive diterapkan & disimpan ke Firebase!','success');
}

function applyPhotoToSlot(talentId, slotType, slotIdx, url) {
  const data = getCustomPhotoData(talentId);
  if (slotType==='main') {
    data.main = url;
  } else {
    if (!data.gallery) data.gallery=[null,null];
    data.gallery[slotIdx] = url;
  }
  // Simpan ke Firebase DB
  saveCustomPhotoData(talentId, data);

  // Refresh preview
  const suffix    = slotType==='main'?'main':('gal'+slotIdx);
  const previewEl = document.getElementById(`preview-${suffix}-${talentId}`);
  if (previewEl) {
    previewEl.innerHTML = `<img src="${url}" alt="Foto" onerror="this.parentElement.innerHTML='<div class=photo-slot-empty>❌</div>'">
      <button class="photo-slot-del" onclick="deleteSlotPhoto('${talentId}','${slotType}',${slotIdx})" title="Hapus foto"><i class='fas fa-trash'></i></button>`;
  }
  refreshTalentPhotoDisplay(talentId);
}

function deleteSlotPhoto(talentId, slotType, slotIdx) {
  if (!confirm('Hapus foto ini?')) return;
  const data = getCustomPhotoData(talentId);
  if (slotType==='main') { data.main=null; }
  else { if (data.gallery) data.gallery[slotIdx]=null; }
  saveCustomPhotoData(talentId, data);
  const suffix    = slotType==='main'?'main':('gal'+slotIdx);
  const previewEl = document.getElementById(`preview-${suffix}-${talentId}`);
  const t = getTalents().find(x=>x.id===talentId);
  if (previewEl) previewEl.innerHTML=`<div class="photo-slot-empty">${slotType==='main'?(t?t.avatar:'✨'):'+'}</div>`;
  refreshTalentPhotoDisplay(talentId);
  toast('Foto dihapus dari Firebase','info');
}

function refreshTalentPhotoDisplay(talentId) {
  const overviewEl = document.getElementById('talent-tab-overview');
  if (overviewEl && overviewEl.classList.contains('active')) {
    const t = getTalents().find(x=>x.id===talentId);
    if (t) renderTalentOverview(overviewEl, t);
  }
}

function saveTalentProfile(id) {
  const b  = document.getElementById('editBio');
  const h  = document.getElementById('editHobi');
  const ig = document.getElementById('editIg');
  const tk = document.getElementById('editTiktok');
  const updates = {};
  if (b)  updates.bio     = b.value;
  if (h)  updates.hobbies = h.value;
  if (ig) updates.ig      = ig.value;
  if (tk) updates.tiktok  = tk.value;
  updateTalent(id, updates);
  toast('Profil tersimpan ke Firebase! ✓','success');
}

function renderTalentEarnings(el, t) {
  if (!t) { el.innerHTML='<p>Data tidak ditemukan</p>'; return; }
  const done = getOrders().filter(o=>o.talent===t.name&&o.status==='Selesai');
  let total = 0;
  done.forEach(o => { const raw=(o.total||'').replace(/\./g,'').replace(/[^0-9]/g,''); total+=parseInt(raw||0,10); });
  el.innerHTML = `<h2 style="font-family:var(--font-display);margin-bottom:1.5rem">Pendapatan 💰</h2>
    <div class="dash-grid-4">
      <div class="dash-stat-card" style="background:linear-gradient(135deg,var(--pink-light),var(--purple-light));border:none"><div class="dsc-icon">💵</div><div class="dsc-val" style="font-size:1.2rem">Rp ${total.toLocaleString('id-ID')}</div><div class="dsc-label">Total Pendapatan</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">📊</div><div class="dsc-val">${done.length}</div><div class="dsc-label">Order Selesai</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">⭐</div><div class="dsc-val">${t.rating}</div><div class="dsc-label">Rating</div></div>
      <div class="dash-stat-card"><div class="dsc-icon">🏅</div><div class="dsc-val">${t.bookings}</div><div class="dsc-label">All Time Booking</div></div>
    </div>
    <div class="dash-section"><h3>📋 Histori Order Selesai</h3>${done.length?`<div class="table-scroll">${ordersTable(done)}</div>`:'<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem">💰</div><p>Belum ada pendapatan</p></div>'}</div>`;
}

// ── MODALS ──
function openModal(id)  { const el=document.getElementById(id); if(el)el.classList.add('open'); }
function closeModal(id) { const el=document.getElementById(id); if(el)el.classList.remove('open'); }

function showNotifModal(msg, icon='🎉') {
  const c = document.getElementById('notifContent');
  if (c) c.innerHTML = `<div style="text-align:center;padding:1rem"><div style="font-size:3.5rem;margin-bottom:1rem">${icon}</div><p style="font-size:.9rem;line-height:1.7;color:var(--text-sec)">${msg}</p><div style="margin-top:1.25rem;padding:.85rem;background:var(--pink-light);border-radius:var(--radius-sm);font-size:.8rem;color:var(--pink-deep);display:flex;align-items:center;gap:.5rem;justify-content:center"><i class="fab fa-whatsapp"></i> Konfirmasi dikirim via WhatsApp dalam 5–15 menit</div></div>`;
  openModal('notifModal');
}

function toast(msg, type='info') {
  const c = document.getElementById('toastContainer'); if (!c) return;
  while (c.children.length >= 3) c.removeChild(c.firstChild);
  const el = document.createElement('div'); el.className='toast '+type;
  const icons = {success:'✅',error:'❌',info:'ℹ️'};
  el.innerHTML = `<span style="flex-shrink:0">${icons[type]||'ℹ️'}</span><span style="flex:1">${msg}</span><span onclick="this.parentElement.remove()" style="flex-shrink:0;cursor:pointer;opacity:.6;padding:.1rem .2rem;font-size:.85rem">✕</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(10px)'; el.style.transition='all .35s'; setTimeout(()=>el.remove(),350); }, 3000);
}

// ── MUSIC — FIX: accessed inside function, not at top level ──
function toggleMusic() {
  const bgMusic = document.getElementById('bgMusic');
  if (!bgMusic) return;
  musicPlaying = !musicPlaying;
  const icon = document.getElementById('musicIcon');
  const btn  = document.getElementById('floatMusic');
  if (musicPlaying) {
    bgMusic.play().catch(()=>{}); // catch autoplay policy error
    if (icon) icon.className='fas fa-pause';
    if (btn)  btn.classList.add('playing');
    toast('🎵 Ambient music diputar...','info');
  } else {
    bgMusic.pause();
    if (icon) icon.className='fas fa-music';
    if (btn)  btn.classList.remove('playing');
    toast('🎵 Musik dimatikan','info');
  }
}

// ── POPUP NOTIF ──
function schedulePopup() {
  const msgs = [
    {icon:'🌸',title:'Ara online!',body:'Talent favoritmu siap menemanimu'},
    {icon:'🎉',title:'Booking masuk!',body:'Platform makin ramai, yuk pilih talent'},
    {icon:'💌',title:'Promo spesial!',body:'Diskon 20% untuk PDKT Package'},
    {icon:'🎮',title:'Kira siap Mabar!',body:'Pro gamer online sekarang'},
  ];
  let i=0;
  function next() {
    if (currentPage==='admin'||currentPage==='talent-dash') { setTimeout(next,15000); return; }
    const m = msgs[i++%msgs.length];
    showPopup(m.icon, m.title, m.body);
    setTimeout(next, 18000+Math.random()*10000);
  }
  setTimeout(next, 10000);
}

function showPopup(icon, title, body) {
  if (document.querySelector('.modal-overlay.open')) return;
  let p = document.getElementById('globalPopup');
  if (!p) {
    p = document.createElement('div');
    p.id = 'globalPopup';
    p.className = 'popup-notif';
    p.innerHTML = `
      <div class="popup-notif-header">
        <div class="popup-notif-title">
          <span id="pnIcon"></span>
          <span id="pnTitle"></span>
        </div>
        <button class="popup-notif-close" onclick="document.getElementById('globalPopup').classList.remove('show')" aria-label="Tutup">✕</button>
      </div>
      <p id="pnBody"></p>`;
    document.body.appendChild(p);
  }
  const pi=document.getElementById('pnIcon'), pt=document.getElementById('pnTitle'), pb=document.getElementById('pnBody');
  if (pi) pi.textContent=icon+' ';
  if (pt) pt.textContent=title;
  if (pb) pb.textContent=body;
  p.classList.add('show');
  clearTimeout(p._hideTimer);
  p._hideTimer = setTimeout(() => p.classList.remove('show'), 5000);
}
