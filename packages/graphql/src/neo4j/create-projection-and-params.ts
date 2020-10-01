import { generate } from "randomstring";
import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { NeoSchema, Node } from "../classes";
import formatCypherProperties from "./format-cypher-properties";
import createWhereAndParams from "./create-where-and-params";

function createProjectionAndParams({
    fieldsByTypeName,
    node,
    neoSchema,
    parentID,
    typeName,
}: {
    fieldsByTypeName: FieldsByTypeName;
    node: Node;
    neoSchema: NeoSchema;
    parentID?: string;
    typeName: string;
}): [string, any] {
    let args = {};

    function reducer(proj: string[], [k, field]: [string, FieldsByTypeName]) {
        /* TODO should we concatenate? Need a better recursive mechanism other than parentID. 
           Using IDS may lead to cleaner code but also sacrifice clean testing.
        */
        const id = generate({
            charset: "alphabetic",
        });

        const cypherField = node.cypherFields.find((x) => x.fieldName === k);
        if (cypherField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name) as Node;

            // @ts-ignore
            const fieldFields = field.fieldsByTypeName as FieldsByTypeName;
            const cypherProjection = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode || node,
                neoSchema,
                typeName: referenceNode?.name,
            });
            args = { ...args, ...field.args, ...cypherProjection[1] };

            const apocFieldArgs = Object.keys(field.args).reduce(
                (res: string[], v) => [...res, `${v}:$${v}`],
                []
            ) as string[];

            const apocStr = `${id} IN apoc.cypher.runFirstColumn("${cypherField.statement}", {this: ${
                parentID || "this"
            }, ${apocFieldArgs.join(", ")}}, true) | ${id} ${cypherProjection[0]}`;

            if (cypherField.typeMeta.array) {
                return proj.concat(`${k}: [${apocStr}]`);
            }

            return proj.concat(`${k}: head([${apocStr}])`);
        }

        const relationField = node.relationFields.find((x) => x.fieldName === k);
        if (relationField) {
            const referenceNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const relType = relationField.type;
            const relDirection = relationField.direction;

            let whereStr = "";
            let projectionStr = "";

            const query = field.args.query as any;
            const options = field.args.options as any;

            if (query) {
                const where = createWhereAndParams({
                    query,
                    varName: id,
                });
                whereStr = where[0];
                args = { ...args, ...where[1] };
            }

            // @ts-ignore
            const fieldFields = field.fieldsByTypeName as FieldsByTypeName;
            const projection = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode,
                neoSchema,
                parentID: id,
                typeName: referenceNode.name,
            });
            projectionStr = projection[0];
            args = { ...args, ...projection[1] };

            const nodeMatchStr = `(${parentID || "this"})`;
            const inStr = relDirection === "IN" ? "<-" : "-";
            const relTypeStr = `[:${relType}]`;
            const outStr = relDirection === "OUT" ? "->" : "-";
            const nodeOutStr = `(${id}:${referenceNode?.name})`;
            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
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

                    nestedQuery = `${k}: apoc.coll.sortMulti([ ${pathStr} ${whereStr} | ${id} ${projectionStr} ], [${sorts.join(
                        ", "
                    )}])${sortLimitStr}`;
                }

                nestedQuery = `${k}: [ ${pathStr} ${whereStr} | ${id} ${projectionStr} ]${sortLimitStr}`;
            } else {
                nestedQuery = `${k}: [ ${pathStr} ${whereStr} | ${id} ${projectionStr} ]`;
            }

            return proj.concat(nestedQuery);
        }

        return proj.concat(`.${k}`);
    }

    // @ts-ignore
    return [formatCypherProperties(Object.entries(fieldsByTypeName[typeName]).reduce(reducer, [])), args];
}

export default createProjectionAndParams;
