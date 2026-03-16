import type { ResolveTree } from "graphql-parse-resolve-info";
import { GroupByField } from "../../ast/fields/group-by/GroupByField";

export class GroupByFactory {
    public createGroupByField({ resolveTree }: { resolveTree: ResolveTree }): GroupByField {
        const fields: Record<string, boolean> = (resolveTree.args.fields as Record<string, boolean>) ?? {};
        const filterByFields = Object.entries(fields)
            .filter(([_, groupBy]) => {
                return groupBy;
            })
            .map(([fieldName, _]) => {
                return fieldName;
            });
        return new GroupByField({
            alias: "groupBy", // Top level should be groupBy, as the alias is handled by GraphQL
            by: filterByFields,
        });
    }
}
