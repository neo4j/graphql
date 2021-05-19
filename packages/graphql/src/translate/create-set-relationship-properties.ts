/* eslint-disable prefer-destructuring */
import { Relationship } from "../classes";
import { BaseField, DateTimeField, PrimitiveField } from "../types";

/*
    TODO - lets reuse this function for setting either node or rel properties.
           This was not reused due to the large differences between node fields
           - and relationship fields. 
*/
function createSetRelationshipProperties({
    properties,
    varName,
    relationship,
    operation,
}: {
    properties: Record<string, unknown>;
    varName: string;
    relationship: Relationship;
    operation: "CREATE" | "UPDATE";
}): [string, any] {
    const strs: string[] = [];
    const params = {};

    Object.entries(properties).forEach((entry) => {
        const paramName = `${varName}_${entry[0]}`;
        const field = (relationship.fields.find((x) => x.fieldName === entry[0]) as unknown) as BaseField;

        if ("timestamps" in field) {
            const f = field as DateTimeField;
            (f.timestamps || []).forEach((ts) => {
                if (ts.includes(operation)) {
                    strs.push(`SET ${varName}.${f.fieldName} = datetime()`);
                }
            });

            return;
        }

        if ("autogenerate" in field) {
            const f = field as PrimitiveField;

            strs.push(`SET ${varName}.${f.fieldName} = randomUUID()`);

            return;
        }

        if (["Point", "CartesianPoint"].includes(field.typeMeta.name)) {
            if (field.typeMeta.array) {
                strs.push(`SET ${varName}.${field.fieldName} = [p in $${paramName} | point(p)]`);
            } else {
                strs.push(`SET ${varName}.${field.fieldName} = point($${paramName})`);
            }

            params[paramName] = entry[1];

            return;
        }

        strs.push(`SET ${varName}.${field.fieldName} = $${paramName}`);
        params[paramName] = entry[1];
    });

    return [strs.join("\n"), params];
}

export default createSetRelationshipProperties;

/* eslint-enable prefer-destructuring */
