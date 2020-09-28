/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SelectionNode, FieldNode } from "graphql";
import { generate } from "randomstring";
import { NeoSchema, Node } from "../classes";
import formatCypherProperties from "./format-cypher-properties";

function createProjectionAndParams({
    graphQLArgs,
    node,
    neoSchema,
    selections,
}: {
    graphQLArgs: any;
    node: Node;
    neoSchema: NeoSchema;
    selections: SelectionNode[];
}): [string, any] {
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

        const cypherField = node.cypherFields.find((x) => x.fieldName === selection.name.value);

        const id = generate({
            charset: "alphabetic",
        });

        if (cypherField) {
            const cypherSelections = selection.selectionSet?.selections as SelectionNode[];

            const cypherProjection = createProjectionAndParams({
                graphQLArgs,
                node,
                neoSchema,
                selections: cypherSelections,
            });

            const apocStr = `${id} IN apoc.cypher.runFirstColumn("MATCH (p:Person) RETURN p", {this: this}, true) | ${id} ${cypherProjection[0]}`;

            if (cypherField.typeMeta.array) {
                return proj.concat(`${selection.name.value}: [${apocStr}]`);
            }

            return proj.concat(`${selection.name.value}: head(${apocStr})`);
        }

        return proj.concat(`.${selection.name.value}`);
    }

    return [formatCypherProperties(selections.reduce(reducer, [])), {}];
}

export default createProjectionAndParams;
