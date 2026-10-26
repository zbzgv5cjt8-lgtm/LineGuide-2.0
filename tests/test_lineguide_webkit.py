"""WebKit smoke check for image imports and PDF export (iPhone Safari engine family).

Uses synthetic graphics only. Linux WebKit is not a replacement for real iOS Safari.
"""
import base64
import json
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image
from playwright.sync_api import sync_playwright
from test_lineguide_e2e import server

ROOT=Path(__file__).resolve().parent.parent
KEY='lineguide-procedures-v1'


def test_webkit_import_photo_preview_and_pdf(server):
    image=Image.new('RGB',(80,60),'#4a8758')
    buffer=BytesIO()
    image.save(buffer,'JPEG')
    src='data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode()
    doc={'id':'webkit-photo-proof','title':'WebKit photo proof','site':'Test',
         'line':'Line A','asset':'Example asset',
         'templateType':'Standard operating procedure (SOP)',
         'purpose':'Testing browser rendering only','prerequisites':'Fictional QA',
         'finalChecks':'Check completed','isolationMode':'not-required',
         'status':'Draft','revision':'1.0','owner':'Tester',
         'steps':[{'action':'View provided image','expected':'Image visible',
                   'photo':src,'photoCaption':'Synthetic JPEG test image'}]}
    with sync_playwright() as playwright:
        browser=playwright.webkit.launch(headless=True)
        ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
        pg=ctx.new_page()
        pg.set_default_timeout(10000)
        errors=[]
        pg.on('pageerror',lambda err:errors.append(str(err)))
        pg.on('dialog',lambda dialog:dialog.accept())
        html=(ROOT/'index.html').read_text().replace('<script src="app.js"></script>','')
        pg.goto(server+'tests/blank.html')
        html=html.replace('<script src="photo-store.js"></script>','').replace('<script src="pdf-export.js"></script>','')
        pg.set_content(html)
        pg.evaluate("""() => {
            const storage={};
            Object.defineProperty(window,'localStorage',{
                configurable:true,
                value:{
                    getItem:k=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null,
                    setItem:(k,v)=>{storage[k]=String(v)},
                    removeItem:k=>delete storage[k]
                }
            })
        }""")
        pg.add_script_tag(content=(ROOT/'photo-store.js').read_text())
        pg.add_script_tag(content=(ROOT/'app.js').read_text())
        pg.add_script_tag(content=(ROOT/'pdf-export.js').read_text())
        with pg.expect_file_chooser() as picker:
            pg.locator('[data-action=import-prepared]').click()
        picker.value.set_files({'name':'synthetic-image.json','mimeType':'application/json',
                                'buffer':json.dumps({'app':'LineGuide','version':1,'procedures':[doc]}).encode()})
        pg.locator('.docphoto').wait_for()
        assert pg.locator('.docphoto').evaluate('img=>img.complete&&img.naturalWidth>0')
        assert pg.locator('.docphoto').count()==1
        assert json.loads(pg.evaluate('localStorage.getItem("'+KEY+'")'))[0]['steps'][0]['photo'].startswith('idb:sha256:')
        with pg.expect_download() as info:
            pg.locator('[data-action=save-pdf]').click()
        pdf=fitz.open(info.value.path())
        assert sum(len(pdf.get_page_images(i)) for i in range(len(pdf)))>=1
        assert 'WebKit photo proof' in '\n'.join(page.get_text() for page in pdf)
        assert errors==[]
        ctx.close()
        browser.close()
