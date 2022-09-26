# Output Validation

type User @validate(AND: [{aboveZero_GT: 0}]) {
    id: ID!
    aboveZero: Int!
}
