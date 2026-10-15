from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
html=(root/'index.html').read_text().replace('<script src="app.js"></script>','')
source=(root/'app.js').read_text()
seed=[dict(id='s1l1',title='S1 L1 example',site='Site A',line='Line 1',asset='Asset Alpha',steps=[],status='Draft',revision=1),dict(id='s1l2',title='S1 L2 example',site='Site A',line='Line 2',asset='Asset Beta',steps=[],status='Draft',revision=1),dict(id='s2l1',title='S2 L1 example',site='Site B',line='Line 1',asset='Asset Gamma',steps=[],status='Draft',revision=1)]
with sync_playwright() as play:
 browser=play.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':390,'height':740},is_mobile=True,has_touch=True,accept_downloads=True)
 pg=ctx.new_page();pg.set_default_timeout(6000)
 errors=[]; dialogs=[]
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
 pg.set_content(html)
 pg.evaluate('''(seed) => {let d={'lineguide-procedures-v1':JSON.stringify(seed)};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(d,k)?d[k]:null,setItem:(k,v)=>{d[k]=v},removeItem:k=>delete d[k]}})}''',seed)
 pg.add_script_tag(content=source)
 pg.locator('[data-page=builder]').click()
 assert pg.locator('[data-choice=line]').is_disabled()
 assert pg.locator('[data-choice=asset]').is_disabled()
 pg.locator('[name=title]').fill('Test line startup')
 pg.locator('[data-choice=site]').select_option('Site A')
 assert pg.locator('[data-choice=line]').is_enabled()
 assert 'Line 1' in pg.locator('[data-choice=line] option').all_text_contents()
 assert 'Line 2' in pg.locator('[data-choice=line] option').all_text_contents()
 pg.locator('[data-choice=line]').select_option('Line 1')
 assert pg.locator('[data-choice=asset]').is_enabled()
 assert 'Asset Alpha' in pg.locator('[data-choice=asset] option').all_text_contents()
 assert 'Asset Beta' not in pg.locator('[data-choice=asset] option').all_text_contents()
 assert 'Asset Gamma' not in pg.locator('[data-choice=asset] option').all_text_contents()
 pg.locator('[data-choice=asset]').select_option('Asset Alpha')
 pg.locator('[data-choice=site]').select_option('Site B')
 assert pg.locator('[data-choice=line]').input_value()==''
 assert pg.locator('[data-choice=asset]').is_disabled()
 assert pg.locator('[data-choice=asset]').input_value()==''
 pg.locator('[data-choice=line]').select_option('Line 1')
 assert 'Asset Gamma' in pg.locator('[data-choice=asset] option').all_text_contents()
 assert 'Asset Alpha' not in pg.locator('[data-choice=asset] option').all_text_contents()
 # Site A custom / line custom flow: the next field enables while typing.
 pg.locator('[data-choice=site]').select_option('__custom__')
 assert pg.locator('[data-choice=line]').is_disabled()
 pg.locator('input[name=site]').fill('Site C')
 assert pg.locator('[data-choice=line]').is_enabled()
 assert 'Line 1' not in pg.locator('[data-choice=line] option').all_text_contents()
 pg.locator('[data-choice=line]').select_option('__custom__')
 pg.locator('input[name=line]').fill('Packing Z')
 assert pg.locator('[data-choice=asset]').is_enabled()
 pg.locator('[data-choice=asset]').select_option('__custom__');pg.locator('input[name=asset]').fill('Conveyor ZX')
 pg.locator('[name=purpose]').fill('Approved line startup operation instruction')
 # Navigate from bottom, then back, scroll resets to zero both times.
 pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
 assert pg.evaluate('window.scrollY')>50
 pg.locator('#nextBtn').click()
 pg.wait_for_timeout(70)
 assert pg.locator('[data-stage="2"]').is_visible()
 assert pg.evaluate('window.scrollY')==0,pg.evaluate('window.scrollY')
 assert pg.locator('[data-isolation-mode]').input_value()==''
 assert pg.locator('textarea[name=isolation]').is_hidden()
 pg.locator('[name=prerequisites]').fill('Site-approved operators only')
 # Selecting not required must not require an isolation reference.
 pg.locator('[data-isolation-mode]').select_option('not-required')
 assert pg.locator('textarea[name=isolation]').is_hidden()
 assert not pg.locator('textarea[name=isolation]').evaluate('(e)=>e.required')
 pg.locator('[name=isolationReason]').fill('Routine operation under approved start-up controls SOP-123')
 pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
 assert pg.evaluate('window.scrollY')>50
 pg.locator('#backBtn').click();pg.wait_for_timeout(70)
 assert pg.evaluate('window.scrollY')==0
 assert pg.locator('[name=site]').input_value()=='Site C'
 assert pg.locator('[name=line]').input_value()=='Packing Z'
 assert pg.locator('[name=asset]').input_value()=='Conveyor ZX'
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-isolation-mode]').input_value()=='not-required'
 assert pg.locator('[name=isolationReason]').input_value().startswith('Routine operation')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('Verify guards and approved pre-start checks')
 pg.locator('[data-step=expected]').fill('Line ready for normal startup')
 pg.locator('[name=finalChecks]').fill('Approved startup checklist completed')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('[name=owner]').fill('Engineer Demo')
 pg.locator('#nextBtn').click()
 saved=json.loads(pg.evaluate("localStorage.getItem('lineguide-procedures-v1')"))
 new=next(x for x in saved if x['title']=='Test line startup')
 assert new['isolationMode']=='not-required'
 assert new['isolation']==''
 assert new['isolationReason']=='Routine operation under approved start-up controls SOP-123'
 assert new['site']=='Site C' and new['line']=='Packing Z' and new['asset']=='Conveyor ZX'
 assert 'Isolation: Not required' in pg.locator('.preview').inner_text()
 assert 'SOP-123' in pg.locator('.preview').inner_text()
 print('PASS: location-dependent dropdowns, custom values, reset on change, stage top, non-isolation export')
 # New procedure with isolation required must have a specific reference.
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Maintenance task')
 pg.locator('[data-choice=site]').select_option('Site C')
 pg.locator('[data-choice=line]').select_option('Packing Z')
 pg.locator('[data-choice=asset]').select_option('Conveyor ZX')
 pg.locator('[name=purpose]').fill('Test with isolation')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Competent personnel')
 pg.locator('[data-isolation-mode]').select_option('required')
 assert pg.locator('[name=isolation]').is_visible()
 assert pg.locator('[name=isolation]').evaluate('(e)=>e.required')
 pg.locator('#nextBtn').click()
 assert any('Approved isolation' in s for s in dialogs),dialogs
 assert pg.locator('[data-stage="2"]').is_visible()
 pg.locator('[name=isolation]').fill('Approved LOTO procedure SOP-124')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="3"]').is_visible()
 print('PASS: required isolation conditional validation')
 # Switching to no isolation should clear stale text only upon save, while allowing return.
 pg.locator('#backBtn').click()
 pg.locator('[data-isolation-mode]').select_option('not-required')
 assert pg.locator('[name=isolation]').is_hidden()
 assert not pg.locator('[name=isolation]').evaluate('(e)=>e.required')
 pg.locator('[data-isolation-mode]').select_option('required')
 assert pg.locator('[name=isolation]').input_value()=='Approved LOTO procedure SOP-124'
 print('PASS: toggling applicability preserves draft until save')
 assert errors==[],errors
 print('PASS: no JavaScript runtime errors')
 browser.close()
# A prior LineGuide v2.3 procedure still opens, shows its old reference, and can be revised.
with sync_playwright() as play:
 browser=play.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 pg=browser.new_page(viewport={'width':390,'height':740})
 errors=[];pg.on('pageerror',lambda e: errors.append(str(e)))
 pg.set_content(html)
 old=dict(id='legacy-one',title='Legacy machine work',site='Site A',line='Line 1',asset='Asset Alpha',steps=[dict(action='Inspect',expected='Pass')],isolation='Approved machine LOTO procedure',prerequisites='Trained personnel',purpose='Inspection',finalChecks='Recorded',status='Draft',revision=3)
 pg.evaluate('''(seed)=>{let d={'lineguide-procedures-v1':JSON.stringify([seed])};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d[k]??null,setItem:(k,v)=>d[k]=v}})}''',old)
 pg.add_script_tag(content=source)
 pg.locator('[data-action=open]').first.click()
 pg.locator('[data-action=preview]').click()
 assert 'Legacy procedure: isolation classification not recorded' in pg.locator('.preview').inner_text()
 assert 'Approved machine LOTO procedure' in pg.locator('.preview').inner_text()
 pg.locator('[data-action=open]').click()
 pg.locator('[data-action=edit]').click()
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-isolation-mode]').input_value()=='required'
 assert pg.locator('[name=isolation]').input_value()=='Approved machine LOTO procedure'
 assert not errors,errors
 print('PASS: legacy v2.3 records preserve existing isolation reference without claiming a recorded classification')
 browser.close()