# Builds a single-server Bun project for the GitHub repo (no size limits, deploy on push)
import re, subprocess, os, shutil
subprocess.run(['python3','build4.py'],check=True,capture_output=True)
cl=open('client.tsx').read()
client_fn = cl.split("const JS = `")[0].replace("// @ts-nocheck\n","")
main=open('main_local.tsx').read()
main=main.replace("const CLIENT_URL = Bun.env.CLIENT_URL || 'https://ringue-client-production.up.railway.app/client.js';",
  client_fn + "const CLIENT_JS = `(${CLIENT_MAIN.toString()})();`;\nconst CLIENT_URL = Bun.env.CLIENT_URL || '/client.js';")
assert "const CLIENT_JS" in main
main=main.replace("    if (url.pathname === '/crowd.js')","    if (url.pathname === '/client.js') return new Response(CLIENT_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-cache' } });\n    if (url.pathname === '/crowd.js')")
assert "'/client.js')" in main
out='/home/claude/ringue-gh'
os.makedirs(out+'/src',exist_ok=True)
open(out+'/index.ts','w').write(main)
shutil.copy('race.html', out+'/race.html')
for f in ['race.html', 'game3d.html','fx.js','crowd.js','server.ts','build4.py','build_repo.py']: shutil.copy(f, out+'/src/'+f)
print('index.ts', len(main))
