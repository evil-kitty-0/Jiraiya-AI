# Jiraiya-Cyber Foundation

Jiraiya-Cyber adds an authorization-first security assessment workflow to Jiraiya.

## Workflow

```
Discover -> Analyze -> Verify proposal -> Ask permission -> Bounded PoC -> Evidence -> Report
```

The current foundation intentionally **does not execute active security tests**. It provides the policy and data structures that active tools must pass through later.

## Components

- `cyber/scope.py` — explicit host/path scope validation.
- `cyber/findings.py` — structured finding lifecycle.
- `cyber/authorization.py` — per-finding, per-target, per-action, time/attempt bounded authorization.
- `cyber/verifier.py` — non-destructive verification proposal layer.
- `cyber/evidence.py` — timestamped evidence capture with conservative secret redaction.
- `cyber/reporter.py` — structured bug-bounty-style report output.
- `cyber/planner.py` — assessment task planning without execution.

## Authorization rule

A future active PoC executor must require a matching authorization record for the exact finding, target, and action. Authorization is single-use by default and automatically expires.

No authorization for one finding should grant permission for another finding or another target.

## Local API

- `POST /api/cyber/scope` — configure explicit assessment scope.
- `POST /api/cyber/finding` — register a candidate finding inside scope.
- `GET /api/cyber/findings` — list findings.
- `POST /api/cyber/finding/<id>/verification` — generate a verification proposal.
- `POST /api/cyber/finding/<id>/authorization` — create a **pending** authorization request.
- `POST /api/cyber/authorization/<id>/approve` — explicit user approval.
- `POST /api/cyber/authorization/<id>/consume` — consume the approved authorization. This foundation returns a gated status and performs no active PoC.
- `GET /api/cyber/authorization/<id>` — inspect authorization state.

The API is bound to Jiraiya's existing localhost service. Future active tools must call the authorization consume path immediately before execution and stop when the authorization is exhausted or expired.
