---
"@neo4j/graphql": minor
---

The `where` field for nested update operations has been deprecated to be moved within the `update` input field.
The `where` in its deprecated location is a no-op for all nested operations apart from `update`.

For example, the following mutation is using the deprecated syntax:

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

It should be modified to move the `where` inside the `update` operation:

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
