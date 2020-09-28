/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SelectionNode, FieldNode } from "graphql";
import { NeoSchema, Node } from "../classes";
import formatCypherProperties from "./format-cypher-properties";

function createProjectionAndParams({
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

        return proj.concat(`.${selection.name.value}`);
    }

    return [formatCypherProperties(selections.reduce(reducer, [])), {}];
}

export default createProjectionAndParams;
