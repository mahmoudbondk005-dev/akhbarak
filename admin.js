const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('YOUR_');
let supabaseClient = null;
let allNews = [];

const $ = id => document.getElementById(id);
const loginView = $('loginView'), adminView = $('adminView');

function show(el, yes=true){el.classList.toggle('hidden', !yes)}
function status(el, msg, error=false){el.innerHTML = msg ? `<div class="status" style="${error?'background:#fff0f0;color:#b71c1c':''}">${msg}</div>` : '';}
function formatDate(v){return new Date(v).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'});}
function localInputDate(v){const d=new Date(v); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}

if(!configured){
  status($('loginStatus'),'افتح ملف <b>supabase-config.js</b> وضع SUPABASE_URL و SUPABASE_ANON_KEY أولاً.',true);
  $('loginForm').querySelector('button').disabled = true;
} else {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  init();
}

async function init(){
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(session) await enterAdmin(session);
  supabaseClient.auth.onAuthStateChange(async (_event, session)=>{
    if(session) await enterAdmin(session); else {show(adminView,false);show(loginView,true);}
  });
}

$('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  status($('loginStatus'),'جاري تسجيل الدخول...');
  const {error} = await supabaseClient.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error) status($('loginStatus'),'بيانات الدخول غير صحيحة أو الحساب غير مفعّل كمدير.',true);
});

async function enterAdmin(session){
  const {data,isAdmin,error} = await checkAdmin();
  if(error || !isAdmin){await supabaseClient.auth.signOut();status($('loginStatus'),'هذا الحساب ليس مديرًا للوحة التحكم.',true);return;}
  show(loginView,false);show(adminView,true);status($('adminStatus'),''); resetForm(); await loadNews();
}

async function checkAdmin(){
  const {data,error} = await supabaseClient.rpc('is_admin');
  return {isAdmin:data===true,error};
}

$('logoutBtn').onclick = ()=>supabaseClient.auth.signOut();
$('search').addEventListener('input',renderNews);
$('cancelBtn').onclick = resetForm;

$('newsForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const id=$('newsId').value;
  const payload={title:$('title').value.trim(),content:$('content').value.trim(),excerpt:$('excerpt').value.trim(),category:$('category').value,published_at:new Date($('publishedAt').value).toISOString(),featured:$('featured').checked};
  $('saveBtn').disabled=true; status($('adminStatus'),'جاري حفظ الخبر...');
  try{
    const file=$('image').files[0];
    if(file) payload.image_url=await uploadImage(file);
    if(id){
      const {error}=await supabaseClient.from('news').update(payload).eq('id',id); if(error) throw error;
    }else{
      if(!payload.image_url) payload.image_url='https://images.unsplash.com/photo-1504711435509-e1b5fe1bd7d3?w=900&h=500&fit=crop';
      const {error}=await supabaseClient.from('news').insert(payload); if(error) throw error;
    }
    status($('adminStatus'),'تم حفظ الخبر بنجاح.'); resetForm(); await loadNews();
  }catch(err){status($('adminStatus'),'حدث خطأ: '+escapeHtml(err.message),true)}finally{$('saveBtn').disabled=false;}
});

async function uploadImage(file){
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path=`${crypto.randomUUID()}.${ext||'jpg'}`;
  const {error}=await supabaseClient.storage.from('news-images').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if(error) throw error;
  return supabaseClient.storage.from('news-images').getPublicUrl(path).data.publicUrl;
}

async function loadNews(){
  const {data,error}=await supabaseClient.from('news').select('*').order('published_at',{ascending:false});
  if(error){status($('adminStatus'),'تعذر تحميل الأخبار: '+escapeHtml(error.message),true);return;}
  allNews=data||[]; renderNews();
}

function renderNews(){
  const q=$('search').value.trim().toLowerCase();
  const list=allNews.filter(n=>(n.title+' '+n.excerpt+' '+n.category).toLowerCase().includes(q));
  $('newsList').innerHTML=list.length?list.map(n=>`<div class="news"><img src="${safeAttr(n.image_url)}" alt=""><div class="news-main"><div class="news-title">${escapeHtml(n.title)}</div><div class="meta">${escapeHtml(n.category)} · ${formatDate(n.published_at)} ${n.featured?'· ⭐ مميز':''}</div><div class="meta">${escapeHtml(n.excerpt||'')}</div></div><div class="actions"><button class="btn muted" onclick="editNews('${n.id}')">تعديل</button><button class="btn danger" onclick="deleteNews('${n.id}')">حذف</button></div></div>`).join(''):'<div class="meta">لا توجد أخبار.</div>';
}

window.editNews = id=>{const n=allNews.find(x=>x.id===id);if(!n)return;$('newsId').value=n.id;$('title').value=n.title;$('category').value=n.category;$('publishedAt').value=localInputDate(n.published_at);$('excerpt').value=n.excerpt||'';$('content').value=n.content||'';$('featured').checked=!!n.featured;$('currentImage').textContent=n.image_url?'الصورة الحالية محفوظة، اختر صورة جديدة لاستبدالها.':'';$('formTitle').textContent='تعديل الخبر';$('saveBtn').textContent='حفظ التعديل';window.scrollTo({top:0,behavior:'smooth'});};

window.deleteNews=async id=>{const n=allNews.find(x=>x.id===id);if(!n||!confirm('هل تريد حذف هذا الخبر نهائيًا؟'))return;status($('adminStatus'),'جاري الحذف...');const {error}=await supabaseClient.from('news').delete().eq('id',id);if(error)status($('adminStatus'),'تعذر الحذف: '+escapeHtml(error.message),true);else{status($('adminStatus'),'تم حذف الخبر.');await loadNews();}};

function resetForm(){ $('newsForm').reset(); $('newsId').value=''; $('formTitle').textContent='إضافة خبر جديد';$('saveBtn').textContent='حفظ الخبر';$('currentImage').textContent=''; const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());$('publishedAt').value=d.toISOString().slice(0,16);}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function safeAttr(s=''){return escapeHtml(s).replace(/`/g,'&#96;');}
