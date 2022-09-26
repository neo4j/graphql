# Output Validation

type User @validate(rule: {AND: [{aboveZero_GT: 0}]}) {
    id: ID!
    aboveZero: Int!
}
