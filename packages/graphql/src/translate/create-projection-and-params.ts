import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { NeoSchema, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLWhereArg } from "../types";

interface Res {
    projection: string[];
    params: any;
}

function createProjectionAndParams({
    fieldsByTypeName,
    node,
    neoSchema,
    chainStr,
    varName,
}: {
    fieldsByTypeName: FieldsByTypeName;
    node: Node;
    neoSchema: NeoSchema;
    chainStr?: string;
    varName: string;
}): [string, any] {
    function reducer(res: Res, [key, field]: [string, FieldsByTypeName]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const whereInput = field.args.where as GraphQLWhereArg;
        const optionsInput = field.args.options as GraphQLOptionsArg;
        const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
        const cypherField = node.cypherFields.find((x) => x.fieldName === key);

        if (cypherField) {
            let projectionStr = "";

            const referenceNode = neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);
            if (referenceNode) {
                const recurse = createProjectionAndParams({
                    fieldsByTypeName: fieldFields,
                    node: referenceNode || node,
                    neoSchema,
                    varName: `${varName}_${key}`,
                    chainStr: param,
                });
                projectionStr = recurse[0];
                res.params = { ...res.params, ...recurse[1] };
            }

            const apocParams = Object.entries(field.args).reduce(
                (r: { strs: string[]; params: any }, f) => {
                    const argName = `${param}_${f[0]}`;

                    return {
                        strs: [...r.strs, `${f[0]}: $${argName}`],
                        params: { ...r.params, [argName]: f[1] },
                    };
                },
                { strs: [], params: {} }
            ) as { strs: string[]; params: any };
            res.params = { ...res.params, ...apocParams.params };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";

            const apocStr = `${param} IN apoc.cypher.runFirstColumn("${cypherField.statement}", {this: ${
                chainStr || varName
            }${apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""}}, ${expectMultipleValues}) ${
                projectionStr ? `| ${param} ${projectionStr}` : ""
            }`;

            if (!cypherField.typeMeta.array) {
                res.projection.push(`${key}: head([${apocStr}])`);
                return res;
            }

            res.projection.push(`${key}: [${apocStr}]`);
            return res;
        }

        const relationField = node.relationFields.find((x) => x.fieldName === key);
        if (relationField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relType = relationField.type;
            const relDirection = relationField.direction;
            const isArray = relationField.typeMeta.array;

            let whereStr = "";
            let projectionStr = "";

            if (whereInput) {
                const where = createWhereAndParams({
                    whereInput,
                    varName: `${varName}_${key}`,
                });
                whereStr = where[0];
                res.params = { ...res.params, ...where[1] };
            }

            const recurse = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode || node,
                neoSchema,
                varName: `${varName}_${key}`,
                chainStr: param,
            });
            projectionStr = recurse[0];
            res.params = { ...res.params, ...recurse[1] };

            const nodeMatchStr = `(${chainStr || varName})`;
            const inStr = relDirection === "IN" ? "<-" : "-";
            const relTypeStr = `[:${relType}]`;
            const outStr = relDirection === "OUT" ? "->" : "-";
            const nodeOutStr = `(${param}:${referenceNode?.name})`;
            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
            const innerStr = `${pathStr} ${whereStr} | ${param} ${projectionStr}`;

            let nestedQuery;

            if (optionsInput) {
                let sortLimitStr = "";

                if (optionsInput.skip && !optionsInput.limit) {
                    sortLimitStr = `[${optionsInput.skip}..]`;
                }

                if (optionsInput.limit && !optionsInput.skip) {
                    sortLimitStr = `[..${optionsInput.limit}]`; // TODO options.limit + 1 ?
                }

                if (optionsInput.limit && optionsInput.skip) {
                    sortLimitStr = `[${optionsInput.skip}..${optionsInput.limit}]`;
                }

                if (optionsInput.sort) {
                    const sorts = optionsInput.sort.map((x) => {
                        const [fieldName, op] = x.split("_");

                        if (op === "DESC") {
                            return `'${fieldName}'`;
                        }

                        return `'^${fieldName}'`;
                    });

                    nestedQuery = `${key}: apoc.coll.sortMulti([ ${innerStr} ], [${sorts.join(", ")}])${sortLimitStr}`;
                } else {
                    nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${sortLimitStr}${
                        !isArray ? ")" : ""
                    }`;
                }
            } else {
                nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${!isArray ? ")" : ""}`;
            }

            res.projection.push(nestedQuery);
            return res;
        }

        res.projection.push(`.${key}`);
        return res;
    }

    const { projection, params } = Object.entries(fieldsByTypeName[node.name] as { [k: string]: any }).reduce(reducer, {
        projection: [],
        params: {},
    }) as Res;

    return [`{ ${projection.join(", ")} }`, params];
}

export default createProjectionAndParams;
