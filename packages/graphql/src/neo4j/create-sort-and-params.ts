/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ArgumentNode, ObjectValueNode, ListValueNode, EnumValueNode } from "graphql";

function createSortAndParams({
    astArgs,
    graphQLArgs,
    varName,
}: {
    graphQLArgs: any;
    astArgs: ArgumentNode[];
    varName: string;
}): [string, any] {
    let sortStr = "";
    const params: any = {};

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const sortArg = optionsValue.fields.find((x) => x.name.value === "sort");

        if (sortArg) {
            let sorts: string[] = [];

            if ("value" in sortArg.value) {
                // @ts-ignore
                const value = sortArg.value as ListValueNode;
                const values = value.values as EnumValueNode[];

                sorts = values.map((x) => x.value);
            } else {
                const value = graphQLArgs.options.sort as string[];

                sorts = value;
            }

            const sortArr = sorts.map((sort) => {
                let key;
                let direc;

                if (sort.includes("_DESC")) {
                    direc = "DESC";
                    [key] = sort.split("_DESC");
                } else {
                    direc = "ASC";
                    [key] = sort.split("_ASC");
                }

                return `${varName}.${key} ${direc}`;
            });

            if (sortArr.length) {
                sortStr = `ORDER BY ${sortArr.join(", ")}`;
            }
        }
    }

    return [sortStr, params];
}

export default createSortAndParams;
