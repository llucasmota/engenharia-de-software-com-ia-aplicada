# Incident Report: Database Connection Leaks
Date: 2026-04-29

## 1. Prometheus Metrics Analysis

- **Metric Query**: `http_server_duration_milliseconds_count{http_route="/students/db-leaky-connections"}`
- **Observation**:
  - The first two requests return a `200 OK` status.
  - Subsequent requests return a `500 Internal Server Error`.
- **Response Times**:
  - Successful requests (200 OK) average response time is `~28ms`.
  - Failed requests (500 Internal Server Error) average response time is `~1003ms` (suggesting a 1-second timeout).

## 2. Loki Logs Analysis

- **Log Query**: `{service_name=~"alumnus_app.*"} |= "/students/db-leaky-connections"`
- **Error Pattern**: The `/students/db-leaky-connections` endpoint processes the first 2 requests correctly, but later requests timeout and fail.
- **Error Message**:
  ```text
  Error: timeout exceeded when trying to connect
  ```
- **Stack Trace**:
  ```text
  Error: timeout exceeded when trying to connect
    at .../node_modules/pg-pool/index.js:45:11
    at async DbLeakyConnectionsScenario.createConnection (.../main.ts:43:24)
    at async Object.<anonymous> (.../main.ts:67:32)
  ```
  *(Note: The line numbers correspond to the `pool.connect()` call inside `createConnection` and the route handler in `main.ts`.)*

## 3. Tempo Traces Analysis

- **Trace ID**: `d2aa6c76fb1c564d91fc9f708ed403c8`
- **Observation**:
  - The HTTP request span `GET /students/db-leaky-connections` takes `1017ms` to complete.
  - The `handler - fastify -> @fastify/otel` internal span shows the exact `exception` event with the message `"timeout exceeded when trying to connect"`.
  - There are NO spans or operations indicating a cleanup or connection release taking place.

## 4. Root Cause Analysis

Based on the telemetry data:
- The database connection pool has a maximum limit of 2 connections.
- The 1-second delay in 500 errors is the timeout limit trying to acquire a connection from the exhausted pool (`pg-pool`).
- The root cause is located in `main.ts:80-90` inside the `/students/db-leaky-connections` handler. The application calls `await this.createConnection()` which checks out a client from the pool. However, it executes the query and returns the response without ever calling `client.release()`.
- The missing `finally` block leaves the connections acquired indefinitely, causing the pool to deplete after 2 successful requests.

## 5. Telemetry Correlation Summary

| Signal      | Observation | Correlation / Indicator |
|-------------|-------------|-------------------------|
| **Metrics** | 2 successes, then 100% 500 errors. Response times jump from ~28ms to ~1000ms. | Indicates resource exhaustion and a timeout threshold hit. |
| **Logs**    | "timeout exceeded when trying to connect" at `main.ts:43` | Confirms the exhausted resource is the database connection pool. |
| **Traces**  | 1017ms handler span; exception event without release/cleanup spans. | Points to a missing database cleanup step in the code execution path. |

## 6. Recommended Fix

Modify the route handler in `main.ts` to ensure connections are always released back to the pool, even when errors occur:

```typescript
const client = await this.pool.connect()
try {
  const result = await client.query('SELECT * FROM students LIMIT 1')
  return reply.send({ students: result.rows })
} finally {
  client.release() // Always release, even on error
}
```
