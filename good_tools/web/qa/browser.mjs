import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, truncateSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createServer } from 'node:http';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../../server/index.mjs';

const html = readFileSync('dist/index.html','utf8');
const entry = html.match(/<script[^>]*src="\.\/([^"]+)"/)[1];
assert.ok(gzipSync(readFileSync('dist/'+entry)).length < 120000, 'Initial JS gzip budget exceeded');
if (!process.env.QA_DATA_DIR) throw Error('Set QA_DATA_DIR to a temporary directory');
const app = createApp({publicDir:process.cwd()+'/dist', dataDir:process.env.QA_DATA_DIR, allowNetworkTools:false});
const http = createServer((req,res) => {
  if (!req.url.startsWith('/qa/')) { res.writeHead(404).end(); return; }
  req.url = req.url.slice(3);
  app(req,res);
});
await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+http.address().port+'/qa/';
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_BIN, headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/prefs',async route=>{ await new Promise(resolve=>setTimeout(resolve,150));await route.fulfill({json:{lang:'ko',favorites:[],hiddenTools:[],theme:'system'}}); });
  const open = async id => { await page.goto(base+'#/tool/'+id); await page.locator('h1').last().waitFor(); };
  await open('file-checksum');
  const input = page.locator('input[type=file]');
  await input.setInputFiles({name:'abc.txt',mimeType:'text/plain',buffer:Buffer.from('abc')});
  await page.getByText('900150983cd24fb0d6963f7d28e17f72',{exact:true}).waitFor();
  mkdirSync(process.env.QA_DATA_DIR, {recursive:true});
  const large = process.env.QA_DATA_DIR + '/large.bin';
  writeFileSync(large, '');
  truncateSync(large, 50*1024*1024);
  await input.setInputFiles(large);
  await page.getByRole('button',{name:'취소',exact:true}).click();
  await page.getByText('취소됨',{exact:true}).waitFor();
  await open('pdf-tools');
  await page.getByRole('button',{name:'PDF 페이지 추출'}).click();
  const pdf = await PDFDocument.create();pdf.addPage();pdf.addPage();
  await page.locator('input[type=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await page.getByText(/총 2페이지/).waitFor();
  await page.getByRole('button',{name:'선택 페이지 추출'}).click();
  await page.getByRole('button',{name:/Save extracted/}).waitFor();
  await open('game-roulette');
  await page.locator('input[placeholder*="항목"]').fill('QA');
  await page.locator('input[placeholder*="항목"]').press('Enter');
  await page.reload(); await page.getByText('QA',{exact:true}).last().waitFor();
  await page.getByRole('button',{name:'돌림판 돌리기'}).click();
  await page.getByText(/당첨:/).waitFor();
  await page.goto(base);await page.getByText('최근 사용한 도구').waitFor();
  await page.keyboard.press('Control+k');
  await page.locator('input[placeholder*=키워드]').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: bundle budget, delayed preferences, mobile file hash/cancel, PDF extraction, reduced motion, recent tools, keyboard input');
} finally {
  await browser?.close();
  await new Promise(resolve=>http.close(resolve));
}
