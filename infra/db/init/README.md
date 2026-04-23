# Database Init Hooks

This directory is mounted into the Postgres container at startup.

Use it for optional bootstrap SQL such as:

- seed reference programs
- enable extensions
- create reporting views

The current MVP does not require any init SQL, so this folder is intentionally minimal.

