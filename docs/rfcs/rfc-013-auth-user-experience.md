# Auth User Experience

## Problem

- Complete lack of type definition validation - errors only become apparent at query runtime
- Disparity between query `where` and "where" in auth rules
- Confusion between `allow`, `bind` and `where`
- Empty results vs errors - what's the best approach? - this is security
- `isAuthenticated` checks happen in the database - this is a bad thing
- No global auth options - `isAuthenticated` and `roles` would be useful here
- Validate that auth works when defined on an interface - multiple `@auth` directives (one on interface, one on type)?
- Auth on relationship properties?

## Requirements

### Must have

- Dynamic checking of `@auth` directives against the types to which they are applied
- Same filtering functionality is used for authorization as filtering for queries and mutations
  - Must have `node` jumps between relationships to leave room for filtering on relationship properties
- `isAuthenticated` checks happen in the server code rather than in the database
- TODO: Reconsidered naming for `allow` and `bind`
- TODO: Reconsidered whether `where` should actually be in the `@auth` directive or not
- TODO: Reconsidered whether empty results or errors should be returned

### Should have

- `@auth` directives on interface types - if we don't implement this, then we should explicitly prevent it

### Could have

- Filtering on relationship properties

### Won't have (this time)

- Global `isAuthenticated` and `roles` - this should be pitched separately

## Proposed Solution

How are you proposing we will solve the problem described above?

Feel free to add/remove subheadings below as appropriate:

### Usage Examples

## Risks

What risks might cause us to go over the appetite described above?

### Security consideration

Please take some time to think about potential security issues/considerations for the proposed solution.
For example: How can a malicious user abuse this? How can we prevent that in such case?

## Out of Scope

What are we definitely not going to implement in this solution?
