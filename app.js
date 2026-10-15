/* LineGuide MVP. Local-first prototype: data stays in this browser on this device. */
const KEY='lineguide-procedures-v1', $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const OWN=['title','site','line','asset','taskType','audience','purpose','prerequisites','tools','ppe','isolation','isolationMode','isolationReason','guards','finalChecks','notes','owner','reviewer','approver','status','changeNote','created','updated','submittedAt','approvedAt','approvedBy','archiveState','templateType','documentNumber'];
const statuses=['Draft','In review','Approved'];
const TEMPLATES=['Standard operating procedure (SOP)','Work instruction','Inspection procedure'];
// Curated, short option lists. Machine-specific details must come from approved instructions.
const TASK_TYPES=['Operation / changeover','Inspection','Cleaning','Adjustment','Repair / replacement','Testing / verification'];
const AUDIENCES=['Maintenance engineers','Operators','Supervisors','Contractors'];
const PPE_CHOICES=['Safety footwear','Eye protection','Hearing protection','Gloves','Protective clothing','Respiratory protection'];
const PREREQ_CHOICES=['Competence / training','Authorisation / permit','Risk assessment','OEM / approved procedure','Isolation / safe state'];
const HAZARD_CHOICES=['Electrical','Moving parts / entrapment','Pneumatic / hydraulic','Stored energy / suspended loads','Hot / sharp surfaces','Chemicals / dust','Slips / trips / falls','Noise'];
const STEP_TYPES=['Action / instruction','Inspection / check','Adjustment / test','Record / handover'];
const VERIFY_METHODS=['Visual check','Measurement to approved limits','Functional test','Record / sign-off'];
const LEGACY_OTHER=['Other / site-specific','Other — specify below','Other'];
const MULTI_FIELDS=['hazards','ppeItems','prerequisiteTypes'];
const ISOLATION_MODES=['required','not-required','other'];
function existingValues(field){return [...new Set(data.map(p=>p[field]).filter(x=>typeof x==='string'&&x.trim()))].sort((a,b)=>a.localeCompare(b))}
function curatedValues(field, defaults, current){
 // Keep the menu tidy: common choices plus at most three previously entered extras.
 const extras=existingValues(field).filter(x=>!defaults.includes(x)&&x!==current).slice(0,3);
 return [...defaults,...extras,...(current&&!defaults.includes(current)?[current]:[])];
}
function choiceMarkup(name, value, values, label, required=false, enabled=true){
 const options=[...new Set(values.filter(x=>typeof x==='string'&&x.trim()))];
 const hasMatch=options.includes(value), isCustom=!!value&&!hasMatch, selection=hasMatch?value:isCustom?'__custom__':'';
 const selectOptions=options.map(x=>`<option value="${esc(x)}" ${selection===x?'selected':''}>${esc(x)}</option>`).join('');
 return `<div class="field choice-field" data-choice-wrap="${esc(name)}"><label>${esc(label)}${required?' *':''}</label><select name="${esc(name)}Choice" data-choice="${esc(name)}" ${required?'required':''} ${enabled?'':'disabled'}><option value="" ${!selection?'selected':''}>Choose ${esc(label.toLowerCase())}…</option>${selectOptions}<option value="__custom__" ${selection==='__custom__'?'selected':''}>Other — enter your own…</option></select><input type="text" name="${esc(name)}" class="custom-choice ${selection==='__custom__'?'':'hidden'}" value="${esc(value||'')}" placeholder="Enter your own ${esc(label.toLowerCase())}" ${selection==='__custom__'?'required':''}><div class="small">${enabled?'Only relevant options are shown. Choose Other to enter your own.':name==='line'?'Select a site first.':'Select a site and production line first.'}</div></div>`;
}
function basicSelect(name,value,values,label,required=false){return `<div class="field"><label>${esc(label)}${required?' *':''}</label><select name="${esc(name)}" ${required?'required':''}>${required?'<option value="">Select an option…</option>':''}${values.map(x=>`<option value="${esc(x)}" ${value===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`}
function multiChoice(name,values,chosen,label){
 const selected=Array.isArray(chosen)?chosen:[];
 const custom=selected.filter(x=>!values.includes(x)&&!LEGACY_OTHER.includes(x));
 const hasOther=custom.length>0||selected.some(x=>LEGACY_OTHER.includes(x));
 const count=selected.filter(x=>!LEGACY_OTHER.includes(x)).length;
 return `<div class="field" data-multi-wrap="${esc(name)}"><label>${esc(label)}</label><details class="multiselect"><summary>Choose relevant options (${count} selected)</summary><div class="choice-grid">${values.map(v=>`<label class="checkline"><input type="checkbox" name="${esc(name)}" value="${esc(v)}" ${selected.includes(v)?'checked':''}>${esc(v)}</label>`).join('')}<label class="checkline"><input type="checkbox" data-multi-other="${esc(name)}" ${hasOther?'checked':''}>Other — enter your own</label></div><div class="multi-other ${hasOther?'':'hidden'}"><label for="custom-${esc(name)}">Your own answers (one per line)</label><textarea id="custom-${esc(name)}" data-multi-custom="${esc(name)}" placeholder="Enter a relevant item on each line…">${esc(custom.join('\n'))}</textarea><div class="small">These entries are included in the saved document, not added to everyone’s default choices.</div></div></details></div>`;
}

function lineValues(site){return site?[...new Set(data.filter(p=>p.site===site).map(p=>p.line).filter(Boolean))].sort((a,b)=>a.localeCompare(b)):[]}
function assetValues(site,line){return site&&line?[...new Set(data.filter(p=>p.site===site&&p.line===line).map(p=>p.asset).filter(Boolean))].sort((a,b)=>a.localeCompare(b)):[]}
function hierarchyValue(name){return document.querySelector('#builderForm input[name="'+name+'"]')?.value.trim()||''}
function refreshHierarchyChildren(parent){
 // Change only the dependent controls, so other answers and the scroll position survive.
 const site=hierarchyValue('site');
 const line=parent==='site'?'':hierarchyValue('line');
 if(parent==='site'){
   const lineWrap=document.querySelector('[data-choice-wrap="line"]');
   if(lineWrap)lineWrap.outerHTML=choiceMarkup('line','',lineValues(site),'Production line',true,!!site);
 }
 const assetWrap=document.querySelector('[data-choice-wrap="asset"]');
 if(assetWrap)assetWrap.outerHTML=choiceMarkup('asset','',assetValues(site,line),'Asset / machine',true,!!site&&!!line);
}
function isolationChoice(d){
 // Older records may have a reference but not the new classification.
 const mode=d.isolationMode||(d.isolation?'required':'');
 return `<div class="field"><label>Isolation requirement *</label><select name="isolationMode" data-isolation-mode required>
 <option value="" ${!mode?'selected':''}>Select requirement…</option>
 <option value="required" ${mode==='required'?'selected':''}>Isolation required</option>
 <option value="not-required" ${mode==='not-required'?'selected':''}>Not required for this procedure</option>
 <option value="other" ${mode==='other'?'selected':''}>Other — specify safe-state arrangement</option>
 </select><div class="small">Choose for this task using site/OEM-approved requirements; do not infer from the procedure type alone.</div></div>
 <div data-isolation-details class="${mode==='required'||mode==='other'?'':'hidden'}"><div class="field"><label>${mode==='other'?'Other safe-state arrangement / approved reference *':'Approved isolation / safe-state reference *'}</label><textarea name="isolation" ${mode==='required'||mode==='other'?'required':''} placeholder="Identify the approved task-specific isolation or safe-state requirements. Do not guess isolation points.">${esc(d.isolation||'')}</textarea></div></div>
 <div data-no-isolation class="${mode==='not-required'?'':'hidden'}"><div class="field"><label>Reason / approved operating reference (recommended)</label><textarea name="isolationReason" placeholder="e.g. Approved routine line start-up under normal operating controls; cite the relevant procedure or assessment.">${esc(d.isolationReason||'')}</textarea></div><div class="notice">Only choose this when the approved task and risk assessment permit normal operation. This selection does not waive guarding, interlocks, permits or other safety controls.</div></div>`;
}
function updateIsolationVisibility(){
 const f=$('#builderForm'),sel=f?.querySelector('[data-isolation-mode]');if(!sel)return;
 const mode=sel.value;
 const details=f.querySelector('[data-isolation-details]'),noIsolation=f.querySelector('[data-no-isolation]');
 details.classList.toggle('hidden',mode!=='required'&&mode!=='other');
 noIsolation.classList.toggle('hidden',mode!=='not-required');
 const reference=details.querySelector('textarea[name="isolation"]');
 reference.required=mode==='required'||mode==='other';
 details.querySelector('label').textContent=mode==='other'?'Other safe-state arrangement / approved reference *':'Approved isolation / safe-state reference *';
}
function scrollWizardTop(){
 window.scrollTo(0,0);
 requestAnimationFrame(()=>window.scrollTo(0,0));
}
function stepChoice(name,value,values,label){
 const known=values.includes(value), custom=!!value&&!known, selected=known?value:custom?'__custom__':'';
 return `<div class="field"><label>${esc(label)}</label><select data-step-choice="${esc(name)}"><option value="" ${!selected?'selected':''}>Choose if relevant…</option>${values.map(x=>`<option value="${esc(x)}" ${selected===x?'selected':''}>${esc(x)}</option>`).join('')}<option value="__custom__" ${selected==='__custom__'?'selected':''}>Other — enter your own…</option></select><input type="text" data-step="${esc(name)}" class="custom-choice ${custom?'':'hidden'}" value="${esc(value||'')}" placeholder="Enter your own ${esc(label.toLowerCase())}" ${custom?'required':''}></div>`;
}

const photosafe=s=>typeof s==='string' && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s);
const jsoncopy=x=>JSON.parse(JSON.stringify(x));
let page='home',editingId=null,stepDrafts=[],wizardStep=1,searchTerm='',filterStatus='all',currentId=null,currentRevisionIndex=null,data=[],draftFields={},builderDirty=false,loadProblem=false;
function persist(next){
  try{localStorage.setItem(KEY,JSON.stringify(next));data=next;loadProblem=false;return true}
  catch(e){alert('Unable to save LineGuide data. Browser storage may be full or disabled. Your existing saved records have not been changed. Export a backup and check available storage.');return false}
}
function save(){return persist(data)}
function safeDate(s){let d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleDateString():'Unknown date'}
function normaliseStep(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid instruction step');let r={};for(let k of ['action','expected','verify','warning','type','verifyMethod'])r[k]=typeof v[k]==='string'?v[k].slice(0,30000):'';r.photo=photosafe(v.photo)?v.photo:'';return r}
function normaliseProcedure(v,depth=0){
  if(!v||typeof v!=='object'||Array.isArray(v)||typeof v.id!=='string'||!v.id.trim()||v.id.length>150||typeof v.title!=='string'||!v.title.trim())throw Error('Invalid procedure');
  if(!Array.isArray(v.steps)||v.steps.length>300)throw Error('Invalid steps');
  let r={id:v.id,revision: typeof v.revision==='string'||typeof v.revision==='number'?v.revision:1,steps:v.steps.map(normaliseStep),hazards:Array.isArray(v.hazards)?v.hazards.filter(x=>typeof x==='string').slice(0,30):[],ppeItems:Array.isArray(v.ppeItems)?v.ppeItems.filter(x=>typeof x==='string').slice(0,30):[],prerequisiteTypes:Array.isArray(v.prerequisiteTypes)?v.prerequisiteTypes.filter(x=>typeof x==='string').slice(0,30):[]};
  for(let k of OWN){if(typeof v[k]==='string')r[k]=v[k].slice(0,40000)}
  r.status=statuses.includes(v.status)?v.status:'Draft';
  if(depth===0){if(v.revisionHistory!==undefined&&(!Array.isArray(v.revisionHistory)||v.revisionHistory.length>500))throw Error('Invalid revision history');r.revisionHistory=(v.revisionHistory||[]).map(x=>normaliseProcedure(x,1))}
  return r;
}
function validateImport(items){
  if(!Array.isArray(items)||items.length>2000)throw Error('Invalid procedure collection');
  const ids=new Set();return items.map((x)=>{let p=normaliseProcedure(x);if(ids.has(p.id))throw Error('Duplicate document ID');ids.add(p.id);return p});
}
function isValidStored(items){return Array.isArray(items)&&items.every(v=>v&&typeof v==='object'&&typeof v.id==='string'&&typeof v.title==='string'&&Array.isArray(v.steps))}
function onError(message){
 const n=$('#app');if(n)n.innerHTML=`<section class="panel"><h2>Stored data needs attention</h2><p>${esc(message)}</p><p>LineGuide has left your existing browser data untouched. First download a recovery copy of the unreadable data, then import an earlier valid backup. Do not clear Safari data.</p><div class="actions"><button class="btn secondary" data-action="raw-recovery">Download recovery copy</button><button class="btn green" data-action="import">Import valid backup</button></div></section>`;
}
function downloadRaw(){
 const raw=localStorage.getItem(KEY);
 if(raw===null){alert('No browser data is available to export.');return}
 const blob=new Blob([raw],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='lineguide-unreadable-recovery-'+new Date().toISOString().slice(0,10)+'.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}

function demo(){return {id:'demo-pl04',title:'Packing line changeover',site:'Main production site',line:'Packing Line 04',asset:'Weighing and packing system',taskType:'Operation / changeover',audience:'Maintenance engineers',status:'Draft',revision:1,owner:'',purpose:'Provide a consistent reference for the approved packing line changeover process.',prerequisites:'Trained and authorised personnel. Confirm the correct asset and current approved instructions.',tools:'As specified by the approved machine procedure.',hazards:['Moving machinery','Gravity / suspended loads'],ppe:'As defined by the site risk assessment and approved procedure.',isolation:'Link the machine-specific approved isolation and stored-energy control procedure here. Exact controls must be confirmed by a competent reviewer.',guards:'Confirm required guards and protective devices are present and effective as specified by the approved procedure.',finalChecks:'Add the approved acceptance criteria, required functional checks and handover requirements.',notes:'DEMO CONTENT ONLY. Add the site-approved changeover sequence and safety controls before approval.',steps:[{action:'Confirm equipment identity',expected:'Correct machine and procedure revision identified.',verify:'Compare the asset identification and document reference.',warning:'Stop if the equipment identity or procedure does not match.',photo:''},{action:'Establish the required safe state',expected:'Required isolation and stored-energy controls are established and verified in line with the approved site procedure.',verify:'Use the verification method specified in the approved isolation procedure.',warning:'Do not intervene until the required safe state has been established and verified.',photo:''},{action:'Follow the approved changeover sequence',expected:'The specified changeover criteria are met.',verify:'Use the task-specific checks and acceptance criteria in the approved source instruction.',warning:'Machine-specific sequence and release requirements must be supplied and reviewed.',photo:''}],created:new Date().toISOString(),updated:new Date().toISOString(),changeNote:'Initial demonstration record'}}
function load(){
 const raw=localStorage.getItem(KEY);
 if(raw===null){data=[demo()];persist(data);return}
 try{const value=JSON.parse(raw);if(!isValidStored(value))throw Error('Invalid stored format');data=value}
 catch(e){loadProblem=true;data=[]}
}
function badge(s){return `<span class="badge ${s==='Approved'?'approved':s==='In review'?'review':'draft'}">${esc(s||'Draft')}</span>`}
function crumb(p){return [p.site,p.line,p.asset,p.taskType].filter(Boolean).map(esc).join(' / ')}
function nav(p){page=p;document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));render()}
document.querySelector('.nav').addEventListener('click',e=>{
 const b=e.target.closest('button[data-page]');if(!b)return;
 if(!leaveBuilder())return;
 b.dataset.page==='builder'?startBuilder():nav(b.dataset.page);
});
function leaveBuilder(){if(page!=='builder'||!builderDirty)return true;return confirm('Discard unsaved changes to this procedure? Your existing saved documents will not be changed.')}
function empty(t){return `<div class="empty">${esc(t)}</div>`}
function itemCard(p){return `<div class="item"><div class="itemtop"><div><div class="itemtitle">${esc(p.title)}</div><div class="crumb">${crumb(p)}</div></div>${badge(p.status)}</div><div class="actions"><button class="btn secondary" data-action="open" data-id="${esc(p.id)}">Open</button><button class="btn ghost" data-action="edit" data-id="${esc(p.id)}">Edit</button></div></div>`}
function home(){let approved=data.filter(p=>p.status==='Approved').length;return `<section class="welcome"><div class="eyebrow">YOUR ENGINEERING REFERENCE</div><h1>Good procedures.<br>Easy to find.</h1><p class="muted">Create thorough, consistent instructions once, then find them by site, line, asset or task.</p><div class="actions"><button class="btn green" data-action="new">＋ Create procedure</button><button class="btn secondary" data-action="library">⌕ Find a procedure</button></div></section><div class="grid three"><div class="stat"><strong>${data.length}</strong><span>Procedures</span></div><div class="stat"><strong>${approved}</strong><span>Approved documents</span></div><div class="stat"><strong>${new Set(data.map(p=>p.line).filter(Boolean)).size}</strong><span>Production lines</span></div></div><section class="panel" style="margin-top:14px"><h2>Recently updated</h2>${data.slice().sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')).slice(0,3).map(itemCard).join('')||empty('No procedures yet. Create your first one.')}</section><section class="panel"><h3>Built for practical engineering</h3><div class="pillrow"><span class="pill">Guided authoring</span><span class="pill">Photo steps</span><span class="pill">Safety prompts</span><span class="pill">PDF / print</span><span class="pill">Revision history</span><span class="pill">Named approvals</span></div><p class="small">Workflow build v2.4 · Prototype data is stored on this device only. It does not sync with other engineers.</p></section>`}
function library(){let arr=data.filter(p=>[p.title,p.site,p.line,p.asset,p.taskType,p.purpose,p.notes].join(' ').toLowerCase().includes(searchTerm.toLowerCase()));if(filterStatus!=='all')arr=arr.filter(p=>p.status===filterStatus);return `<section class="welcome"><div class="eyebrow">PROCEDURE LIBRARY</div><h1>Find a procedure</h1><p class="muted">Search by task, asset, line, site or keyword.</p></section><input class="search" id="searchInput" placeholder="⌕  e.g. belt, Packing Line 04, sensor" value="${esc(searchTerm)}"><div class="toolbar"><select id="statusFilter" class="search"><option value="all">All document states</option><option>Draft</option><option>In review</option><option>Approved</option></select><button class="btn green" data-action="new">＋ Create</button><button class="btn secondary" data-action="export">Export backup</button><button class="btn secondary" data-action="import">Import backup</button></div><div id="libraryResults">${arr.map(itemCard).join('')||empty('No matching procedures. Try another search or create a procedure.')}</div>`}
function browse(){let sites=[...new Set(data.map(p=>p.site).filter(Boolean))];return `<section class="welcome"><div class="eyebrow">ASSET HIERARCHY</div><h1>Browse by equipment</h1><p class="muted">Follow your site structure: site → line → asset → task.</p></section>${sites.map(site=>{let lines=[...new Set(data.filter(p=>p.site===site).map(p=>p.line))];return `<section class="panel"><h2>🏭 ${esc(site)}</h2>${lines.map(line=>{let assets=[...new Set(data.filter(p=>p.site===site&&p.line===line).map(p=>p.asset))];return `<div class="item"><h3>↳ ${esc(line||'Unassigned line')}</h3>${assets.map(asset=>`<div style="padding:8px 0 8px 12px;border-left:2px solid #dce3e8;margin:8px 0"><strong>⚙ ${esc(asset||'Unassigned asset')}</strong>${data.filter(p=>p.site===site&&p.line===line&&p.asset===asset).map(p=>`<div class="item" style="margin:8px 0 0"><div class="itemtitle">↳ ${esc(p.taskType||p.title)}</div><div class="crumb">${esc(p.title)}</div><button class="btn secondary" data-action="open" data-id="${esc(p.id)}">Open procedure</button></div>`).join('')}</div>`).join('')}</div>`}).join('')}</section>`}).join('')||empty('Create a procedure to start your asset library.')}`}
function startBuilder(p=null){builderDirty=false;editingId=p?.id||null;stepDrafts=p?JSON.parse(JSON.stringify(p.steps||[])):[];draftFields=p?JSON.parse(JSON.stringify(p)): {title:'',site:'',line:'',asset:'',templateType:'Standard operating procedure (SOP)',taskType:'Operation / changeover',audience:'Maintenance engineers',purpose:'',prerequisites:'',tools:'',hazards:[],ppeItems:[],prerequisiteTypes:[],ppe:'',isolation:'',isolationMode:'',isolationReason:'',guards:'',finalChecks:'',notes:'',owner:'',reviewer:'',approver:'',status:'Draft',changeNote:'Initial issue'};if(p&&p.status!=='Draft')draftFields.status='Draft';wizardStep=1;page='builder';render();scrollWizardTop()}
function stepEditor(s={},i){return `<div class="stepbox" data-step-index="${i}"><div class="stephead"><div class="stepnum">${i+1}</div><strong>Instruction step ${i+1}</strong><button type="button" class="btn danger" style="margin-left:auto;padding:7px 10px;min-height:34px" data-action="remove-step" data-index="${i}">Remove</button></div>${stepChoice('type',s.type||'',STEP_TYPES,'Step category')}<div class="field"><label>Action *</label><textarea data-step="action" required placeholder="Describe one clear action…">${esc(s.action||'')}</textarea></div><div class="field"><label>Expected result *</label><textarea data-step="expected" required placeholder="What should be true when this step is complete?">${esc(s.expected||'')}</textarea></div>${stepChoice('verifyMethod',s.verifyMethod||'',VERIFY_METHODS,'Verification approach')}<div class="field"><label>Verification details</label><textarea data-step="verify" placeholder="How is the expected result checked? Use approved criteria.">${esc(s.verify||'')}</textarea></div><div class="field"><label>Warning / caution</label><textarea data-step="warning" placeholder="Task-specific warning from approved sources…">${esc(s.warning||'')}</textarea></div><div class="field"><label>Photo / visual reference</label><input type="file" accept="image/*" data-step="photoFile"><input type="hidden" data-step="photo" value="${esc(s.photo||'')}">${s.photo?`<img class="photo" src="${photosafe(s.photo)?esc(s.photo):''}" alt="Step photo"><button type="button" class="btn ghost" data-action="remove-photo" data-index="${i}">Remove photo</button>`:''}<div class="small">Use a real photo of the actual equipment and label components where needed.</div></div></div>`}

function builder(){let p=editingId?data.find(x=>x.id===editingId):null,d=draftFields||{};return `<section class="welcome"><div class="eyebrow">${p?'EDIT PROCEDURE':'GUIDED AUTHORING'}</div><h1>${p?'Revise a procedure':'Create a procedure'}</h1><p class="muted">Choose from short, relevant lists. Use Other when the correct answer is not listed.</p><div class="pillrow"><span class="pill">Step ${wizardStep} of 4</span><span class="pill">Changes are saved when you finish the wizard</span></div></section><div class="panel"><div class="grid" style="margin-bottom:15px">${['Identify','Requirements','Instructions','Review'].map((x,i)=>`<div class="stat" style="padding:8px;border-color:${wizardStep===i+1?'#216b55':'#dce3e8'};background:${wizardStep===i+1?'#e8f2ee':'#f8fafb'}"><strong style="font-size:14px">${x}</strong><span>Stage ${i+1}</span></div>`).join('')}</div><form id="builderForm">
<div class="${wizardStep===1?'':'hidden'}" data-stage="1"><h2>1. Identify the procedure</h2>
${basicSelect('templateType',d.templateType||TEMPLATES[0],TEMPLATES,'Document template',true)}
<div class="field"><label>Procedure title *</label><input name="title" required value="${esc(d.title||'')}" placeholder="e.g. Replace conveyor belt"></div>
${choiceMarkup('site',d.site||'',existingValues('site'),'Site',true)}
${choiceMarkup('line',d.line||'',lineValues(d.site||''),'Production line',true,!!d.site)}
${choiceMarkup('asset',d.asset||'',assetValues(d.site||'',d.line||''),'Asset / machine',true,!!d.site&&!!d.line)}
${choiceMarkup('taskType',d.taskType||'',curatedValues('taskType',TASK_TYPES,d.taskType),'Task type')}
${choiceMarkup('audience',d.audience||'',curatedValues('audience',AUDIENCES,d.audience),'Intended audience')}
<div class="field"><label>Purpose / scope *</label><textarea name="purpose" required placeholder="Describe the scope and exclusions specific to this task.">${esc(d.purpose||'')}</textarea></div></div>
<div class="${wizardStep===2?'':'hidden'}" data-stage="2"><h2>2. Requirements and safety</h2>
${multiChoice('prerequisiteTypes',PREREQ_CHOICES,d.prerequisiteTypes||[],'Prerequisite categories — select relevant items')}
<div class="field"><label>Prerequisites and competence *</label><textarea name="prerequisites" required placeholder="State the actual training, authorisations, permit numbers and other requirements from approved sources.">${esc(d.prerequisites||'')}</textarea></div>
<div class="field"><label>Tools, materials and parts</label><textarea name="tools" placeholder="Required tools, consumables, parts and specifications.">${esc(d.tools||'')}</textarea></div>
${multiChoice('hazards',HAZARD_CHOICES,d.hazards||[],'Relevant hazards — select all that apply')}
${multiChoice('ppeItems',PPE_CHOICES,d.ppeItems||[],'PPE — select only what approved guidance requires')}
<div class="field"><label>Additional PPE and work-area requirements</label><textarea name="ppe" placeholder="List equipment-specific PPE, permit conditions and other requirements from the approved assessment.">${esc(d.ppe||'')}</textarea></div>
${isolationChoice(d)}
<div class="field"><label>Guards and protective devices</label><textarea name="guards" placeholder="What must be checked or verified according to the approved source?">${esc(d.guards||'')}</textarea></div>
<div class="warning">Checkboxes are prompts, not a completed risk assessment. Do not select hazards or PPE by assumption. Use the relevant OEM/site documents and competent review.</div></div>
<div class="${wizardStep===3?'':'hidden'}" data-stage="3"><h2>3. Build the instructions</h2><p class="muted">Each step should describe one clear action, its expected result and how the result is verified. Add photos where useful.</p><div id="stepsEditor">${stepDrafts.map(stepEditor).join('')}</div><button type="button" class="btn secondary full" data-action="add-step">＋ Add instruction step</button><div class="rule"></div><div class="field"><label>Completion / acceptance criteria *</label><textarea name="finalChecks" required placeholder="How is the task verified as complete? Include approved checks and release requirements.">${esc(d.finalChecks||'')}</textarea></div><div class="field"><label>Linked procedures / references</label><textarea name="notes" placeholder="Document numbers, OEM manuals, drawings or related procedures.">${esc(d.notes||'')}</textarea></div></div>
<div class="${wizardStep===4?'':'hidden'}" data-stage="4"><h2>4. Review and document control</h2>
${choiceMarkup('owner',d.owner||'',[...existingValues('owner'),...existingValues('reviewer'),...existingValues('approver')],'Author',true)}
${choiceMarkup('reviewer',d.reviewer||'',[...existingValues('owner'),...existingValues('reviewer'),...existingValues('approver')],'Reviewer')}
${choiceMarkup('approver',d.approver||'',[...existingValues('owner'),...existingValues('reviewer'),...existingValues('approver')],'Approver')}
${basicSelect('status',d.status||'Draft',statuses,'Document state')}
<div class="field"><label>Revision change note</label><input name="changeNote" value="${esc(d.changeNote||'Initial issue')}" placeholder="Describe the change to this revision"></div>
<div class="warning">Named reviews and approvals are prototype records, not authenticated signatures. Use competent reviewers and your site's approved document-control process.</div><div class="notice">Save the procedure to view its preview and export a PDF.</div></div>
<div class="toolbar"><button type="button" class="btn secondary" id="backBtn" ${wizardStep===1?'disabled':''}>← Back</button><button type="button" class="btn green" id="nextBtn">${wizardStep===4?'Save procedure':'Continue →'}</button></div></form></div>`}
function captureSteps(){
 const boxes=[...document.querySelectorAll('[data-step-index]')];
 if(!boxes.length)return;
 stepDrafts=boxes.map(box=>{const previous=stepDrafts[Number(box.dataset.stepIndex)]||{},o={...previous};box.querySelectorAll('[data-step]').forEach(el=>{if(el.dataset.step!=='photoFile')o[el.dataset.step]=el.value});return o});
}
function captureForm(){
 const f=$('#builderForm');if(!f)return;
 const o={...draftFields};
 for(let el of f.elements){if(!el.name||MULTI_FIELDS.includes(el.name))continue;
   if(el.dataset.choice)continue;
   if(el.type!=='button'&&el.type!=='submit')o[el.name]=el.value;
 }
 for(const name of MULTI_FIELDS){
   const wrap=f.querySelector(`[data-multi-wrap="${name}"]`);
   if(!wrap)continue;
   const chosen=[...wrap.querySelectorAll(`input[name="${name}"]:checked`)].map(el=>el.value);
   const other=wrap.querySelector(`[data-multi-other="${name}"]`);
   if(other?.checked){
     const custom=wrap.querySelector(`[data-multi-custom="${name}"]`).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
     for(const text of custom)if(!chosen.includes(text))chosen.push(text);
   }
   o[name]=chosen;
 }
 o.steps=jsoncopy(stepDrafts);draftFields=o;
}

function collectForm(){captureSteps();captureForm();return {...draftFields,steps:jsoncopy(stepDrafts)}}
function validateStage(n){
 const stage=$(`#builderForm [data-stage="${n}"]`);
 for(const select of stage.querySelectorAll('[data-choice]')){
   if(select.value==='__custom__'){
     const input=select.closest('[data-choice-wrap]').querySelector(`input[name="${select.dataset.choice}"]`);
     if(!input.value.trim()){alert('Enter your own answer for '+select.closest('.field').querySelector('label').textContent);input.focus();return false}
   }
 }
 for(const other of stage.querySelectorAll('[data-multi-other]')){
   if(other.checked){const custom=other.closest('[data-multi-wrap]').querySelector('[data-multi-custom]');
     if(!custom.value.trim()){alert('Enter your own answer, or untick Other.');custom.focus();return false}
   }
 }
 for(const select of stage.querySelectorAll('[data-step-choice]')){
   if(select.value==='__custom__'){
     const input=select.closest('.field').querySelector('[data-step]');
     if(!input.value.trim()){alert('Enter your own '+select.closest('.field').querySelector('label').textContent);input.focus();return false}
   }
 }

 for(let el of stage.querySelectorAll('[required]')){
   if(!String(el.value||'').trim()){
     alert('Please complete: '+(el.closest('.field')?.querySelector('label')?.textContent||'required field'));
     el.focus();return false;
   }
 }
 if(n===3){captureSteps();if(!stepDrafts.length){alert('Add at least one instruction step.');return false}
   for(let i=0;i<stepDrafts.length;i++)if(!stepDrafts[i].action?.trim()||!stepDrafts[i].expected?.trim()){alert(`Step ${i+1} needs an action and expected result.`);return false}
 }
 return true;
}
function validateAllFields(fields){
 for(let k of ['title','site','line','asset','purpose','prerequisites','finalChecks','owner']){
   if(!String(fields[k]||'').trim()){alert('The procedure is missing a required field: '+k+'. Return to the relevant stage to complete it.');return false}
 }
 if(!ISOLATION_MODES.includes(fields.isolationMode)){
   alert('Choose whether isolation is required, not required, or another approved safe-state approach.');return false
 }
 if(fields.isolationMode!=='not-required'&&!String(fields.isolation||'').trim()){
   alert('Add the approved isolation or safe-state reference for this task.');return false
 }
 if(!Array.isArray(fields.steps)||!fields.steps.length||fields.steps.some(s=>!s.action?.trim()||!s.expected?.trim())){alert('At least one complete instruction step is required.');return false}
 return true;
}
function updateMultiCount(detail){
 const selected=detail.querySelectorAll('input[name]:checked').length;
 const custom=detail.querySelector('[data-multi-other]:checked') ? detail.querySelector('[data-multi-custom]').value.split(/\r?\n/).filter(x=>x.trim()).length:0;
 detail.querySelector('summary').textContent=`Choose relevant options (${selected+custom} selected)`;
}
function wireBuilder(){
 const f=$('#builderForm');if(!f)return;
 f.addEventListener('input',event=>{
   builderDirty=true;
   const detail=event.target.closest('details.multiselect');if(detail)updateMultiCount(detail);
   if(event.target.matches('input.custom-choice[name="site"], input.custom-choice[name="line"]'))refreshHierarchyChildren(event.target.name);
 });
 f.addEventListener('change',event=>{
   builderDirty=true;
   const el=event.target;
   if(el.matches('[data-choice]')){
     const field=el.dataset.choice,wrap=el.closest('[data-choice-wrap]'),custom=wrap.querySelector('input[name="'+field+'"]');
     const isCustom=el.value==='__custom__';
     custom.classList.toggle('hidden',!isCustom);
     custom.required=isCustom;
     custom.value=isCustom?'':el.value;
     if(isCustom)custom.focus();
     // Site → line → asset are dependent selections, including custom answers.
     if(field==='site'||field==='line')refreshHierarchyChildren(field);
   }
   if(el.matches('[data-isolation-mode]'))updateIsolationVisibility();
   if(el.matches('[data-step-choice]')){
     const input=el.closest('.field').querySelector(`[data-step="${el.dataset.stepChoice}"]`);
     const isCustom=el.value==='__custom__';
     input.classList.toggle('hidden',!isCustom);input.required=isCustom;input.value=isCustom?'':el.value;
     if(isCustom)input.focus();
   }
   if(el.matches('[data-multi-other]')){
     const wrap=el.closest('[data-multi-wrap]'),area=wrap.querySelector('[data-multi-custom]');
     area.parentElement.classList.toggle('hidden',!el.checked);
     if(el.checked)area.focus();
   }
   const detail=el.closest('details.multiselect');
   if(detail)updateMultiCount(detail);
 });
 $('#backBtn').onclick=()=>{if(wizardStep>1){captureSteps();captureForm();wizardStep--;render();scrollWizardTop()}};
 $('#nextBtn').onclick=()=>{
   if(wizardStep<4){if(!validateStage(wizardStep))return;captureSteps();captureForm();wizardStep++;render();scrollWizardTop();return}
   if(!validateStage(4))return;
   const fields=collectForm();
   if(!validateAllFields(fields))return;
   // A no-isolation procedure must never accidentally inherit an older isolation instruction.
   if(fields.isolationMode==='not-required')fields.isolation='';
   else fields.isolationReason='';
   const old=editingId?data.find(x=>x.id===editingId):null;
   if(editingId&&!old){alert('The original procedure no longer exists. No changes were saved.');return}
   const status=fields.status||'Draft';
   if(status==='In review'&&(!fields.owner?.trim()||!fields.reviewer?.trim())){alert('Add a named author and reviewer before submitting for review.');return}
   if(status==='Approved'){
     if(!fields.owner?.trim()||!fields.reviewer?.trim()||!fields.approver?.trim()){alert('An approved procedure requires a named author, reviewer and approver.');return}
     if(!confirm('Prototype approval record only: confirm the named reviewer and approver have completed the required review outside LineGuide. This is not an authenticated signature.'))return;
   }
   const now=new Date().toISOString(),history=old?jsoncopy(old.revisionHistory||[]):[];
   if(old){const previous={...old};delete previous.revisionHistory;
     if(previous.status==='Approved')previous.archiveState='Superseded';history.unshift(previous);
   }
   const revision=old?(Number(old.revision)||1)+1:1;
   const obj={...(old||{}),...fields,id:old?.id||('lg-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)),revision,revisionHistory:history,created:old?.created||now,updated:now,submittedAt:status==='In review'?now:(old?.submittedAt||''),approvedAt:status==='Approved'?now:'',approvedBy:status==='Approved'?fields.approver:''};
   const next=data.slice(),at=next.findIndex(x=>x.id===obj.id);
   if(at>=0)next[at]=obj;else next.unshift(obj);
   if(persist(next)){builderDirty=false;currentId=obj.id;currentRevisionIndex=null;nav('preview')}
 };
 f.querySelectorAll('[data-step-index]').forEach(box=>{
   const fi=box.querySelector('[data-step="photoFile"]');if(!fi)return;
   fi.onchange=()=>{
     const file=fi.files?.[0];if(!file)return;
     if(file.size>1200000||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){
       alert('Choose a JPEG, PNG, WebP or GIF image under 1.2 MB.');fi.value='';return;
     }
     captureSteps();captureForm();const index=Number(box.dataset.stepIndex),reader=new FileReader();
     reader.onload=()=>{
       if(typeof reader.result!=='string'||!photosafe(reader.result)){alert('That image could not be read safely.');return}
       if(!stepDrafts[index])return;stepDrafts[index].photo=reader.result;builderDirty=true;render();
     };
     reader.onerror=()=>alert('Unable to read that image. Try a smaller file.');
     reader.readAsDataURL(file);
   };
 });
}
function detail(){let p=data.find(x=>x.id===currentId);if(!p)return empty('Procedure not found.');return `<section class="welcome"><div class="eyebrow">PROCEDURE REFERENCE</div><h1>${esc(p.title)}</h1><div class="crumb">${crumb(p)}</div>${badge(p.status)} <span class="small">Revision ${p.revision||1}</span></section><div class="panel"><div class="toolbar"><button class="btn green" data-action="preview" data-id="${esc(p.id)}">Read full procedure</button><button class="btn secondary" data-action="edit" data-id="${esc(p.id)}">Edit / revise</button></div><h3>Purpose</h3><p>${esc(p.purpose)}</p><div class="rule"></div><p class="small">Author: ${esc(p.owner||'Not specified')} · Reviewer: ${esc(p.reviewer||'Not specified')} · Approver: ${esc(p.approver||'Not specified')} · Updated: ${safeDate(p.updated)}</p><div class="toolbar"><button class="btn ghost" data-action="export">Export backup</button><button class="btn ghost" data-action="delete" data-id="${esc(p.id)}">Delete</button></div></div><div class="panel"><h3>Document control</h3><p class="muted">Revision ${p.revision||1} · ${esc(p.changeNote||'No change note')}</p><p class="small">Current revision: ${p.revision||1} · ${p.status==='Approved'?'Approved by '+esc(p.approvedBy||p.approver||'Not recorded')+(p.approvedAt?' on '+safeDate(p.approvedAt):''):'Not currently approved'}</p><h4>Previous revisions (${(p.revisionHistory||[]).length})</h4>${(p.revisionHistory||[]).map((r,i)=>`<div class="item"><strong>Revision ${r.revision||1} · ${esc(r.archiveState||r.status||'Draft')}${r.archiveState?' (was '+esc(r.status||'Approved')+')':''}</strong><div class="crumb">${safeDate(r.updated||r.created)} · ${esc(r.changeNote||'No change note')}</div><div class="small">Author: ${esc(r.owner||'Not recorded')} · Reviewer: ${esc(r.reviewer||'Not recorded')} · Approver: ${esc(r.approver||'Not recorded')}</div><button class="btn secondary" data-action="view-revision" data-id="${esc(p.id)}" data-index="${i}">View this revision</button></div>`).join('')||'<p class="small">No previous revisions yet.</p>'}</div>`}
function preview(){let base=data.find(x=>x.id===currentId);if(!base)return empty('Procedure not found.');let archived=currentRevisionIndex!==null, p=archived?(base.revisionHistory||[])[currentRevisionIndex]:base;if(!p)return empty('Revision not found.');return `${archived?'<div class="warning"><strong>ARCHIVED REVISION — FOR REFERENCE ONLY.</strong> This is a historical snapshot, not the current controlled document.</div>':''}<div class="toolbar no-print"><button class="btn secondary" data-action="open" data-id="${esc(p.id)}">← Details</button><button class="btn green" onclick="window.print()">Print / Save PDF</button></div><article class="panel preview"><div class="eyebrow">LINEGUIDE · ${esc(p.templateType||'ENGINEERING PROCEDURE')}</div><h1>${esc(p.title)}</h1><div class="crumb">${crumb(p)}</div><div class="pillrow">${badge(p.status)}<span class="pill">Document ${esc(p.id.toUpperCase())}</span><span class="pill">Revision ${p.revision||1}</span></div><p><strong>Intended audience:</strong> ${esc(p.audience||'Not specified')}</p><h2>1. Purpose and scope</h2><p>${esc(p.purpose||'Not specified')}</p><h2>2. Prerequisites and resources</h2><p><strong>Selected prerequisite categories:</strong> ${esc((p.prerequisiteTypes||[]).join(', ')||'None selected')}</p><p><strong>Competence / prerequisites:</strong><br>${esc(p.prerequisites||'Not specified')}</p><p><strong>Tools, materials and parts:</strong><br>${esc(p.tools||'Not specified')}</p><p><strong>Selected PPE:</strong> ${esc((p.ppeItems||[]).join(', ')||'None selected')}</p><p><strong>Additional PPE / work area:</strong><br>${esc(p.ppe||'Not specified')}</p><h2>3. Safety considerations</h2><p><strong>Hazards identified:</strong> ${esc((p.hazards||[]).join(', ')||'Not specified')}</p>${p.isolationMode==='not-required'?`<div class="notice"><strong>Isolation: Not required for this procedure</strong><br>${esc(p.isolationReason||'No supporting reason / reference recorded. Verify approved operating controls before use.')}</div>`:p.isolationMode==='other'?`<div class="warning"><strong>Other approved safe-state arrangement</strong><br>${esc(p.isolation||'Not specified')}</div>`:p.isolationMode==='required'?`<div class="warning"><strong>Isolation required — approved reference</strong><br>${esc(p.isolation||'Not specified')}</div>`:`<div class="warning"><strong>Legacy procedure: isolation classification not recorded</strong><br>${esc(p.isolation||'Review and specify whether isolation is required before approval.')}</div>`}<p><strong>Guards / protective devices:</strong><br>${esc(p.guards||'Not specified')}</p><h2>4. Instructions</h2>${(p.steps||[]).map((s,i)=>`<div class="previewstep"><h3>Step ${i+1}. ${esc(s.action||'Instruction')}</h3>${s.type?`<p class="small">${esc(s.type)}</p>`:''}<p>${esc(s.action||'')}</p>${s.photo?`<img class="photo" src="${photosafe(s.photo)?esc(s.photo):''}" alt="Reference for step ${i+1}">`:''}<p><strong>Expected result:</strong> ${esc(s.expected||'Not specified')}</p>${s.verifyMethod?`<p><strong>Verification approach:</strong> ${esc(s.verifyMethod)}</p>`:''}${s.verify?`<p><strong>Verification details:</strong> ${esc(s.verify)}</p>`:''}${s.warning?`<div class="warning"><strong>Warning / caution:</strong> ${esc(s.warning)}</div>`:''}</div>`).join('')}<h2>5. Completion and acceptance criteria</h2><p>${esc(p.finalChecks||'Not specified')}</p><h2>6. References and additional notes</h2><p>${esc(p.notes||'None recorded')}</p><div class="rule"></div><p class="small">Author: ${esc(p.owner||'Not specified')} · Reviewer: ${esc(p.reviewer||'Not specified')} · Approver: ${esc(p.approver||'Not specified')} · Revision: ${p.revision||1} · Updated: ${safeDate(p.updated)} · Change note: ${esc(p.changeNote||'Not specified')}</p>${p.status==='Approved'?`<p class="small">Approved by ${esc(p.approvedBy||p.approver||'Not recorded')} ${p.approvedAt?'on '+safeDate(p.approvedAt):''}</p>`:''}${p.status!=='Approved'?'<div class="warning"><strong>NOT APPROVED FOR OPERATIONAL USE.</strong> This document is a draft or awaiting review.</div>':''}</article>`}
function exportData(){
 const blob=new Blob([JSON.stringify({app:'LineGuide',version:1,exported:new Date().toISOString(),procedures:data},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='lineguide-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}
function importData(){
 const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
 input.onchange=async()=>{
   const f=input.files?.[0];if(!f)return;
   try{
     if(f.size>25*1024*1024)throw Error('Backup file exceeds the 25 MB import limit');
     const obj=JSON.parse(await f.text());
     if(obj?.app!=='LineGuide'||obj?.version!==1)throw Error('Not a supported LineGuide backup');
     const incoming=validateImport(obj.procedures),map=new Map(data.map(p=>[p.id,p]));
     const matches=incoming.filter(p=>map.has(p.id)).length;
     if(!confirm(`Import ${incoming.length} procedures? ${matches} existing records with matching IDs will be replaced. Export a backup first.`))return;
     for(let p of incoming)map.set(p.id,p);
     const next=[...map.values()];if(persist(next))nav('library');
   }catch(e){alert('Import cancelled: '+(e.message||'Invalid backup')+'. Your saved library is unchanged.')}
 };
 input.click();
}
function act(a,pid,idx){
 if(a==='new'){if(leaveBuilder())startBuilder();return}
 if(a==='library'){if(leaveBuilder())nav('library');return}
 if(a==='open'){if(!leaveBuilder())return;currentId=pid;currentRevisionIndex=null;nav('detail');return}
 if(a==='edit'){if(!leaveBuilder())return;let p=data.find(x=>x.id===pid);if(p)startBuilder(p);return}
 if(a==='add-step'){captureSteps();captureForm();stepDrafts.push({action:'',expected:'',verify:'',warning:'',photo:''});builderDirty=true;render();return}
 if(a==='remove-step'){captureSteps();captureForm();stepDrafts.splice(Number(idx),1);builderDirty=true;render();return}
 if(a==='remove-photo'){captureSteps();captureForm();if(stepDrafts[Number(idx)])stepDrafts[Number(idx)].photo='';builderDirty=true;render();return}
 if(a==='preview'){currentId=pid;currentRevisionIndex=null;nav('preview');return}
 if(a==='view-revision'){currentId=pid;currentRevisionIndex=Number(idx);nav('preview');return}
 if(a==='delete'){
   let p=data.find(x=>x.id===pid);
   if(p&&confirm(`Delete "${p.title}" from this device? Export a backup first if needed.`)){
     const next=data.filter(x=>x.id!==pid);if(persist(next))nav('library');
   }
   return;
 }
 if(a==='raw-recovery'){downloadRaw();return}
 if(a==='export'){exportData();return}
 if(a==='import'){importData();return}
}
function render(){
 if(loadProblem){onError('The existing browser data could not be read.');return}
 const app=$('#app');
 if(page==='home')app.innerHTML=home();
 if(page==='library')app.innerHTML=library();
 if(page==='browse')app.innerHTML=browse();
 if(page==='builder')app.innerHTML=builder();
 if(page==='detail')app.innerHTML=detail();
 if(page==='preview')app.innerHTML=preview();
 document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 wire();
}
document.querySelector('#app').addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||!e.currentTarget.contains(b))return;
 e.preventDefault();act(b.dataset.action,b.dataset.id,b.dataset.index);
});
function filteredProcedures(){
 let arr=data.filter(p=>[p.title,p.site,p.line,p.asset,p.taskType,p.purpose,p.notes].join(' ').toLowerCase().includes(searchTerm.toLowerCase()));
 if(filterStatus!=='all')arr=arr.filter(p=>p.status===filterStatus);return arr;
}
function wire(){
 const si=$('#searchInput');if(si)si.addEventListener('input',()=>{
   searchTerm=si.value;
   $('#libraryResults').innerHTML=filteredProcedures().map(itemCard).join('')||empty('No matching procedures.');
 });
 const sf=$('#statusFilter');if(sf){sf.value=filterStatus;sf.addEventListener('change',()=>{filterStatus=sf.value;render()})}
 if(page==='builder')wireBuilder();
}
load();if(location.hash.startsWith('#procedure=')){try{currentId=decodeURIComponent(location.hash.slice(11));page='detail'}catch{page='home'}}render();
function updateConnection(){let el=$('#connectionBadge');if(el)el.textContent=navigator.onLine?'● Online':'● Offline'}window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

window.addEventListener('beforeunload',e=>{if(page==='builder'&&builderDirty){e.preventDefault();e.returnValue=''}});