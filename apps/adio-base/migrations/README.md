# Database migration

Run `001_initial.sql` in the Supabase SQL Editor using a migration role before starting the API. The service uses a restricted Postgres connection string from `Project Settings > Database > Connect`; the browser never receives it.

For production, apply migrations from CI or a controlled release job and verify the indexed usage query with `EXPLAIN (ANALYZE, BUFFERS)`.
