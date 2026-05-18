# Security Review — @neo4j/graphql

Repository: `neo4j/graphql`
Branch reviewed: `claude/security-review-yjexB` (= `dev` at `54a0a80`)
Scope: full repository, with emphasis on the `@neo4j/graphql` package (the GraphQL → Cypher translator), the introspector, and the federation example.

This is a defensive review. Each finding lists the file/line, what the code does, an assessment of exploitability, and a recommendation. Findings are ordered roughly by severity.

---

## Summary

The library's overall architecture is sound. User-provided values reach Cypher exclusively through `@neo4j/cypher-builder`'s `Cypher.Param` / `Cypher.NamedParam`, which parameterizes them as bind variables rather than concatenating them into query text. Filter operators (`CONTAINS`, `STARTS_WITH`, `MATCHES`, `IN`, ...) all route through `Cypher.contains` / `Cypher.matches` / etc., which likewise parameterize the right-hand side. Pagination, ordering, and projection use schema-derived identifiers, not client input. There is no `eval`, `new Function`, `child_process.exec`, or unsafe deserialization in the production code paths.

That said, there are a handful of real issues worth tracking, plus several patterns where the library defers responsibility to the integrating application without making that clear.

---

## Findings

### 1. `verify: false` disables JWT signature verification entirely — HIGH (by design, but under‑documented)
**File:** `packages/graphql/src/classes/authorization/Neo4jGraphQLAuthorization.ts:48-50`

```ts
if (this.authorization.verify === false) {
    debug("Skipping verifying JWT as verify is set to false");
    return decodeJwt(token);
}
```

When `Neo4jAuthorizationSettings.verify === false`, JWT signatures are not checked — any client-supplied token is decoded and its claims trusted. This is intended as a development/test affordance, but:

- There is no environment check (e.g. refusing it when `NODE_ENV === "production"`).
- There is no startup warning emitted to stderr.
- Documentation reachable from the README does not clearly flag the auth‑bypass impact.

**Recommendation:** Emit a loud `console.warn` at construction time when `verify === false`, and consider refusing the option when `NODE_ENV === "production"` unless an additional acknowledgement flag is set.

---

### 2. JWT silently degrades to "unauthenticated" on any verification error — MEDIUM
**File:** `packages/graphql/src/classes/authorization/Neo4jGraphQLAuthorization.ts:47-57`

```ts
try {
    ...
    return await this.verify(token, secret);
} catch (error) {
    debug("%s", error);
    return undefined;
}
```

A tampered, expired, or wrong-issuer token produces the same outcome as "no token supplied": the request proceeds as unauthenticated. For endpoints/fields that are protected only by `@authorization` filter rules (rather than `@authentication`), this means a request with an invalid token will be treated like an anonymous request rather than rejected.

This is not a vulnerability on its own — `@authentication` directives still reject unauthenticated traffic — but it is surprising behaviour. An attacker can probe with garbage tokens and never get a distinguishable error.

**Recommendation:** Surface verification failures as a structured error to the GraphQL layer rather than silently dropping them; at minimum, log at `warn` rather than `debug` so operators can see invalid-token bursts.

---

### 3. Subscription auth is decided once at connect time and never re-checked — MEDIUM
**Files:**
- `packages/graphql/src/schema/resolvers/composition/wrap-subscription.ts:44-60`
- (consumers of `connectionParams.jwt` in the subscription event path)

```ts
const authorizationContext = await getAuthorizationContext(
    context?.connectionParams || {},
    authorization,
    jwtClaimsMap
);
if (!context.connectionParams?.jwt) {
    context.connectionParams = { ...context.connectionParams, jwt: authorizationContext.jwt };
}
```

The JWT is decoded at subscription setup and cached on `context.connectionParams.jwt`. Subsequent event deliveries reuse the same decoded payload — there is no re-verification, no `exp` re-check on each event, and no path to revoke an in‑flight subscription. A long-lived WebSocket subscription will keep streaming events long after its token has expired or been revoked.

**Recommendation:** Re-check `exp` (and ideally re-run authorization rules against the cached `jwt`) on each event, or document a maximum subscription lifetime and require clients to reconnect.

---

### 4. `context.jwt` is trusted unconditionally if pre-populated — MEDIUM (integration footgun)
**File:** `packages/graphql/src/schema/resolvers/composition/utils/get-authorization-context.ts:28-40`

```ts
if (context.jwt) {
    const isAuthenticated = true;
    const jwt = context.jwt;
    ...
    return { isAuthenticated, jwt, ... };
}
```

If `context.jwt` is already set by the integrator, the library uses it as-is and skips all token parsing/verification. This is intentional — it lets an integrator pre-verify in their own middleware — but the trust boundary is fragile:

- Any code path that spreads request data into the GraphQL context (e.g. `context: ({ req }) => ({ ...req.body })`) can let a client populate `context.jwt` directly.
- The check is `if (context.jwt)`, with no shape/integrity marker.

This has been a real-world auth bypass pattern in other GraphQL servers.

**Recommendation:** Require a non-enumerable / Symbol-keyed marker on context-injected JWTs (e.g. `context[INTERNAL_JWT_SYMBOL] = payload`), so a JSON-coerced client payload cannot satisfy the trust check.

---

### 5. JWKS URL not validated against `https://` — MEDIUM
**File:** `packages/graphql/src/classes/authorization/Neo4jGraphQLAuthorization.ts:64`

```ts
return createRemoteJWKSet(new URL(key.url), key.options);
```

The `key.url` is forwarded straight to `new URL()` with no scheme check. A misconfigured deployment can point at `http://...` (signing key fetched in cleartext, susceptible to MITM substitution and full token forgery) or, depending on `jose` and the fetch transport, at non-HTTP schemes / internal addresses (potential SSRF surface if user/config-controlled).

In normal operation this is operator-controlled config, so impact is configuration-dependent rather than directly exploitable.

**Recommendation:** Reject non‑`https:` URLs by default; allow `http:` only behind an explicit insecure flag. Block link‑local / private addresses unless explicitly allowlisted.

---

### 6. Default `formatError` re-throws raw Neo4j errors to the client — MEDIUM
**File:** `packages/graphql/src/classes/Executor.ts:143-166`

```ts
private formatError(error: unknown) {
    if (error instanceof Neo4jError) {
        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
            return new Neo4jGraphQLForbiddenError("Forbidden");
        }
        ...
    }
    debug("%s", error);
    return error;
}
```

For any `Neo4jError` that doesn't match the four explicit patterns — and for non-`Neo4jError` errors — the original error is returned verbatim. GraphQL's default error formatter then surfaces `error.message` and (in non-production Apollo configurations) the stack trace to clients. This can leak generated Cypher fragments, parameter names, and database structure.

This is partially the integrator's responsibility (Apollo masks unexpected errors in production), but the default is overly permissive.

**Recommendation:** Wrap unrecognised errors in a generic `Neo4jGraphQLInternalError("Internal error")` and log the original at the server. Mirror Apollo's `production` behaviour by default.

---

### 7. `parseBearerToken` falls back to raw token + misleading debug log — LOW
**File:** `packages/graphql/src/classes/authorization/parse-request-token.ts:11-22`

```ts
export function parseBearerToken(bearerAuth: string): string | undefined {
    if (!bearerAuth.startsWith("Bearer ")) {
        debug("Authorization header with authentication scheme 'Bearer <token>'");
        return bearerAuth;
    }
    const token = bearerAuth.split("Bearer ")[1];
    ...
}
```

Two issues:

1. The "Bearer " check is case‑sensitive (RFC 7235 §2.1 requires schemes be matched case-insensitively). `bearer eyJ...` or `BEARER eyJ...` is treated as a raw token rather than a Bearer header.
2. The debug message printed in the *non-Bearer* branch claims the header has the Bearer scheme — the conditional and the message are inverted. Cosmetic, but it has led to confusion.

Behavioral risk is low (downstream `decodeJwt`/`jwtVerify` will reject malformed input), but the case sensitivity can cause spurious auth failures.

**Recommendation:** `startsWith("Bearer ")` → case-insensitive comparison; fix the debug message.

---

### 8. Introspector interpolates relationship type into the RETURN clause — LOW
**File:** `packages/introspector/src/to-internal-struct.ts:103-109`

```ts
const escapedType = escapeLabel(cleanTypeName(relType));
const relationshipsRes = await conSession.executeRead((tx) =>
    tx.run(`
        MATCH (n)-[r:${escapedType}]->(m)
        WITH DISTINCT labels(n) AS from, labels(m) AS to
        WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
        RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`)
);
```

The `MATCH` clause properly backtick-escapes (`escapeLabel`), but the `RETURN` clause emits `relType` as a string literal with only `"` doubled. This breaks several invariants:

- Backslashes are not escaped. A type name containing `\` becomes part of a Cypher escape sequence (`"\X"` is parsed by Cypher as an escape attempt). Worst case: an unterminated string and a syntax error.
- The `relType` value here is the raw form from `db.schema.relTypeProperties()`, which is shaped like `` :`Type` ``. The literal backticks are inside the quoted string — benign — but anything weird Neo4j allows in a relationship type name flows in unsanitized.

Exploitability: very low. To inject Cypher rather than just break the query, an attacker would need to land an unescaped `"` after escape-doubling, which the current rules prevent. Trust boundary: anyone with `CREATE`/relationship rights on the introspected database — i.e. the database owner, not a GraphQL client. So this is an integrity issue against the introspector tool, not a remote exploit.

**Recommendation:** Pass `relType` as a Cypher parameter rather than interpolating: `RETURN from, to, $relType AS relType`.

---

### 9. `replaceArgumentsInStatement` builds a regex from argument names without escaping — LOW (not currently exploitable)
**File:** `packages/graphql/src/translate/queryAST/utils/replace-arguments-in-statement.ts:23`

```ts
const reg = new RegExp(`\\$(${argNames.join("|")})\\b`, "g");
```

`argNames` come from the schema's `@cypher` argument definitions. GraphQL argument names are already restricted to `/[_A-Za-z][_0-9A-Za-z]*/` by `graphql-js`, so this is safe today. If the upstream constraint ever relaxes, or if a future caller passes raw names from another source, the regex breaks and could match unintended substrings.

The *value* substituted in is correctly wrapped in `Cypher.Param`, so even a regex misfire cannot inject Cypher — at worst it would substitute a parameter into the wrong position. Defence-in-depth fix:

**Recommendation:** `argNames.map(escapeRegExp).join("|")`.

---

### 10. `escapeQuery` is dead code with an unresolved security TODO — LOW
**File:** `packages/graphql/src/translate/utils/escape-query.ts`

```ts
export function escapeQuery(query: string): string {
    // TODO: Should single quotes be escaped?
    // return query.replace(/("|')/g, "\\$1");
    return query.replace(/("|\\)/g, "\\$1");
}
```

Grep confirms this function is referenced only by its own unit test — it is not used in production code paths. Leaving an unused, incomplete string-escaper around invites a future caller to reach for it instead of `Cypher.Param`.

**Recommendation:** Delete the function (and its test). If a need ever arises, force the caller to use `Cypher.Param` / `Cypher.Literal`.

---

### 11. No built-in query depth / complexity / rate limits — LOW (deferred to integrator)
**Files:** schema construction in `packages/graphql/src/schema/make-augmented-schema.ts`; no enforcement.

The library exposes a `complexityEstimators` opt-in for use with `graphql-query-complexity`, but ships no depth-limit or per-operation cost ceiling. Generated schemas include deeply nestable filter inputs (`AND` / `OR` / `NOT` recursion, nested relationship filters) that can produce expensive Cypher plans. A malicious client can craft a query with deep `OR` nesting and force the translator and Neo4j into pathological work.

**Recommendation:** Document recommended depth/complexity caps prominently. Consider shipping a default depth limit on filter recursion (configurable, e.g. 10 levels) inside the translator itself.

---

### 12. Default credentials in shipped Compose / federation example — LOW (sample code)
**Files:**
- `docker-compose.yaml:11` — `NEO4J_AUTH=neo4j/NeedsALongPassword`
- `packages/apollo-federation-subgraph-compatibility/src/index.ts:12-16` — `NEO4J_PASSWORD = "password"` as the env-var default

These are sample/test artefacts, not production code, but the federation example is the kind of file developers copy as a starting point.

**Recommendation:** In the federation example, refuse to start when `NEO4J_PASSWORD` is unset, rather than defaulting to `"password"`.

---

## Non-findings worth noting

These were checked and look correct; recording them so future reviewers can skip them.

- **Pagination (`SKIP`, `LIMIT`)** — `packages/graphql/src/translate/queryAST/ast/pagination/Pagination.ts:27-28`. Both are wrapped in `Cypher.Param`, so the values are bind variables, not interpolated.
- **Filter operators (`CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `MATCHES`, `IN`)** — `packages/graphql/src/translate/queryAST/utils/create-comparison-operator.ts`. All route through `Cypher.*` builders that parameterize the right-hand side. `MATCHES` does pass user input as a regex pattern — that's a *feature* of the API, and ReDoS protection is the integrator's responsibility, but it is not a Cypher injection.
- **`@cypher` directive statement** — `packages/graphql/src/translate/queryAST/ast/selection/CustomCypherSelection.ts`. The raw Cypher is provided by the schema author (server-side code), not the client. Client-supplied argument values reach the statement only via `Cypher.Param` substitution.
- **Full-text / vector index names** — wrapped via `Cypher.Literal` from schema-derived constants, not from query input.
- **`dot-prop` claim traversal** — `packages/graphql/src/translate/authorization/utils/populate-where-params.ts:46-51`, `filter-by-values.ts:93`. The path strings come from schema-author `@authorization` rules (e.g. `$jwt.roles`), not from client input. `dot-prop` does not traverse `__proto__`/`constructor`, so prototype pollution via the JWT payload is not reachable here.
- **No `eval` / `new Function` / `vm.runInContext` / `child_process.exec`** in production source.

---

## Suggested next steps

1. Address findings 1, 3, 4 first — they are the auth-related ones with the highest blast radius.
2. Tighten the default `formatError` (#6) — easy win, removes a recurrent customer-support footgun and stops Cypher leakage.
3. Migrate the introspector RETURN clause to a parameter (#8) and delete `escapeQuery` (#10) in one cleanup PR.
4. Add a "Production hardening" section to the docs covering: depth/complexity caps, introspection disabling, `verify: false` warnings, and the `context.jwt` trust boundary.
