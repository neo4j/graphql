/* eslint-disable no-inner-declarations */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectValueNode } from "graphql";
import { generate } from "randomstring";
import { NeoSchema, Node } from "../classes";

type Parent = {
    parent?: Parent;
    type: "AND" | "OR";
    index: number;
};

function createWhereAndParams({
    value,
    graphQLArgs,
    varName,
    node,
    neoSchema,
    parent,
}: {
    value: ObjectValueNode;
    node: Node;
    neoSchema: NeoSchema;
    graphQLArgs: any;
    varName: string;
    parent?: Parent;
}): [string, any] {
    let params = {};

    let where = `WHERE`;

    function recurse(v: ObjectValueNode) {
        const { fields } = v;

        for (let i = 0; i < fields.length; i += 1) {
            const field = fields[i];
            const next = fields[i + 1];

            const id = generate({
                charset: "alphabetic",
            });

            switch (field.name.value) {
                case "AND":
                    {
                        // @ts-ignore
                        const values = field.value.values as ObjectValueNode[];

                        where += ` (`;

                        for (let ii = 0; ii < values.length; ii += 1) {
                            const and = values[ii];
                            const n = values[ii + 1];

                            const _parent: Parent = {
                                parent,
                                type: "AND",
                                index: ii,
                            };

                            const andWhere = createWhereAndParams({
                                value: and,
                                graphQLArgs,
                                varName,
                                node,
                                neoSchema,
                                parent: _parent,
                            });

                            const whereGone = andWhere[0].replace("WHERE", "");
                            where += `(${whereGone})`;

                            params = { ...params, ...andWhere[1] };

                            if (n) {
                                where += " AND ";
                            }
                        }

                        where += ` )`;
                    }
                    break;

                case "OR":
                    {
                        // @ts-ignore
                        const values = field.value.values as ObjectValueNode[];

                        where += ` (`;

                        for (let ii = 0; ii < values.length; ii += 1) {
                            const or = values[ii];
                            const n = values[ii + 1];

                            const _parent: Parent = {
                                parent,
                                type: "OR",
                                index: ii,
                            };

                            const orWhere = createWhereAndParams({
                                value: or,
                                graphQLArgs,
                                varName,
                                node,
                                neoSchema,
                                parent: _parent,
                            });

                            const whereGone = orWhere[0].replace("WHERE", "");
                            where += `(${whereGone})`;

                            params = { ...params, ...orWhere[1] };

                            if (n) {
                                where += " OR ";
                            }
                        }

                        where += ` )`;
                    }
                    break;

                default: {
                    where += ` ${varName}.${field.name.value} = $${id}`;
                    let incomingArg;

                    if ("value" in field.value) {
                        incomingArg = field.value.value;
                    } else {
                        incomingArg = graphQLArgs.query[field.name.value];

                        if (parent) {
                            function walker(p: Parent, obj) {
                                if (p?.parent) {
                                    return walker(p.parent, obj[p.type][p.index]);
                                }

                                return obj[p?.type][p?.index][field.name.value];
                            }

                            incomingArg = walker(parent, graphQLArgs.query);
                        }
                    }

                    params[id] = incomingArg;
                }
            }

            if (next) {
                where += " AND ";
            }
        }
    }

    if (!value) {
        return ["", params];
    }

    recurse(value);

    return [where, params];
}

export default createWhereAndParams;
