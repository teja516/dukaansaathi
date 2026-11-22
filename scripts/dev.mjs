// Starts the Next.js dev server, then pre-compiles every page and API route in the background.
//
// `next dev` compiles a route the first time somebody opens it, which costs several seconds per page.
// Visiting every route once, right after startup, moves that cost out of your way: by the time you click
// around, everything is already compiled (and each request takes a few milliseconds).
//
//   npm run dev        (this script; the database is started first by the `predev` hook)
//   WARM=0 npm run dev   to skip the warm-up
import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const PORT = process.env.PORT || '3000';
const BASE = `http://localhost:${PORT}`;
const FAKE_ID = '00000000-0000-4000-8000-000000000000';

const child = spawn('npx', ['next', 'dev', '-p', PORT], { stdio: 'inherit', shell: true });
const stop = () => child.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code) => process.exit(code ?? 0));

/** Every page and API route found under src/app, with [param] folders filled by a dummy id. */
function discover() {
  const root = join(process.cwd(), 'src', 'app');
  const pages = [];
  const apis = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (name !== 'page.tsx' && name !== 'route.ts') continue;
      const rel = dir.slice(root.length).split(sep).filter(Boolean).map((s) => (/^\[.+\]$/.test(s) ? FAKE_ID : s));
      const path = '/' + rel.join('/');
      (name === 'page.tsx' ? pages : apis).push(path === '/' ? '/' : path);
    }
  })(root);
  // Most-used screens first.
  const first = ['/', '/customers', '/suppliers', '/expenses', '/cash-forecast', '/action-centre', '/login'];
  pages.sort((a, b) => (first.indexOf(a) + 1 || 99) - (first.indexOf(b) + 1 || 99) || a.localeCompare(b));
  return [...pages, ...apis];
}

async function up() {
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(5000) });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

async function warm() {
  if (process.env.WARM === '0') return;
  if (!(await up())) return;
  const routes = discover();
  const started = Date.now();
  let done = 0;
  const queue = [...routes];
  const worker = async () => {
    for (let path = queue.shift(); path; path = queue.shift()) {
      try {
        await fetch(BASE + path, { signal: AbortSignal.timeout(120_000) });
      } catch {
        /* a failed warm-up request must never matter */
      }
      done++;
    }
  };
  console.log(`\n[warm] pre-compiling ${routes.length} routes in the background…`);
  await Promise.all([worker(), worker()]);
  console.log(`[warm] ready: ${done} routes compiled in ${((Date.now() - started) / 1000).toFixed(0)}s. Pages now open instantly.\n`);
}

warm();
