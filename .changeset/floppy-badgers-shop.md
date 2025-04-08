---
"@neo4j/graphql": major
---

The `where` field for nested update operations has been moved within the `update` input field.
The `where` in its previous location was a no-op for all nested operations apart from `update`.

For example, the following syntax would filter the `Post` nodes to update in Version 6:

```graphql
mutation {
    updateUsers(
        where: { name: { eq: "Darrell" } }
        update: {
            posts: {
                where: { node: { title: { eq: "Version 7 Release Notes" } } }
                update: { node: { title: { set: "Version 7 Release Announcement" } } }
            }
        }
    )
}
```

In Version 7, this `where` has been moved inside the `update` operation:

```graphql
mutation {
    updateUsers(
        where: { name: { eq: "Darrell" } }
        update: {
            posts: {
                update: {
                    where: { node: { title: { eq: "Version 7 Release Notes" } } }
                    node: { title: { set: "Version 7 Release Announcement" } }
                }
            }
        }
    )
}
```
