---
"@neo4j/graphql": patch
---

Fix a privilege-escalation vulnerability where a field-level `@authentication` rule on a root custom-resolver field was silently ignored when the operation type also carried a type-level `@authentication` rule. Type-level and field-level `@authentication` are now enforced independently, so stricter per-field requirements (such as a required JWT role) are applied as declared.
