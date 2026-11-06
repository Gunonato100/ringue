import re, hashlib
s=open('game3d.html').read()
m=re.search(r'<script type="module">(.*?)</script>',s,re.S)
client=m.group(1)
imports = {
"import * as THREE from 'three';": "const THREE = await import('three');",
"import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';": "const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');",
"import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';": "const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');",
"import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';": "const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');",
"import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';": "const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');",
"import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';": "const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');",
"import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';": "const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');",
}
for a,b in imports.items():
    assert client.count(a)==1, a; client=client.replace(a,b)
lines=[l for l in client.split('\n') if l.strip() and not l.strip().startswith('// ')]
client='\n'.join(lines)
# ---- client function ----
cl = "// @ts-nocheck\nasync function CLIENT_MAIN() {\n" + client + "\n}\n" + \
"const JS = `(${CLIENT_MAIN.toString()})();`;\n" + \
"const SRC_SHA = new Bun.CryptoHasher('sha256').update(await Bun.file(import.meta.path).text()).digest('hex');\n" + \
"Bun.serve({ port: Number(Bun.env.PORT || 3000), fetch(req) { const p = new URL(req.url).pathname; if (p === '/version') return Response.json({ sha: SRC_SHA }); return new Response(JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'no-cache' } }); } });\n"
open('client.tsx','w').write(cl)
# ---- main function ----
head=s[:m.start()]; tail=s[m.end():]
assert '`' not in head+tail and '${' not in head+tail
srv=open('server.ts').read().replace("const HTML = Buffer.from(HTML_B64, 'base64').toString('utf8');\n","")
srv='\n'.join(l for l in srv.split('\n') if not l.strip().startswith('// '))
srv=srv.replace("if (url.pathname === '/health')", "if (url.pathname === '/version') return Response.json({ sha: SRC_SHA });\n    if (url.pathname === '/health')")
first, rest = srv.split('\n',1)
main = first + "\n// @ts-nocheck\n" + \
"const CLIENT_URL = Bun.env.CLIENT_URL || 'https://ringue-client-production.up.railway.app/client.js';\n" + \
open('fx.js').read() + "const FX_JS = `(${FX_MAIN.toString()})();`;\n" + \
  open('crowd.js').read() + "const CROWD_JS = `(${CROWD_MAIN.toString()})();`;\n" + \
"const HTML = `" + head + "<script type=\"module\" src=\"${CLIENT_URL}?v=${Date.now()}\"></script>" + tail + "`;\n" + \
"const SRC_SHA = new Bun.CryptoHasher('sha256').update(await Bun.file(import.meta.path).text()).digest('hex');\n" + rest
open('main.tsx','w').write(main)
open('main_local.tsx','w').write(main.replace("'tiktok-live-connector@2.5.0'","'tiktok-live-connector'"))
for n,c in [('client',cl),('main',main.replace("'tiktok-live-connector@2.5.0'","'tiktok-live-connector'"))]:
    print(n, len(c.encode()), hashlib.sha256(c.encode()).hexdigest())
