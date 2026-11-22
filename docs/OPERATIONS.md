# Operations

## Where the data lives

Development data is a Postgres 16 container (`dukaan-pg`) with a named Docker volume `dukaan-pgdata`.
`npm run db:down` stops it and keeps the data. Removing the volume (`docker volume rm`) deletes everything.

## Backup and restore (development)

```powershell
docker exec dukaan-pg pg_dump -U postgres -d app -Fc -f /tmp/app.dump
docker cp dukaan-pg:/tmp/app.dump ./app.dump
```

Restore into an empty database:

```powershell
docker cp ./app.dump dukaan-pg:/tmp/app.dump
docker exec dukaan-pg pg_restore -U postgres -d app --clean --if-exists /tmp/app.dump
```

Limits to know: there is no automatic backup, and no export button in the app. A hosted database should use its
provider's backups (check the free-tier retention before relying on it; spec 19.5).

## Production checklist

- Set `AUTH_SECRET` to a long random value and `DATABASE_URL` to the hosted database; keep both out of source control.
- Serve over HTTPS. In production the app also sends HSTS and blocks framing.
- Connect an email provider for password reset (today the link is only printed to the server log).
- Put the rate limiter on a shared store if more than one server process runs.
- Run `npm run build`, `npm test` and (against a staging copy) `npm run test:acceptance` before deploying.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run dev` says Docker is not running | Start Docker Desktop and run it again. |
| Pages show "We could not load this" | The database is down; run `npm run db:up`. |
| Schema edited but the app fails | Run `npm run db:push` in a terminal. |
| Signed out after reseeding | Reseeding creates new accounts; sign in again. |
