# Input contract

Every source document must use the Google OKF v0.2 envelope and include at least one complete HTTP(S) URL in `sources`.

RCPs must use `artifact: requirement-context-pack`. User Stories must use `artifact: user-story` and must belong to the product passed to the builder.

The complete URL must identify the repository, ref and path, for example:

```text
https://gitlab.example.com/group/knowledge-base/-/blob/main/requirement/user-stories/US-001-search.md
```

`kb://`, bare IDs and repository-relative paths alone are rejected because a provider or external development team cannot navigate them without additional oral context.
