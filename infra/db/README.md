# Local PostgreSQL Setup

ScholarScout uses Docker Compose for local PostgreSQL.

## Default connection

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scholarscout?schema=public
```

## Commands

From the repo root:

```bash
npm run db:up
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

To stop the database:

```bash
npm run db:down
```

To follow database logs:

```bash
npm run db:logs
```

## Notes

- Data is persisted in the `postgres_data` Docker volume.
- If you need a clean reset, run `docker compose down -v` from the repo root.
