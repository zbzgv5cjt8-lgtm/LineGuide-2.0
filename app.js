/* LineGuide MVP. Local-first prototype: data stays in this browser on this device. */
const KEY='lineguide-procedures-v1', DRAFT_KEY='lineguide-wizard-draft-v1', SEQUENCE_KEY='lineguide-document-sequence-v1', $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const OWN=['title','site','line','asset','taskType','audience','purpose','prerequisites','tools','ppe','isolation','isolationMode','isolationReason','guards','finalChecks','notes','owner','reviewer','approver','status','changeNote','created','updated','submittedAt','approvedAt','approvedBy','archiveState','templateType','documentNumber','riskAssessmentMode','riskAssessmentRef','riskControls'];
const statuses=['Draft','In review','Approved'];
const TEMPLATES=['Standard operating procedure (SOP)','Safe working procedure (SWP)'];
const LEGACY_TEMPLATES=['Work instruction','Inspection procedure'];
// Curated, short option lists. Machine-specific details must come from approved instructions.
const TASK_TYPES=['Operation / changeover','Inspection','Cleaning','Adjustment','Repair / replacement','Testing / verification'];
const AUDIENCES=['Maintenance engineers','Operators','Supervisors','Contractors'];
const PPE_CHOICES=['Safety footwear','Eye protection','Hearing protection','Gloves','Protective clothing','Respiratory protection'];
const PREREQ_CHOICES=['Competence / training','Authorisation / permit','Risk assessment','OEM / approved procedure','Isolation / safe state'];
const HAZARD_CHOICES=['Electrical','Moving parts / entrapment','Pneumatic / hydraulic','Stored energy / suspended loads','Hot surfaces','Sharp edges / surfaces','Chemicals / dust','Slips / trips / falls','Noise'];
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
 const custom=selected.filter(x=>!values.includes(x)&&!LEGACY_OTHER.includes(x)&&x!=='Hot / sharp surfaces');
 const hasOther=custom.length>0||selected.some(x=>LEGACY_OTHER.includes(x));
 const count=selected.filter(x=>!LEGACY_OTHER.includes(x)&&(values.includes(x)||!['Hot / sharp surfaces'].includes(x))).length + (selected.includes('Hot / sharp surfaces') ? 2 : 0);
 return `<div class="field" data-multi-wrap="${esc(name)}"><label>${esc(label)}</label><details class="multiselect"><summary>Choose relevant options (${count} selected)</summary><div class="choice-grid">${values.map(v=>`<label class="checkline"><input type="checkbox" name="${esc(name)}" value="${esc(v)}" ${(selected.includes(v)||(selected.includes('Hot / sharp surfaces')&&['Hot surfaces','Sharp edges / surfaces'].includes(v)))?'checked':''}>${esc(v)}</label>`).join('')}<label class="checkline"><input type="checkbox" data-multi-other="${esc(name)}" ${hasOther?'checked':''}>Other — enter your own</label></div><div class="multi-other ${hasOther?'':'hidden'}"><label for="custom-${esc(name)}">Your own answers (one per line)</label><textarea id="custom-${esc(name)}" data-multi-custom="${esc(name)}" placeholder="Enter a relevant item on each line…">${esc(custom.join('\n'))}</textarea><div class="small">These entries are included in the saved document, not added to everyone’s default choices.</div></div></details></div>`;
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
function riskEntryEditor(r={},i){
 const hazardValues=[...new Set((draftFields.hazards||[]).filter(Boolean))];
 const people=['Operators','Maintenance engineers','Contractors','Other — specify'];
 const chosen=people.includes(r.people)?r.people:(r.people?'Other — specify':'');
 return `<div class="stepbox" data-risk-index="${i}"><div class="stephead"><span class="stepnum">${i+1}</span><strong>Hazard and controls ${i+1}</strong><button class="btn danger" type="button" style="margin-left:auto" data-action="remove-risk" data-index="${i}">Remove</button></div>
 ${choiceMarkup('riskHazard'+i,r.hazard||'',hazardValues,'Hazard',true)}
 <div class="field"><label>Possible harm *</label><input data-risk="harm" required value="${esc(r.harm||'')}" placeholder="e.g. injury from moving equipment"></div>
 <div class="field"><label>Who could be harmed? *</label><select data-risk-people="${i}"><option value="">Choose…</option>${people.map(v=>`<option value="${esc(v)}" ${chosen===v?'selected':''}>${esc(v)}</option>`).join('')}</select><input data-risk="people" class="custom-choice ${chosen==='Other — specify'?'':'hidden'}" value="${esc(r.people||'')}" placeholder="Specify affected people"></div>
 <div class="field"><label>Required control measures *</label><textarea data-risk="controls" required placeholder="Give the task-specific approved controls, not just PPE.">${esc(r.controls||'')}</textarea></div>
 <div class="field"><label>Further actions (if any)</label><input data-risk="actions" value="${esc(r.actions||'')}" placeholder="Leave blank if no further actions are needed"></div></div>`;
}
function riskAssessmentFields(d){
 const isSwp=d.templateType===TEMPLATES[1];const mode=d.riskAssessmentMode||'existing';
 return `<div class="panel" style="background:#f8fafb;padding:14px" data-risk-assessment>
 <h3>Risk assessment</h3><p class="small">An SOP should refer to the applicable approved assessment where relevant. An SWP must be supported by an approved assessment or a task-specific assessment for review.</p>
 <div data-sop-risk class="${isSwp?'hidden':''}"><div class="field"><label>Applicable risk assessment reference (if relevant)</label><input name="riskAssessmentRef" value="${esc(d.riskAssessmentRef||'')}" placeholder="Site risk assessment reference"></div></div>
 <div data-swp-risk class="${isSwp?'':'hidden'}"><div class="field"><label>How are the risks assessed? *</label><select name="riskAssessmentMode" data-risk-mode><option value="existing" ${mode==='existing'?'selected':''}>Reference an existing approved assessment</option><option value="new" ${mode==='new'?'selected':''}>Create a task-specific assessment</option></select></div>
 <div data-risk-existing class="${mode==='existing'?'':'hidden'}"><div class="field"><label>Approved risk assessment reference *</label><input data-risk-ref value="${esc(d.riskAssessmentRef||'')}" placeholder="Document number / revision"></div><div class="field"><label>Key controls applicable to this task *</label><textarea name="riskControls" placeholder="State the approved controls that the engineer must follow; do not just list hazards.">${esc(d.riskControls||'')}</textarea></div></div>
 <div data-risk-new class="${mode==='new'?'':'hidden'}"><p class="small">Record each significant hazard, the potential harm, people affected and the approved controls. A competent person must review the assessment before use.</p><div id="riskEditor">${riskDrafts.map(riskEntryEditor).join('')}</div><button type="button" class="btn secondary full" data-action="add-risk">＋ Add hazard and controls</button></div></div></div>`;
}
function updateRiskVisibility(){
 const f=$('#builderForm');if(!f)return;
 const swp=f.elements.templateType?.value===TEMPLATES[1];
 const area=f.querySelector('[data-risk-assessment]');if(!area)return;
 area.querySelector('[data-sop-risk]').classList.toggle('hidden',swp);
 area.querySelector('[data-swp-risk]').classList.toggle('hidden',!swp);
 const mode=f.elements.riskAssessmentMode?.value||'existing';
 area.querySelector('[data-risk-existing]').classList.toggle('hidden',mode!=='existing');
 area.querySelector('[data-risk-new]').classList.toggle('hidden',mode!=='new');
}
function captureRiskEntries(){
 const cards=[...document.querySelectorAll('[data-risk-index]')];
 if(!cards.length)return;
 riskDrafts=cards.map(card=>{
   const i=Number(card.dataset.riskIndex),previous=riskDrafts[i]||{},out={...previous};
   out.hazard=card.querySelector('input[name="riskHazard'+i+'"]')?.value?.trim()||'';
   for(const k of ['harm','controls','actions'])out[k]=card.querySelector('[data-risk="'+k+'"]')?.value||'';
   out.people=card.querySelector('[data-risk="people"]')?.value?.trim()||'';
   return out;
 });
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
function storedDraft(){
 try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return null;const d=JSON.parse(raw);
  if(!d||typeof d!=='object'||!d.draftFields||!Array.isArray(d.stepDrafts)||!Array.isArray(d.riskDrafts))return null;
  return d
 }catch{return null}
}
function discardWorkingDraft(){clearTimeout(draftTimer);try{localStorage.removeItem(DRAFT_KEY)}catch{}}
function saveWorkingDraft(){
 if(page!=='builder'||!builderDirty)return;
 try{captureSteps();captureForm();localStorage.setItem(DRAFT_KEY,JSON.stringify({editingId,stepDrafts,riskDrafts,draftFields,wizardStep,savedAt:new Date().toISOString()}));draftSaveFailed=false}
 catch(e){if(!draftSaveFailed){alert('Your unfinished work could not be saved automatically. Avoid closing the app; check device storage.');draftSaveFailed=true}}
}
function queueDraftSave(){clearTimeout(draftTimer);draftTimer=setTimeout(saveWorkingDraft,450)}
function resumeWorkingDraft(){
 const draft=storedDraft();if(!draft){alert('No recoverable working draft was found.');return}
 editingId=data.some(p=>p.id===draft.editingId)?draft.editingId:null;
 stepDrafts=jsoncopy(draft.stepDrafts);riskDrafts=jsoncopy(draft.riskDrafts);
 draftFields=jsoncopy(draft.draftFields);wizardStep=Math.min(4,Math.max(1,Number(draft.wizardStep)||1));
 builderDirty=true;page='builder';render();scrollWizardTop();
}
function nextDocumentNumber(templateType){
 const prefix=templateType===TEMPLATES[1]?'SWP':'SOP';
 const existingMax=Math.max(0,...data.map(p=>Number((p.documentNumber||'').match(/^LG-(?:SOP|SWP)-(\d+)$/)?.[1]||0)));
 let current=0;try{current=Number(localStorage.getItem(SEQUENCE_KEY))||0}catch{}
 return {number:'LG-'+prefix+'-'+String(Math.max(current,existingMax)+1).padStart(4,'0'),sequence:Math.max(current,existingMax)+1}
}

let page='home',editingId=null,stepDrafts=[],riskDrafts=[],wizardStep=1,searchTerm='',filterStatus='all',currentId=null,currentRevisionIndex=null,data=[],draftFields={},builderDirty=false,loadProblem=false,draftTimer=null,draftSaveFailed=false;
function persist(next){
  try{localStorage.setItem(KEY,JSON.stringify(next));data=next;loadProblem=false;return true}
  catch(e){alert('Unable to save LineGuide data. Browser storage may be full or disabled. Your existing saved records have not been changed. Export a backup and check available storage.');return false}
}
function save(){return persist(data)}
function parseRevision(value){
 const raw=String(value??'1.0');const m=raw.match(/^(\d+)(?:\.(\d+))?$/);
 return m?{major:Number(m[1]),minor:Number(m[2]||0)}:{major:1,minor:0}
}
function revLabel(value){const r=parseRevision(value);return r.major+'.'+r.minor}
function bumpedRevision(value,type){const r=parseRevision(value);return String(type).startsWith('Major')?(r.major+1)+'.0':r.major+'.'+(r.minor+1)}
function safeDate(s){let d=new Date(s);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d):'Unknown date'}
function compressProcedurePhoto(file){
 return new Promise((resolve,reject)=>{
  if(!file||!file.type.startsWith('image/')||file.size>18*1024*1024){reject(new Error('Choose a photo smaller than 18 MB.'));return}
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('Could not read the photo.'));
  reader.onload=()=>{
   const photo=new Image();photo.onerror=()=>reject(new Error('The selected image could not be decoded.'));
   photo.onload=()=>{
    const maxSide=1600,ratio=Math.min(1,maxSide/Math.max(photo.naturalWidth,photo.naturalHeight));
    if(!photo.naturalWidth||!photo.naturalHeight||photo.naturalWidth*photo.naturalHeight>65000000){reject(new Error('This photo is too large to process safely.'));return}
    let width=Math.max(1,Math.round(photo.naturalWidth*ratio)),height=Math.max(1,Math.round(photo.naturalHeight*ratio));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx){reject(new Error('Photo processing is not supported on this device.'));return}
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.drawImage(photo,0,0,width,height);
    let result=canvas.toDataURL('image/jpeg',0.79);
    if(result.length>950000)result=canvas.toDataURL('image/jpeg',0.60);
    if(result.length>950000){reject(new Error('Photo is still too large after compression. Try a closer image with less background.'));return}
    resolve(result);
   };
   photo.src=String(reader.result);
  };
  reader.readAsDataURL(file);
 });
}
function normaliseRisk(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid risk entry');let r={};for(const k of ['hazard','harm','people','controls','actions'])r[k]=typeof v[k]==='string'?v[k].slice(0,10000):'';return r}
function normaliseStep(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid instruction step');let r={};for(let k of ['action','expected','verify','warning','type','verifyMethod'])r[k]=typeof v[k]==='string'?v[k].slice(0,30000):'';r.photo=photosafe(v.photo)?v.photo:'';return r}
function normaliseProcedure(v,depth=0){
  if(!v||typeof v!=='object'||Array.isArray(v)||typeof v.id!=='string'||!v.id.trim()||v.id.length>150||typeof v.title!=='string'||!v.title.trim())throw Error('Invalid procedure');
  if(!Array.isArray(v.steps)||v.steps.length>300)throw Error('Invalid steps');
  if(v.riskEntries!==undefined&&(!Array.isArray(v.riskEntries)||v.riskEntries.length>80))throw Error('Invalid risk assessment entries');
  let r={id:v.id,riskEntries:(v.riskEntries||[]).map(normaliseRisk),revision: typeof v.revision==='string'||typeof v.revision==='number'?v.revision:1,steps:v.steps.map(normaliseStep),hazards:Array.isArray(v.hazards)?v.hazards.filter(x=>typeof x==='string').slice(0,30):[],ppeItems:Array.isArray(v.ppeItems)?v.ppeItems.filter(x=>typeof x==='string').slice(0,30):[],prerequisiteTypes:Array.isArray(v.prerequisiteTypes)?v.prerequisiteTypes.filter(x=>typeof x==='string').slice(0,30):[]};
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
function nav(p){page=p;document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));render();scrollWizardTop()}
document.querySelector('.nav').addEventListener('click',e=>{
 const b=e.target.closest('button[data-page]');if(!b)return;
 if(!leaveBuilder())return;
 b.dataset.page==='builder'?startBuilder():nav(b.dataset.page);
});
function leaveBuilder(){if(page!=='builder'||!builderDirty)return true;
 if(!confirm('Discard unfinished changes? Your saved documents will stay unchanged.'))return false;
 discardWorkingDraft();builderDirty=false;return true
}
function empty(t){return `<div class="empty">${esc(t)}</div>`}
function itemCard(p){return `<div class="item"><div class="itemtop"><div><div class="itemtitle">${esc(p.title)}</div><div class="crumb">${crumb(p)}</div><div class="small">${esc(p.documentNumber||'Legacy reference')} · Rev ${revLabel(p.revision)}</div></div>${badge(p.status)}</div><div class="actions"><button class="btn secondary" data-action="open" data-id="${esc(p.id)}">Open</button><button class="btn ghost" data-action="edit" data-id="${esc(p.id)}">Edit</button><button class="btn danger" data-action="delete" data-id="${esc(p.id)}" aria-label="Delete ${esc(p.title)}">Delete</button></div></div>`}
function home(){let approved=data.filter(p=>p.status==='Approved').length;return `<section class="welcome"><div class="eyebrow">YOUR ENGINEERING REFERENCE</div><h1>Good procedures.<br>Easy to find.</h1><p class="muted">Create thorough, consistent instructions once, then find them by site, line, asset or task.</p>${storedDraft()?'<div class="notice"><strong>Unfinished procedure saved on this device.</strong><div class="actions" style="margin-top:10px"><button class="btn green" data-action="resume-draft">Resume</button><button class="btn ghost" data-action="discard-draft">Discard</button></div></div>':''}<div class="actions"><button class="btn green" data-action="new">＋ Create procedure</button><button class="btn secondary" data-action="library">⌕ Find a procedure</button></div></section><div class="grid three"><div class="stat"><strong>${data.length}</strong><span>Procedures</span></div><div class="stat"><strong>${approved}</strong><span>Approved documents</span></div><div class="stat"><strong>${new Set(data.map(p=>p.line).filter(Boolean)).size}</strong><span>Production lines</span></div></div><section class="panel" style="margin-top:14px"><h2>Recently updated</h2>${data.slice().sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')).slice(0,3).map(itemCard).join('')||empty('No procedures yet. Create your first one.')}</section><section class="panel"><h3>Built for practical engineering</h3><div class="pillrow"><span class="pill">Guided authoring</span><span class="pill">Photo steps</span><span class="pill">Safety prompts</span><span class="pill">PDF / print</span><span class="pill">Revision history</span><span class="pill">Named approvals</span></div><p class="small">Quality build v2.6 · Prototype data is stored on this device only. It does not sync with other engineers.</p></section>`}
function searchableText(p){return [p.title,p.site,p.line,p.asset,p.taskType,p.purpose,p.notes,p.documentNumber,...(p.hazards||[]),...(p.steps||[]).flatMap(s=>[s.action,s.expected,s.verify]),...(p.riskEntries||[]).flatMap(r=>[r.hazard,r.harm,r.controls])].join(' ').toLowerCase()}
function library(){let arr=filteredProcedures().sort((a,b)=>(b.updated||'').localeCompare(a.updated||''));return `<section class="welcome"><div class="eyebrow">PROCEDURE LIBRARY</div><h1>Find a procedure</h1><p class="muted">Search by task, asset, line, site or keyword.</p></section><input class="search" id="searchInput" placeholder="⌕  e.g. belt, Packing Line 04, sensor" value="${esc(searchTerm)}"><div class="toolbar"><select id="statusFilter" class="search"><option value="all">All document states</option><option>Draft</option><option>In review</option><option>Approved</option></select><button class="btn green" data-action="new">＋ Create</button><button class="btn secondary" data-action="export">Export backup</button><button class="btn secondary" data-action="import">Import backup</button></div><div id="libraryResults">${arr.map(itemCard).join('')||empty('No matching procedures. Try another search or create a procedure.')}</div>`}
function browse(){let sites=[...new Set(data.map(p=>p.site).filter(Boolean))];return `<section class="welcome"><div class="eyebrow">ASSET HIERARCHY</div><h1>Browse by equipment</h1><p class="muted">Follow your site structure: site → line → asset → task.</p></section>${sites.map(site=>{let lines=[...new Set(data.filter(p=>p.site===site).map(p=>p.line))];return `<section class="panel"><h2>🏭 ${esc(site)}</h2>${lines.map(line=>{let assets=[...new Set(data.filter(p=>p.site===site&&p.line===line).map(p=>p.asset))];return `<div class="item"><h3>↳ ${esc(line||'Unassigned line')}</h3>${assets.map(asset=>`<div style="padding:8px 0 8px 12px;border-left:2px solid #dce3e8;margin:8px 0"><strong>⚙ ${esc(asset||'Unassigned asset')}</strong>${data.filter(p=>p.site===site&&p.line===line&&p.asset===asset).map(p=>`<div class="item" style="margin:8px 0 0"><div class="itemtitle">↳ ${esc(p.taskType||p.title)}</div><div class="crumb">${esc(p.title)}</div><button class="btn secondary" data-action="open" data-id="${esc(p.id)}">Open procedure</button></div>`).join('')}</div>`).join('')}</div>`}).join('')}</section>`}).join('')||empty('Create a procedure to start your asset library.')}`}
function startBuilder(p=null){builderDirty=false;riskDrafts=p?jsoncopy(p.riskEntries||[]):[];editingId=p?.id||null;stepDrafts=p?JSON.parse(JSON.stringify(p.steps||[])):[];draftFields=p?JSON.parse(JSON.stringify(p)): {title:'',site:'',line:'',asset:'',templateType:'Standard operating procedure (SOP)',taskType:'Operation / changeover',audience:'Maintenance engineers',purpose:'',prerequisites:'',tools:'',hazards:[],ppeItems:[],prerequisiteTypes:[],ppe:'',isolation:'',isolationMode:'',isolationReason:'',guards:'',finalChecks:'',notes:'',owner:'',reviewer:'',approver:'',status:'Draft',riskAssessmentMode:'existing',riskAssessmentRef:'',riskControls:'',riskEntries:[],changeNote:'Initial issue'};if(p&&p.status!=='Draft')draftFields.status='Draft';wizardStep=1;page='builder';render();scrollWizardTop()}
function stepEditor(s={},i){return `<div class="stepbox" data-step-index="${i}"><div class="stephead"><div class="stepnum">${i+1}</div><strong>Instruction step ${i+1}</strong><button type="button" class="btn danger" style="margin-left:auto;padding:7px 10px;min-height:34px" data-action="remove-step" data-index="${i}">Remove</button></div>${stepChoice('type',s.type||'',STEP_TYPES,'Step category')}<div class="field"><label>Action *</label><textarea data-step="action" required placeholder="Describe one clear action…">${esc(s.action||'')}</textarea></div><div class="field"><label>Expected result *</label><textarea data-step="expected" required placeholder="What should be true when this step is complete?">${esc(s.expected||'')}</textarea></div>${stepChoice('verifyMethod',s.verifyMethod||'',VERIFY_METHODS,'Verification approach')}<div class="field"><label>Verification details</label><textarea data-step="verify" placeholder="How is the expected result checked? Use approved criteria.">${esc(s.verify||'')}</textarea></div><div class="field"><label>Warning / caution</label><textarea data-step="warning" placeholder="Task-specific warning from approved sources…">${esc(s.warning||'')}</textarea></div><div class="field"><label>Photo / visual reference</label><input type="file" accept="image/*" data-step="photoFile"><input type="hidden" data-step="photo" value="${esc(s.photo||'')}">${s.photo?`<img class="photo" src="${photosafe(s.photo)?esc(s.photo):''}" alt="Step photo"><button type="button" class="btn ghost" data-action="remove-photo" data-index="${i}">Remove photo</button>`:''}<div class="small">Choose a real equipment photo. Large camera images are compressed automatically; use approved source drawings for fine technical detail.</div></div></div>`}

function builder(){let p=editingId?data.find(x=>x.id===editingId):null,d=draftFields||{};return `<section class="welcome"><div class="eyebrow">${p?'EDIT PROCEDURE':'GUIDED AUTHORING'}</div><h1>${p?'Revise a procedure':'Create a procedure'}</h1><p class="muted">Choose from short, relevant lists. Use Other when the correct answer is not listed.</p><div class="pillrow"><span class="pill">Step ${wizardStep} of 4</span><span class="pill">Unfinished work is saved locally as you type</span></div></section><div class="panel"><div class="grid" style="margin-bottom:15px">${['Identify','Requirements','Instructions','Review'].map((x,i)=>`<div class="stat" style="padding:8px;border-color:${wizardStep===i+1?'#216b55':'#dce3e8'};background:${wizardStep===i+1?'#e8f2ee':'#f8fafb'}"><strong style="font-size:14px">${x}</strong><span>Stage ${i+1}</span></div>`).join('')}</div><form id="builderForm">
<div class="${wizardStep===1?'':'hidden'}" data-stage="1"><h2>1. Identify the procedure</h2>
${basicSelect('templateType',TEMPLATES.includes(d.templateType)?d.templateType:TEMPLATES[0],TEMPLATES,'Document template',true)}${d.templateType&&LEGACY_TEMPLATES.includes(d.templateType)?'<div class="notice">This older document used a retired template. Select SOP or SWP to continue. The existing saved version remains unchanged until you save.</div>':''}
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
${riskAssessmentFields(d)}
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
${p?basicSelect('revisionChangeType',d.revisionChangeType||'Minor revision',['Minor revision','Major revision'],'Revision type'):''}
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
 captureRiskEntries();
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
 if(f.elements.templateType?.value===TEMPLATES[1])o.riskAssessmentRef=f.querySelector('[data-risk-ref]')?.value||'';
 o.riskEntries=jsoncopy(riskDrafts);
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
 if(n===2){
  const swp=$('#builderForm [name=templateType]')?.value===TEMPLATES[1];
  if(swp){const mode=stage.querySelector('[data-risk-mode]')?.value;
   if(mode==='existing'&&!stage.querySelector('[data-risk-ref]').value.trim()){alert('Enter the approved risk assessment reference, or select the task-specific assessment option.');return false}
   if(mode==='existing'&&!stage.querySelector('[name=riskControls]').value.trim()){alert('Summarise the key task-specific controls from the approved risk assessment.');return false}
   if(mode==='new'){captureRiskEntries();if(!riskDrafts.length){alert('Add at least one hazard and its controls to the assessment.');return false}
    for(let i=0;i<riskDrafts.length;i++){const r=riskDrafts[i];if(!r.hazard?.trim()||!r.harm?.trim()||!r.people?.trim()||!r.controls?.trim()){alert('Complete the hazard, possible harm, people affected and controls for assessment entry '+(i+1)+'.');return false}}
   }
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
 if(!TEMPLATES.includes(fields.templateType)){alert('Select SOP or SWP as the document template.');return false}
 if(!ISOLATION_MODES.includes(fields.isolationMode)){
   alert('Choose whether isolation is required, not required, or another approved safe-state approach.');return false
 }
 if(fields.isolationMode!=='not-required'&&!String(fields.isolation||'').trim()){
   alert('Add the approved isolation or safe-state reference for this task.');return false
 }
 if(fields.templateType===TEMPLATES[1]){
  if(fields.riskAssessmentMode==='existing'&&!String(fields.riskAssessmentRef||'').trim()){alert('An SWP needs an approved risk assessment reference, or a new task-specific assessment.');return false}
  if(fields.riskAssessmentMode==='existing'&&!String(fields.riskControls||'').trim()){alert('The SWP must include the applicable task-specific risk controls.');return false}
  if(fields.riskAssessmentMode==='new'&&(!Array.isArray(fields.riskEntries)||!fields.riskEntries.length||fields.riskEntries.some(r=>!r.hazard?.trim()||!r.harm?.trim()||!r.people?.trim()||!r.controls?.trim()))){alert('Complete the task-specific risk assessment before saving.');return false}
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
   const detail=event.target.closest('details.multiselect');if(detail)updateMultiCount(detail);queueDraftSave();
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
   if(el.matches('[data-risk-mode],[name=templateType]'))updateRiskVisibility();
   if(el.matches('[data-risk-people]')){const box=el.closest('[data-risk-index]'),input=box.querySelector('[data-risk="people"]'),custom=el.value==='Other — specify';input.classList.toggle('hidden',!custom);input.value=custom?'':el.value;input.required=custom;if(custom)input.focus()}
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
   if(detail)updateMultiCount(detail);queueDraftSave();
 });
 $('#backBtn').onclick=()=>{if(wizardStep>1){captureSteps();captureForm();wizardStep--;render();scrollWizardTop();queueDraftSave()}};
 $('#nextBtn').onclick=()=>{
   if(wizardStep<4){if(!validateStage(wizardStep))return;captureSteps();captureForm();wizardStep++;render();scrollWizardTop();queueDraftSave();return}
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
   const revision=old?bumpedRevision(old.revision,fields.revisionChangeType||'Minor revision'):'1.0';
   const ref=old?{number:old.documentNumber||old.id.toUpperCase(),sequence:null}:nextDocumentNumber(fields.templateType);
   const documentNumber=ref.number;
   const obj={...(old||{}),...fields,documentNumber,id:old?.id||('lg-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)),revision,revisionHistory:history,created:old?.created||now,updated:now,submittedAt:status==='In review'?now:(old?.submittedAt||''),approvedAt:status==='Approved'?now:'',approvedBy:status==='Approved'?fields.approver:''};
   delete obj.revisionChangeType;
   const next=data.slice(),at=next.findIndex(x=>x.id===obj.id);
   if(at>=0)next[at]=obj;else next.unshift(obj);
   if(persist(next)){if(!old){try{localStorage.setItem(SEQUENCE_KEY,String(ref.sequence))}catch{alert('Document saved, but the reference counter could not be updated. Export a backup before deleting records.')}}discardWorkingDraft();builderDirty=false;currentId=obj.id;currentRevisionIndex=null;nav('preview')}
 };
 f.querySelectorAll('[data-step-index]').forEach(box=>{
   const fi=box.querySelector('[data-step="photoFile"]');if(!fi)return;
   fi.onchange=()=>{
     const file=fi.files?.[0];if(!file)return;
     if(!file.type.startsWith('image/')||file.size>18*1024*1024){alert('Choose an image under 18 MB. The app will resize it to save storage space.');fi.value='';return}
     captureSteps();captureForm();const index=Number(box.dataset.stepIndex);
     compressProcedurePhoto(file).then(photo=>{
       if(!stepDrafts[index])return;
       stepDrafts[index].photo=photo;builderDirty=true;render();queueDraftSave();
     }).catch(err=>alert(err.message||'Unable to process photo.'));
   };
 });
}
function detail(){let p=data.find(x=>x.id===currentId);if(!p)return empty('Procedure not found.');return `<section class="welcome"><div class="eyebrow">PROCEDURE REFERENCE</div><h1>${esc(p.title)}</h1><div class="crumb">${crumb(p)}</div>${badge(p.status)} <span class="small">Revision ${revLabel(p.revision)}</span></section><div class="panel"><div class="toolbar"><button class="btn green" data-action="preview" data-id="${esc(p.id)}">Read full procedure</button><button class="btn secondary" data-action="edit" data-id="${esc(p.id)}">Edit / revise</button></div><h3>Purpose</h3><p>${esc(p.purpose)}</p><div class="rule"></div><p class="small">Author: ${esc(p.owner||'Not specified')} · Reviewer: ${esc(p.reviewer||'Not specified')} · Approver: ${esc(p.approver||'Not specified')} · Updated: ${safeDate(p.updated)}</p><div class="toolbar"><button class="btn ghost" data-action="export">Export backup</button><button class="btn ghost" data-action="delete" data-id="${esc(p.id)}">Delete</button></div></div><div class="panel"><h3>Document control</h3><p class="muted">Revision ${revLabel(p.revision)} · ${esc(p.changeNote||'No change note')}</p><p class="small">Current revision: ${revLabel(p.revision)} · ${p.status==='Approved'?'Approved by '+esc(p.approvedBy||p.approver||'Not recorded')+(p.approvedAt?' on '+safeDate(p.approvedAt):''):'Not currently approved'}</p><h4>Previous revisions (${(p.revisionHistory||[]).length})</h4>${(p.revisionHistory||[]).map((r,i)=>`<div class="item"><strong>Revision ${revLabel(r.revision)} · ${esc(r.archiveState||r.status||'Draft')}${r.archiveState?' (was '+esc(r.status||'Approved')+')':''}</strong><div class="crumb">${safeDate(r.updated||r.created)} · ${esc(r.changeNote||'No change note')}</div><div class="small">Author: ${esc(r.owner||'Not recorded')} · Reviewer: ${esc(r.reviewer||'Not recorded')} · Approver: ${esc(r.approver||'Not recorded')}</div><button class="btn secondary" data-action="view-revision" data-id="${esc(p.id)}" data-index="${i}">View this revision</button></div>`).join('')||'<p class="small">No previous revisions yet.</p>'}</div>`}
function preview(){
 const base=data.find(x=>x.id===currentId);
 if(!base)return empty('Procedure not found.');
 const archived=currentRevisionIndex!==null;
 const p=archived?(base.revisionHistory||[])[currentRevisionIndex]:base;
 if(!p)return empty('Revision not found.');
 const nonempty=(x)=>typeof x==='string'&&x.trim();
 const paragraph=(label,value)=>nonempty(value)?`<p class="docrow"><strong>${esc(label)}:</strong> <span class="docvalue">${esc(value)}</span></p>`:'';
 const chosen=(label,values)=>values?.length?paragraph(label,values.join(', ')):'';
 const docType=p.templateType===TEMPLATES[1]?'SWP':p.templateType===TEMPLATES[0]?'SOP':'LEGACY';
 const documentNumber=p.documentNumber||p.id.toUpperCase();
 const riskEntries=Array.isArray(p.riskEntries)?p.riskEntries:[];
 const riskContent=docType==='SWP'?
   p.riskAssessmentMode==='new'?`<div class="docrisktitle">Task-specific risk assessment (requires competent review)</div>${riskEntries.length?riskEntries.map((r,i)=>`<div class="docrisk"><h3>Risk ${i+1}: ${esc(r.hazard||'Not recorded')}</h3>${paragraph('Possible harm',r.harm)}${paragraph('People exposed',r.people)}${paragraph('Required controls',r.controls)}${paragraph('Further actions',r.actions)}</div>`).join(''):'<p class="warning">No assessment entries recorded; review required.</p>'}`:
   p.riskAssessmentMode==='existing'?paragraph('Approved risk assessment reference',p.riskAssessmentRef)+paragraph('Key required controls',p.riskControls):'<div class="warning">Risk assessment method has not been recorded for this legacy SWP. Review required before use.</div>':
   paragraph('Applicable approved risk assessment',p.riskAssessmentRef);
 const isolation=p.isolationMode==='not-required'?`<div class="docnotice"><strong>Isolation not required for this task</strong>${nonempty(p.isolationReason)?'<p>'+esc(p.isolationReason)+'</p>':''}</div>`:
   p.isolationMode==='required'?`<div class="docnotice"><strong>Isolation required</strong><p>${esc(p.isolation||'Approved reference not specified')}</p></div>`:
   p.isolationMode==='other'?`<div class="docnotice"><strong>Other approved safe-state arrangement</strong><p>${esc(p.isolation||'Reference not specified')}</p></div>`:
   `<div class="warning">Isolation / safe-state classification not recorded (older document). Confirm before use.</div>`;
 const steps=(p.steps||[]).map((st,i)=>`<section class="docstep"><div class="docstepheader"><span class="docstepnumber">${String(i+1).padStart(2,'0')}</span><div><span class="docstepcaption">STEP ${i+1}${st.type?' · '+esc(st.type):''}</span><div class="docstepaction">${esc(st.action||'Instruction missing')}</div></div></div>${st.photo&&photosafe(st.photo)?`<img src="${esc(st.photo)}" alt="Equipment reference for step ${i+1}" class="docphoto">`:''}${paragraph('Expected result',st.expected)}${paragraph('Verification',st.verify)}${st.verifyMethod?paragraph('Method',st.verifyMethod):''}${st.warning?`<div class="docwarning"><strong>Caution:</strong> ${esc(st.warning)}</div>`:''}</section>`).join('');
 return `${archived?'<div class="warning"><strong>ARCHIVED REVISION — FOR REFERENCE ONLY.</strong> Not the current controlled document.</div>':''}<div class="toolbar no-print"><button class="btn secondary" data-action="open" data-id="${esc(base.id)}">← Document details</button><button class="btn green" onclick="window.print()">Print / Save PDF</button></div>
 <article class="panel preview docpreview"><div class="docmasthead"><div><div class="docbrand">LINEGUIDE</div><div class="docsubbrand">ENGINEERING PROCEDURES</div></div><div class="doctypelabel">${esc(docType)} · ${archived?'ARCHIVED':esc(p.status||'Draft')}</div></div>
 <h1>${esc(p.title)}</h1><div class="docmetagrid"><div><small>DOCUMENT</small><strong>${esc(documentNumber)}</strong></div><div><small>REVISION</small><strong>${revLabel(p.revision)}</strong></div><div><small>SITE</small><strong>${esc(p.site||'—')}</strong></div><div><small>LINE / ASSET</small><strong>${esc([p.line,p.asset].filter(Boolean).join(' · ')||'—')}</strong></div></div>
 ${p.status!=='Approved'||archived?`<div class="docwarning"><strong>${archived?'HISTORICAL DOCUMENT — REFERENCE ONLY':'DRAFT / UNAPPROVED — NOT FOR OPERATIONAL USE'}</strong></div>`:''}
 <section class="docsection"><h2>1. Purpose and scope</h2><p class="docvalue">${esc(p.purpose||'Purpose not recorded')}</p>${paragraph('Intended audience',p.audience)}</section>
 <section class="docsection"><h2>2. Preparation</h2>${chosen('Prerequisite categories',p.prerequisiteTypes)}${paragraph('Competence / prerequisites',p.prerequisites)}${paragraph('Tools / materials',p.tools)}${chosen('PPE',p.ppeItems)}${paragraph('Other PPE / work-area controls',p.ppe)}${paragraph('Guards / protective devices',p.guards)}</section>
 <section class="docsection"><h2>3. Safety and risk assessment</h2>${chosen('Relevant hazards',p.hazards)}${riskContent}${isolation}</section>
 <section class="docsection"><h2>4. Working instructions</h2>${steps||'<p class="warning">No instruction steps recorded.</p>'}</section>
 <section class="docsection"><h2>5. Completion and verification</h2><p class="docvalue">${esc(p.finalChecks||'Completion criteria not recorded')}</p></section>
 ${nonempty(p.notes)?`<section class="docsection"><h2>6. References</h2><p class="docvalue">${esc(p.notes)}</p></section>`:''}
 <section class="docsection doccontrol"><h2>Document control</h2><div class="doccontrolgrid">${[['Author',p.owner],['Reviewer',p.reviewer],['Approver',p.approver],['Revision',revLabel(p.revision)],['Last updated',safeDate(p.updated)],['Change summary',p.changeNote]].filter(([,v])=>nonempty(v)).map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('')}</div>${p.status==='Approved'?`<p class="small">Approval recorded: ${esc(p.approvedBy||p.approver||'Not recorded')}${p.approvedAt?' · '+safeDate(p.approvedAt):''}. Prototype names are not authenticated signatures.</p>`:''}</section>
 <div class="docend">LineGuide · ${esc(documentNumber)} · Rev ${revLabel(p.revision)} · ${esc(p.status||'Draft')}</div></article>`;
}
function exportData(){
 const blob=new Blob([JSON.stringify({app:'LineGuide',version:1,exported:new Date().toISOString(),documentSequence:Number(localStorage.getItem(SEQUENCE_KEY))||0,procedures:data},null,2)],{type:'application/json'});
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
     const next=[...map.values()];if(persist(next)){const maxImported=Math.max(0,Number(obj.documentSequence)||0,...next.map(p=>Number((p.documentNumber||'').match(/^LG-(?:SOP|SWP)-(\d+)$/)?.[1]||0)));try{localStorage.setItem(SEQUENCE_KEY,String(Math.max(Number(localStorage.getItem(SEQUENCE_KEY))||0,maxImported)))}catch{}nav('library')}
   }catch(e){alert('Import cancelled: '+(e.message||'Invalid backup')+'. Your saved library is unchanged.')}
 };
 input.click();
}
function act(a,pid,idx){
 if(a==='new'){if(!leaveBuilder())return;if(storedDraft()&&!confirm('An unfinished procedure is saved on this device. Discard it and start a new procedure?'))return;discardWorkingDraft();startBuilder();return}
 if(a==='resume-draft'){resumeWorkingDraft();return}
 if(a==='discard-draft'){if(confirm('Discard the unfinished procedure? Your saved library is unaffected.')){discardWorkingDraft();nav('home')}return}
 if(a==='library'){if(leaveBuilder())nav('library');return}
 if(a==='open'){if(!leaveBuilder())return;currentId=pid;currentRevisionIndex=null;nav('detail');return}
 if(a==='edit'){if(!leaveBuilder())return;if(storedDraft()&&!confirm('Discard your unfinished procedure and edit this document?'))return;discardWorkingDraft();let p=data.find(x=>x.id===pid);if(p)startBuilder(p);return}
 if(a==='add-risk'){captureSteps();captureForm();riskDrafts.push({hazard:'',harm:'',people:'',controls:'',actions:''});builderDirty=true;render();queueDraftSave();return}
 if(a==='remove-risk'){captureSteps();captureForm();riskDrafts.splice(Number(idx),1);builderDirty=true;render();queueDraftSave();return}
 if(a==='add-step'){captureSteps();captureForm();stepDrafts.push({action:'',expected:'',verify:'',warning:'',photo:''});builderDirty=true;render();queueDraftSave();return}
 if(a==='remove-step'){captureSteps();captureForm();stepDrafts.splice(Number(idx),1);builderDirty=true;render();queueDraftSave();return}
 if(a==='remove-photo'){captureSteps();captureForm();if(stepDrafts[Number(idx)])stepDrafts[Number(idx)].photo='';builderDirty=true;render();return}
 if(a==='preview'){currentId=pid;currentRevisionIndex=null;nav('preview');return}
 if(a==='view-revision'){currentId=pid;currentRevisionIndex=Number(idx);nav('preview');return}
 if(a==='delete'){
   let p=data.find(x=>x.id===pid);
   if(p&&confirm(`Permanently delete "${p.title}" (revision ${p.revision||1}) and ALL its saved revision history from this device? This cannot be undone. Export a backup first if needed.`)){
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
 let arr=data.filter(p=>searchableText(p).includes(searchTerm.trim().toLowerCase()));
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

window.addEventListener('beforeunload',e=>{if(page==='builder'&&builderDirty){saveWorkingDraft();if(draftSaveFailed){e.preventDefault();e.returnValue=''}}});