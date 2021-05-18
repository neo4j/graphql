import { ResolveTree } from "graphql-parse-resolve-info";
import { PointField } from "../../../types";

function createPointElement({
    resolveTree,
    field,
    variable,
}: {
    resolveTree: ResolveTree;
    field: PointField;
    variable: string;
}): string {
    const isArray = field.typeMeta.array;

    const { crs, ...point } = resolveTree.fieldsByTypeName[field.typeMeta.name];
    const fields: string[] = [];

    // Sadly need to select the whole point object due to the risk of height/z
    // being selected on a 2D point, to which the database will throw an error
    if (point) {
        fields.push(isArray ? "point:p" : `point: ${variable}.${resolveTree.name}`);
    }

    if (crs) {
        fields.push(isArray ? "crs: p.crs" : `crs: ${variable}.${resolveTree.name}.crs`);
    }

    return isArray
        ? `${resolveTree.alias}: [p in ${variable}.${resolveTree.name} | { ${fields.join(", ")} }]`
        : `${resolveTree.alias}: { ${fields.join(", ")} }`;
}

export default createPointElement;
