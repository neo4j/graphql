/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SelectionNode, FieldNode, ObjectValueNode } from "graphql";
import { generate } from "randomstring";
import { NeoSchema, Node } from "../classes";
import formatCypherProperties from "./format-cypher-properties";
import createWhereAndParams from "./create-where-and-params";

function createProjectionAndParams({
    graphQLArgs,
    node,
    neoSchema,
    fieldNode,
    parentID,
}: {
    graphQLArgs: any;
    node: Node;
    neoSchema: NeoSchema;
    fieldNode: FieldNode;
    parentID?: string;
}): [string, any] {
    let args = {};

    function reducer(proj: string[], selection: SelectionNode) {
        if (selection.kind !== "Field") {
            return proj;
        }

        if (selection.name.value === "edges") {
            const edgesSelection = selection.selectionSet?.selections as SelectionNode[];

            // @ts-ignore
            const nodeSelection = edgesSelection.find((x) => x.name.value === "node") as FieldNode;

            // @ts-ignore
            return [...proj, ...nodeSelection.selectionSet?.selections.reduce(reducer, [])];
        }

        const id = generate({
            charset: "alphabetic",
        });

        const cypherField = node.cypherFields.find((x) => x.fieldName === selection.name.value);
        if (cypherField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);

            const cypherProjection = createProjectionAndParams({
                graphQLArgs,
                node: referenceNode || node,
                neoSchema,
                fieldNode: selection,
            });

            const apocStr = `${id} IN apoc.cypher.runFirstColumn("${cypherField.statement}", {this: this}, true) | ${id} ${cypherProjection[0]}`;

            if (cypherField.typeMeta.array) {
                return proj.concat(`${selection.name.value}: [${apocStr}]`);
            }

            return proj.concat(`${selection.name.value}: head([${apocStr}])`);
        }

        const relationField = node.relationFields.find((x) => x.fieldName === selection.name.value);
        if (relationField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const relType = relationField.type;
            const relDirection = relationField.direction;

            // @ts-ignore
            const value = fieldNode.arguments?.find((x) => x.name === "query") as ObjectValueNode;

            const where = createWhereAndParams({
                graphQLArgs,
                neoSchema,
                node: referenceNode,
                varName: id,
                value,
            });

            args = { ...args, ...where[1] };

            const projection = createProjectionAndParams({
                node: referenceNode,
                neoSchema,
                fieldNode: selection,
                graphQLArgs,
                parentID: id,
            });

            args = { ...args, ...projection[1] };

            const match = `${selection.name.value}: [ (${parentID || "this"})${
                relDirection === "IN" ? "<-" : "-"
            }[:${relType}]${relDirection === "OUT" ? "->" : "-"}(${id}:${referenceNode?.name})${
                where[0] ? where[0] : ""
            } | ${id} ${projection[0]}  ]`;

            return proj.concat(match);
        }

        return proj.concat(`.${selection.name.value}`);
    }

    // @ts-ignore
    return [formatCypherProperties(fieldNode.selectionSet?.selections.reduce(reducer, [])), {}];
}

export default createProjectionAndParams;
