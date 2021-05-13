import { CustomEnumField, CustomScalarField, DateTimeField, PointField, PrimitiveField } from "../types";

interface Fields {
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    primitiveFields: PrimitiveField[];
    dateTimeFields: DateTimeField[];
    pointFields: PointField[];
}

function getWhereFields({ typeName, fields, enableRegex }: { typeName: string; fields: Fields; enableRegex: boolean }) {
    return {
        OR: `[${typeName}Where!]`,
        AND: `[${typeName}Where!]`,
        // Custom scalar fields only support basic equality
        ...fields.scalarFields.reduce((res, f) => {
            res[f.fieldName] = f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name;
            return res;
        }, {}),
        ...[...fields.primitiveFields, ...fields.dateTimeFields, ...fields.enumFields, ...fields.pointFields].reduce(
            (res, f) => {
                // This is the only sensible place to flag whether Point and CartesianPoint are used
                // if (f.typeMeta.name === "Point") {
                //     pointInTypeDefs = true;
                // } else if (f.typeMeta.name === "CartesianPoint") {
                //     cartesianPointInTypeDefs = true;
                // }

                res[f.fieldName] = f.typeMeta.input.where.pretty;
                res[`${f.fieldName}_NOT`] = f.typeMeta.input.where.pretty;

                if (f.typeMeta.name === "Boolean") {
                    return res;
                }

                if (f.typeMeta.array) {
                    res[`${f.fieldName}_INCLUDES`] = f.typeMeta.input.where.type;
                    res[`${f.fieldName}_NOT_INCLUDES`] = f.typeMeta.input.where.type;
                    return res;
                }

                res[`${f.fieldName}_IN`] = `[${f.typeMeta.input.where.pretty}]`;
                res[`${f.fieldName}_NOT_IN`] = `[${f.typeMeta.input.where.pretty}]`;

                if (["Float", "Int", "BigInt", "DateTime"].includes(f.typeMeta.name)) {
                    ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                    });
                    return res;
                }

                if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                    ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = `${f.typeMeta.name}Distance`;
                    });
                    return res;
                }

                if (["String", "ID"].includes(f.typeMeta.name)) {
                    if (enableRegex) {
                        res[`${f.fieldName}_MATCHES`] = "String";
                    }

                    [
                        "_CONTAINS",
                        "_NOT_CONTAINS",
                        "_STARTS_WITH",
                        "_NOT_STARTS_WITH",
                        "_ENDS_WITH",
                        "_NOT_ENDS_WITH",
                    ].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                    });
                    return res;
                }

                return res;
            },
            {}
        ),
    };
}

export default getWhereFields;
