export const AUTH_FORBIDDEN_ERROR = "@neo4j/graphql/FORBIDDEN";
export const AUTH_UNAUTHENTICATED_ERROR = "@neo4j/graphql/UNAUTHENTICATED";
export const MIN_NEO4J_VERSION = "4.1.0";
export const MIN_APOC_VERSION = "4.1.0";
export const REQUIRED_APOC_FUNCTIONS = [
    "apoc.util.validatePredicate",
    "apoc.cypher.runFirstColumn",
    "apoc.coll.sortMulti",
    "apoc.date.convertFormat",
];
export const REQUIRED_APOC_PROCEDURES = ["apoc.util.validate", "apoc.do.when"];
