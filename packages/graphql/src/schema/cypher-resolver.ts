import { isInt } from "neo4j-driver";
import { deserialize, execute, serialize } from "../utils";
import { BaseField } from "../types";
import getFieldTypeMeta from "./get-field-type-meta";
import { NeoSchema } from "../classes";

/**
 * Called on custom (Queries & Mutations "TOP LEVEL") with a @cypher directive. Not to mistaken for @cypher type fields.
 */
function cypherResolver({
    defaultAccessMode,
    field,
    statement,
    getSchema,
}: {
    defaultAccessMode: "READ" | "WRITE";
    field: BaseField;
    statement: string;
    getSchema: () => NeoSchema;
}) {
    async function resolve(_root: any, args: any, context: any) {
        const neoSchema = getSchema();

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const result = await execute({
            cypher: statement,
            params: serialize(args),
            driver,
            defaultAccessMode,
            neoSchema,
            raw: true,
        });

        const values = result.records.map((record) => {
            const value = record._fields[0];

            if (["number", "string", "boolean"].includes(typeof value)) {
                return value;
            }

            if (!value) {
                return undefined;
            }

            if (isInt(value)) {
                return Number(value);
            }

            if (value.identity && value.labels && value.properties) {
                return deserialize(value.properties);
            }

            return deserialize(value);
        });

        if (!field.typeMeta.array) {
            return values[0];
        }

        return values;
    }

    return {
        type: field.typeMeta.pretty,
        resolve,
        args: field.arguments.reduce((args, arg) => {
            const meta = getFieldTypeMeta(arg);

            return {
                ...args,
                [arg.name.value]: {
                    type: meta.pretty,
                    description: arg.description,
                    defaultValue: arg.defaultValue,
                },
            };
        }, {}),
    };
}

export default cypherResolver;
