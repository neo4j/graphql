import { Node, Relationship } from "../../../classes";
import { ConnectionWhereArg, Context } from "../../../types";
import createRelationshipWhereAndParams from "./create-relationship-where-and-params";
import createNodeWhereAndParams from "./create-node-where-and-params";

function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    const whereStrs: string[] = [];
    let params = {};

    if (whereInput.node) {
        const nodeWhere = createNodeWhereAndParams({
            whereInput: whereInput.node,
            node,
            nodeVariable,
            context,
            parameterPrefix: `${parameterPrefix}.node`,
        });
        whereStrs.push(nodeWhere[0]);
        params = { ...params, node: nodeWhere[1] };
    }

    if (whereInput.node_NOT) {
        const nodeWhere = createNodeWhereAndParams({
            whereInput: whereInput.node_NOT,
            node,
            nodeVariable,
            context,
            parameterPrefix: `${parameterPrefix}.node_NOT`,
        });
        whereStrs.push(`(NOT ${nodeWhere[0]})`);
        params = { ...params, node_NOT: nodeWhere[1] };
    }

    if (whereInput.relationship) {
        const relationshipWhere = createRelationshipWhereAndParams({
            whereInput: whereInput.relationship,
            relationship,
            relationshipVariable,
            context,
            parameterPrefix: `${parameterPrefix}.relationship`,
        });
        whereStrs.push(relationshipWhere[0]);
        params = { ...params, relationship: relationshipWhere[1] };
    }

    if (whereInput.relationship_NOT) {
        const relationshipWhere = createRelationshipWhereAndParams({
            whereInput: whereInput.relationship_NOT,
            relationship,
            relationshipVariable,
            context,
            parameterPrefix: `${parameterPrefix}.relationship_NOT`,
        });
        whereStrs.push(`(NOT ${relationshipWhere[0]})`);
        params = { ...params, relationship_NOT: relationshipWhere[1] };
    }

    if (whereInput.AND) {
        const innerClauses: string[] = [];

        whereInput.AND.forEach((a, i) => {
            const and = createConnectionWhereAndParams({
                whereInput: a,
                node,
                nodeVariable,
                relationship,
                relationshipVariable,
                context,
                parameterPrefix: `${parameterPrefix}.AND[${i}]`,
            });

            innerClauses.push(`${and[0]}`);
            params = { ...params, ...and[1] };
        });

        whereStrs.push(`(${innerClauses.join(" AND ")})`);
    }

    if (whereInput.OR) {
        const innerClauses: string[] = [];

        whereInput.OR.forEach((o, i) => {
            const or = createConnectionWhereAndParams({
                whereInput: o,
                node,
                nodeVariable,
                relationship,
                relationshipVariable,
                context,
                parameterPrefix: `${parameterPrefix}.OR[${i}]`,
            });

            innerClauses.push(`${or[0]}`);
            params = { ...params, ...or[1] };
        });

        whereStrs.push(`(${innerClauses.join(" OR ")})`);
    }

    return [whereStrs.join(" AND "), params];
}

export default createConnectionWhereAndParams;
