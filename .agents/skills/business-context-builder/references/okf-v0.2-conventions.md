# OKF v0.2 conventions — Business Context

The program uses Google OKF v0.2 as its canonical Markdown knowledge representation and adds governance conventions.

Every generated concept MUST contain `type`, `title`, `description`, `tags`, `status`, `generated`, and `sources`. New agent-generated concepts use `status: draft`; `generated.by` identifies the producing Skill/version; human verification is external and MUST NOT be fabricated.

Prefer concept references over duplication, preserve source identity/version, represent assumptions explicitly, represent missing/conflicting information as open questions, and preserve downstream lineage. Suggested IDs: `BCP-*`, `BO-*`, `STK-*`, `BC-*`, `BCON-*`, `BRISK-*`, `BAS-*`, `BOQ-*`.
