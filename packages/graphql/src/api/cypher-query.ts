import { GraphQLResolveInfo } from "graphql";
import { getArguments, getSelections } from "../graphql";
import { formatCypherProperties } from "../neo4j";

const safe = (w: string) => w.replace(/\[/g, "").replace(/\]/g, "").replace(/!/g, "");
const escape = (w: string) => `\`${w}\``;

function cypherQuery(args: any, _context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const { returnType } = resolveInfo;
    const typeName = returnType.toString();

    const selections = getSelections(resolveInfo);
    const queryArgs = getArguments(resolveInfo);

    const safeName = escape(safe(typeName));

    let cypherParams: { [k: string]: any } = {};

    const projection = selections?.reduce((proj: string[], selection) => {
        if (selection.kind !== "Field") {
            return proj;
        }

        return proj.concat(`.${selection.name.value}`);
    }, []) as string[];

    const properties = queryArgs
        .filter((x) => !["skip", "limit"].includes(x.name.value))
        .reduce(
            (allArgs, currentArg) => {
                let incomingArg;

                if ("value" in currentArg.value) {
                    incomingArg = currentArg.value.value;
                } else {
                    incomingArg = args[currentArg.name.value];
                }

                const argName = currentArg.name.value;

                return {
                    propertiesArgs: {
                        ...allArgs.propertiesArgs,
                        [currentArg.name.value]: incomingArg,
                    },
                    propertiesArr: allArgs.propertiesArr.concat(`${escape(argName)}:$${argName}`),
                };
            },
            { propertiesArr: [], propertiesArgs: {} } as { propertiesArr: string[]; propertiesArgs: any }
        );

    cypherParams = { ...cypherParams, ...properties.propertiesArgs };

    let skipStr = "";
    const skipArg = queryArgs.find((x) => x.name.value === "skip");
    if (skipArg) {
        skipStr = "SKIP $skip";

        if ("value" in skipArg.value) {
            cypherParams.skip = skipArg.value.value;
        } else {
            cypherParams.skip = args[skipArg.name.value];
        }
    }

    let limitStr = "";
    const limitArg = queryArgs.find((x) => x.name.value === "limit");
    if (limitArg) {
        limitStr = "LIMIT $limit";

        if ("value" in limitArg.value) {
            cypherParams.limit = limitArg.value.value;
        } else {
            cypherParams.limit = args[limitArg.name.value];
        }
    }

    const query = `
        MATCH (${safeName}:${safeName}${formatCypherProperties(properties.propertiesArr)})
        RETURN ${safeName}${formatCypherProperties(projection)} AS ${safeName}
        ${skipStr || ""}
        ${limitStr || ""}
    `;

    return [query, args];
}

export default cypherQuery;
