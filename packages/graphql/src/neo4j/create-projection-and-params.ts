import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { NeoSchema, Node } from "../classes";
import formatCypherProperties from "./format-cypher-properties";
import createWhereAndParams from "./create-where-and-params";

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
    let args = {};

    function reducer(proj: string[], [key, field]: [string, FieldsByTypeName]) {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const cypherField = node.cypherFields.find((x) => x.fieldName === key);
        if (cypherField) {
            let projectionStr = "";

            const referenceNode = neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);
            if (referenceNode) {
                const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
                const cypherProjection = createProjectionAndParams({
                    fieldsByTypeName: fieldFields,
                    node: referenceNode || node,
                    neoSchema,
                    varName: `${varName}_${key}`,
                    chainStr: param,
                });
                projectionStr = cypherProjection[0];
                args = { ...args, ...field.args, ...cypherProjection[1] };
            }

            const apocFieldArgs = Object.keys(field.args).reduce(
                (res: string[], v) => [...res, `${v}: $${v}`],
                []
            ) as string[];

            const apocStr = `${param} IN apoc.cypher.runFirstColumn("${cypherField.statement}", {this: ${
                chainStr || varName
            }${apocFieldArgs.length ? `, ${apocFieldArgs.join(", ")}` : ""}}, true) ${
                projectionStr ? `| ${param} ${projectionStr}` : ""
            }`;

            if (!cypherField.typeMeta.array) {
                return proj.concat(`${key}: head([${apocStr}])`);
            }

            return proj.concat(`${key}: [${apocStr}]`);
        }

        const relationField = node.relationFields.find((x) => x.fieldName === key);
        if (relationField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relType = relationField.type;
            const relDirection = relationField.direction;
            const isArray = relationField.typeMeta.array;

            let whereStr = "";
            let projectionStr = "";

            const query = field.args.query as any;
            const options = field.args.options as any;

            if (query) {
                const where = createWhereAndParams({
                    query,
                    varName: `${varName}_${key}`,
                });
                whereStr = where[0];
                args = { ...args, ...where[1] };
            }

            const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
            const projection = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode || node,
                neoSchema,
                varName: `${varName}_${key}`,
                chainStr: param,
            });
            projectionStr = projection[0];
            args = { ...args, ...projection[1] };

            const nodeMatchStr = `(${chainStr || varName})`;
            const inStr = relDirection === "IN" ? "<-" : "-";
            const relTypeStr = `[:${relType}]`;
            const outStr = relDirection === "OUT" ? "->" : "-";
            const nodeOutStr = `(${param}:${referenceNode?.name})`;
            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
            const innerStr = `${pathStr} ${whereStr} | ${param} ${projectionStr}`;

            let nestedQuery;

            if (options) {
                let sortLimitStr = "";

                if (options.skip && !options.limit) {
                    sortLimitStr = `[${options.skip}..]`;
                }

                if (options.limit && !options.skip) {
                    sortLimitStr = `[..${options.limit}]`; // TODO options.limit + 1 ?
                }

                if (options.limit && options.skip) {
                    sortLimitStr = `[${options.skip}..${options.limit}]`;
                }

                if (options.sort) {
                    const sorts = options.sort.map((x) => {
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

            return proj.concat(nestedQuery);
        }

        return proj.concat(`.${key}`);
    }

    // @ts-ignore
    return [formatCypherProperties(Object.entries(fieldsByTypeName[node.name]).reduce(reducer, [])), args];
}

export default createProjectionAndParams;
