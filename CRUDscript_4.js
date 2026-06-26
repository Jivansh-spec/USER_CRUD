const PALETTE=['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444','#f97316','#06b6d4','#84cc16','#a855f7'];
const BANNER_PATTERNS=['#eef2ff','#fdf4ff','#ecfdf5','#fff7ed','#eff6ff','#fef9c3','#fce7f3'];
const PAGE=5;
let users=[],nextId=1,pendingDel=null,page=1,q='',sortDir='az',todayN=0,viewMode='table';

function avColor(id){return PALETTE[(id-1)%PALETTE.length]}
function inits(f,l){return((f[0]||'')+(l[0]||'')).toUpperCase()}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function hl(str,qq){
  if(!qq)return esc(str);
  const i=str.toLowerCase().indexOf(qq.toLowerCase());
  if(i<0)return esc(str);
  return esc(str.slice(0,i))+'<mark class="hl">'+esc(str.slice(i,i+qq.length))+'</mark>'+esc(str.slice(i+qq.length));
}

function domains(){return new Set(users.map(u=>u.username.split('@')[1]).filter(Boolean)).size}
function animVal(el,to){
  const from=parseInt(el.textContent)||0;
  if(from===to){el.textContent=to;return}
  let s=null;const dur=400;
  function step(ts){s=s||ts;const p=Math.min((ts-s)/dur,1);el.textContent=Math.round(from+(to-from)*p);if(p<1)requestAnimationFrame(step)}
  requestAnimationFrame(step);
}
function updateStats(){
  animVal(document.getElementById('sTotal'),users.length);
  document.getElementById('sToday').textContent=todayN;
  animVal(document.getElementById('sDomains'),domains());
}

function filtered(){
  let r=users.filter(u=>{
    if(!q)return true;
    const qq=q.toLowerCase();
    return u.first.toLowerCase().includes(qq)||u.last.toLowerCase().includes(qq)||u.username.toLowerCase().includes(qq);
  });
  r.sort((a,b)=>{const ka=(a.first+a.last).toLowerCase(),kb=(b.first+b.last).toLowerCase();return sortDir==='az'?ka.localeCompare(kb):kb.localeCompare(ka)});
  return r;
}
function totalPg(list){return Math.max(1,Math.ceil(list.length/PAGE))}

function bannerSVG(id){
  const c=BANNER_PATTERNS[(id-1)%BANNER_PATTERNS.length];
  const ac=avColor(id);
  return`<svg viewBox="0 0 240 64" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="64" fill="${c}"/><circle cx="30" cy="20" r="18" fill="${ac}" opacity=".12"/><circle cx="200" cy="50" r="22" fill="${ac}" opacity=".1"/><circle cx="120" cy="8" r="10" fill="${ac}" opacity=".08"/></svg>`;
}

function render(){
  updateStats();
  const list=filtered();
  const mc=document.getElementById('mainContent');
  const pg=document.getElementById('pgWrap');

  if(users.length===0){
    mc.innerHTML=`<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div class="empty">
        <svg class="empty-illu" viewBox="0 0 140 100" fill="none" aria-hidden="true">
          <rect x="20" y="20" width="100" height="70" rx="12" fill="#eef2ff"/>
          <rect x="35" y="38" width="70" height="6" rx="3" fill="#c7d2fe"/>
          <rect x="35" y="52" width="50" height="5" rx="2.5" fill="#e0e7ff"/>
          <rect x="35" y="64" width="60" height="5" rx="2.5" fill="#e0e7ff"/>
          <circle cx="70" cy="22" r="14" fill="#6366f1"/>
          <circle cx="70" cy="19" r="5" fill="#fff"/>
          <ellipse cx="70" cy="29" rx="8" ry="5" fill="#fff" opacity=".6"/>
        </svg>
        <h2>No team members yet</h2>
        <p>Add your first user to get started with your team.</p>
        <button class="btn btn-primary" id="emptyCreate"><i class="ti ti-user-plus"></i> Add first user</button>
      </div>
    </div>`;
    document.getElementById('emptyCreate')?.addEventListener('click',openCreate);
    pg.innerHTML='';
    return;
  }

  if(page>totalPg(list))page=totalPg(list);
  if(page<1)page=1;
  const start=(page-1)*PAGE;
  const slice=list.slice(start,start+PAGE);

  if(viewMode==='cards'){
    if(list.length===0){mc.innerHTML=`<div class="no-res"><i class="ti ti-search-off" style="font-size:26px;display:block;margin-bottom:8px"></i>No users match your search.</div>`;pg.innerHTML='';return}
    const grid=document.createElement('div');grid.className='card-grid';
    slice.forEach(u=>{
      const div=document.createElement('div');div.className='user-card';
      div.innerHTML=`
        <div class="card-actions">
          <button class="ca-btn ca-edit" data-id="${u.id}" data-a="edit" title="Edit"><i class="ti ti-edit"></i></button>
          <button class="ca-btn ca-del" data-id="${u.id}" data-a="del" title="Delete"><i class="ti ti-trash"></i></button>
        </div>
        <div class="card-banner">${bannerSVG(u.id)}</div>
        <div class="card-av-wrap"><div class="card-av" style="background:${avColor(u.id)}">${inits(u.first,u.last)}</div></div>
        <div class="card-body">
          <div class="card-name">${esc(u.first)} ${esc(u.last)}</div>
          <div class="card-email" title="${esc(u.username)}">${esc(u.username)}</div>
          <span class="card-badge" style="background:${avColor(u.id)}18;color:${avColor(u.id)}">${esc(u.username.split('@')[1]||'?')}</span>
        </div>`;
      grid.appendChild(div);
    });
    grid.querySelectorAll('[data-a="edit"]').forEach(b=>b.addEventListener('click',()=>openEdit(+b.dataset.id)));
    grid.querySelectorAll('[data-a="del"]').forEach(b=>b.addEventListener('click',()=>openDel(+b.dataset.id)));
    mc.innerHTML='';mc.appendChild(grid);
  } else {
    const wrap=document.createElement('div');wrap.className='table-card';
    if(list.length===0){wrap.innerHTML=`<div class="no-res"><i class="ti ti-search-off" style="font-size:26px;display:block;margin-bottom:8px"></i>No users match your search.</div>`;mc.innerHTML='';mc.appendChild(wrap);pg.innerHTML='';return}
    const tbl=document.createElement('table');
    tbl.innerHTML=`<thead><tr>
      <th class="col-n">#</th><th class="col-av"></th>
      <th data-col="first">First <i class="ti ti-chevron-${sortDir==='az'?'up':'down'}"></i></th>
      <th data-col="last">Last</th><th>Email</th><th class="col-ac">Actions</th>
    </tr></thead>`;
    const tbody=document.createElement('tbody');
    slice.forEach((u,i)=>{
      const tr=document.createElement('tr');tr.className='row-in';
      tr.innerHTML=`<td class="col-n">${start+i+1}</td>
        <td class="col-av"><div class="av" style="background:${avColor(u.id)}">${inits(u.first,u.last)}</div></td>
        <td>${hl(u.first,q)}</td><td>${hl(u.last,q)}</td><td>${hl(u.username,q)}</td>
        <td class="col-ac">
          <button class="rb" data-id="${u.id}" data-a="edit"><i class="ti ti-edit"></i> Edit</button>
          <button class="rb del" data-id="${u.id}" data-a="del"><i class="ti ti-trash"></i></button>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-a="edit"]').forEach(b=>b.addEventListener('click',()=>openEdit(+b.dataset.id)));
    tbody.querySelectorAll('[data-a="del"]').forEach(b=>b.addEventListener('click',()=>openDel(+b.dataset.id)));
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    mc.innerHTML='';mc.appendChild(wrap);
  }
  renderPg(list);
}

function renderPg(list){
  const cont=document.getElementById('pgWrap');
  const pages=totalPg(list);
  cont.innerHTML='';
  if(list.length===0||pages===1)return;
  const s=(page-1)*PAGE+1,e=Math.min(page*PAGE,list.length);
  const info=document.createElement('span');info.className='pg-info';info.textContent=`${s}–${e} of ${list.length}`;
  const nav=document.createElement('div');nav.className='pg-nav';
  const mk=(lbl,dis,cb)=>{const b=document.createElement('button');b.className='pg-btn';b.innerHTML=lbl;b.disabled=dis;b.addEventListener('click',cb);return b};
  nav.appendChild(mk('<i class="ti ti-chevron-left"></i>',page===1,()=>{page--;render()}));
  for(let p=1;p<=pages;p++){const b=mk(p,false,()=>{page=p;render()});if(p===page)b.classList.add('active');nav.appendChild(b)}
  nav.appendChild(mk('<i class="ti ti-chevron-right"></i>',page===pages,()=>{page++;render()}));
  cont.appendChild(info);cont.appendChild(nav);
}

/* modals */
function openCreate(){
  clearF();
  document.getElementById('modalTitle').textContent='Add user';
  document.getElementById('modalSub').textContent='Fill in the details below';
  document.getElementById('modalIcon').innerHTML='<i class="ti ti-user-plus"></i>';
  document.getElementById('modalIcon').className='modal-hd-icon';
  document.getElementById('saveLbl').textContent='Save user';
  document.getElementById('editOverlay').classList.add('active');
  document.getElementById('iFirst').focus();
}
function openEdit(id){
  const u=users.find(u=>u.id===id);if(!u)return;
  clearF();
  document.getElementById('editId').value=u.id;
  document.getElementById('iFirst').value=u.first;
  document.getElementById('iLast').value=u.last;
  document.getElementById('iEmail').value=u.username;
  document.getElementById('modalTitle').textContent='Edit user';
  document.getElementById('modalSub').textContent='Update the details below';
  document.getElementById('modalIcon').innerHTML='<i class="ti ti-pencil"></i>';
  document.getElementById('modalIcon').className='modal-hd-icon';
  document.getElementById('saveLbl').textContent='Save changes';
  document.getElementById('editOverlay').classList.add('active');
  document.getElementById('iFirst').focus();
}
function closeEdit(){document.getElementById('editOverlay').classList.remove('active')}
function clearF(){
  ['editId','iFirst','iLast','iEmail'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fErr').textContent='';
  ['iFirst','iLast','iEmail'].forEach(id=>document.getElementById(id).classList.remove('err'));
}
function setErr(msg,fid){
  document.getElementById('fErr').innerHTML=msg?`<i class="ti ti-alert-circle"></i>${msg}`:'';
  if(fid)document.getElementById(fid).classList.add('err');
}
function saveUser(){
  const first=document.getElementById('iFirst').value.trim();
  const last=document.getElementById('iLast').value.trim();
  const email=document.getElementById('iEmail').value.trim();
  const eid=document.getElementById('editId').value?+document.getElementById('editId').value:null;
  ['iFirst','iLast','iEmail'].forEach(id=>document.getElementById(id).classList.remove('err'));
  if(!first){setErr('First name is required.','iFirst');document.getElementById('iFirst').focus();return}
  if(!last){setErr('Last name is required.','iLast');document.getElementById('iLast').focus();return}
  if(!email){setErr('Email address is required.','iEmail');document.getElementById('iEmail').focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setErr('Enter a valid email address.','iEmail');document.getElementById('iEmail').focus();return}
  const dupe=users.find(u=>u.username.toLowerCase()===email.toLowerCase()&&u.id!==eid);
  if(dupe){setErr('That email is already in use.','iEmail');document.getElementById('iEmail').focus();return}
  if(eid){const u=users.find(u=>u.id===eid);if(u){u.first=first;u.last=last;u.username=email}toast('User updated','s','ti-check')}
  else{users.push({id:nextId++,first,last,username:email});todayN++;page=totalPg(filtered());toast('User added','s','ti-user-plus')}
  closeEdit();render();
}
function openDel(id){
  const u=users.find(u=>u.id===id);if(!u)return;
  pendingDel=id;
  document.getElementById('delName').textContent=`${u.first} ${u.last}`;
  document.getElementById('delOverlay').classList.add('active');
}
function closeDel(){document.getElementById('delOverlay').classList.remove('active');pendingDel=null}
function confirmDel(){
  if(pendingDel===null)return;
  users=users.filter(u=>u.id!==pendingDel);
  closeDel();render();
  toast('User deleted','e','ti-trash');
}

/* toast */
function toast(msg,type='s',icon='ti-check'){
  const t=document.createElement('div');t.className=`toast ${type}`;
  t.innerHTML=`<i class="ti ${icon}"></i>${msg}`;
  document.getElementById('toastTray').appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),200)},2600);
}

/* listeners */
document.getElementById('btnCreate').addEventListener('click',openCreate);
document.getElementById('closeEdit').addEventListener('click',closeEdit);
document.getElementById('cancelEdit').addEventListener('click',closeEdit);
document.getElementById('saveUser').addEventListener('click',saveUser);
document.getElementById('closeDel').addEventListener('click',closeDel);
document.getElementById('cancelDel').addEventListener('click',closeDel);
document.getElementById('confirmDel').addEventListener('click',confirmDel);
document.getElementById('editOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('editOverlay'))closeEdit()});
document.getElementById('delOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('delOverlay'))closeDel()});
document.getElementById('searchIn').addEventListener('input',e=>{q=e.target.value;page=1;render()});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeEdit();closeDel()}
  if(e.key==='Enter'&&document.getElementById('editOverlay').classList.contains('active'))saveUser();
  if(e.key==='n'&&!document.getElementById('editOverlay').classList.contains('active')&&e.target.tagName!=='INPUT')openCreate();
  if(e.key==='/'&&e.target.tagName!=='INPUT'){e.preventDefault();document.getElementById('searchIn').focus()}
});

render();
