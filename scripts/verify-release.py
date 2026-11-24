"""Verify a trusted git commit on the sub HA and download its web-dist.tar.gz.

The configured SSH account needs a POSIX shell, Node 22.12+ or Node 24, npm,
Chromium and space for two npm installs. The operator runs this script from
the repository root with an SSH key in the local agent or SSH config.

Release steps (the add-on store reads config.yaml from main, so the image must exist first):
1. Bump the version in config.yaml, run.sh, server/index.mjs and server/routes/api.mjs on a branch.
2. python scripts/verify-release.py <commit> --user <account> --output web-dist.tar.gz
3. Mark the commit: status context "sub-ha/verified", state success, description = printed SHA-256.
4. Upload web-dist.tar.gz to a "v<version>-rc.1" pre-release.
5. Run the "Package verified sub-HA build" workflow on main with the commit and version.
6. Merge the branch after "Release guard" passes, update the sub HA, then tag v<version>.
"""
import argparse
import hashlib
from pathlib import Path
import re
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('commit')
parser.add_argument('--user', required=True)
parser.add_argument('--port', type=int, default=22)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
if not re.fullmatch(r'[a-zA-Z0-9_-]+', args.user) or not 0 < args.port < 65536:
    parser.error('Invalid SSH account or port')
sha = subprocess.check_output(['git', 'rev-parse', '--verify', '--end-of-options', args.commit + '^{commit}'], text=True).strip()
ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-p', str(args.port),
       args.user + '@192.168.1.129']
remote = subprocess.check_output(ssh + ['mktemp -d /tmp/good-tools-release.XXXXXXXX'], text=True).strip()
if not re.fullmatch(r'/tmp/good-tools-release\.[a-zA-Z0-9]{8}', remote):
    raise RuntimeError('Unexpected temporary path')
try:
    archive = subprocess.check_output(['git', '-c', 'core.autocrlf=false', 'archive', '--format=tar.gz', sha + ':good_tools'])
    subprocess.run(ssh + ['tar xzf - -C ' + remote], input=archive, check=True)
    script = """set -eu
cd "$1"
export QA_DATA_DIR="$PWD/test-data"
export CHROMIUM_BIN="$(command -v chromium || command -v chromium-browser)"
cd server
npm ci --no-audit
npm test
npm audit --omit=dev
cd ../web
npm ci --no-audit
npm run build
npm test
npm audit
node qa/browser.mjs
tar czf ../web-dist.tar.gz -C dist .
"""
    subprocess.run(ssh + ['sh -s -- ' + remote], input=script.encode(), check=True)
    with tempfile.NamedTemporaryFile(dir=args.output.parent, delete=False) as f:
        partial = Path(f.name)
        try:
            subprocess.run(ssh + ['cat ' + remote + '/web-dist.tar.gz'], stdout=f, check=True)
        except BaseException:
            f.close()
            partial.unlink(missing_ok=True)
            raise
    partial.replace(args.output)
    print(sha, hashlib.sha256(args.output.read_bytes()).hexdigest())
finally:
    subprocess.run(ssh + ['rm -rf -- ' + remote], check=True)
