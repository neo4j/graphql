import { Neo4jGraphQL } from "@neo4j/graphql";

export { default as filterDocument } from "./filter-document";

export function getReferenceNode(schema: Neo4jGraphQL, relationField: any) {
    return schema.nodes.find((x) => x.name === relationField.typeMeta.name);
}
