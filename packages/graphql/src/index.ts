/* eslint-disable no-useless-escape */
import { ArgumentNode, GraphQLResolveInfo, SelectionNode } from "graphql";

export type Context = Record<string, unknown>;

export function cypherQuery(args: any, _context: Context, resolveInfo: GraphQLResolveInfo): [string, any] {
    const { returnType } = resolveInfo;

    const typeName = returnType.toString();

    const selections = getSelections(resolveInfo);
    const queryArgs = getArguments(resolveInfo);

    const safeVariableName = safeVar(lowFirstLetter(typeName));

    const safeLabelName = safeLabel([typeName]);

    const projection = selections?.reduce((proj: string[], selection) => {
        if (selection.kind !== "Field") {
            return proj;
        }

        return proj.concat(`.${selection.name.value}`);
    }, []) as string[];

    const properties = queryArgs.reduce(
        (allArgs, currentArg) => {
            let incomingArg;

            if ("value" in currentArg.value) {
                incomingArg = currentArg.value.value;
            } else {
                incomingArg = args[currentArg.name.value];
            }

            const argName = currentArg.name.value;
            const safeName = safeVar(argName);

            return {
                propertiesArgs: {
                    ...allArgs.propertiesArgs,
                    [currentArg.name.value]: incomingArg,
                },
                propertiesArr: allArgs.propertiesArr.concat(`${safeName}:$${argName}`),
            };
        },
        { propertiesArr: [], propertiesArgs: {} } as { propertiesArr: string[]; propertiesArgs: any }
    );

    const query = `
        MATCH (${safeVariableName}:${safeLabelName}${formatCypherProperties(properties.propertiesArr)})
        RETURN ${safeVariableName}${formatCypherProperties(projection)} AS ${safeVariableName}
    `;

    return [query, args];
}

function formatCypherProperties(properties: string[]): string {
    if (!properties.length) {
        return "";
    }

    return ` { ${properties.join(", ")} }`;
}

function getArguments(resolveInfo: GraphQLResolveInfo): ArgumentNode[] {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === resolveInfo.fieldName);

    const args = node?.arguments as ArgumentNode[];

    return args;
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
