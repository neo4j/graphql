# Example Title

## Problem

Currently, the `@customResolver` directive allows users to define fields that a custom resolver requires in order to provide it's intended functionality. These fields are then always fetched from the database if the `@customResolver` field is requested. However, only fields defined on the same type as the `@customResolver` field, can be used in the `requires` argument. A user may want to use fields on related types. This is not currently possible.

## Proposed Solution

The requires argument should be updated to accept a selection set (i.e. `firstName lastName address { city }` which would fetch the `firstName`, `lastName` and `address.city` fields.). Nested fields should be provided to the custom resolver as nested objects.

In version 3.x.x this new input type should be optional and the only input should be deprecated. This will allow users to try out the feature ahead of 4.0.0.

In version 4.0.0, the array input should be removed.

### Usage Examples

#### Fetching only fields available on the base type

Type Defs:

```gql
type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String @customResolver(requires: "firstName lastName")
}
```

Resolver:

```js
const resolvers = {
    User: {
        fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
    },
};
```

#### Fetching a field from a related type

Type Defs:

```gql
type AddressType {
    street: String!
    city: String!
}

type User {
    id: ID!
    firstName: String!
    lastName: String!
    address: AddressType @relationship(type: "LIVES_AT", direction: OUT)
    fullName: String @customResolver(requires: "firstName lastName address { city }")
}
```

OR

```gql
type AddressType {
    street: String!
    city: String!
}

type User {
    id: ID!
    firstName: String!
    lastName: String!
    address: AddressType @relationship(type: "LIVES_AT", direction: OUT)
    fullName: String @customResolver(requires: "firstName address { city } lastName") # Note that non-nested fields can be required after the nested fields
}
```

Resolver:

```js
const resolvers = {
    User: {
        fullName: ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`,
    },
};
```

Cypher (when just fullName selected):

```
MATCH (this:`User`)

CALL {
    WITH this
    MATCH (this)-[this0:LIVES_AT]->(this_address:`AddressType`)
    WITH this_address { .city } AS this_address
    RETURN head(collect(this_address)) AS this_address
}
RETURN this { .fullName, address: this_address, .firstName, .lastName } AS this
```

Note this is the same cypher as when the firstName, lastName, address city and fullName are manually selected.


#### Fetching from a double nested related node

Type Defs:

```gql
type City {
    name: String!
    population: Int
}

type AddressType {
    street: String!
    city: City! @relationship(type: "IN_CITY", direction: OUT)
}

type User {
    id: ID!
    firstName: String!
    lastName: String!
    address: AddressType @relationship(type: "LIVES_AT", direction: OUT)
    fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
}
```

Resolver:

```js
const resolvers = {
    User: {
        fullName: ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        },
    },
};
```

#### Requiring a related UNION

Type Defs:

```gql
union Publication = Book | Journal

type Author {
    name: String!
    publications: [Publication!]! @relationship(type: "WROTE", direction: OUT)
    publicationsWithAuthor: [String!]! @customResolver(requires: "name publications { ...on Book { title } ... on Journal { subject } }")
}

type Book {
    title: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN)
}

type Journal {
    subject: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN)
}
```

Resolver:

```js
const resolvers = {
    Author: {
        publicationsWithAuthor: ({ name, publications }) =>
            publications.map((publication) => `${publication.title || publication.subject} by ${name}`),
    },
};
```

Cypher:

```
MATCH (this:`Author`)
CALL {
    WITH this
    CALL {
        WITH *
        MATCH (this)-[this0:WROTE]->(this_publications:`Book`)
        WITH this_publications  { __resolveType: "Book",  .title } AS this_publications
        RETURN this_publications AS this_publications
        UNION
        WITH *
        MATCH (this)-[this1:WROTE]->(this_publications:`Journal`)
        WITH this_publications  { __resolveType: "Journal",  .subject } AS this_publications
        RETURN this_publications AS this_publications
    }
    WITH this_publications
    RETURN collect(this_publications) AS this_publications
}
RETURN this { .name, publications: this_publications, .publicationsWithAuthor } AS this
```

Note this is the same cypher as requesting the fields manually using the following query:

```gql
query Query {
  authors {
    name
    publications {
      ... on Book {
        title
      }
      ... on Journal {
        subject
      }
    }
    publicationsWithAuthor
  }
}
```

#### Requiring a related interface

Type Defs:

```gql
interface Publication {
    publicationYear: Int!
}

type Author {
    name: String!
    publications: [Publication!]! @relationship(type: "WROTE", direction: OUT)
    publicationsWithAuthor: [String!]! @customResolver(requires: "name publications { publicationYear ...on Book { title } ... on Journal { subject } }")
}

type Book implements Publication {
    title: String!
    publicationYear: Int!
    author: [Author!]! @relationship(type: "WROTE", direction: IN)
}

type Journal implements Publication {
    subject: String!
    publicationYear: Int!
    author: [Author!]! @relationship(type: "WROTE", direction: IN)
}
```

Resolver:

```js
const resolvers = {
    Author: {
        publicationsWithAuthor: ({ name, publications }) =>
            publications.map((publication) => `${publication.title || publication.subject} by ${name} in ${publication.publicationYear}`),
    },
};
```

Cypher:

```
MATCH (this:`Author`)
WITH *
CALL {
WITH *
CALL {
    WITH this
    MATCH (this)-[this0:WROTE]->(this_Book:`Book`)
    
    RETURN { __resolveType: "Book", title: this_Book.title, publicationYear: this_Book.publicationYear } AS this_publications
    UNION
    WITH this
    MATCH (this)-[this1:WROTE]->(this_Journal:`Journal`)
    
    RETURN { __resolveType: "Journal", subject: this_Journal.subject, publicationYear: this_Journal.publicationYear } AS this_publications
}
RETURN collect(this_publications) AS this_publications
}
RETURN this { .name, publications: this_publications, .publicationsWithAuthor } AS this
```

Note the same as the cypher for the following query:

```gql
query Query {
  authors {
    name
    publications {
      ... on Book {
        title
      }
      ... on Journal {
        subject
      }
      publicationYear
    }
    publicationsWithAuthor
  }
}
```

### Documentation Updates

There is not currently documentation for using the `requires` argument. This needs to be added to document the new possibilities. Consider using the above examples for simple tutorials on using this feature.

## Risks

### Security consideration

#### Do `@auth` rules on the related nodes/fields still need to be applied?

Yes. These auth rules will likely still apply in the majority of cases. We could consider adding an option to `@customResolver` to disable these checks where they are not required. However, this is out of the scope of this work.

This behaviour needs to be validated by integration tests.

#### Can `@exclude`/`@readonly`/`@writeonly` nodes/fields be required?

It should be possible to require these fields as clients cannot directly access them.
