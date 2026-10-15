from pathlib import Path
import json,datetime
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
html=(root/'index.html').read_text().replace('<script src="app.js"></script>','')
js=(root/'app.js').read_text()
results=[]
scenarios=[
 dict(title='POC 01 — Routine line start-up',template='Standard operating procedure (SOP)',site='Test Site A',line='Packing 1',asset='Conveyor A',task='Operation / changeover',isolation='not-required',hazards=['Moving parts / entrapment','Noise'],steps=[('Identify equipment and current approved start-up document','Identification verified against the test reference'),('Complete documented pre-start checklist','Checklist outcome recorded')]),
 dict(title='POC 02 — Mechanical maintenance',template='Safe working procedure (SWP)',site='Test Site A',line='Packing 1',asset='Conveyor A',task='Repair / replacement',isolation='required',hazards=['Moving parts / entrapment','Sharp edges / surfaces'],steps=[('Consult the approved machine isolation and maintenance information','Approved controls identified'),('Follow the site-approved maintenance sequence','Specified checks documented')]),
 dict(title='POC 03 — Hot surface inspection',template='Safe working procedure (SWP)',site='Test Site A',line='Packing 2',asset='Test Heat Sealer',task='Inspection',isolation='other',hazards=['Hot surfaces'],steps=[('Identify the manufacturer-specified inspection method','Method and limits confirmed')]),
 dict(title='POC 04 — Routine check with custom hazard',template='Standard operating procedure (SOP)',site='Test Site B',line='Sorting 1',asset='Optical Scanner',task='Inspection',isolation='not-required',hazards=['Electrical','Other: reflected optical emission'],steps=[('Consult the approved equipment inspection checklist','Records checked against the approved criteria')]),
]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
 pg=ctx.new_page();pg.set_default_timeout(8000)
 errors=[]; dialogs=[]
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
 pg.set_content(html)
 pg.evaluate('''() => {const m={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(m,k)?m[k]:null,setItem:(k,v)=>m[k]=v,removeItem:k=>delete m[k]}})}''')
 pg.add_script_tag(content=js)
 # Keep the built-in fictional demo; procedures are tested in isolated mocked browser storage.
 # Danger button has to be accessible without opening the editor.
 for n,s in enumerate(scenarios):
  pg.locator('[data-page=builder]').click()
  select=pg.locator('[name=templateType]'); opts=select.locator('option').all_text_contents()
  assert opts==['Select an option…','Standard operating procedure (SOP)','Safe working procedure (SWP)'],opts
  select.select_option(s['template'])
  pg.locator('[name=title]').fill(s['title'])
  for field,val in [('site',s['site']),('line',s['line']),('asset',s['asset'])]:
   dropdown=pg.locator('[data-choice='+field+']')
   if val in dropdown.locator('option').all_text_contents(): dropdown.select_option(val)
   else: dropdown.select_option('__custom__');pg.locator('input[name='+field+']').fill(val)
  pg.locator('[data-choice=taskType]').select_option(s['task'])
  pg.locator('[name=purpose]').fill('FICTIONAL TEST ONLY — outline for software validation, not machine instructions.')
  pg.locator('#nextBtn').click()
  assert pg.locator('[data-stage="2"]').is_visible()
  pg.locator('[name=prerequisites]').fill('Competent review of site/OEM procedures required before any operational use.')
  hz=pg.locator('[data-multi-wrap=hazards]');hz.locator('summary').click()
  for x in s['hazards']:
   if x.startswith('Other:'):
    hz.locator('[data-multi-other]').check();hz.locator('[data-multi-custom]').fill(x[6:].strip())
   else:hz.locator('input[type=checkbox][name=hazards]').filter(has=pg.locator('not-there')) if False else hz.locator('input[name=hazards]').evaluate_all('(els,val)=>{let e=els.find(x=>x.value===val);if(e){e.click()}}',x)
  assert hz.locator('input[name=hazards]:checked').count()==len([x for x in s['hazards'] if not x.startswith('Other:')])
  pg.locator('[data-isolation-mode]').select_option(s['isolation'])
  if s['isolation']=='not-required':pg.locator('[name=isolationReason]').fill('Only under fictional approved routine operating controls.')
  else:pg.locator('[name=isolation]').fill('REFERENCE PLACEHOLDER — machine-specific approved controls to be supplied.')
  pg.locator('#nextBtn').click()
  assert pg.locator('[data-stage="3"]').is_visible()
  for action,expected in s['steps']:
   pg.locator('[data-action=add-step]').click()
   pg.locator('[data-step=action]').last.fill(action)
   pg.locator('[data-step=expected]').last.fill(expected)
  pg.locator('[name=finalChecks]').fill('FICTIONAL: confirm approved criteria and document completion.')
  pg.locator('#nextBtn').click()
  pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('input[name=owner]').fill('Proof of Concept Tester')
  pg.locator('#nextBtn').click()
  
  if pg.locator('.preview').count()==0:
   print('DEBUG stage',n,pg.locator('#app').inner_text()[-1200:],'DIALOGS',dialogs[-6:]);pg.screenshot(path=str(root/'debug.png'),full_page=True)
  preview=pg.locator('.preview').inner_text()
  assert s['title'] in preview and s['template'] in preview
  for h in s['hazards']:
   assert (h.replace('Other: ','') in preview), (h,preview)
  assert len(pg.locator('.previewstep').all())==len(s['steps'])
  saved=json.loads(pg.evaluate("localStorage.getItem('lineguide-procedures-v1')"))
  record=next(x for x in saved if x['title']==s['title'])
  assert record['isolationMode']==s['isolation']
  results.append({'scenario':s['title'],'template':s['template'],'isolation':s['isolation'],'hazards':record['hazards'],'steps':len(record['steps']),'result':'PASS'})
  if n==1:
   pg.screenshot(path=str(root/'proof_procedure_preview.png'),full_page=True)
 # Revise an SOP, confirm the original snapshot is retained, then keep it for deletion test.
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('POC 01')
 pg.locator('[data-action=edit]').click()
 pg.locator('[name=purpose]').fill('FICTIONAL TEST ONLY — revised draft, approved machine-specific content still required.')
 pg.locator('#nextBtn').click(); pg.locator('#nextBtn').click();pg.locator('#nextBtn').click()
 pg.locator('[name=changeNote]').fill('Test revision: clarification of scope')
 pg.locator('#nextBtn').click()
 saved=json.loads(pg.evaluate("localStorage.getItem('lineguide-procedures-v1')"))
 revised=next(x for x in saved if x['title']==scenarios[0]['title'])
 assert revised['revision']==2 and len(revised.get('revisionHistory',[]))==1
 assert revised['revisionHistory'][0]['revision']==1
 results.append({'scenario':'Edit existing procedure and retain previous revision snapshot','result':'PASS'})
 (root/'POC_TEST_PROCEDURES.json').write_text(json.dumps({'app':'LineGuide','version':1,'exported':datetime.datetime.now(datetime.timezone.utc).isoformat(),'procedures':[p for p in saved if p['title'].startswith('POC ')]},indent=2))
 # Search, delete directly from Library and preserve remaining records.
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('')
 assert pg.locator('[data-action=delete]').count()==5
 pg.locator('#searchInput').fill('POC 02')
 assert pg.locator('[data-action=delete]').count()==1
 pg.locator('[data-action=delete]').click()
 assert dialogs[-1].startswith('Permanently delete')
 after=json.loads(pg.evaluate("localStorage.getItem('lineguide-procedures-v1')"))
 assert len(after)==4 and not any(x['title']==scenarios[1]['title'] for x in after)
 assert pg.locator('[data-action=delete]').count()==0
 results.append({'scenario':'Delete from filtered library without opening builder','result':'PASS'})
 # Check both hazards still independent in checkbox list; legacy consolidated value maps to the two choices.
 pg.locator('[data-page=builder]').click();pg.locator('[name=title]').fill('Legacy option test')
 pg.locator('[data-choice=site]').select_option('Test Site A');pg.locator('[data-choice=line]').select_option('Packing 1');pg.locator('[data-choice=asset]').select_option('Conveyor A');pg.locator('[name=purpose]').fill('Test')
 pg.locator('#nextBtn').click();pg.locator('[data-multi-wrap=hazards] summary').click()
 hz=pg.locator('[data-multi-wrap=hazards]')
 assert hz.locator('input[value="Hot surfaces"]').count()==1
 assert hz.locator('input[value="Sharp edges / surfaces"]').count()==1
 assert hz.locator('input[value="Hot / sharp surfaces"]').count()==0
 results.append({'scenario':'Distinct hot and sharp hazard choices','result':'PASS'})
 assert errors==[],errors
 results.append({'scenario':'No browser JavaScript errors','result':'PASS'})
 pg.locator('[data-page=library]').click() # prompts discard, auto accepted
 pg.screenshot(path=str(root/'proof_library.png'),full_page=True)
 browser.close()
(root/'POC_RESULTS.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))