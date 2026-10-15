"""LineGuide browser regression tests. Run: pytest -q tests/test_lineguide_e2e.py"""
import contextlib,functools,http.server,json,os,shutil,threading
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
KEY='lineguide-procedures-v1'
SOP='Standard operating procedure (SOP)'
SWP='Safe working procedure (SWP)'

@pytest.fixture(scope='session')
def server():
 class QuietHandler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 Handler=functools.partial(QuietHandler,directory=str(ROOT))
 srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
 thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start()
 yield f'http://127.0.0.1:{srv.server_port}/'
 srv.shutdown();srv.server_close()

@pytest.fixture(scope='session')
def browser():
 with sync_playwright() as playwright:
  path=shutil.which('chromium') or shutil.which('google-chrome')
  b=playwright.chromium.launch(headless=True,executable_path=path if path else None,args=['--no-sandbox'])
  yield b
  b.close()

@pytest.fixture
def app(browser):
 ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
 page=ctx.new_page();page.set_default_timeout(6000)
 errors=[];dialogs=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('dialog',lambda d: (dialogs.append(d.message),d.accept()))
 html=(ROOT/'index.html').read_text().replace('<script src="app.js"></script>','')
 page.set_content(html)
 page.evaluate("""() => {const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>delete store[k]}})}""")
 page.add_script_tag(content=(ROOT/'app.js').read_text())
 page.add_script_tag(content=(ROOT/'pdf-export.js').read_text())
 yield page,ctx,errors,dialogs
 ctx.close()

def getdata(pg):return json.loads(pg.evaluate(f"localStorage.getItem('{KEY}')"))
def prepare_one(pg,title='Example — startup',swp=False,site='QA Site',line='Line 1',asset='Machine 1'):
 pg.locator('[data-page=builder]').click()
 if swp:pg.locator('[name=templateType]').select_option(SWP)
 pg.locator('[name=title]').fill(title)
 for k,val in [('site',site),('line',line),('asset',asset)]:
  dropdown=pg.locator('[data-choice='+k+']')
  if val in dropdown.locator('option').all_text_contents():dropdown.select_option(val)
  else:dropdown.select_option('__custom__');pg.locator('input[name='+k+']').fill(val)
 pg.locator('[name=purpose]').fill('Fictional QA test scope; no operational use')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Consult approved OEM and site procedures; competent personnel only')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('[name=isolationReason]').fill('Site approved normal operational controls only')
 if swp:
  pg.locator('[data-risk-ref]').fill('Fictional approved RA-TEST-01')
  pg.locator('[name=riskControls]').fill('Apply applicable controls documented in the approved task assessment; this test does not define them')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('Consult the fictional approved equipment instructions')
 pg.locator('[data-step=expected]').fill('Correct reference is available for review')
 pg.locator('[name=finalChecks]').fill('Review completed against approved criteria')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__')
 pg.locator('input[name=owner]').fill('QA Author')
 pg.locator('#nextBtn').click()
 assert pg.locator('.docpreview').is_visible()
 return next(x for x in getdata(pg) if x['title']==title)

@pytest.mark.group1
def test_home_and_mobile_width(app):
 pg,_,errors,_=app
 assert pg.get_by_text('Good procedures.').count()
 assert pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
 assert pg.locator('[data-page]').count()==4
 assert not errors

@pytest.mark.group1
def test_sop_creation_minimal_and_readable_preview(app):
 pg,_,errors,_=app
 p=prepare_one(pg)
 assert p['templateType']==SOP
 assert p['documentNumber']=='LG-SOP-0001'
 assert not p.get('riskAssessmentRef')
 preview=pg.locator('.docpreview').inner_text()
 assert 'Purpose and scope' in preview and 'Completion and verification' in preview
 assert 'No approved reference recorded' not in preview
 assert 'Tools, materials and parts:\nNot specified' not in preview
 assert preview.count('Consult the fictional approved equipment instructions')==1
 assert 'DRAFT / UNAPPROVED' in preview
 assert not errors

@pytest.mark.group1
def test_swp_existing_ra_is_required(app):
 pg,_,errors,dialogs=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=templateType]').select_option(SWP)
 pg.locator('[name=title]').fill('SWP existing RA')
 for k,v in [('site','Site A'),('line','Line A'),('asset','Asset A')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Fictional test')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Approved competence')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="2"]').is_visible()
 assert any('risk assessment reference' in x.lower() for x in dialogs)
 pg.locator('[data-risk-ref]').fill('RA-42 REV 3')
 pg.locator('[name=riskControls]').fill('Task-specific controls must be established by competent reviewer')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="3"]').is_visible()
 assert not errors

@pytest.mark.group1
def test_swp_new_ra_capture_and_print(app):
 pg,_,errors,dialogs=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=templateType]').select_option(SWP)
 pg.locator('[name=title]').fill('SWP with new assessment')
 for k,v in [('site','Site C'),('line','Line C'),('asset','Asset C')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Fictional scope')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Qualified trained personnel')
 pg.locator('[data-isolation-mode]').select_option('required');pg.locator('[name=isolation]').fill('Fictional approved safe-state ref')
 hz=pg.locator('[data-multi-wrap=hazards]');hz.locator('summary').click()
 hz.locator('input[name=hazards][value="Sharp edges / surfaces"]').check()
 pg.locator('[data-risk-mode]').select_option('new')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="2"]').is_visible()
 pg.locator('[data-action=add-risk]').click()
 # Select custom hazard
 pg.locator('[data-choice=riskHazard0]').select_option('__custom__')
 pg.locator('input[name=riskHazard0]').fill('Sharp panel burrs')
 pg.locator('[data-risk=harm]').fill('Cut / laceration')
 pg.locator('[data-risk-people]').select_option('Maintenance engineers')
 pg.locator('[data-risk=controls]').fill('Handle using the approved protected technique; no unsupported PPE assumption')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="3"]').is_visible()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('Review approved protection method')
 pg.locator('[data-step=expected]').fill('Protection method confirmed')
 pg.locator('[name=finalChecks]').fill('Record inspection')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('input[name=owner]').fill('QA Author')
 pg.locator('#nextBtn').click()
 p=next(v for v in getdata(pg) if v['title']=='SWP with new assessment')
 assert p['riskAssessmentMode']=='new' and len(p['riskEntries'])==1
 assert p['riskEntries'][0]['people']=='Maintenance engineers'
 assert 'Sharp panel burrs' in pg.locator('.docpreview').inner_text()
 assert 'approved protected technique' in pg.locator('.docpreview').inner_text()
 pdf=pg.pdf(format='A4',print_background=True)
 assert pdf.startswith(b'%PDF') and len(pdf)>5000
 assert not errors

@pytest.mark.group1
def test_cascading_asset_choices(app):
 pg,_,errors,_=app
 prepare_one(pg,'First procedure',site='Alpha Site',line='Filling',asset='Line asset A')
 pg.locator('[data-page=builder]').click()
 pg.locator('[data-choice=site]').select_option('Alpha Site')
 pg.locator('[data-choice=line]').select_option('Filling')
 assert 'Line asset A' in pg.locator('[data-choice=asset] option').all_text_contents()
 pg.locator('[data-choice=site]').select_option('__custom__');pg.locator('input[name=site]').fill('Beta Site')
 assert 'Line asset A' not in pg.locator('[data-choice=asset] option').all_text_contents()
 assert 'Filling' not in pg.locator('[data-choice=line] option').all_text_contents()
 assert not errors

@pytest.mark.group1
def test_stage_scrolling_and_back_keeps_answers(app):
 pg,_,errors,_=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Back navigation')
 for k,v in [('site','Z'),('line','Y'),('asset','X')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Back and forth')
 pg.evaluate('window.scrollTo(0,500)')
 pg.locator('#nextBtn').click()
 assert pg.evaluate('window.scrollY')<60
 pg.locator('[name=prerequisites]').fill('Important prerequisites')
 pg.locator('#backBtn').click()
 assert pg.locator('[name=title]').input_value()=='Back navigation'
 pg.locator('#nextBtn').click()
 assert pg.locator('[name=prerequisites]').input_value()=='Important prerequisites'
 assert not errors

@pytest.mark.group2
def test_search_instruction_text_and_document_number(app):
 pg,_,errors,_=app
 p=prepare_one(pg,'Searchable SOP')
 pg.locator('[data-page=library]').click()
 for word in ['fictional approved equipment instructions',p['documentNumber']]:
  pg.locator('#searchInput').fill(word)
  assert pg.locator('[data-action=open]').count()==1,word
 assert not errors

@pytest.mark.group2
def test_delete_cancel_then_confirm(app):
 pg,_,errors,dialogs=app
 p=prepare_one(pg,'Delete test')
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('Delete test')
 assert len(getdata(pg))>=2
 pg.locator('[data-action=delete]').click()
 assert all(x['title']!='Delete test' for x in getdata(pg))
 assert any('Permanently delete' in msg for msg in dialogs)
 assert not errors

@pytest.mark.group2
def test_revision_preserves_snapshot(app):
 pg,_,errors,_=app
 p=prepare_one(pg,'Revision test')
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('Revision test')
 pg.locator('[data-action=edit]').click()
 pg.locator('[name=purpose]').fill('Updated for revision QA')
 for _ in range(3):pg.locator('#nextBtn').click()
 pg.locator('[name=changeNote]').fill('Clarified purpose')
 pg.locator('#nextBtn').click()
 p=next(x for x in getdata(pg) if x['title']=='Revision test')
 assert len(p['revisionHistory'])==1 and p['revision']=='1.1'
 assert p['revisionHistory'][0]['revision']=='1.0'
 assert 'Fictional QA test scope' in p['revisionHistory'][0]['purpose']
 assert not errors

@pytest.mark.group2
def test_export_and_backups(app):
 pg,_,errors,_=app
 prepare_one(pg,'Backup SOP')
 pg.locator('[data-page=library]').click()
 with pg.expect_download() as download: pg.locator('[data-action=export]').click()
 backup=json.loads(download.value.path().read_text())
 assert backup['app']=='LineGuide' and len(backup['procedures'])==2
 assert not errors

@pytest.mark.group2
def test_print_a4_pdf_and_readability(app):
 pg,_,errors,_=app
 prepare_one(pg,'A4 printing check')
 data=pg.pdf(format='A4',print_background=True)
 import fitz
 d=fitz.open(stream=data,filetype='pdf')
 words='\n'.join(page.get_text() for page in d)
 for expected in ['A4 printing check','Purpose and scope','Safety and risk assessment','Working instructions','Document control']:
  assert expected in words,expected
 assert 'Create procedure' not in words
 assert len(d)==1  # Short controlled procedures should not spill to a nearly empty extra page
 assert not errors

@pytest.mark.group2
def test_legacy_backup_import_support(app):
 pg,_,errors,_=app
 # Import earlier sample records via FileChooser; previous schema must still be readable
 sample=ROOT/'POC_TEST_PROCEDURES.json'
 if not sample.exists(): pytest.skip('Optional legacy fixtures not present')
 pg.locator('[data-page=library]').click()
 with pg.expect_file_chooser() as f:pg.locator('[data-action=import]').click()
 f.value.set_files(str(sample))
 pg.wait_for_function("() => JSON.parse(localStorage.getItem('lineguide-procedures-v1')||'[]').length >= 4",timeout=7000)
 assert len(getdata(pg))>=4
 assert not errors

@pytest.mark.group3
def test_unsaved_builder_recovered_on_new_session(app):
 pg,ctx,errors,_=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Interrupt recovery test')
 pg.locator('[data-choice=site]').select_option('__custom__')
 pg.locator('input[name=site]').fill('Unfinished site')
 pg.wait_for_timeout(750)
 stored=pg.evaluate("localStorage.getItem('lineguide-wizard-draft-v1')")
 assert 'Interrupt recovery test' in stored
 # Simulate reopening the application in a fresh JS context with saved browser storage.
 second=ctx.new_page()
 second.set_content((ROOT/'index.html').read_text().replace('<script src="app.js"></script>',''))
 second.evaluate('''storage=>{const store={'lineguide-wizard-draft-v1':storage};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]}})}''',stored)
 second.add_script_tag(content=(ROOT/'app.js').read_text())
 assert second.locator('[data-action=resume-draft]').is_visible()
 second.locator('[data-action=resume-draft]').click()
 assert second.locator('[name=title]').input_value()=='Interrupt recovery test'
 assert second.locator('input[name=site]').input_value()=='Unfinished site'
 second.close()
 assert not errors

@pytest.mark.group3
def test_sequence_does_not_repeat_after_deleting_last_record(app):
 pg,_,errors,_=app
 a=prepare_one(pg,'First assigned number')
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('First assigned number')
 pg.locator('[data-action=delete]').click()
 b=prepare_one(pg,'Second assigned number')
 assert a['documentNumber']=='LG-SOP-0001'
 assert b['documentNumber']=='LG-SOP-0002'
 assert not errors

@pytest.mark.group3
def test_custom_options_and_photo_print(app):
 pg,_,errors,_=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Photo and custom option test')
 for k,v in [('site','Plant X'),('line','Line X'),('asset','Sensor X')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[data-choice=taskType]').select_option('__custom__')
 pg.locator('input[name=taskType]').fill('Custom verification')
 pg.locator('[name=purpose]').fill('Fictional photo demonstration')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Site conditions must be verified')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('Review the attached fictional illustration')
 pg.locator('[data-step=expected]').fill('Illustration is legible')
 from PIL import Image
 from io import BytesIO
 image=Image.new('RGB',(100,60),'white');buf=BytesIO();image.save(buf,format='PNG')
 pg.locator('[data-step=photoFile]').set_input_files({'name':'qa_photo.png','mimeType':'image/png','buffer':buf.getvalue()})
 pg.locator('.stepbox img.photo').wait_for(timeout=12000)
 pg.locator('[name=finalChecks]').fill('Review complete')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('input[name=owner]').fill('QA Author')
 pg.locator('#nextBtn').click()
 assert pg.locator('.docpreview img.docphoto').count()==1
 p=next(x for x in getdata(pg) if x['title']=='Photo and custom option test')
 assert p['taskType']=='Custom verification'
 assert p['steps'][0]['photo'].startswith('data:image/jpeg;base64,')
 assert len(pg.pdf(format='A4',print_background=True))>6000
 assert not errors

@pytest.mark.group3
def test_failed_storage_does_not_claim_saved(app):
 pg,_,errors,dialogs=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Failure demonstration')
 for k,v in [('site','A'),('line','B'),('asset','C')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Testing inability to save')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Trained user')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('QA action')
 pg.locator('[data-step=expected]').fill('QA result')
 pg.locator('[name=finalChecks]').fill('QA completion')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('input[name=owner]').fill('QA Author')
 pg.evaluate("""() => {const old=window.localStorage.setItem;window.localStorage.setItem=(k,v)=>{if(k==='lineguide-procedures-v1')throw new Error('QuotaExceededError');return old.call(window.localStorage,k,v)}}""")
 before=getdata(pg)
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="4"]').is_visible()
 assert getdata(pg)==before
 assert any('Unable to save' in x for x in dialogs)
 assert not errors

@pytest.mark.group3
def test_long_instructions_and_pdf_page_bounds(app):
 pg,_,errors,_=app
 prepare_one(pg,'Long procedure to print')
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('Long procedure to print')
 pg.locator('[data-action=edit]').click()
 pg.locator('#nextBtn').click();pg.locator('#nextBtn').click()
 for i in range(9):
  pg.locator('[data-action=add-step]').click()
  pg.locator('[data-step=action]').last.fill('Instruction '+str(i)+' — '+('check each approved condition; '*15))
  pg.locator('[data-step=expected]').last.fill('Result '+str(i)+' — '+('record and compare to documented limit; '*10))
 pg.locator('#nextBtn').click();pg.locator('#nextBtn').click()
 import fitz
 d=fitz.open(stream=pg.pdf(format='A4',print_background=True),filetype='pdf')
 assert len(d)>=2
 text='\n'.join(x.get_text() for x in d)
 for i in range(9):assert 'Instruction '+str(i) in text
 for page in d:
  assert 594<=page.rect.width<=597 and 841<=page.rect.height<=844
  for block in page.get_text('blocks'):
   if isinstance(block[4],str) and block[4].strip():
    assert block[0]>=-1 and block[2]<=page.rect.width+1
 assert not errors

@pytest.mark.group3
def test_preview_escapes_untrusted_text(app):
 pg,_,errors,_=app
 p=prepare_one(pg,'Text escaping check')
 pg.locator('[data-page=library]').click();pg.locator('#searchInput').fill('Text escaping check')
 pg.locator('[data-action=edit]').click()
 pg.locator('[name=purpose]').fill('<img src=x onerror=alert(99)> Unique content')
 for i in range(3):pg.locator('#nextBtn').click()
 pg.locator('#nextBtn').click()
 assert '<img src=x onerror=alert(99)>' in pg.locator('.docpreview').inner_text()
 assert pg.locator('.docpreview img:not(.docphoto)').count()==0
 assert not errors

@pytest.mark.group4
def test_phone_320px_and_tablet_sizes(app):
 pg,_,errors,_=app
 for width in [320,360,390,768,1024]:
  pg.set_viewport_size({'width':width,'height':760})
  pg.locator('[data-page=library]').click()
  assert pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),width
 assert not errors

@pytest.mark.group4
def test_major_revision_bumps_and_keeps_history(app):
 pg,_,errors,_=app
 prepare_one(pg,'Major revision verification')
 pg.locator('[data-page=library]').click()
 pg.locator('#searchInput').fill('Major revision verification')
 pg.locator('[data-action=edit]').click()
 for _ in range(3):pg.locator('#nextBtn').click()
 pg.locator('[name=revisionChangeType]').select_option('Major revision')
 pg.locator('[name=changeNote]').fill('New approved method introduced')
 pg.locator('#nextBtn').click()
 p=next(x for x in getdata(pg) if x['title']=='Major revision verification')
 assert p['revision']=='2.0' and p['revisionHistory'][0]['revision']=='1.0'
 assert 'Rev 2.0' in pg.locator('.docend').inner_text()
 assert not errors

@pytest.mark.group4
def test_approval_rejects_missing_roles(app):
 pg,_,errors,dialogs=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Role approval check')
 for k,v in [('site','Alpha'),('line','Bravo'),('asset','Charlie')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Fictional test')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Competence required')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 pg.locator('[data-step=action]').fill('Review site instructions')
 pg.locator('[data-step=expected]').fill('References identified')
 pg.locator('[name=finalChecks]').fill('Test only')
 pg.locator('#nextBtn').click()
 pg.locator('[data-choice=owner]').select_option('__custom__');pg.locator('input[name=owner]').fill('QA Author')
 pg.locator('[name=status]').select_option('Approved')
 pg.locator('#nextBtn').click()
 assert pg.locator('[data-stage="4"]').is_visible()
 assert any('named author, reviewer and approver' in x for x in dialogs)
 assert not errors

@pytest.mark.group4
def test_import_malformed_json_keeps_records(app):
 pg,_,errors,dialogs=app
 prepare_one(pg,'Safe backup import')
 pg.locator('[data-page=library]').click()
 before=getdata(pg)
 with pg.expect_file_chooser() as chooser:pg.locator('[data-action=import]').click()
 chooser.value.set_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"app":"LineGuide","version":1,"procedures":[{"id":null}]}'})
 # FileChooser selection returns before the asynchronous File.text()/validation finishes.
 # Wait for the rejection dialog, rather than racing the browser event loop.
 for _ in range(40):
  if any('Import cancelled' in msg for msg in dialogs):break
  pg.wait_for_timeout(100)
 assert any('Import cancelled' in msg for msg in dialogs)
 assert getdata(pg)==before
 assert not errors

@pytest.mark.group4
def test_damaged_local_data_is_not_overwritten(browser):
 ctx=browser.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
 pg.set_content((ROOT/'index.html').read_text().replace('<script src="app.js"></script>',''))
 pg.evaluate("""()=>{const m={'lineguide-procedures-v1':'{BROKEN'};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m[k]??null,setItem:(k,v)=>m[k]=String(v),removeItem:k=>delete m[k]}})}""")
 errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.add_script_tag(content=(ROOT/'app.js').read_text())
 assert pg.get_by_text('Stored data needs attention').count()==1
 assert pg.evaluate("localStorage.getItem('lineguide-procedures-v1')")=="{BROKEN"
 assert pg.locator('[data-action=raw-recovery]').is_visible()
 assert not errors
 ctx.close()

@pytest.mark.group4
def test_large_camera_photo_is_accepted_after_compression(app):
 pg,_,errors,_=app
 pg.locator('[data-page=builder]').click()
 pg.locator('[name=title]').fill('Image size QA')
 for k,v in [('site','P'),('line','L'),('asset','A')]:
  pg.locator('[data-choice='+k+']').select_option('__custom__');pg.locator('input[name='+k+']').fill(v)
 pg.locator('[name=purpose]').fill('Photo handling QA')
 pg.locator('#nextBtn').click()
 pg.locator('[name=prerequisites]').fill('Qualified author')
 pg.locator('[data-isolation-mode]').select_option('not-required')
 pg.locator('#nextBtn').click()
 pg.locator('[data-action=add-step]').click()
 from PIL import Image
 from io import BytesIO
 image=Image.effect_noise((1700,1200),75).convert('RGB');buf=BytesIO();image.save(buf,format='PNG')
 assert len(buf.getvalue())>1200000
 pg.locator('[data-step=photoFile]').set_input_files({'name':'large_camera.png','mimeType':'image/png','buffer':buf.getvalue()})
 pg.locator('.stepbox img.photo').wait_for(timeout=15000)
 photo=pg.locator('[data-step=photo]').input_value()
 assert photo.startswith('data:image/jpeg;base64,') and len(photo)<950000
 assert not errors


# Reliable native PDF export regression suite (iPhone print fallback).
import fitz
@pytest.mark.group1
def test_pdf_button_exports_real_searchable_pdf_repeated(app):
    page, _, errors, _ = app
    prepare_one(page,'Reliable offline PDF',swp=True)
    for attempt in range(2):
        with page.expect_download() as info:
            page.locator('[data-action=save-pdf]').click()
        download = info.value
        assert download.suggested_filename.startswith('LineGuide-')
        assert download.suggested_filename.endswith('.pdf')
        doc = fitz.open(download.path())
        if attempt == 0:
            Path('/mnt/data/lineguide_print_fix/export_sample_swp.pdf').write_bytes(Path(download.path()).read_bytes())
        assert len(doc)>=1
        text = '\n'.join(x.get_text() for x in doc)
        for fragment in ['Reliable offline PDF','LG-SWP-0001','Purpose and scope','Working instructions','Document control','Fictional approved RA-TEST-01']:
            assert fragment in text, (fragment, text)
        assert 'DRAFT / UNAPPROVED' in text
    assert not errors

@pytest.mark.group2
def test_pdf_browser_print_not_called_in_standalone_mode(app):
    page, _, errors, dialogs=app
    prepare_one(page,'Standalone print check')
    page.evaluate("""() => {
        window.__printCalls=0;
        window.print=()=>window.__printCalls++;
        Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
        render();
    }""")
    assert page.locator('[data-action=print-browser]').count()==0
    page.evaluate('() => window.LineGuidePdf.browserPrint()')
    assert page.evaluate('window.__printCalls') == 0
    assert any('Home Screen' in x for x in dialogs)
    assert not errors

@pytest.mark.group3
def test_browser_print_in_regular_browser_uses_print(app):
    page, _, errors, _=app
    prepare_one(page,'Browser print check')
    page.evaluate('() => {window.__printCalls=0;window.__printStacks=[];window.print=()=>{window.__printCalls++;window.__printStacks.push(new Error().stack)};}')
    page.locator('[data-action=print-browser]').click()
    assert page.evaluate('window.__printCalls') == 1, page.evaluate('window.__printStacks')
    assert not errors

@pytest.mark.group4
def test_pdf_export_includes_previous_revision_warning(app):
    page, _, errors, _=app
    prepare_one(page,'Historical revision PDF')
    page.locator('[data-action=open]').click()
    page.locator('[data-action=edit]').click()
    # Let the existing tested revision workflow create a new revision.
    page.locator('[name=title]').fill('Historical revision PDF — updated')
    for i in range(3):
        page.locator('#nextBtn').click()
    page.locator('[name=changeNote]').fill('Quality assurance revised this procedure')
    page.locator('#nextBtn').click()
    assert page.locator('[data-action=save-pdf]').count()==1
    with page.expect_download() as info:page.locator('[data-action=save-pdf]').click()
    current=fitz.open(info.value.path())
    assert 'Historical revision PDF - updated' in '\n'.join(p.get_text() for p in current) or 'Historical revision PDF' in '\n'.join(p.get_text() for p in current)
    page.locator('[data-action=open]').click()
    page.locator('[data-action=view-revision]').first.click()
    with page.expect_download() as info:page.locator('[data-action=save-pdf]').click()
    archived=fitz.open(info.value.path())
    text='\n'.join(p.get_text() for p in archived)
    assert 'ARCHIVED REVISION' in text
    assert 'Historical revision PDF' in text
    assert not errors

@pytest.mark.group1
def test_pdf_embeds_actual_photo(app):
    page,_,errors,_=app
    prepare_one(page,'PDF with embedded photo')
    # A real image was attached during authoring in the other regression suite;
    # inject equivalent locally stored camera data for the PDF unit path.
    page.evaluate("""() => {
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=220;
      const c=canvas.getContext('2d');c.fillStyle='#aaccdd';c.fillRect(0,0,320,220);
      c.fillStyle='#182f40';c.fillRect(40,30,180,90);
      data.find(p=>p.title==='PDF with embedded photo').steps[0].photo=canvas.toDataURL('image/jpeg',.8);
      render();
    }""")
    with page.expect_download() as info:page.locator('[data-action=save-pdf]').click()
    d=fitz.open(info.value.path());imgs=sum(len(x.get_images()) for x in d)
    assert imgs==1
    assert 'PDF with embedded photo' in '\n'.join(p.get_text() for p in d)
    assert not errors

@pytest.mark.group2
def test_long_pdf_multipage_layout_has_page_numbers(app):
    page,_,errors,_=app
    prepare_one(page,'Long PDF and page numbers')
    page.evaluate("""() => {
      const p=data.find(v=>v.title==='Long PDF and page numbers');
      p.steps=Array.from({length:20},(_,i)=>({
        action:'Test instruction '+i+'. Observe machine indication and compare with the approved limit. '.repeat(5),
        expected:'Correct condition established using approved criteria.',
        warning:i%3===0?'Test caution: this is example content only.':'',
        photo:''
      }));render();
    }""")
    with page.expect_download() as info:page.locator('[data-action=save-pdf]').click()
    d=fitz.open(info.value.path());assert len(d)>=3
    alltext='\n'.join(p.get_text() for p in d)
    assert 'Test instruction 0.' in alltext and 'Test instruction 19.' in alltext
    for i,p in enumerate(d):
        assert f'Page {i+1} of {len(d)}' in p.get_text()
        for x0,y0,x1,y1,*_ in p.get_text('blocks'):
            assert x0 >= -1 and y0 >= -1 and x1 < p.rect.width + 1 and y1 < p.rect.height+1
    assert not errors

@pytest.mark.group3
def test_pdf_file_share_path_and_cancellation(app):
    page,_,errors,_=app
    prepare_one(page,'Native share PDF')
    page.evaluate("""() => {
        window.__shared=false;
        Object.defineProperty(navigator,'canShare',{configurable:true,value:({files})=>files?.length===1});
        Object.defineProperty(navigator,'share',{configurable:true,value:({files})=>{
          window.__shared=files[0].name.endsWith('.pdf')&&files[0].type==='application/pdf';
          return Promise.reject({name:'AbortError'});
        }});
    }""")
    page.locator('[data-action=save-pdf]').click()
    assert page.evaluate('window.__shared')
    assert not errors

@pytest.mark.group4
def test_pdf_legacy_png_photo_is_preserved(app):
    pg,_,errors,_=app
    prepare_one(pg,'Legacy PNG photo export')
    pg.evaluate("""() => {
      const canvas=document.createElement('canvas');canvas.width=180;canvas.height=110;
      const c=canvas.getContext('2d');c.fillStyle='orange';c.fillRect(0,0,180,110);
      data.find(p=>p.title==='Legacy PNG photo export').steps[0].photo=canvas.toDataURL('image/png');
      render();
    }""")
    pg.locator('.docpreview img.docphoto').wait_for()
    pg.wait_for_function("() => document.querySelector('.docpreview img.docphoto')?.complete === true")
    with pg.expect_download() as download: pg.locator('[data-action=save-pdf]').click()
    pdf=fitz.open(download.value.path())
    assert sum(len(p.get_images()) for p in pdf)==1
    assert 'Photo could not be embedded' not in '\n'.join(p.get_text() for p in pdf)
    assert not errors

@pytest.mark.group1
def test_pdf_technical_symbols_have_unambiguous_output(app):
    pg,_,errors,_=app
    prepare_one(pg,'Technical symbols PDF')
    pg.evaluate("""() => {data.find(p=>p.title==='Technical symbols PDF').steps[0].action='Measure R ≥ 1 MΩ ± 5% at 20°C; confirm Δ reading ≤ 2µA.';render();}""")
    with pg.expect_download() as download:pg.locator('[data-action=save-pdf]').click()
    text='\n'.join(page.get_text() for page in fitz.open(download.value.path()))
    for term in ['Measure R >= 1 MOhm', 'Delta reading <= 2µA']:
        assert term in text,term
    assert not errors

@pytest.mark.group2
def test_pdf_unknown_symbol_stops_export_without_silent_change(app):
    pg,_,errors,dialogs=app
    prepare_one(pg,'Reject ambiguous symbol')
    pg.evaluate("""() => {data.find(p=>p.title==='Reject ambiguous symbol').steps[0].action='Check the 🧲 status';render();}""")
    pg.locator('[data-action=save-pdf]').click()
    pg.wait_for_timeout(100)
    assert any('not supported in PDF export' in m for m in dialogs)
    assert not errors