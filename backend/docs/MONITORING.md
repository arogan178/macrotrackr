# Monitoring

There is no paging or alert routing. Monitoring runs on the server, from the
Linux Server repo: Uptime Kuma for availability, and Grafana with Loki for the
Traefik access log. Application logs are not shipped there; read them with
`docker logs`.

## Endpoints

| Endpoint                | Auth             | Returns                                        |
| ----------------------- | ---------------- | ---------------------------------------------- |
| `GET /`                 | none             | Static status and process start time           |
| `GET /api/health`       | none             | Status with a database check                   |
| `GET /api/health/ready` | none             | Readiness, failing when the database is down   |
| `GET /metrics`          | metrics key      | Prometheus text format                         |
| `GET /metrics/queries`  | metrics key      | Slow-query stats and recent query traces       |

The metrics key is `METRICS_API_KEY`, sent as `x-metrics-key` or as a bearer
token. Without it set, both metrics endpoints return 403.

## When something is wrong

1. `GET /api/health/ready` says whether the API can reach its database.
2. The Traefik access log in Grafana shows status codes and latency per route.
3. The backend container's logs carry the errors themselves.
