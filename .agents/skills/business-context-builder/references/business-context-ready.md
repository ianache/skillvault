# Quality Gate — BUSINESS_CONTEXT_READY

A pack is ready only after human review confirms downstream discovery can start without silently inventing critical context.

| Check | Pass condition |
|---|---|
| Problem/opportunity | Explicit and source-backed |
| Objectives | BO concept or explicit open question |
| Outcome/KPI | Defined or measurement gap explicit |
| Scope | In and out explicitly separated |
| Stakeholders | Principal stakeholders or gap recorded |
| Capabilities | Impacted capability/process identified |
| Constraints | Known constraints source-backed |
| Dependencies | Known dependencies listed |
| Risks | Material known risks captured |
| Assumptions | Separate from facts; unverified |
| Open questions | Visible; blocking flag present |
| Sources | Resolvable provenance |
| Conflicts | Resolved by evidence/human decision or open |
| Verification | Human review external to generation |

Outcomes: `READY`, `READY_WITH_OPEN_QUESTIONS`, `NOT_READY`. The agent may recommend an outcome but MUST NOT self-verify.
