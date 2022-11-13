import type { Node } from "@neo4j/graphql";
import type { Model } from "../classes";

// https://stackoverflow.com/a/60574755/10687857
function unquoteKeys(json) {
    return json.replace(/"(\\[^]|[^\\"])*"\s*:?/g, function (match) {
        if (/:$/.test(match)) return match.replace(/^"|"(?=\s*:$)/g, "");
        else return match;
    });
}

export function buildSelectionSetFromSelect({
    select,
    models,
    node,
    nodes,
}: {
    select: Record<string, any>;
    model: Model;
    models: Model[];
    node: Node;
    nodes: Node[];
}) {
    const selectionSet = [`{`];

    Object.entries(select).forEach(([key, value]) => {
        if (!value) {
            return;
        }

        const relationField = node.relationFields.find((field) => field.fieldName === key);

        if (relationField) {
            const relationModel = models.find((m) => m.name === relationField.typeMeta.name) as Model;
            const relationNode = nodes.find((n) => n.name === relationField.typeMeta.name) as Node;

            const relationSelect = buildSelectionSetFromSelect({
                select: value.select as Record<string, any>,
                model: relationModel,
                models,
                node: relationNode,
                nodes,
            });

            const inlineArguments: string[] = [];

            if (value.where) {
                const graphqlCompatiableInlineJSON = unquoteKeys(JSON.stringify(value.where));
                inlineArguments.push(`where: ${graphqlCompatiableInlineJSON}`);
            }

            if (value.options) {
                const graphqlCompatiableInlineJSON = unquoteKeys(JSON.stringify(value.options));
                inlineArguments.push(`options: ${graphqlCompatiableInlineJSON}`);
            }

            if (inlineArguments.length) {
                selectionSet.push(`${key}(${inlineArguments.join(", ")}) ${relationSelect}`);
            } else {
                selectionSet.push(`${key} ${relationSelect}`);
            }
        } else if (key.endsWith("Aggregate?") || key.endsWith("Connection")) {
            // TODO
            throw new Error("select 'Aggregate' and select 'Connection' not supported");
        } else {
            selectionSet.push(key);
        }
    });

    selectionSet.push("}");

    return selectionSet.join("\n").replace(",", "");
}
