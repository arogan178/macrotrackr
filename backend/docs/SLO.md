# Service Level Objectives (SLOs)

## Overview

This document defines the Service Level Objectives for the Macro Tracker application. SLOs are targets that define the expected level of service quality.

## Service Level Indicators (SLIs)

### 1. Availability

- **Definition**: Percentage of successful requests (HTTP 2xx/3xx responses)
- **Measurement**: Total successful requests / Total requests × 100
- **Target**: 99.5% monthly availability

### 2. Latency

- **Definition**: Time to respond to requests
- **Measurement**: p50, p95, p99 response times
- **Targets**:
  - p50: < 100ms
  - p95: < 500ms
  - p99: < 1000ms

### 3. Error Rate

- **Definition**: Percentage of failed requests (HTTP 5xx responses)
- **Measurement**: Total 5xx responses / Total responses × 100
- **Target**: < 0.5% error rate

### 4. Auth Failure Rate

- **Definition**: Percentage of authentication failures
- **Measurement**: Failed auth attempts / Total auth attempts × 100
- **Target**: < 1% (excluding invalid credentials)

### 5. Webhook Failure Rate

- **Definition**: Percentage of failed webhook deliveries
- **Measurement**: Failed webhooks / Total webhooks × 100
- **Target**: < 0.1% (with retry)

## Error Budget

- **Monthly Error Budget**: 0.5% of requests (based on 99.5% availability target)
- **Budget Calculation**: Total monthly requests × 0.005
- **Budget Reset**: Monthly

## Monitoring

SLO metrics are exposed at:

- `/metrics` - Prometheus-compatible metrics endpoint
- `/health/ready` - Readiness probe with dependency status

## Alerting

Alerts are triggered when:

1. Availability drops below 99% for 5 minutes
2. p95 latency exceeds 1s for 5 minutes
3. Error rate exceeds 1% for 5 minutes
4. Auth failure rate exceeds 5% for 5 minutes
5. Webhook failure rate exceeds 1% for 5 minutes

## Incident Response

See [ALERTING.md](./ALERTING.md) for runbooks and incident response procedures.
