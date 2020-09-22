/* eslint-disable no-useless-escape */
import { GraphQLResolveInfo, SelectionNode } from "graphql";

export type Context = Record<string, unknown>;

export function cypherQuery(args: any, _context: Context, resolveInfo: GraphQLResolveInfo): [string, any] {
    const { returnType } = resolveInfo;

    const typeName = returnType.toString();

    const selections = getSelections(resolveInfo);

    const safeVariableName = safeVar(lowFirstLetter(typeName));

    const safeLabelName = safeLabel([typeName]);

    const projection = selections?.reduce((proj, selection, i, arr) => {
        if (selection.kind !== "Field") {
            return proj;
        }

        const last = Boolean(i === arr.length - 1);
        const lastBracket = last ? "}" : "";
        const trailingComma = !last ? "," : "";

        return `${proj} .${selection.name.value}${trailingComma} ${lastBracket}`;
    }, "{");

    const query = `
        MATCH (${safeVariableName}:${safeLabelName})
        RETURN ${safeVariableName} ${projection} AS ${safeVariableName}
    `;

    return [query, args];
}

function getSelections(resolveInfo: GraphQLResolveInfo): SelectionNode[] | undefined {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === resolveInfo.fieldName);

    const selections = node?.selectionSet?.selections as SelectionNode[];

    return selections;
}

function safeVar(s: string): string {
    const asStr = `${s}`;

    // Rules: https://neo4j.com/docs/developer-manual/current/cypher/syntax/naming/
    return `\`${asStr.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, "_")}\``;
}

function safeLabel(l: string | Array<string>): string {
    let label = l;

    if (!Array.isArray(label)) {
        label = [label];
    }

    const safeLabels = label.map((x) => {
        const asStr = `${x}`;
        const escapeInner = asStr.replace(/\`/g, "\\`");

        return `\`${escapeInner}\``;
    });

    return safeLabels.join(":");
}

function lowFirstLetter(word: string): string {
    return word.charAt(0).toLowerCase() + word.slice(1);
}
