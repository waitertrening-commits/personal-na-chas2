const C=window.CFG||{},live=!!(C.url&&C.key),ADMIN='waiter.trening@gmail.com';
const sb=live?supabase.createClient(C.url,C.key):null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=/duplicate/.test(m)?'Это уже сделано ранее':m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3000)};
const ST={published:'Опубликовано',pending:'На модерации',hidden:'Скрыто',new:'Новая',work:'В работе',done:'Закрыта'};
const STAFF=[['Официант','от 80 000 сум/час'],['Повар','от 150 000 сум/час'],['Бармен','от 120 000 сум/час'],['Раннер на банкет','от 300 000 сум/смена'],['Команда официантов','от 70 000 сум/час на человека'],['Повар-мангальщик','от 180 000 сум/час']];
const TRAIN=[['Техника работы официанта','2 000 000 сум','Практический курс по технике обслуживания и подаче.'],['Официант-продавец','1 500 000 сум','Активные продажи, рекомендации и увеличение среднего чека.']];
const F={
vacancies:[['title','Должность'],['company','Компания / заведение'],['city','Город'],['salary','Зарплата'],['type','Тип занятости','sel',['Постоянная','Временная','Подработка','Стажировка']],['phone','Телефон для откликов'],['description','Описание','area']],
resumes:[['full_name','ФИО'],['phone','Телефон'],['position','Желаемая должность'],['city','Город'],['experience','Опыт, лет'],['salary','Желаемая зарплата'],['about','О себе, навыки','area']],
orders:[['name','Имя'],['phone','Телефон'],['event_date','Дата','date'],['event','Тип мероприятия'],['address','Адрес'],['staff','Нужные специалисты'],['guests','Количество гостей'],['budget','Бюджет, сум'],['comment','Комментарий','area']]};
const OPT=new Set(['comment','salary','about','guests','budget','address']);
/* ---------- данные: демо (localStorage) или Supabase ---------- */
const seed={vacancies:[
{id:'s1',title:'Официант в ресторан',company:'Ресторан-партнёр',city:'Ташкент',salary:'4–6 млн сум/месяц',type:'Постоянная',phone:'',description:'Обслуживание гостей, знание меню, стандарты сервиса.',status:'published'},
{id:'s2',title:'Повар горячего цеха',company:'HoReCa Group',city:'Ташкент',salary:'6–8 млн сум/месяц',type:'Постоянная',phone:'',description:'Приготовление блюд по технологическим картам.',status:'published'},
{id:'s3',title:'Раннер на банкет',company:'Event Service',city:'Ташкент',salary:'300 000 сум/смена',type:'Подработка',phone:'',description:'Подача блюд и помощь команде официантов.',status:'published'}],
resumes:[{id:'r1',full_name:'Азиз К. (пример)',phone:'+998 90 000 00 00',position:'Официант',city:'Ташкент',experience:'3',salary:'5 млн сум',about:'Банкеты, ресторан, работа с кассой.',status:'published'}],applications:[],orders:[]};
const ld=t=>JSON.parse(localStorage.getItem('pnch2_'+t)||'null')||seed[t]||[];
const sv=(t,a)=>localStorage.setItem('pnch2_'+t,JSON.stringify(a));
const fail=r=>{if(r.error){toast(r.error.message);return false}return true};
const DB={
async list(t,f={}){if(live){let q=sb.from(t).select('*').order('created_at',{ascending:false}).limit(500);for(const k in f)q=q.eq(k,f[k]);const r=await q;fail(r);return r.data||[]}return ld(t).filter(x=>Object.keys(f).every(k=>x[k]===f[k]))},
async add(t,o){if(live){const r=await sb.from(t).insert(o);return fail(r)?o:null}const a=ld(t);o={...o,id:'d'+Date.now(),created_at:new Date().toISOString()};a.unshift(o);sv(t,a);return o},
async upd(t,id,o){if(live){const r=await sb.from(t).update(o).eq('id',id);return fail(r)}sv(t,ld(t).map(x=>x.id===id?{...x,...o}:x));return true},
async del(t,id){if(live){const r=await sb.from(t).delete().eq('id',id);return fail(r)}sv(t,ld(t).filter(x=>x.id!==id));return true}};
/* ---------- вход ---------- */
let me=null;
async function loadMe(){
if(live){const{data:{session}}=await sb.auth.getSession();if(!session){me=null;return}const u=session.user;const r=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle();me={id:u.id,email:u.email,name:r.data?.full_name||u.email,role:r.data?.role||'user'}}
else me=JSON.parse(localStorage.getItem('pnch2_me')||'null')}
async function auth(e,mode){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
if(live){const r=mode==='reg'?await sb.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.name}}}):await sb.auth.signInWithPassword({email:f.email,password:f.password});
if(r.error)return toast(r.error.message);if(mode==='reg'&&!r.data.session)return toast('Подтвердите email по письму, затем войдите.')}
else{me={id:'u_'+f.email.toLowerCase(),email:f.email,name:f.name||f.email.split('@')[0],role:f.email.toLowerCase()===ADMIN?'admin':'user'};localStorage.setItem('pnch2_me',JSON.stringify(me))}
await loadMe();nav();go('cabinet')}
const google=()=>sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
async function logout(){if(live)await sb.auth.signOut();else localStorage.removeItem('pnch2_me');me=null;nav();go('home')}
/* ---------- каркас ---------- */
function nav(){const L=[['jobs','Вакансии'],['resumes','Резюме'],['staff','Персонал на час'],['training','Обучение']];
$('#nav').innerHTML=L.map(([p,l])=>`<button data-page="${p}">${l}</button>`).join('')+(me?.role==='admin'?'<button data-page="admin">Админ</button>':'');
$('#acct').innerHTML=me?`<button data-page="cabinet">${esc(me.name)}</button><button onclick="logout()">Выйти</button>`:'<button data-page="login">Войти</button><button class="gold" data-page="register">Регистрация</button>'}
const go=p=>{if(location.hash.slice(1)===p)render();else location.hash=p};
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){e.preventDefault();go(b.dataset.page)}});
const head=(t,s)=>`<section class="hero"><span>HR-ПЛАТФОРМА HORECA · УЗБЕКИСТАН</span><h1>${t}</h1><p>${s}</p></section>`;
const grid=(a,f)=>`<div class="grid">${a.map(f).join('')||'<p class="muted">Ничего не найдено.</p>'}</div>`;
const pill=s=>`<span class="pill ${s}">${ST[s]||esc(s)}</span>`;
function fld(f,v=''){const[n,l,t,o]=f,r=OPT.has(n)?'':'required';return`<div class="field"><label>${l}</label>${t==='area'?`<textarea name="${n}" maxlength="3000" ${r}>${esc(v)}</textarea>`:t==='sel'?`<select name="${n}">${o.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`:`<input name="${n}" type="${t||'text'}" maxlength="200" value="${esc(v)}" ${r}>`}</div>`}
function formPage(t,it,title,sub,onsub){it=it||{};return head(title,sub)+`<section class="section"><form class="form" onsubmit="${onsub||`saveForm(event,'${t}','${it.id||''}')`}"><div class="formgrid">${F[t].map(f=>fld(f,it[f[0]])).join('')}</div>${t==='orders'?'<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">':''}<button class="wine">Сохранить</button></form></section>`}
async function saveForm(e,t,id){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
if(t==='orders'){if(f.website){toast('Заявка отправлена.');return go('home')}delete f.website;const L=+localStorage.getItem('pnch2_last')||0;if(Date.now()-L<60000)return toast('Подождите минуту перед следующей заявкой');f.user_id=me?.id||null;f.status='new';if(await DB.add(t,f)){localStorage.setItem('pnch2_last',Date.now());toast('Заявка отправлена. Мы свяжемся с вами.');go(me?'cabinet':'home')}return}
if(!id)f.status=me.role==='admin'?'published':'pending';else if(me.role!=='admin')f.status='pending';
let ok;if(id)ok=await DB.upd(t,id,f);else{f[t==='vacancies'?'created_by':'user_id']=me.id;ok=await DB.add(t,f)}
if(ok){toast(me.role==='admin'?'Опубликовано':'Отправлено на модерацию');go('cabinet')}}
async function setSt(t,id,s){if(await DB.upd(t,id,{status:s})){toast('Готово');render()}}
async function rm(t,id){if(confirm('Удалить безвозвратно?')&&await DB.del(t,id)){toast('Удалено');render()}}
async function apply(id){if(!me){toast('Сначала войдите');return go('login')}
const v=JOBS.find(x=>x.id===id);if(v?.created_by===me.id)return toast('Это ваша вакансия');
const r=(await DB.list('resumes',{user_id:me.id}))[0];const phone=r?.phone||prompt('Ваш телефон для связи:');if(!phone)return;
if(await DB.add('applications',{vacancy_id:id,user_id:me.id,name:r?.full_name||me.name,phone,message:r?.position||'',vacancy_title:v?.title||''}))toast('Отклик отправлен работодателю')}
/* ---------- карточки и фильтры ---------- */
let JOBS=[],RES=[];
const jobCard=x=>{const mine=me&&(x.created_by===me.id||me.role==='admin');return`<article class="card"><span class="pill">${esc(x.type)}</span><h3>${esc(x.title)}</h3><b>${esc(x.company)}</b><p class="muted">${esc(x.city)} · ${esc(x.description)}</p><div class="price">${esc(x.salary)}</div><div class="row"><button class="wine" onclick="apply('${x.id}')">Откликнуться</button>${mine?`<button onclick="go('edit/vacancies/${x.id}')">Изменить</button>`:''}</div></article>`};
const resCard=x=>`<article class="card"><span class="pill">${esc(x.position)}</span><h3>${esc(x.full_name)}</h3><p class="muted">${esc(x.city)} · опыт ${esc(x.experience)} лет<br>${esc(x.about)}</p><div class="price">${esc(x.salary)}</div><div class="row"><a href="tel:${esc(x.phone)}"><button class="wine">${esc(x.phone)}</button></a></div></article>`;
function filt(){const q=$('#q').value.toLowerCase(),c=$('#c').value.toLowerCase(),isJ=!!$('#res').dataset.j;const L=isJ?JOBS:RES;
$('#res').innerHTML=grid(L.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q)&&(x.city||'').toLowerCase().includes(c)),isJ?jobCard:resCard)}
const bar=a=>`<div class="row"><input class="search" id="q" placeholder="Поиск по должности, компании, навыкам" oninput="filt()" style="flex:2"><input class="search" id="c" placeholder="Город" oninput="filt()" style="flex:1">${a||''}</div>`;
const inp=(l,n,t='text',x='')=>`<div class="field"><label>${l}</label><input name="${n}" type="${t}" ${x} required></div>`;
/* ---------- страницы ---------- */
const PAGES={
async home(){JOBS=(await DB.list('vacancies',{status:'published'}));
return`<section class="hero"><span>ЕДИНАЯ ПЛАТФОРМА ТРУДОВЫХ РЕСУРСОВ HORECA</span><h1>Работа. Персонал. Обучение.</h1><p>Находите сотрудников, размещайте резюме, заказывайте персонал для мероприятий и развивайте навыки.</p><div class="row"><button class="gold" data-page="jobs">Найти работу</button><button data-page="post/vacancies">Разместить вакансию</button><button data-page="post/resumes">Создать резюме</button><button data-page="request">Заказать персонал</button></div></section><section class="section"><h2>Свежие вакансии</h2>${grid(JOBS.slice(0,3),jobCard)}</section>`},
async jobs(){JOBS=(await DB.list('vacancies',{status:'published'}));return head('Вакансии HoReCa','Постоянная работа, временная занятость и подработка.')+`<section class="section">${bar('<button class="gold" data-page="post/vacancies">+ Вакансия</button>')}<div id="res" data-j="1">${grid(JOBS,jobCard)}</div></section>`},
async resumes(){RES=(await DB.list('resumes',{status:'published'}));return head('Резюме специалистов','Контакты видны только зарегистрированным работодателям.')+`<section class="section">${bar('<button class="gold" data-page="post/resumes">+ Моё резюме</button>')}<div id="res">${grid(RES,resCard)}</div></section>`},
async staff(){return head('Персонал на час','Официанты, повара, бармены и команды для мероприятий.')+`<section class="section">${grid(STAFF,x=>`<article class="card"><h3>${x[0]}</h3><div class="price">${x[1]}</div><div class="row"><button class="wine" onclick="go('request/${encodeURIComponent(x[0])}')">Заказать</button></div></article>`)}</section>`},
async training(){return head('Тренинги и мастер-классы','Практическое обучение от Mashkov.Uz.')+`<section class="section">${grid(TRAIN,x=>`<article class="card"><span class="pill">Обучение</span><h3>${x[0]}</h3><p class="muted">${x[2]}</p><div class="price">${x[1]}</div><div class="row"><button class="wine" onclick="go('request/${encodeURIComponent('Обучение: '+x[0])}')">Записаться</button></div></article>`)}</section>`},
async request(a){return formPage('orders',{staff:a||''},'Заказать персонал','Опишите мероприятие, и мы подберём команду.')},
async post(t){t=t||'vacancies';if(t==='resumes'){const m=(await DB.list('resumes',{user_id:me.id}))[0];if(m)return PAGES.edit('resumes',m.id)}
return formPage(t,{},t==='resumes'?'Новое резюме':'Новая вакансия',me.role==='admin'?'Публикуется сразу.':'После отправки запись проверит модератор.')},
async edit(t,id){const it=(await DB.list(t,{id}))[0];return formPage(t,it,'Редактирование',me.role==='admin'?'Публикуется сразу.':'После изменений запись снова уйдёт на модерацию.')},
login:async()=>head('Войти','Войдите, чтобы откликаться и размещать вакансии.')+`<section class="section"><form class="form" onsubmit="auth(event,'login')">${inp('Email','email','email')}${inp('Пароль','password','password','minlength=6')}<button class="wine">Войти</button>${live?'<button type="button" onclick="google()">Войти через Google</button>':'<p class="muted">Демо: подойдёт любой email.</p>'}</form></section>`,
register:async()=>head('Регистрация','Бесплатно для соискателей и работодателей.')+`<section class="section"><form class="form" onsubmit="auth(event,'reg')">${inp('Имя','name')}${inp('Email','email','email')}${inp('Пароль','password','password','minlength=6')}<button class="wine">Зарегистрироваться</button>${live?'<button type="button" onclick="google()">Через Google</button>':''}</form></section>`,
async cabinet(){const[V,R,Ap,O]=await Promise.all([DB.list('vacancies',{created_by:me.id}),DB.list('resumes',{user_id:me.id}),DB.list('applications'),DB.list('orders',{user_id:me.id})]);
const mv=V,mr=R[0],ids=new Set(mv.map(x=>x.id)),inc=Ap.filter(x=>ids.has(x.vacancy_id)),my=Ap.filter(x=>x.user_id===me.id),mo=O;
return head('Личный кабинет',`${esc(me.name)} · ${me.role==='admin'?'администратор':'пользователь'}`)+`<section class="section"><div class="stats"><div class="stat"><b>${mv.length}</b>Мои вакансии</div><div class="stat"><b>${inc.length}</b>Отклики на них</div><div class="stat"><b>${my.length}</b>Мои отклики</div><div class="stat"><b>${mo.length}</b>Мои заявки</div></div>
<h2>Мои вакансии</h2><div class="row"><button class="gold" data-page="post/vacancies">+ Вакансия</button></div>${grid(mv,x=>{const a=inc.filter(i=>i.vacancy_id===x.id);return`<article class="card">${pill(x.status)}<h3>${esc(x.title)}</h3><p class="muted">${esc(x.company)} · ${esc(x.city)}</p><p><b>Отклики (${a.length})</b><br>${a.map(i=>`${esc(i.name)} · <a href="tel:${esc(i.phone)}">${esc(i.phone)}</a>`).join('<br>')||'<span class="muted">пока нет</span>'}</p><div class="row"><button onclick="go('edit/vacancies/${x.id}')">Изменить</button><button onclick="rm('vacancies','${x.id}')">Удалить</button></div></article>`})}
<h2 style="margin-top:30px">Моё резюме</h2>${mr?`<div class="grid"><article class="card">${pill(mr.status)}<h3>${esc(mr.full_name)}</h3><p class="muted">${esc(mr.position)} · ${esc(mr.city)}</p><div class="row"><button onclick="go('edit/resumes/${mr.id}')">Изменить</button><button onclick="rm('resumes','${mr.id}')">Удалить</button></div></article></div>`:'<div class="row"><button class="gold" data-page="post/resumes">+ Создать резюме</button></div>'}
<h2 style="margin-top:30px">Мои отклики</h2>${grid(my,x=>`<article class="card"><h3>${esc(x.vacancy_title||'Вакансия')}</h3><p class="muted">${esc(x.created_at?.slice(0,10)||'')}</p></article>`)}
<h2 style="margin-top:30px">Мои заявки на персонал</h2>${grid(mo,x=>`<article class="card">${pill(x.status)}<h3>${esc(x.event)}</h3><p class="muted">${esc(x.event_date)} · ${esc(x.staff)}</p></article>`)}
<div class="row"><button onclick="logout()">Выйти</button></div></section>`},
async admin(a){a=a||'vacancies';const D={};for(const t of['vacancies','resumes','orders'])D[t]=await DB.list(t);
const U=live?(await sb.from('profiles').select('*').order('created_at',{ascending:false})).data||[]:[];
const tabs=[['vacancies','Вакансии'],['resumes','Резюме'],['orders','Заявки'],['users','Пользователи']];
const wait=t=>D[t]?.filter(x=>x.status==='pending'||x.status==='new').length||0;
const mod=(t,x)=>`<article class="card">${pill(x.status)} <b>${esc(t==='vacancies'?x.title+' — '+x.company:x.full_name+' — '+x.position)}</b><p class="muted">${esc(x.city)} · ${esc(x.phone||'')}<br>${esc(x.description||x.about||'')}</p><div class="row"><button class="wine" onclick="setSt('${t}','${x.id}','published')">Опубликовать</button><button onclick="setSt('${t}','${x.id}','hidden')">Скрыть</button><button onclick="go('edit/${t}/${x.id}')">Изменить</button><button onclick="rm('${t}','${x.id}')">Удалить</button></div></article>`;
const ord=x=>`<article class="card">${pill(x.status)} <b>${esc(x.event)}</b> · ${esc(x.event_date)}<p class="muted">${esc(x.name)} · ${esc(x.phone)}<br>${esc(x.address||'')} · гостей: ${esc(x.guests||'—')} · бюджет: ${esc(x.budget||'—')}<br>Нужно: ${esc(x.staff)}<br>${esc(x.comment||'')}</p><div class="row"><button onclick="setSt('orders','${x.id}','work')">В работу</button><button onclick="setSt('orders','${x.id}','done')">Закрыть</button><button onclick="rm('orders','${x.id}')">Удалить</button></div></article>`;
const usr=x=>`<article class="card"><b>${esc(x.full_name)}</b><p class="muted">${esc(x.email)} · ${esc(x.role)}</p></article>`;
const body=a==='users'?(live?grid(U,usr):'<p class="notice">Список пользователей доступен после подключения Supabase.</p>'):a==='orders'?grid(D.orders,ord):grid(D[a]||[],x=>mod(a,x));
return head('Админ-панель','Модерация вакансий и резюме, обработка заявок.')+`<section class="section"><div class="row">${tabs.map(([k,l])=>`<button class="${k===a?'wine':''}" onclick="go('admin/${k}')">${l}${wait(k)?` (${wait(k)})`:''}</button>`).join('')}</div>${body}</section>`}};
async function render(){let parts;try{parts=(location.hash.slice(1)||'home').split('/').map(decodeURIComponent)}catch{parts=['home']}let[p='home',a,b]=parts;if(p.includes('='))p='home';const A=$('#app');window.scrollTo(0,0);
const demo=live?'':'<div class="notice" style="margin:0;border-radius:0">Демо-режим: данные хранятся только в этом браузере. Для боевой работы заполните <b>config.js</b> (см. README).</div>';
if(['resumes','cabinet','post','edit','admin'].includes(p)&&!me){A.innerHTML=demo+head('Нужен вход','Войдите или зарегистрируйтесь, чтобы продолжить.')+'<section class="section"><button class="wine" data-page="login">Войти</button> <button data-page="register">Регистрация</button></section>';return}
if(p==='admin'&&me.role!=='admin'){A.innerHTML=demo+head('Нет доступа','Раздел только для администратора.');return}
try{A.innerHTML=demo+await(PAGES[p]||PAGES.home)(a,b)}catch(x){console.error(x);A.innerHTML=demo+head('Ошибка','Не удалось загрузить данные: '+esc(x.message||x))}}
window.onhashchange=render;
(async()=>{await loadMe();nav();render();if(live)sb.auth.onAuthStateChange(async()=>{const was=me;await loadMe();nav();if(!was&&me)render()})})();
