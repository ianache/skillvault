# Evidence Schema

```yaml
evidence_id: EVD-YYYY-NNNN
source_type: requirement|document|ticket|repository|interview|api|human
source_locator: stable locator or reference
observed_at: 2026-01-01T00:00:00Z
claim: functional claim supported by the source
classification: fact|assumption|inference|hypothesis|gap|decision
confidence: high|medium|low
freshness: current|aging|stale|unknown
owner: role responsible for confirmation
```

Use this record for every material finding. Never hide uncertainty.
