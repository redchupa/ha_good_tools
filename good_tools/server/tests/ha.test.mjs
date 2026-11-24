import express from 'express';
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { haRouter } from '../routes/ha.mjs';

it('checks ingress identity and feature permission before accessing HA', async () => {
  const app = express();
  const calls = [];
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.defineProperty(req.socket,'remoteAddress',{ configurable:true, value:'172.30.32.2' });
    next();
  });
  app.use(haRouter({ users:['allowed'], token:'fixture', templates:false, notify:'notify.mobile_app_fixture',
    request:async (url,opts) => { calls.push({url,opts}); return new Response('["light.fixture"]'); } }));
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(base+'/entities?q=light')).status,403);
    const stranger = 'a'.repeat(32);
    const denied = await fetch(base+'/capabilities',{headers:{'x-remote-user-id':stranger}});
    assert.equal(denied.status,403);
    assert.equal((await denied.json()).userId,stranger);
    const headers = {'x-remote-user-id':'allowed','content-type':'application/json'};
    assert.equal((await fetch(base+'/template',{method:'POST',headers,body:'{}'})).status,403);
    assert.equal(calls.length,0);
    assert.deepEqual(await (await fetch(base+'/entities?q=light',{headers})).json(),{ids:['light.fixture']});
    assert.equal((await fetch(base+'/notify',{method:'POST',headers,body:JSON.stringify({message:'example',service:'ignore'})})).status,204);
    assert.equal(calls[1].url,'http://supervisor/core/api/services/notify/mobile_app_fixture');
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
