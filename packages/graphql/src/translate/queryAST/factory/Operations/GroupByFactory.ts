import type { ResolveTree } from "graphql-parse-resolve-info";
import { GroupByField } from "../../ast/fields/group-by/GroupByField";
import type { QueryASTFactory } from "../QueryASTFactory";

export class GroupByFactory {
    private queryASTFactory: QueryASTFactory;
    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

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
            alias: resolveTree.alias,
            by: filterByFields,
        });
    }
}
