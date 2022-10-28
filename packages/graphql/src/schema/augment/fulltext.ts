import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { fulltextResolver } from "../resolvers/query/fulltext";
import { lowerFirst } from "../../utils/lower-first";
import { upperFirst } from "../../utils/upper-first";
import { SCORE_FIELD } from "../../graphql/directives/fulltext";

const fulltextScoreWhereType = "FulltextScoreWhere";

export function augmentFulltextSchema(
    node: Node,
    composer: SchemaComposer,
    nodeWhereTypeName: string,
    nodeSortTypeName: string
) {
    if (node.fulltextDirective) {
        const fields = node.fulltextDirective.indexes.reduce(
            (res, index) => ({
                ...res,
                [index.name]: composer.createInputTC({
                    name: `${node.name}${upperFirst(index.name)}Fulltext`,
                    fields: {
                        phrase: "String!",
                    },
                }),
            }),
            {}
        );

        const fulltextResultDescription = `The result of a fulltext search on an index of ${node.name}`;
        const fulltextWhereDescription = `The input for filtering a fulltext query on an index of ${node.name}`;
        const fulltextSortDescription = `The input for sorting a fulltext query on an index of ${node.name}`;

        composer.createInputTC({
            name: `${node.name}Fulltext`,
            fields,
        });

        composer.createInputTC({
            name: fulltextScoreWhereType,
            description: "The input for filtering the score of a fulltext search",
            fields: {
                min: "Float",
                max: "Float",
            },
        });

        composer.createInputTC({
            name: node.fulltextTypeNames.sort,
            description: fulltextSortDescription,
            fields: {
                [SCORE_FIELD]: "SortDirection",
                [lowerFirst(node.name)]: nodeSortTypeName,
            },
        });

        composer.createInputTC({
            name: node.fulltextTypeNames.where,
            description: fulltextWhereDescription,
            fields: {
                [SCORE_FIELD]: fulltextScoreWhereType,
                [lowerFirst(node.name)]: nodeWhereTypeName,
            },
        });

        composer.createObjectTC({
            name: node.fulltextTypeNames.result,
            description: fulltextResultDescription,
            fields: {
                [SCORE_FIELD]: "Float",
                [lowerFirst(node.name)]: node.name,
            },
        });

        node.fulltextDirective.indexes.forEach((index) => {
            let queryName = `${node.plural}Fulltext${upperFirst(index.name)}`;
            if (index.queryName) {
                queryName = index.queryName;
            }
            composer.Query.addFields({
                [queryName]: fulltextResolver({ node }, index),
            });
        });
    }
}
