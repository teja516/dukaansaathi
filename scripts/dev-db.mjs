// Starts the local Postgres (docker compose), waits until it is healthy, creates the tables and
// seeds the demo accounts on first run. Safe to run repeatedly; it runs as the `predev` hook.
import { execSync } from 'node:child_process';

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const out = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fail(msg) {
  console.error(`[dev-db] ${msg}`);
  process.exit(1);
}

try {
  out('docker info');
} catch {
  fail('Docker is not running. Start Docker Desktop, then run this again.');
}

console.log('[dev-db] starting Postgres…');
try {
  sh('docker compose up -d --wait db');
} catch {
  fail('Could not start the database container. Is port 5432 already in use?');
}

let tables = 0;
try {
  tables = Number(
    out(`docker exec dukaan-pg psql -U postgres -d app -tAc "select count(*) from information_schema.tables where table_schema='public'"`),
  );
} catch {
  fail('Database is up but could not be queried.');
}

if (tables === 0) {
  // Brand-new database: nothing to lose, so apply the schema without prompts, then seed demo data.
  console.log('[dev-db] empty database: creating tables and demo data…');
  sh('npx drizzle-kit push --force');
  sh('npx tsx src/db/seed.ts');
} else {
  // Existing data: never touch the schema automatically. drizzle-kit can ask about destructive
  // changes, and that prompt cannot be answered here. After editing src/db/schema.ts run
  // `npm run db:push` in a terminal.
  console.log('[dev-db] database already set up (after schema edits, run `npm run db:push`)');
}
console.log('[dev-db] ready');
