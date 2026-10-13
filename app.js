/* DATA HUB — application statique autonome, sans CDN ni API. */
'use strict';
const $=id=>document.getElementById(id);
const names=[
['Comptabilité générale',''],
['Collaborateurs',''],
['Organisation territoriale','Collaborateurs'],
['Géographie','Organisation territoriale'],
['Montage et suivi opérations de promotion immobilière',''],
['Développement','Montage et suivi opérations de promotion immobilière'],
['Foncier','Développement'],
['Patrimoine','Foncier|Organisation territoriale'],
['Lots','Patrimoine'],
['Équipements','Lots'],
['IOT','Équipements'],
['Copropriété - Aiguillon','Patrimoine'],
['Diagnostics réglementaires','Patrimoine'],
['Performance énergétique','Diagnostics réglementaires'],
['Risques naturels','Performance énergétique'],
['Contrats','Patrimoine'],
['Commande','Contrats'],
['Suivi interventions prestataires','Commande'],
['Assets management','Patrimoine'],
['Marché immobilier','Assets management'],
['Vente HLM','Assets management'],
['Commercialisation accession','Vente HLM'],
['Baux','Lots'],
['Occupation','Baux'],
['Vacance','Occupation'],
['Rotation','Vacance'],
['Demandes - attributions','Baux'],
['Clients','Baux'],
['Enquête locataires','Clients'],
['Réclamations clients','Clients'],
['Occupants','Clients'],
['Quittancement - relevés de comptes','Clients'],
['Encaissements','Quittancement - relevés de comptes'],
['Impayés','Quittancement - relevés de comptes'],
['Contentieux CSR','Impayés']
];
function sample(){const domains=names.map(([name],i)=>({id:'d'+(i+1),name,description:'',parents:[]}));names.forEach(([n,p],i)=>{domains[i].parents=p?p.split('|').map(t=>domains.find(d=>d.name===t)?.id).filter(Boolean):[]});return {version:1,domains,milestones:[],updatedAt:new Date().toISOString()}}
function valid(raw){if(!raw||!Array.isArray(raw.domains)||!Array.isArray(raw.milestones))throw Error('Structure JSON non reconnue');const ids=new Set();const ds=raw.domains.map(d=>{if(typeof d.id!=='string'||!d.id||ids.has(d.id)||typeof d.name!=='string'||!d.name.trim()||!Array.isArray(d.parents))throw Error('Domaine incorrect ou identifiant en double');ids.add(d.id);return {id:d.id,name:d.name.slice(0,100),description:String(d.description||'').slice(0,1000),parents:d.parents}});for(const d of ds)for(const p of d.parents)if(!ids.has(p)||p===d.id)throw Error('Dépendance invalide pour '+d.name);let cycle=false;const visited=new Set(),stack=new Set();function visit(id){if(stack.has(id)){cycle=true;return}if(visited.has(id))return;stack.add(id);const d=ds.find(x=>x.id===id);d.parents.forEach(visit);stack.delete(id);visited.add(id)}ds.forEach(d=>visit(d.id));if(cycle)throw Error('La cartographie ne peut pas contenir de dépendance circulaire');const ms=raw.milestones.map(m=>({id:String(m.id||uid()),domainId:String(m.domainId),date:String(m.date),value:Number(m.value),note:String(m.note||'').slice(0,1000)}));if(ms.some(m=>!ids.has(m.domainId)||!/^\d{4}-\d{2}-\d{2}$/.test(m.date)||!Number.isFinite(m.value)||m.value<0||m.value>100))throw Error('Jalon invalide');return {version:1,domains:ds,milestones:ms,updatedAt:raw.updatedAt||new Date().toISOString()}}
const uid=()=>globalThis.crypto?.randomUUID?.()||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const today=()=>new Date().toLocaleDateString('sv-SE');
let db;try{db=valid(JSON.parse(localStorage.getItem('dataHubCartography')||'null'))}catch{db=null}db ||= sample();
let dirty=false, fileHandle=null, selected=null, layer='structure',view='map',focus='',filter='',panX=45,panY=45,zoom=1,drag=null;
let date=today();const svgNS='http://www.w3.org/2000/svg';const newSvg=(name,attrs={},parent)=>{let el=document.createElementNS(svgNS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(parent)parent.appendChild(el);return el};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=(id,d=date)=>{const ms=db.milestones.filter(m=>m.domainId===id&&m.date<=d).sort((a,b)=>b.date.localeCompare(a.date));return ms.length?ms[0].value:null};
const delta=(id,d=date)=>{const prev=db.milestones.filter(m=>m.domainId===id&&m.date<d).sort((a,b)=>b.date.localeCompare(a.date))[0];const cur=percent(id,d);return cur==null?null:cur-(prev?.value??0)};
const color=v=>v===null?'#ccd5df':v<25?'#d36a63':v<50?'#dfae58':v<80?'#6aa4cf':'#258c73';
const dates=()=>Array.from(new Set([today(),date,...db.milestones.map(m=>m.date)])).sort();
function touch(){db.updatedAt=new Date().toISOString();localStorage.setItem('dataHubCartography',JSON.stringify(db));dirty=true;status();render()}
function status(){$('storageStatus').textContent=(fileHandle?'● Dossier lié':'● Mode local')+(dirty?' · modifications à enregistrer':'');$('storageInfo').textContent=fileHandle?'Fichier lié : '+fileHandle.name+(dirty?' — modifications non enregistrées dans le dossier.':' — enregistré.'):'Aucun fichier Teams lié. Les modifications sont conservées uniquement dans ce navigateur. Exportez-les ou liez un fichier JSON.'}
function go(next){view=next;for(const v of ['map','admin','storage']){$(v+'Page').hidden=v!==next;document.querySelector('[data-view="'+v+'"]').classList.toggle('active',v===next)}$('pageTitle').textContent=({map:'Cartographie des domaines',admin:'Administration du référentiel',storage:'Partage et stockage'})[next];$('pageDesc').textContent=({map:'Une vision partagée de la cible, du réalisé et de la trajectoire.',admin:'Gérer les domaines, leurs dépendances et les objectifs dans le temps.',storage:'Connecter un fichier JSON hébergé dans votre dossier Teams synchronisé.'})[next];if(next==='map')renderMap()}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
function options(select,empty=false,exclude=''){select.innerHTML=(empty?'<option value="">Tous les domaines</option>':'')+db.domains.filter(d=>d.id!==exclude).map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')}
function populate(){options($('groupFilter'),true);$('groupFilter').value=focus;options($('domainParents'),false,$('domainId').value);options($('milestoneDomain'));$('milestoneDomain').value=selected&&db.domains.some(d=>d.id===selected)?selected:db.domains[0]?.id||''}
function dateControls(){const ds=dates();$('dateRange').max=Math.max(0,ds.length-1);$('dateRange').value=Math.max(0,ds.indexOf(date));$('dateInput').value=date;$('dateLabel').textContent=new Date(date+'T12:00:00').toLocaleDateString('fr-FR')+(date>today()?' · prévision':'');}
function levels(){const cache=new Map();function lev(id,seen=new Set()){if(cache.has(id))return cache.get(id);if(seen.has(id))return 0;seen.add(id);const d=db.domains.find(x=>x.id===id);let l=d?.parents.length?Math.max(...d.parents.map(p=>lev(p,new Set(seen))))+1:0;cache.set(id,l);return l}db.domains.forEach(d=>lev(d.id));return cache}
function positions(){const lvl=levels();const groups=new Map();db.domains.forEach((d,i)=>{const l=lvl.get(d.id)||0;if(!groups.has(l))groups.set(l,[]);groups.get(l).push(d)});const mx=Math.max(...groups.keys(),0),height=Math.max(850,...[...groups.values()].map(g=>g.length*88+100));const pos=new Map();groups.forEach((arr,l)=>{const total=arr.length*88;const start=(height-total)/2+20;arr.forEach((d,i)=>pos.set(d.id,{x:35+l*245,y:start+i*88,w:192,h:55}))});return {pos,width:Math.max(1100,100+mx*245+220),height}}
function drawText(g,name){const words=name.split(' ');let lines=[],line='';for(const word of words){if((line+' '+word).trim().length>26&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);if(lines.length>3)lines=[lines[0],lines[1],lines.slice(2).join(' ').slice(0,29)+'…'];lines.forEach((t,i)=>{const e=newSvg('text',{x:14,y:lines.length===1?24:15+i*13},g);e.textContent=t})}
function renderMap(){if(view!=='map')return;const d=positions(),svg=$('mapSvg');svg.textContent='';svg.setAttribute('viewBox','0 0 '+d.width+' '+d.height);const outer=newSvg('g',{transform:'translate('+panX+' '+panY+') scale('+zoom+')'},svg);const active=new Set();if(selected){active.add(selected);const obj=db.domains.find(x=>x.id===selected);obj?.parents.forEach(p=>active.add(p));db.domains.filter(x=>x.parents.includes(selected)).forEach(x=>active.add(x.id))}
const focusDesc=new Set();function walk(id){focusDesc.add(id);db.domains.filter(x=>x.parents.includes(id)).forEach(x=>{if(!focusDesc.has(x.id))walk(x.id)})}if(focus)walk(focus);
for(const child of db.domains){const a=d.pos.get(child.id);for(const parId of child.parents){const p=d.pos.get(parId);if(!p)continue;const x=p.x+p.w,y=p.y+p.h/2,tx=a.x,ty=a.y+a.h/2,mid=(x+tx)/2;newSvg('path',{d:'M'+x+' '+y+' C'+mid+' '+y+' '+mid+' '+ty+' '+tx+' '+ty,class:'edge'+(selected&&(selected===child.id||selected===parId)?' active':'')},outer)}}
for(const obj of db.domains){const p=d.pos.get(obj.id);const v=layer==='delta'?delta(obj.id):percent(obj.id);const notMatch=(filter&&!obj.name.toLowerCase().includes(filter))||(focus&&!focusDesc.has(obj.id));const g=newSvg('g',{class:'node'+(obj.id===selected?' selected':'')+(notMatch?' dim':''),transform:'translate('+p.x+' '+p.y+')',tabindex:'0',role:'button','aria-label':obj.name+' - couverture '+(percent(obj.id)??'non renseignée')+'%'},outer);newSvg('rect',{width:p.w,height:p.h,rx:7},g);newSvg('rect',{class:'accent',x:0,y:0,width:4,height:p.h,rx:2,fill:layer==='structure'?'#007b91':color(v)},g).setAttribute('style','fill:'+(layer==='structure'?'#007b91':layer==='delta'?'#3560a4':color(v)));const label=newSvg('g',{},g);drawText(label,obj.name);if(layer!=='structure'){const label=newSvg('text',{x:177,y:17,'text-anchor':'end',class:'percent',style:'fill:'+color(v)},g);label.textContent=v===null?'—':layer==='delta'?(v>0?'+':'')+v+' pt':v+'%';newSvg('rect',{class:'pct-bg',x:12,y:44,width:166,height:4,rx:2},g);newSvg('rect',{class:'pct-bar',x:12,y:44,width:166*(layer==='delta'?Math.min(Math.abs(v??0),100)/100:(v??0)/100),height:4,rx:2,style:'fill:'+color(v)},g)}g.addEventListener('click',()=>{selected=obj.id;renderMap();renderDetail()});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=obj.id;renderMap();renderDetail()}})}
$('mapCount').textContent=db.domains.length+' domaines · '+db.domains.reduce((n,d)=>n+d.parents.length,0)+' relations de dépendance';
$('zoomIndicator').textContent=Math.round(zoom*100)+' %';
$('legend').innerHTML=layer==='structure'?'Relations de dépendance • cliquez un pool pour ses détails':layer==='coverage'?[[null,'Non renseigné'],[0,'0 – 24 %'],[25,'25 – 49 %'],[50,'50 – 79 %'],[80,'80 – 100 %']].map(([n,l])=>'<span><i style="background:'+color(n)+'"></i>'+l+'</span>').join(''):'Variation en points par rapport au jalon précédent · sans jalon : non renseigné';
}
function renderDetail(){let o=db.domains.find(x=>x.id===selected);if(!o){$('detail').innerHTML='<div class="empty-detail">Sélectionnez un domaine dans la carte pour consulter son historique et ses jalons.</div>';return}let m=db.milestones.filter(x=>x.domainId===o.id).sort((a,b)=>a.date.localeCompare(b.date));let value=percent(o.id);$('detail').innerHTML='<div class="detail-head"><div><h2>'+esc(o.name)+'</h2><p>'+esc(o.description||'Aucune description renseignée')+'</p></div><button class="btn secondary" id="editSelected">Administrer ce domaine</button></div><div class="details-grid"><div><div class="big-percent">'+(value===null?'—':value+' %')+'</div><small>Couverture au '+esc(date)+'</small><p class="muted">'+esc(o.parents.map(id=>db.domains.find(x=>x.id===id)?.name||id).join(' · ')||'Domaine autonome')+'</p></div><div><b>Trajectoire de couverture</b><div class="mini-timeline" style="margin-top:10px">'+(m.length?m.map(x=>'<span><b>'+x.value+' %</b><small>'+esc(x.date)+(x.date>today()?' · prévu':'')+'</small>'+esc(x.note)+'</span>').join(''):'<span>Aucun jalon de couverture enregistré.</span>')+'</div></div></div>';$('editSelected').onclick=()=>{go('admin');editDomain(o.id);$('milestoneDomain').value=o.id;renderMilestones()}}
function renderMilestones(){const id=$('milestoneDomain').value;const ms=db.milestones.filter(m=>m.domainId===id).sort((a,b)=>b.date.localeCompare(a.date));$('milestoneList').innerHTML='<div class="item-list">'+(ms.length?ms.map(m=>'<div class="item"><div><b>'+m.value+' % · '+esc(m.date)+'</b><small>'+esc(m.note)+(m.date>today()?' · Prévision':'')+'</small></div><button class="danger" data-remove="'+esc(m.id)+'">Supprimer</button></div>').join(''):'<p class="muted">Aucun jalon enregistré.</p>')+'</div>';document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(!confirm('Supprimer ce jalon ?'))return;db.milestones=db.milestones.filter(m=>m.id!==b.dataset.remove);touch()})}
function renderTable(){$('domainTable').innerHTML='<div class="item-list">'+db.domains.map(d=>'<div class="item"><div><button class="link-btn" data-edit="'+esc(d.id)+'">'+esc(d.name)+'</button><small>'+d.parents.length+' dépendance(s) · '+db.milestones.filter(m=>m.domainId===d.id).length+' jalon(s)</small></div><strong>'+(percent(d.id)??'—')+' %</strong></div>').join('')+'</div>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editDomain(b.dataset.edit))}
function editDomain(id){const d=db.domains.find(x=>x.id===id);if(!d)return;$('domainId').value=d.id;$('domainName').value=d.name;$('domainDescription').value=d.description;options($('domainParents'),false,id);[...$('domainParents').options].forEach(o=>o.selected=d.parents.includes(o.value));$('deleteDomain').hidden=false;window.scrollTo({top:0,behavior:'smooth'})}
function resetDomain(){$('domainForm').reset();$('domainId').value='';$('deleteDomain').hidden=true;options($('domainParents'))}
function render(){dateControls();populate();const vals=db.domains.map(x=>percent(x.id)).filter(x=>x!==null);$('totalDomains').textContent=db.domains.length;$('avgCoverage').textContent=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)+' %':'—';$('matureDomains').textContent=db.domains.filter(x=>percent(x.id)!==null&&percent(x.id)>=80).length;$('totalMilestones').textContent=db.milestones.length;renderTable();renderMilestones();renderDetail();renderMap();status()}
$('domainForm').onsubmit=e=>{e.preventDefault();const id=$('domainId').value||uid();const parents=[...$('domainParents').selectedOptions].map(x=>x.value);const obj={id,name:$('domainName').value.trim(),description:$('domainDescription').value.trim(),parents};if(!obj.name)return;try{const proposed={...db,domains:$('domainId').value?db.domains.map(d=>d.id===id?obj:d):[...db.domains,obj]};db=valid(proposed);resetDomain();touch()}catch(err){alert(err.message)}};
$('resetDomain').onclick=resetDomain;
$('deleteDomain').onclick=()=>{const id=$('domainId').value;if(!id)return;const children=db.domains.filter(d=>d.parents.includes(id));if(children.length){alert('Supprimez d’abord les dépendances de : '+children.map(d=>d.name).join(', '));return}if(!confirm('Supprimer ce domaine et tous ses jalons ?'))return;db.domains=db.domains.filter(d=>d.id!==id);db.milestones=db.milestones.filter(m=>m.domainId!==id);selected=null;resetDomain();touch()};
$('milestoneForm').onsubmit=e=>{e.preventDefault();const domainId=$('milestoneDomain').value,day=$('milestoneDate').value,value=Number($('milestoneValue').value);if(!domainId||!day||!Number.isFinite(value)||value<0||value>100){alert('Valeurs invalides');return}const prior=db.milestones.find(m=>m.domainId===domainId&&m.date===day);if(prior){prior.value=value;prior.note=$('milestoneNote').value}else db.milestones.push({id:uid(),domainId,date:day,value,note:$('milestoneNote').value});date=day;touch()};
$('milestoneDomain').onchange=renderMilestones;
$('filter').oninput=e=>{filter=e.target.value.toLowerCase().trim();renderMap()};
$('groupFilter').onchange=e=>{focus=e.target.value;renderMap()};
document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{layer=b.dataset.layer;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('active',x===b));renderMap()});
$('dateRange').oninput=e=>{date=dates()[Number(e.target.value)]||today();render()};
$('dateInput').onchange=e=>{if(e.target.value){date=e.target.value;render()}};
$('todayButton').onclick=()=>{date=today();render()};
function fit(){zoom=1;panX=12;panY=12;renderMap()}$('fitButton').onclick=fit;
$('zoomIn').onclick=()=>{zoom=Math.min(2.8,zoom*1.2);renderMap()};
$('zoomOut').onclick=()=>{zoom=Math.max(.35,zoom/1.2);renderMap()};
const viewport=$('mapViewport');viewport.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(2.8,Math.max(.35,zoom*(e.deltaY<0?1.12:.89)));renderMap()},{passive:false});
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.node'))return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};viewport.setPointerCapture(e.pointerId)});viewport.addEventListener('pointermove',e=>{if(!drag)return;const rect=viewport.getBoundingClientRect(),logical=$('mapSvg').viewBox.baseVal;panX=drag.px+(e.clientX-drag.x)*logical.width/rect.width;panY=drag.py+(e.clientY-drag.y)*logical.height/rect.height;renderMap()});viewport.addEventListener('pointerup',()=>drag=null);viewport.addEventListener('pointercancel',()=>drag=null);
function download(){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.href=url;a.download='data-hub-cartographie.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportButton').onclick=download;
const supported=()=>!!window.showOpenFilePicker&&!!window.showSaveFilePicker;
async function loadHandle(h){const f=await h.getFile(),raw=JSON.parse(await f.text()),loaded=valid(raw);if(dirty&&!confirm('Remplacer les modifications locales non enregistrées ?'))return;db=loaded;fileHandle=h;dirty=false;localStorage.setItem('dataHubCartography',JSON.stringify(db));selected=null;render();go('map')}
$('openShared').onclick=async()=>{if(!supported()){alert('Utilisez Microsoft Edge ou Chrome en contexte sécurisé (localhost ou HTTPS). Sinon importez/exportez un fichier JSON.');return}try{const [h]=await showOpenFilePicker({types:[{description:'Fichiers JSON',accept:{'application/json':['.json']}}]});if(h)await loadHandle(h)}catch(e){if(e.name!=='AbortError')alert(e.message)}};
async function writeShared(){if(!fileHandle)throw Error('Aucun fichier lié. Cliquez d’abord sur « Créer un fichier » ou « Ouvrir un fichier ».');const w=await fileHandle.createWritable();try{await w.write(JSON.stringify(db,null,2));await w.close();dirty=false;status()}catch(e){await w.abort().catch(()=>{});throw e}}
$('createShared').onclick=async()=>{if(!supported()){alert('La création directe nécessite Edge ou Chrome en contexte sécurisé.');return}try{fileHandle=await showSaveFilePicker({suggestedName:'data-hub-cartographie.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});if(fileHandle)await writeShared()}catch(e){if(e.name!=='AbortError')alert(e.message)}};
$('saveShared').onclick=async()=>{try{await writeShared()}catch(e){alert(e.message)}};
$('reloadShared').onclick=async()=>{if(!fileHandle){alert('Aucun fichier lié');return}try{await loadHandle(fileHandle)}catch(e){alert(e.message)}};
$('importButton').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(dirty&&!confirm('Remplacer les modifications locales ?'))return;db=valid(JSON.parse(await f.text()));fileHandle=null;dirty=true;localStorage.setItem('dataHubCartography',JSON.stringify(db));selected=null;render();go('map')}catch(err){alert(err.message)}finally{e.target.value=''}};
$('milestoneDate').value=today();resetDomain();render();go('map');
