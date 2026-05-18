# Security Review — Supplementary Findings

This is a follow-up pass to `SECURITY_REVIEW.md` covering vulnerability classes not fully explored in the first pass: prototype pollution / mass assignment, authorization logic flaws, ReDoS / DoS / resource exhaustion, and crypto / secret handling.

**Methodology note:** delegated four parallel focused audits, then verified every concrete claim by reading the cited code. Several agent-reported "findings" did not hold up under inspection and are recorded under "False positives" at the end so future reviewers don't re-investigate them.

---

## New findings (verified)

### S1. Subscription JWT is not re-checked for expiry on each event — MEDIUM
**Files:**
- `packages/graphql/src/schema/resolvers/subscriptions/where/authorization.ts:34-50` (per-event filter)
- `packages/graphql/src/schema/resolvers/subscriptions/where/utils/populate-where-params.ts`
- `packages/graphql/src/schema/resolvers/composition/wrap-subscription.ts:44-50` (one-time decode)

The full chain:
1. `wrapSubscription` calls `getAuthorizationContext()` once at subscribe time.
2. The decoded JWT payload is cached on `context.connectionParams.jwt` and `context.authorization.jwt`.
3. Each event then flows through `subscriptionAuthorization()`:

```ts
const results = matchedRules.map((rule) => {
    if (rule.requireAuthentication && !context.authorization.jwt) {
        return false;
    }
    const where = populateWhereParams({ where: rule.where, context });
    return filterByAuthorizationRules({ entityAdapter: entity, where, event, context });
});
return multipleConditionsAggregationMap.OR(results);
```

The check `!context.authorization.jwt` is a *presence* check, not an *expiry* check. The cached JWT payload's `exp` claim is never re-validated, the signature is never re-verified, and there is no path to revoke a subscription. A subscription opened with a token expiring in 60 seconds will continue to receive events indefinitely (until the WebSocket disconnects for other reasons).

This is a strict extension of finding #3 in the main report — here it's the per-event evaluation path that fails to re-check, not just the connect-time decode.

**Recommendation:** In `subscriptionAuthorization()`, validate `context.authorization.jwt.exp` against `Date.now()/1000` on each invocation; treat expired as `false`. Document an upper bound on subscription lifetime.

---

### S2. `UnwindCreate` accepts arbitrary-size input arrays — MEDIUM (DoS)
**File:** `packages/graphql/src/translate/queryAST/ast/operations/UnwindCreateOperation.ts:100-114`

```ts
const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);
const createClause = new Cypher.Create(
    new Cypher.Pattern(nestedContext.target, { labels: getEntityLabels(target, ...) })
);
...
for (const field of this.inputFields.values()) {
    ...
    createClause.set(...field.getSetParams(nestedContext, this.unwindVariable));
}
```

`this.argumentToUnwind` is the client-supplied `input: [...]` array on bulk-create mutations. There is no length cap anywhere on the path from GraphQL input to `UNWIND`. The cost is linear in array size both at the translator and at Neo4j, so a single request with `input: [<10 million elements>]` will pin both. Per-element validation happens *inside* the unwind, so cost is also linear in object complexity.

Combine with the lack of query-complexity defaults (main report #11) and an unauthenticated client can submit pathological create payloads through any field with create permissions.

**Recommendation:** Enforce a server-configurable cap (e.g. default 1000 elements) on bulk-create input arrays, with a clear error when exceeded.

---

### S3. Subscription `subscriptionAuthorization()` defaults to allow when no rule matches the event type — LOW (footgun)
**File:** `packages/graphql/src/schema/resolvers/subscriptions/where/authorization.ts:26-32`

```ts
const matchedRules = (subscriptionsAuthorization?.filter || []).filter((rule) =>
    rule.events.some((e) => authorizationEventMatchesEvent(e, event.event))
);

if (!matchedRules.length) {
    return true;
}
```

If `@subscriptionsAuthorization` has rules but none of them list the current event type (e.g. only `CREATED` rules defined, but a `DELETED` event arrives), the function returns `true` — the event is delivered. A developer who writes `@subscriptionsAuthorization(filter: [{ events: [CREATED], where: {...} }])` may reasonably expect that delete events are *not* delivered to unauthorized clients; they will be.

The behaviour is symmetric with the entity-level `@authorization` directive (no rule = no restriction), but the practical surprise is bigger here because subscriptions naturally span multiple event types.

**Recommendation:** Either default to "deny when any rule is present for this entity but no rule matches this event type", or surface a schema-build warning when a `@subscriptionsAuthorization` directive omits an event type that is otherwise emitted for that entity.

---

### S4. Full incoming context (incl. JWT / connectionParams / token) is logged at debug — MEDIUM (operational)
**Files:**
- `packages/graphql/src/schema/resolvers/composition/wrap-subscription.ts:37` — `debugObject(debug, "incoming context", context)`
- `packages/graphql/src/schema/resolvers/composition/wrap-query-and-mutation.ts` — same pattern at request entry
- `packages/graphql/src/schema/resolvers/composition/utils/get-authorization-context.ts:32, 53` — `debugObject(debug, "using JWT provided in context", jwt)` / `"successfully decoded JWT"`

When the `debug` namespace `@neo4j/graphql:auth` (or `@neo4j/graphql:*`) is enabled — easy to do accidentally with `DEBUG=*` — the raw bearer token (from `context.token`) and the decoded JWT payload (including any embedded PII / role claims) are written to stderr via `console.log`-style formatting. There is no redaction, no allowlist of safe-to-log fields, and no warning at startup that turning on debug for this namespace will spill tokens.

If those stderr streams flow into a log aggregator with broader access than the application's secret store, this is effectively a credential leak via misconfiguration.

**Recommendation:** Redact the `Authorization` header, `context.token`, and the JWT payload by default. If a debugger really needs them, gate behind an explicit `NEO4J_GRAPHQL_DEBUG_SECRETS=1` opt-in. At minimum, replace the JWT payload with the `sub` claim only.

---

### S5. `@populatedBy` callbacks receive the full server context, including the decoded JWT — LOW (3rd-party trust surface)
**File:** `packages/graphql/src/translate/queryAST/utils/callback-bucket.ts:62-83`

```ts
await Promise.all(
    this.callbacks.map(async (cb) => {
        const callbackFunction = callbacksList[cb.functionName];
        if (callbackFunction) {
            const paramValue = await callbackFunction(
                cb.parent,
                {},
                { ...this.context, populatedByOperation: cb.operation }
            );
            ...
        }
    })
);
```

The spread `{ ...this.context, ... }` is shallow, so any nested mutation by a callback affects subsequent translator state. More importantly, the context handed to a `@populatedBy` callback includes `authorization.jwt` (the full decoded payload), the executor's driver handle, transaction metadata, and the features map. A malicious or compromised package providing a callback can exfiltrate JWTs, issue side-channel Cypher, or tamper with `cb.parent` (since `cb.parent` is also passed through and is also a live reference).

This is a "trust the schema author's npm dependencies" concern, not a remote vulnerability, but it widens the supply-chain surface considerably.

**Recommendation:** Pass callbacks a minimal, frozen context object — `{ jwt: deepClone(this.context.authorization.jwt), populatedByOperation }` — rather than the full translator context.

---

### S6. Filter recursion (`AND` / `OR` / `NOT`) has no depth cap — LOW (DoS)
**File:** `packages/graphql/src/translate/queryAST/factory/FilterFactory.ts` (factories iterate user-provided `AND`/`OR`/`NOT` recursively)

A client can submit a `where` such as `{ AND: [{ AND: [{ AND: [... 10000 levels ... ]}]}]}`. The translator recursively descends, eventually either blowing the stack (Node's default is in the high tens of thousands of frames, but several frames are consumed per level) or emitting a Cypher query whose plan compilation is itself expensive. Combined with S2, both the translator and Neo4j become attractive DoS targets.

This was already mentioned generically in main-report finding #11. Recording here with the specific recursive entry point.

**Recommendation:** Configurable max recursion depth for `AND`/`OR`/`NOT`, defaulting to ~10. Reject before translating.

---

### S7. Top-level `context` spread can leak attacker-controlled properties into the internal context — LOW (integration footgun)
**Files:**
- `packages/graphql/src/schema/resolvers/composition/wrap-subscription.ts:59` — `return next(root, args, { ...context, ...internalContext }, info)`
- `packages/graphql/src/schema/resolvers/composition/wrap-query-and-mutation.ts` (`{ neo4jDatabaseInfo, ...context, ...internalContext }`)

Internal-context keys (`authorization`, `schemaModel`, `executor`, …) are spread last, so the library's own keys are not overwritten — that part is safe. However, if the integrator constructs `context` directly from `req.body` or a similar client-influenced source, the final context will carry attacker-supplied properties on the side. Downstream `@populatedBy` callbacks or `@cypher` argument substitutions can then read those properties through `$context.<name>` paths.

Concretely: a client who can land an arbitrary `userId` key into context can have it picked up by any `@cypher` rule that does `$context.userId`, regardless of authentication.

Same family of issue as main-report finding #4. The two together justify a documentation page on "what the context is, what it must not contain, and how to keep client-controlled data out of it."

**Recommendation:** In integration docs, recommend a whitelist pattern: `context: ({ req }) => ({ token: req.headers.authorization })` rather than `context: ({ req }) => ({ ...req.body, token: ... })`. Optionally, add a runtime check that warns when known-internal keys (`authorization`, `executor`, `schemaModel`, `subscriptionsEngine`) are already present on the inbound context.

---

### S8. `@cypher` mutations run before projection-level authorization filtering — LOW (documented)
**File:** `packages/graphql/src/translate/queryAST/factory/Operations/CustomCypherFactory.ts`

When a `@cypher` field's `statement` performs writes (`CREATE`, `MERGE`, `DELETE`), the writes occur during Cypher execution. The library applies the *return type's* `@authorization` filters to the projection of the call, but those filters run after the writes have already taken effect. A schema author who assumes "the auth filter will stop the call from executing" is mistaken — the filter only redacts the returned values.

This is documented (somewhere) but very easy to miss. The risk surface is entirely the schema author's, but it's the same shape of footgun as Postgres `INSERT ... RETURNING` with a column-level grant.

**Recommendation:** Document prominently that `@cypher` statements with side effects need their own authorization gates inside the statement (e.g. a `WITH ... WHERE` guard at the top), not just `@authorization` on the return type.

---

## False positives (investigated, dropped)

These were flagged by initial agent passes but did not hold up under code inspection. Recording them so a future review doesn't re-do the work.

- **"Nested authorization is only applied at the top level."** False. `OperationFactory.ts:432` calls `authorizationFactory.getAuthFilters()` for every entity in the projection tree, and `ReadFactory` / `ConnectionFactory` / `AggregateFactory` / `Connect/Disconnect/Update/Delete` all pass through it. Traversing `A { b { c } }` runs B's and C's own `@authorization` filters at each hop.
- **"Subscriptions skip the entity-level authentication check."** False. `subscribe.ts:54` calls `checkAuthentication({ ..., operation: "SUBSCRIBE" })` at subscribe time, and `checkAuthenticationOnSelectionSet` at line 52 walks the selection set checking each entity.
- **"`AuthorizationFilters` combines rules with OR instead of AND, so an overly permissive rule grants access."** This is intended behaviour. Each rule has internal `AND` between its `where` conditions; multiple rules are `OR`-combined because each rule represents an independently sufficient grant (standard "any matching grant suffices" model). The framework matches the documented semantics.
- **"`AggregateFactory` count leaks existence."** Partially true in a *correct* sense — `count()` of authorized rows is what the user is allowed to see; that's not a bug. The aggregation factory does apply auth filters (`AggregateFactory.ts:102, 164, 266, 332, 448, 511, 588, 651`). No additional bypass found.
- **"Bearer token parsing accepts unprefixed tokens — bypass."** Not a bypass — the unprefixed-token branch returns the raw value to be passed to JWT verification, which then rejects malformed tokens normally. Already covered as a minor finding (main report #7) for the case-sensitivity / debug-message issues only.
- **"`createRemoteJWKSet` trusts client-supplied `kid`."** False. `jose` validates `kid` against the JWK set, and only matches a key present in the JWKS document. Not a key-fetch-from-URL pattern.

---

## Putting it together

After this pass, the ranked "what to fix first" list across both reports is:

1. **Main #1 (`verify: false`)** — production guard / loud warn.
2. **Main #6 (raw `Neo4jError` leakage)** — mask unrecognised errors.
3. **Main #4 + S7 (`context.jwt` / context spread)** — Symbol-keyed trust marker, doc page on context hygiene.
4. **Main #3 + S1 (subscription JWT staleness)** — re-check `exp` per event; bound subscription lifetime.
5. **S2 (`UnwindCreate` size cap)** + **S6 (filter recursion cap)** — bound input cost.
6. **S4 (debug log redaction)** — redact JWT / token in `debugObject`.
7. **Main #5 (JWKS `https://` enforcement)** — config-time scheme check.
8. **S3 (subscription default-allow on event-type miss)** — schema-build warning.
9. **S8 (`@cypher` write semantics)** — docs.
10. **Main #8 (introspector RETURN clause)** — parameterize.
11. **Main #10 (delete `escapeQuery`)**, **Main #7 (bearer case-insensitive)**, **Main #9 (escape regex arg names)** — three small cleanups.
12. **S5 (`@populatedBy` context exposure)** — narrow callback context.
13. **Main #12 (federation example default password)** — refuse blank password.
