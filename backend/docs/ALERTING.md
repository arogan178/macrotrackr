# Alerting Guide

## Overview

This document defines alerting rules, escalation procedures, and runbooks for the Macro Tracker application.

## Alert Channels

- **Critical**: PagerDuty (production only)
- **Warning**: Slack #alerts channel
- **Info**: Email digest

## Alert Rules

### 1. Availability Alert

- **Condition**: Availability drops below 99% for 5 minutes
- **Severity**: Critical
- **Runbook**: [Availability Runbook](#availability-runbook)

### 2. Latency Alert

- **Condition**: p95 latency exceeds 1s for 5 minutes
- **Severity**: Warning
- **Runbook**: [Latency Runbook](#latency-runbook)

### 3. Error Rate Alert

- **Condition**: Error rate exceeds 1% for 5 minutes
- **Severity**: Critical
- **Runbook**: [Error Rate Runbook](#error-rate-runbook)

### 4. Auth Failure Alert

- **Condition**: Auth failure rate exceeds 5% for 5 minutes
- **Severity**: Warning
- **Runbook**: [Auth Failure Runbook](#auth-failure-runbook)

### 5. Webhook Failure Alert

- **Condition**: Webhook failure rate exceeds 1% for 5 minutes
- **Severity**: Warning
- **Runbook**: [Webhook Failure Runbook](#webhook-failure-runbook)

## Runbooks

### Availability Runbook

**Symptoms**: Service returning 5xx errors or not responding

**Investigation Steps**:

1. Check `/health/ready` endpoint for dependency status
2. Review recent deployments in GitHub Actions
3. Check database connectivity
4. Check Clerk service status

**Resolution**:

1. If deployment issue: Rollback to previous version
2. If database issue: Check connection pool, restart if needed
3. If Clerk issue: Check Clerk status page, implement fallback auth if available

### Latency Runbook

**Symptoms**: Slow response times affecting user experience

**Investigation Steps**:

1. Check `/metrics` for request duration histogram
2. Identify slow endpoints
3. Check database query performance
4. Check external API calls (OpenFoodFacts, Stripe, Clerk)

**Resolution**:

1. If database: Add indexes, optimize queries
2. If external API: Implement caching, add timeouts
3. If compute: Optimize code, add horizontal scaling

### Error Rate Runbook

**Symptoms**: Elevated 5xx error responses

**Investigation Steps**:

1. Check application logs for error details
2. Identify error patterns by endpoint
3. Check for recent code changes

**Resolution**:

1. If code bug: Fix and deploy hotfix
2. If validation issue: Update request schemas
3. If dependency issue: Implement circuit breaker

### Auth Failure Runbook

**Symptoms**: Elevated authentication failures

**Investigation Steps**:

1. Check Clerk service status
2. Review auth middleware logs
3. Check token expiration patterns

**Resolution**:

1. If Clerk outage: Implement graceful degradation
2. If token issue: Check token refresh logic
3. If configuration: Verify Clerk keys and URLs

### Webhook Failure Runbook

**Symptoms**: Webhook deliveries failing

**Investigation Steps**:

1. Check webhook logs for failure reasons
2. Verify destination endpoints are reachable
3. Check payload format

**Resolution**:

1. If endpoint issue: Contact service provider
2. If payload issue: Fix serialization
3. If timeout: Increase timeout or implement retry queue

## Escalation

1. **Level 1**: On-call engineer (auto-alert)
2. **Level 2**: Team lead (after 15 min unresolved)
3. **Level 3**: Engineering manager (after 1 hour unresolved)

## Alert Silencing

Alerts can be silenced during planned maintenance:

- Use Grafana alerting UI to silence specific alerts
- Document silence reason and expected duration
- Set auto-expiry for silence rules
