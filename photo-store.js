/* LineGuide immutable shared-image store.
 * IndexedDB contains one copy of each SHA-256-addressed image.
 * Procedure metadata and revisions contain lightweight idb:sha256 references.
 * No networking, cloud storage or modification of earlier image content.
 */
(function(){
'use strict';
const DB='lineguide-shared-photos-v1', STORE='images';
const REF=/^idb:sha256:[0-9a-f]{64}$/;
const cache=new Map();
let opening=null;
const isRef=value=>typeof value==='string'&&REF.test(value);
const isInline=value=>typeof value==='string'&&/^data:image\/(?:jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);

function remember(ref,uri){
 if(cache.has(ref))cache.delete(ref);
 cache.set(ref,uri);
 while(cache.size>25)cache.delete(cache.keys().next().value);
}
function open(){
 if(opening)return opening;
 opening=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('This browser does not support IndexedDB photo storage.'));return}
  let request;
  try{request=indexedDB.open(DB,1)}catch(e){reject(e);return}
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onerror=()=>reject(request.error||new Error('Could not open photo storage.'));
  request.onblocked=()=>reject(new Error('Photo storage is blocked by another browser tab.'));
  request.onsuccess=()=>resolve(request.result);
 }).catch(e=>{opening=null;throw e});
 return opening;
}
async function digest(uri){
 if(!window.crypto?.subtle)throw new Error('Secure browser cryptography is required to store images reliably.');
 const bytes=new TextEncoder().encode(uri);
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return 'idb:sha256:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function get(ref){
 if(!isRef(ref))throw new Error('Invalid stored photograph reference.');
 const existing=cache.get(ref);
 if(existing){remember(ref,existing);return existing}
 const db=await open();
 const value=await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(ref);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error('Could not read the photograph.'));
  tx.onabort=()=>reject(tx.error||new Error('Photo read aborted.'));
 });
 if(!value||typeof value!=='string')throw new Error('A referenced photograph is missing from this device. Restore it from a complete LineGuide backup.');
 remember(ref,value);
 return value;
}
async function put(uri,expectedRef=null){
 if(!isInline(uri))throw new Error('Photograph data is not a recognised embedded image.');
 if(typeof window.photoDataValid==='function'&&!window.photoDataValid(uri))throw new Error('The photograph cannot be validated.');
 const ref=await digest(uri);
 if(expectedRef&&ref!==expectedRef)throw new Error('Backup photograph checksum mismatch: import cancelled.');
 const db=await open();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(uri,ref);
  tx.oncomplete=resolve;
  tx.onabort=()=>reject(tx.error||new Error('Could not store the photograph.'));
  tx.onerror=()=>reject(tx.error||new Error('Photograph storage failed.'));
 });
 remember(ref,uri);
 return ref;
}
function walk(doc,visit){
 if(!doc||typeof doc!=='object')return;
 if(Array.isArray(doc.steps))for(const step of doc.steps)visit(step);
 if(Array.isArray(doc.revisionHistory))for(const previous of doc.revisionHistory)walk(previous,visit);
}
function copy(value){return JSON.parse(JSON.stringify(value))}
function references(docs){
 const refs=new Set();
 for(const doc of docs)walk(doc,step=>{if(isRef(step.photo))refs.add(step.photo)});
 return refs;
}
async function convertProcedures(docs){
 const next=copy(docs);
 for(const doc of next){
  const steps=[];
  walk(doc,step=>steps.push(step));
  for(const step of steps){
   if(!step.photo)continue;
   if(isRef(step.photo))continue;
   if(!isInline(step.photo))throw new Error('A procedure contains damaged photograph data. Migration has not changed your saved library.');
   step.photo=await put(step.photo);
  }
 }
 return next;
}
function hasInline(docs){
 for(const doc of docs){
  let found=false;
  walk(doc,step=>{if(isInline(step.photo))found=true});
  if(found)return true;
 }
 return false;
}
async function preload(doc){
 const all=[];
 walk(doc,step=>{if(isRef(step.photo))all.push(step.photo)});
 for(const ref of new Set(all))await get(ref);
}
function materializeCached(doc){
 const result=copy(doc),missing=[];
 walk(result,step=>{
  if(!isRef(step.photo))return;
  const uri=cache.get(step.photo);
  if(!uri)missing.push(step.photo);
  else step.photo=uri;
 });
 if(missing.length)throw new Error('Photographs are still loading or missing from local storage. Open this procedure online or restore a complete backup.');
 return result;
}
async function backup(docs){
 // Metadata stays compact; photos occur once even when referenced in many revisions.
 const portable=await convertProcedures(docs),images={};
 for(const ref of references(portable))images[ref]=await get(ref);
 return {procedures:portable,images};
}
async function prepareImport(records,version,images){
 const incoming=copy(records);
 const refs=references(incoming);
 if(version===1&&refs.size)throw new Error('Legacy backups must embed photographs, not refer to images on another device.');
 if(version===2){
  if(!images||typeof images!=='object'||Array.isArray(images))throw new Error('Version 2 backup is missing its image library.');
  for(const ref of refs){
   if(typeof images[ref]!=='string')throw new Error('The backup is missing a photograph used in a procedure.');
  }
  for(const ref of refs)await put(images[ref],ref);
 }
 return convertProcedures(incoming);
}
function attach(root=document){
 const nodes=[...root.querySelectorAll('img[data-photo-ref]')];
 const button=root.querySelector('[data-action="save-pdf"]');
 if(button&&nodes.length){button.disabled=true;button.textContent='Loading photographs…'}
 if(!nodes.length)return Promise.resolve();
 return Promise.all(nodes.map(async node=>{
  const ref=node.dataset.photoRef;
  try{
   const uri=await get(ref);
   if(!node.isConnected||node.dataset.photoRef!==ref)return;
   node.src=uri;
   node.removeAttribute('data-photo-ref');
   await new Promise((resolve,reject)=>{
    if(node.complete&&node.naturalWidth>0){resolve();return}
    node.onload=resolve;node.onerror=()=>reject(new Error('Cannot display photograph.'));
   });
  }catch(err){
   if(!node.isConnected)return;
   const warning=document.createElement('p');
   warning.className='docwarning photo-error';
   warning.textContent='Photograph unavailable: '+(err.message||'restore from backup');
   node.replaceWith(warning);
   throw err;
  }
 })).then(()=>{
  if(button?.isConnected){button.disabled=false;button.textContent='Save / Share PDF'}
 }).catch(err=>{
  if(button?.isConnected){button.disabled=true;button.textContent='PDF unavailable — missing photograph'}
  console.error('LineGuide photo load failed',err);
 });
}
window.LineGuidePhotos={isRef,isInline,open,get,put,preload,attach,copy,walk,references,convertProcedures,hasInline,materializeCached,backup,prepareImport};
})();