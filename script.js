// اخبارك - واجهة الموقع. التصميم الأصلي محفوظ، والبيانات تأتي من Supabase.

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('ar-EG', options);
}
updateDate();

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times');
    });
}

const searchToggle = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const closeSearch = document.getElementById('closeSearch');
if (searchToggle && searchOverlay) searchToggle.addEventListener('click', () => { searchOverlay.classList.add('active'); searchOverlay.querySelector('input').focus(); });
if (closeSearch && searchOverlay) closeSearch.addEventListener('click', () => searchOverlay.classList.remove('active'));

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { searchOverlay?.classList.remove('active'); mainNav?.classList.remove('active'); }
});

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' && themeToggle) { html.setAttribute('data-theme','dark'); themeToggle.querySelector('i').classList.replace('fa-moon','fa-sun'); }
if (themeToggle) themeToggle.addEventListener('click', () => {
    const dark = html.getAttribute('data-theme') === 'dark';
    if (dark) { html.removeAttribute('data-theme'); localStorage.setItem('theme','light'); themeToggle.querySelector('i').classList.replace('fa-sun','fa-moon'); }
    else { html.setAttribute('data-theme','dark'); localStorage.setItem('theme','dark'); themeToggle.querySelector('i').classList.replace('fa-moon','fa-sun'); }
});

document.querySelector('.newsletter-form')?.addEventListener('submit', e => { e.preventDefault(); const email=e.target.querySelector('input').value; if(email){alert('شكراً لاشتراكك! سيتم إرسال النشرة إلى: '+email);e.target.reset();}});

const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('YOUR_');
let db = null;
if (configured && window.supabase) {
    db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    loadNews();
} else {
    showEmptyState();
}

const catClass = {'سياسة':'politics','اقتصاد':'economy','رياضة':'sports','تكنولوجيا':'tech','ثقافة':'culture'};
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function safeUrl(url=''){try{return new URL(url,location.href).href.replace(/"/g,'%22')}catch{return '#'}}
function timeAgo(date){
    const sec=Math.max(0,(Date.now()-new Date(date).getTime())/1000);
    if(sec<60)return 'منذ أقل من دقيقة'; const min=Math.floor(sec/60); if(min<60)return `منذ ${min} دقيقة`;
    const hr=Math.floor(min/60); if(hr<24)return `منذ ${hr} ساعة`; const day=Math.floor(hr/24); if(day<7)return `منذ ${day} يوم`;
    return new Date(date).toLocaleDateString('ar-EG');
}
function badge(cat){return `<span class="category-badge ${catClass[cat]||''}">${esc(cat)}</span>`;}
function img(url,alt=''){return `<img src="${esc(safeUrl(url))}" alt="${esc(alt)}" loading="lazy">`;}

async function loadNews(){
    const {data,error}=await db.from('news').select('*').order('published_at',{ascending:false});
    if(error){console.error(error);showEmptyState('تعذر تحميل الأخبار حاليًا.');return;}
    renderNews(data||[]);
}

function renderNews(news){
    const featured=news.filter(n=>n.featured)[0] || news[0];
    const side=news.filter(n=>n.id!==featured?.id).slice(0,2);
    const latest=news.slice(0,8);
    const politics=news.filter(n=>n.category==='سياسة').slice(0,4);
    const sports=news.filter(n=>n.category==='رياضة').slice(0,4);
    const techEconomy=news.filter(n=>n.category==='تكنولوجيا'||n.category==='اقتصاد').slice(0,6);

    document.getElementById('heroMain').innerHTML=featured?`<article class="hero-article"><div class="hero-image">${img(featured.image_url,featured.title)}${badge(featured.category)}</div><div class="hero-content"><h1><a href="#">${esc(featured.title)}</a></h1><p class="excerpt">${esc(featured.excerpt||featured.content.slice(0,220))}</p><div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(featured.published_at)}</span></div></div></article>`:'';
    document.getElementById('heroSide').innerHTML=side.map(n=>`<article class="side-article"><div class="side-image">${img(n.image_url,n.title)}${badge(n.category)}</div><h3><a href="#">${esc(n.title)}</a></h3><div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(n.published_at)}</span></div></article>`).join('');
    document.getElementById('latestNews').innerHTML=latest.map(card).join('');
    document.getElementById('politicsNews').innerHTML=politics.map(horizontalCard).join('') || emptyCategory();
    document.getElementById('sportsNews').innerHTML=sports.map(horizontalCard).join('') || emptyCategory();
    document.getElementById('techNews').innerHTML=techEconomy.map(card).join('') || emptyCategory();

    const popular=news.slice(0,5);
    document.getElementById('popularList').innerHTML=popular.map((n,i)=>`<li><span class="rank">${i+1}</span><a href="#">${esc(n.title)}</a></li>`).join('') || '<li>لا توجد أخبار بعد</li>';
    const counts={}; news.forEach(n=>counts[n.category]=(counts[n.category]||0)+1);
    document.getElementById('categoriesList').innerHTML=['سياسة','اقتصاد','رياضة','تكنولوجيا','ثقافة'].map(c=>`<li><a href="#latest" data-category="${esc(c)}">${esc(c)} <span>${counts[c]||0}</span></a></li>`).join('');
    const ticker= news.slice(0,5).map(n=>esc(n.title)).join(' • ');
    document.querySelector('.ticker').innerHTML=`<span>${ticker||'تابع آخر الأخبار من اخبارك' } • </span><span>${ticker||'تابع آخر الأخبار من اخبارك'} • </span>`;
    bindCategoryFilters(news);
}

function card(n){return `<article class="news-card"><div class="card-image">${img(n.image_url,n.title)}${badge(n.category)}</div><div class="card-content"><h3><a href="#">${esc(n.title)}</a></h3>${n.excerpt?`<p>${esc(n.excerpt)}</p>`:''}<div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(n.published_at)}</span></div></div></article>`;}
function horizontalCard(n){return `<article class="horizontal-card"><div class="h-image">${img(n.image_url,n.title)}</div><div class="h-content"><h3><a href="#">${esc(n.title)}</a></h3><p>${esc(n.excerpt||n.content.slice(0,150))}</p><div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(n.published_at)}</span></div></div></article>`;}
function emptyCategory(){return '<p style="padding:10px">لا توجد أخبار في هذا القسم حاليًا.</p>';}
function showEmptyState(msg='لا توجد أخبار منشورة حاليًا.'){
    ['heroMain','heroSide','latestNews','politicsNews','sportsNews','techNews','popularList'].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML= id==='popularList'?'<li>لا توجد أخبار بعد</li>': id.includes('News')||id.includes('hero')?emptyCategory():'';});
}
function bindCategoryFilters(news){
    document.querySelectorAll('#categoriesList a[data-category]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const c=a.dataset.category;document.getElementById('latestNews').innerHTML=news.filter(n=>n.category===c).map(card).join('')||emptyCategory();document.getElementById('latest').scrollIntoView({behavior:'smooth'});}));
}

const navLinks=document.querySelectorAll('.main-nav a');
navLinks.forEach(link=>link.addEventListener('click',()=>{navLinks.forEach(l=>l.classList.remove('active'));link.classList.add('active');mainNav?.classList.remove('active');if(menuToggle)menuToggle.querySelector('i').classList.replace('fa-times','fa-bars');}));

document.querySelector('#searchOverlay input')?.addEventListener('input', async e=>{
    if(!db)return; const q=e.target.value.trim(); if(!q)return;
    const {data}=await db.from('news').select('*').or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`).order('published_at',{ascending:false}).limit(20);
    document.getElementById('latestNews').innerHTML=(data||[]).map(card).join('')||emptyCategory();
});
