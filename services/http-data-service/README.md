# ScholarScout HTTP Data Service Fixture

This workspace package is a no-dependency local fixture for the ScholarScout HTTP data adapter contract.

It is not a production CMS. It gives developers a real `GET`/`PUT` service to test `SCHOLARSCOUT_DATA_ADAPTER=http` without Docker or new install scripts.

## Run Locally

```bash
npm run dev --workspace @scholar-scout/http-data-service
```

The service listens at:

```text
http://localhost:4010/scholarscout
```

Health check:

```text
http://localhost:4010/health
```

Use it from the web app with:

```bash
SCHOLARSCOUT_DATA_ADAPTER=http
SCHOLARSCOUT_DATA_SERVICE_URL=http://localhost:4010/scholarscout
SCHOLARSCOUT_DATA_SERVICE_TOKEN=optional-local-token
```

Set `SCHOLARSCOUT_DATA_SERVICE_FILE` to control where the JSON document is stored.

Before every replacement write, the fixture stores a timestamped copy of the previous JSON document under a `backups` directory beside the active file. Invalid JSON writes return `400` without replacing the current document.
