import { ResolveTree } from "graphql-parse-resolve-info";
import { DateTimeField } from "../../../types";

function createDatetimeElement({
    resolveTree,
    field,
    variable,
}: {
    resolveTree: ResolveTree;
    field: DateTimeField;
    variable: string;
}): string {
    return field.typeMeta.array
        ? `${resolveTree.alias}: [ dt in ${variable}.${resolveTree.name} | apoc.date.convertFormat(toString(dt), "iso_zoned_date_time", "iso_offset_date_time") ]`
        : `${resolveTree.alias}: apoc.date.convertFormat(toString(${variable}.${resolveTree.name}), "iso_zoned_date_time", "iso_offset_date_time")`;
}

export default createDatetimeElement;
