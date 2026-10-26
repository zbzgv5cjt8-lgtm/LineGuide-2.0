/* LineGuide PDF export — self-contained, offline-capable A4 PDF writer.
 * Text remains selectable/searchable. Photos are embedded from local procedure records.
 * No external service or network requests. */
(function(){
'use strict';
const PW=595.28, PH=841.89, M=43, RIGHT=PW-M, W=PW-2*M, FOOT=PH-39;
const NAVY=[0.095,0.19,0.27], GREY=[0.36,0.44,0.49], GREEN=[0.14,0.39,0.32], ORANGE=[0.57,0.31,0.08], WHITE=[1,1,1];
// Use explicit words for technical symbols that Base-14 PDF fonts cannot encode.
// Never silently replace an unknown engineering symbol with a question mark.
const technicalSymbols={
 'Ω':'Ohm','Ω':'Ohm','Δ':'Delta','μ':'µ','≤':'<=','≥':'>=','≠':'!=','≈':'approximately',
 '→':'->','←':'<-','↔':'<->','∅':'diameter','⌀':'diameter','√':'sqrt',
 '℃':'deg C','℉':'deg F','∞':'infinity','α':'alpha','β':'beta','γ':'gamma',
 '⚠':'WARNING','⚡':'Electrical hazard','✓':'OK','✔':'OK','✖':'X',
 'π':'pi','θ':'theta','σ':'sigma','λ':'lambda','ρ':'rho','τ':'tau','η':'eta',
 'Φ':'Phi','φ':'phi','Σ':'Sigma','∑':'sum','∂':'partial'
};
function pdfText(input){let output='';for(const char of String(input??'')){
 if(Object.prototype.hasOwnProperty.call(technicalSymbols,char)){output+=technicalSymbols[char];continue}
 const cp=char.codePointAt(0);
 if(cp===10||cp===13||cp===9||cp>=32&&cp<=126||cp>=160&&cp<=255||Object.prototype.hasOwnProperty.call(extraWin,cp))output+=char;
 else throw Error(`The character "${char}" is not supported in PDF export. Please replace it with a written word or common unit symbol before exporting.`);
 }return output}
const extraWin={0x20ac:128,0x201a:130,0x0192:131,0x201e:132,0x2026:133,0x2020:134,0x2021:135,0x02c6:136,0x2030:137,0x0160:138,0x2039:139,0x0152:140,0x017d:142,0x2018:145,0x2019:146,0x201c:147,0x201d:148,0x2022:149,0x2013:150,0x2014:151,0x02dc:152,0x2122:153,0x0161:154,0x203a:155,0x0153:156,0x017e:158,0x0178:159};
function encode1252(s){let out='';for(const ch of String(s??'')){const n=ch.codePointAt(0);const b=n>=32&&n<=126||n>=160&&n<=255?n:extraWin[n];if(b===undefined)throw Error('Unsupported PDF character: '+ch);out+=String.fromCharCode(b)}return out}
function bytes(s){const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u}
function escPdf(t){return encode1252(t).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n\t]/g,' ')}
function fmt(v){return Number(v.toFixed(2)).toString()}
function rgb(c){return c.map(fmt).join(' ')}
function jpegInfo(data){
 if(typeof data!=='string')return null;
 // Older backups may contain PNG, WebP or GIF photos. Where the preview image
 // is already decoded, convert that local image to JPEG without a network request.
 if(!/^data:image\/jpeg;base64,/i.test(data)){
   const source=Array.from(document.querySelectorAll('.docpreview img.docphoto')).find(img=>img.getAttribute('src')===data && img.complete && img.naturalWidth>0);
   if(!source)return null;
   const ratio=Math.min(1,1600/Math.max(source.naturalWidth,source.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.round(source.naturalWidth*ratio);canvas.height=Math.round(source.naturalHeight*ratio);
   const ctx=canvas.getContext('2d');if(!ctx)return null;
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
   data=canvas.toDataURL('image/jpeg',0.78);
 }

 const binary=atob(data.slice(data.indexOf(',')+1));if(binary.length<30||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216)return null;
 for(let i=2;i<binary.length-12;){if(binary.charCodeAt(i)!==255){i++;continue}
  const mark=binary.charCodeAt(i+1);i+=2;if(mark===0xd8||mark===0xd9||mark===1)continue;
  if(i+2>binary.length)break;const len=binary.charCodeAt(i)*256+binary.charCodeAt(i+1);
  if(len<2||i+len>binary.length)break;
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(mark)){
    const height=binary.charCodeAt(i+3)*256+binary.charCodeAt(i+4),width=binary.charCodeAt(i+5)*256+binary.charCodeAt(i+6),components=binary.charCodeAt(i+7);
    if(!width||!height||components!==3)return null;
    return {data:bytes(binary),width,height};
  }
  i+=len;
 }return null;
}
function pdfRaw(parts){
 const objects=[null],reserve=()=>{objects.push(null);return objects.length-1},set=(id,b)=>{objects[id]=typeof b==='string'?bytes(b):b},add=b=>{const id=reserve();set(id,b);return id};
 const stream=(content,extra='')=>{const body=typeof content==='string'?bytes(content):content;const header=bytes(`<< /Length ${body.length} ${extra} >>\nstream\n`),tail=bytes('\nendstream');const merged=new Uint8Array(header.length+body.length+tail.length);merged.set(header);merged.set(body,header.length);merged.set(tail,header.length+body.length);return add(merged)};
 return {objects,reserve,set,add,stream,finish(root){const chunks=[bytes('%PDF-1.4\n%\xF3\xF4\xF5\xF6\n')],offsets=[0];let total=chunks[0].length;
  objects.slice(1).forEach((obj,i)=>{if(!obj)throw Error('Unfilled PDF object '+(i+1));offsets.push(total);const beg=bytes(`${i+1} 0 obj\n`),end=bytes('\nendobj\n');chunks.push(beg,obj,end);total+=beg.length+obj.length+end.length});
  const xref=total;let table=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objects.length;i++)table+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  table+=`trailer\n<< /Size ${objects.length} /Root ${root} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const trailer=bytes(table);chunks.push(trailer);total+=trailer.length;const result=new Uint8Array(total);let pos=0;for(const part of chunks){result.set(part,pos);pos+=part.length}return new Blob([result],{type:'application/pdf'});
 }};
}
class Document {
 constructor(p,archived){this.p=p;this.archived=archived;this.file=pdfRaw();this.font=this.file.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');this.bold=this.file.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');this.pages=[];this.page=null;this.y=0;this.ctx=document.createElement('canvas').getContext('2d');if(!this.ctx)throw Error('Canvas unavailable');this.addPage();}
 rect(x,y,w,h,fill,stroke){const b=PH-y-h;let op='';if(fill)op+=rgb(fill)+' rg ';if(stroke)op+=rgb(stroke)+' RG ';op+=`${fmt(x)} ${fmt(b)} ${fmt(w)} ${fmt(h)} re ${fill&&stroke?'B':fill?'f':'S'}\n`;this.page.ops.push(op)}
 line(x1,y1,x2,y2,c=GREY){this.page.ops.push(`${rgb(c)} RG 0.6 w ${fmt(x1)} ${fmt(PH-y1)} m ${fmt(x2)} ${fmt(PH-y2)} l S\n`)}
 t(s,x,top,size=10,bold=false,col=NAVY){if(s===null||s===undefined||s==='')return;this.page.ops.push(`BT /${bold?'F2':'F1'} ${fmt(size)} Tf ${rgb(col)} rg 1 0 0 1 ${fmt(x)} ${fmt(PH-top-size)} Tm (${escPdf(pdfText(s))}) Tj ET\n`)}
 wrap(value,sz,w,bold=false){this.ctx.font=(bold?'bold ':'')+sz+'px Arial';const result=[];const clean=pdfText(value).replace(/\t/g,'    ');for(const paragraph of clean.split(/\r?\n/)){if(!paragraph){result.push('');continue}let row='';const words=paragraph.split(/\s+/).filter(Boolean);for(let word of words){while(word&&this.ctx.measureText(word).width>w){let cut=Math.max(1,Math.floor(word.length*w/this.ctx.measureText(word).width));while(cut>1&&this.ctx.measureText(word.slice(0,cut)).width>w)cut--;const part=word.slice(0,cut);if(row){result.push(row);row=''}result.push(part);word=word.slice(cut)}if(!word)continue;const candidate=row?row+' '+word:word;if(this.ctx.measureText(candidate).width>w){if(row)result.push(row);row=word}else row=candidate}result.push(row)}return result}
 addPage(){const p={ops:[],images:[]};this.pages.push(p);this.page=p;this.y=60;
  this.t('LINEGUIDE',M,22,14,true,NAVY);this.t('ENGINEERING PROCEDURES',M+120,26,8,false,GREY);
  const ref=(this.p.documentNumber||this.p.id||'').toUpperCase();const short=(this.p.templateType||'').includes('SWP')?'SWP':'SOP';
  this.t(`${short}  |  ${ref}  |  Rev ${this.p.revision||'1.0'}`,PW-240,26,8,false,NAVY);this.line(M,46,RIGHT,46,NAVY);
 }
 ensure(h){if(this.y+h>PH-57)this.addPage()}
 gap(n=8){this.y+=n}
 text(value,{size=10,bold=false,color=NAVY,x=M,width=W,leading=size*1.4,indent=0}={}){const lines=this.wrap(value,size,width-indent,bold);for(const s of lines){this.ensure(leading+2);this.t(s,x+indent,this.y,size,bold,color);this.y+=leading}return lines.length}
 heading(s){this.ensure(41);this.gap(7);this.text(s,{size:12,bold:true,leading:15});this.gap(2);this.line(M,this.y,RIGHT,this.y,[0.8,0.85,0.88]);this.gap(6)}
 field(label,value){if(value===undefined||value===null||String(value).trim()==='')return;this.ensure(32);this.text(label.toUpperCase(),{size:8,bold:true,color:GREY,leading:11});this.text(String(value),{size:10,leading:14});this.gap(3)}
 note(text,kind='neutral'){if(!text)return;const lines=this.wrap(text,9,W-24);const lh=13;this.ensure(lines.length*lh+17);const h=lines.length*lh+15;this.rect(M,this.y,W,h,kind==='warning'?[1,.94,.87]:[.94,.97,.97]);this.rect(M,this.y,3,h,kind==='warning'?ORANGE:GREEN);this.y+=7;for(const line of lines){this.t(line,M+12,this.y,9,false,kind==='warning'?ORANGE:NAVY);this.y+=lh}this.y+=8}
 photo(uri){const jpeg=jpegInfo(uri);if(!jpeg){this.note('Photo could not be embedded in this PDF. Open the saved procedure to view the original.','warning');return}const maxH=235,maxW=W-12;const s=Math.min(maxW/jpeg.width,maxH/jpeg.height,1);let w=jpeg.width*s,h=jpeg.height*s;this.ensure(h+12);const name='Im'+(this.page.images.length+1),x=M+(W-w)/2;this.page.images.push({name,jpeg});this.page.ops.push(`q ${fmt(w)} 0 0 ${fmt(h)} ${fmt(x)} ${fmt(PH-this.y-h)} cm /${name} Do Q\n`);this.y+=h+12}
 metaRow(k1,v1,k2,v2){const half=(W-12)/2;this.ensure(43);this.rect(M,this.y,half,40,[.95,.97,.98]);this.rect(M+half+12,this.y,half,40,[.95,.97,.98]);this.t(k1.toUpperCase(),M+9,this.y+6,7.5,true,GREY);this.t(k2.toUpperCase(),M+half+21,this.y+6,7.5,true,GREY);const line=(value,x)=>{const wrap=this.wrap(value||'-',9,half-18,true);wrap.slice(0,2).forEach((t,i)=>this.t(t,x,this.y+19+i*12,9,true,NAVY))};line(v1,M+9);line(v2,M+half+21);this.y+=44}
 finish(){const pagesId=this.file.reserve();const pageIds=[];
  for(let i=0;i<this.pages.length;i++){const page=this.pages[i];this.page=page;
   this.line(M,PH-49,RIGHT,PH-49,[.75,.8,.83]);this.t(`${this.p.documentNumber||this.p.id}  |  Revision ${this.p.revision||'1.0'}  |  ${this.archived?'ARCHIVED':this.p.status||'Draft'}`,M,PH-44,8,false,GREY);
   this.t(`Page ${i+1} of ${this.pages.length}`,RIGHT-65,PH-44,8,false,GREY);
   let xobjects='';for(const im of page.images){const {jpeg,name}=im;const obj=this.file.stream(jpeg.data,`/Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`);xobjects+=`/${name} ${obj} 0 R `}
   const contents=this.file.stream(page.ops.join(''));
   pageIds.push(this.file.add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${fmt(PW)} ${fmt(PH)}] /Resources << /Font << /F1 ${this.font} 0 R /F2 ${this.bold} 0 R >> /XObject << ${xobjects}>> >> /Contents ${contents} 0 R >>`));
  }
  this.file.set(pagesId,`<< /Type /Pages /Kids [${pageIds.map(i=>i+' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
  const root=this.file.add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);return this.file.finish(root);
 }
}
function makePdf(p,archived=false){
 const d=new Document(p,archived);const swp=(p.templateType||'').includes('(SWP)');
 d.text(p.title||'Untitled procedure',{size:19,bold:true,leading:25});d.gap(12);
 d.metaRow('Document reference',p.documentNumber||p.id,'Revision',String(p.revision||'1.0'));
 d.metaRow('Site',p.site||'Not specified','Line / asset',[p.line,p.asset].filter(Boolean).join(' / ')||'Not specified');
 d.note(archived?'ARCHIVED REVISION — REFERENCE ONLY. Not the current controlled document.':p.status==='Approved'?'APPROVED RECORD — check that this is the current applicable revision.':'DRAFT / UNAPPROVED — NOT FOR OPERATIONAL USE.',p.status==='Approved'&&!archived?'neutral':'warning');
 d.heading('1. Purpose and scope');d.text(p.purpose||'Purpose not recorded');d.gap(7);d.field('Intended audience',p.audience);
 d.heading('2. Preparation');
 const fields=[['Prerequisite categories',(p.prerequisiteTypes||[]).join(', ')],['Competence / prerequisites',p.prerequisites],['Tools / materials',p.tools],['PPE',(p.ppeItems||[]).join(', ')],['Other PPE / work-area controls',p.ppe],['Guards / protective devices',p.guards]];
 for(const [k,v] of fields)d.field(k,v);
 d.heading('3. Safety and risk assessment');d.field('Relevant hazards',(p.hazards||[]).join(', '));
 if(swp){if(p.riskAssessmentMode==='new'){
  d.text('Task-specific risk assessment (requires competent review)',{size:10,bold:true});d.gap(8);
  if(!(p.riskEntries||[]).length)d.note('No assessment entries recorded; competent review required.','warning');
  for(const [i,r] of (p.riskEntries||[]).entries()){d.field('Risk '+(i+1)+': '+(r.hazard||'Unspecified hazard'),r.harm);d.field('People exposed',r.people);d.field('Required controls',r.controls);d.field('Further actions',r.actions)}
 }else if(p.riskAssessmentMode==='existing'){d.field('Approved risk assessment reference',p.riskAssessmentRef);d.field('Key required controls',p.riskControls)}
 else d.note('Risk assessment method not recorded for this legacy SWP. Review before use.','warning');
 }else d.field('Applicable approved risk assessment',p.riskAssessmentRef);
 if(p.isolationMode==='not-required')d.note('Isolation not required for this task. '+(p.isolationReason||''));
 else if(p.isolationMode==='required')d.note('Isolation required. '+(p.isolation||'Approved reference not specified.'),'warning');
 else if(p.isolationMode==='other')d.note('Other approved safe-state arrangement. '+(p.isolation||'Reference not specified.'),'warning');
 else d.note('Isolation / safe-state classification not recorded. Confirm before use.','warning');
 d.ensure(160);d.heading('4. Working instructions');
 const steps=p.steps||[];if(!steps.length)d.note('No instruction steps recorded.','warning');
 for(const [i,s] of steps.entries()){
  // Reserve space for the step title and the first image, where possible, to avoid orphan headings.
  const image=s.photo?jpegInfo(s.photo):null;
  const visualHeight=image?Math.min((W-12)/image.width,235/image.height,1)*image.height:0;
  const newActivity=!!s.section&&(i===0||s.section!==steps[i-1].section);
  d.ensure(Math.min(360,110+visualHeight+(newActivity?29:0)));
  if(newActivity){d.gap(6);d.text(s.section,{size:11.5,bold:true,color:GREEN,leading:16});d.gap(5)}
  d.ensure(45);d.gap(5);d.rect(M,d.y,27,26,NAVY);d.t(String(i+1).padStart(2,'0'),M+6,d.y+6,10,true,WHITE);
  d.t('STEP '+(i+1)+(s.type?'  /  '+s.type:''),M+38,d.y+3,8,true,GREY);d.y+=27;
  d.text(s.action||'Instruction missing',{size:11.5,bold:true,leading:16,x:M+38,width:W-38});d.gap(5);
  if(s.photo){d.photo(s.photo);if(s.photoCaption){d.text(s.photoCaption,{size:8.5,color:GREY,leading:12});d.gap(4)}}
  if(s.sourcePage)d.field('Source document page',s.sourcePage);
  for(const [k,v] of [['Expected result',s.expected],['Verification',s.verify],['Method',s.verifyMethod==='Visual check'?'':s.verifyMethod]])d.field(k,v);
  if(s.warning)d.note('CAUTION: '+s.warning,'warning');
  d.gap(5);d.line(M,d.y,RIGHT,d.y,[.82,.87,.89]);d.gap(7);
 }
 d.heading('5. Completion and verification');d.text(p.finalChecks||'Completion criteria not recorded');
 if(p.notes){d.heading('6. References');d.text(p.notes)}
 d.ensure(90);d.heading('Document control');
 for(const [k,v] of [['Author',p.owner],['Reviewer',p.reviewer],['Approver',p.approver],['Last updated',p.updated?new Date(p.updated).toLocaleDateString('en-GB'):''],['Change summary',p.changeNote]])d.field(k,v);
 if(p.status==='Approved')d.note('Prototype approval only: names are not authenticated signatures.');
 return d.finish();
}
function currentProcedure(){const base=data.find(x=>x.id===currentId);if(!base)return null;return currentRevisionIndex!==null?(base.revisionHistory||[])[currentRevisionIndex]:base}
function filename(p){const slug=(p.documentNumber||p.title||'procedure').replace(/[^a-z0-9-]/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,65);return `LineGuide-${slug}-Rev-${String(p.revision||'1.0').replace(/[^0-9.]/g,'')}.pdf`}
function triggerDownload(file){const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function exportProcedurePdf(preloadedProcedure=null){
 const p=preloadedProcedure||currentProcedure();if(!p){alert('The selected procedure is no longer available.');return}
 try{
  const blob=makePdf(p,currentRevisionIndex!==null),file=new File([blob],filename(p),{type:'application/pdf'});
  // iPhone web-apps can silently ignore window.print(); native sharing lets users Save to Files, Print or send PDF.
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
   navigator.share({files:[file],title:p.title}).catch(err=>{if(err?.name==='AbortError')return;triggerDownload(file)});
  }else{triggerDownload(file)}
 }catch(err){console.error('LineGuide PDF export failed',err);alert('Could not create the PDF: '+(err.message||'Unexpected error')+'. Your saved procedure has not changed.')}
}
function browserPrint(){
 const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
 if(standalone){alert('Printing directly from an iPhone Home Screen app may not work. Use Save / Share PDF instead, then choose Print or Save to Files.');return}
 if(typeof window.print!=='function'){alert('Printing is unavailable in this browser. Use Save / Share PDF.');return}
 window.print();
}
window.LineGuidePdf={makePdf,exportProcedurePdf,browserPrint};
})();