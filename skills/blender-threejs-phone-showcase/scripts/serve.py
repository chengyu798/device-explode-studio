#!/usr/bin/env python3
"""Serve the generated project only on the loopback interface."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import argparse
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--port',type=int,default=4173);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'dist'
if not root.is_dir():p.error('Missing dist/ next to scripts/. Run create_project.py first.')
try:
 server=ThreadingHTTPServer(('127.0.0.1',a.port),partial(SimpleHTTPRequestHandler,directory=str(root)))
except OSError as exc:p.error(f'{exc}. Choose another --port; do not terminate unrelated services.')
print(f'Local preview: http://127.0.0.1:{a.port}/',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
