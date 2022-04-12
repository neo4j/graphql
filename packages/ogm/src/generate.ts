/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { codegen } from "@graphql-codegen/core";
import * as typescriptPlugin from "@graphql-codegen/typescript";
import { Types } from "@graphql-codegen/plugin-helpers";
import * as fs from "fs";
import * as graphql from "graphql";
import prettier from "prettier";
import { OGM } from "./index";
import { getReferenceNode } from "./utils";
import { upperFirst } from "./utils/upper-first";

export interface IGenerateOptions {
    /**
        File to write types to
    */
    outFile?: string;
    /**
        If specified will return the string contents of file and not write
    */
    noWrite?: boolean;
    /**
        Instance of @neo4j/graphql-ogm
    */
    ogm: OGM;
}

/*  This function will generate TypeScript aggregate input types
/   Because aggregating is all selectionSet based...
/   We make some typescript types, where the corresponding object that will be reflected into a selectionSet
/   ---Before---
    ogm.Model.aggregate({
        selectionSet: `
            title {
                min
                max
            }
            imdbRating {
                avg
            }
        `
    })
    ---After---
    ogm.Model.aggregate({
        aggregate: {
            title: {
                min: true
                max: true
            },
            imdbRating: {
                avg: true
            }
        }
    })
*/
function createAggregationInput({
    basedOnSearch,
    typeName,
    aggregateSelections = {},
    input,
}: {
    basedOnSearch: string;
    typeName: string;
    aggregateSelections?: Record<string, any>;
    input: string;
}) {
    const interfaceStrs = [`export interface ${typeName} {`];

    const [, start] = input.split(basedOnSearch);
    const [body] = start.split(`}`);
    const lines = body.split("\n").filter(Boolean);

    lines.forEach((line) => {
        const [fieldName, type] = line.split(": ").map((x) => x.trim().replace(";", ""));

        if (fieldName === "__typename?") {
            return;
        }

        if (type.endsWith(`AggregateSelectionNonNullable`) || type.endsWith(`AggregateSelectionNullable`)) {
            const newTypeName = `${type.replace(`Selection`, "Input")}`;

            if (!aggregateSelections[type]) {
                const createdInput = createAggregationInput({
                    basedOnSearch: `export type ${type} = {`,
                    typeName: newTypeName,
                    aggregateSelections,
                    input,
                });

                aggregateSelections[type] = createdInput[0];
            }

            interfaceStrs.push(`${removeOptional(fieldName)}?: ${newTypeName};`);

            return;
        }

        interfaceStrs.push(`${removeOptional(fieldName)}?: boolean;`);
    });

    interfaceStrs.push("}");

    return [interfaceStrs.join("\n"), aggregateSelections];
}

function hasConnectOrCreate(node: any, ogm: OGM): boolean {
    for (const relation of node.relationFields) {
        const refNode = getReferenceNode(ogm, relation);
        if (refNode && refNode.uniqueFields.length > 0) {
            return true;
        }
    }

    return false;
}

async function generate(options: IGenerateOptions): Promise<undefined | string> {
    await options.ogm.init();

    const config: Types.GenerateOptions = {
        config: {},
        plugins: [
            {
                typescript: {},
            },
        ],
        filename: options.outFile || "some-random-file-name-thats-not-used",
        documents: [],
        schemaAst: options.ogm.schema,
        schema: graphql.parse(graphql.printSchema(options.ogm.schema)),
        pluginMap: {
            typescript: typescriptPlugin,
        },
    };

    const output = await codegen(config);

    const content: string[] = [`import { SelectionSetNode, DocumentNode } from "graphql";`, output];

    const aggregateSelections: any = {};
    const modeMap: Record<string, string> = {};

    options.ogm.nodes.forEach((node) => {
        const modelName = `${node.name}Model`;
        const hasFulltextArg = Boolean(node.fulltextDirective);

        modeMap[node.name] = modelName;

        const aggregationInput = createAggregationInput({
            basedOnSearch: `__typename?: '${node.aggregateTypeNames.selection}';`,
            typeName: node.aggregateTypeNames.input,
            aggregateSelections,
            input: output,
        });

        const nodeHasConnectOrCreate = hasConnectOrCreate(node, options.ogm);
        const model = `
            ${Object.values(aggregationInput[1]).join("\n")}
            ${aggregationInput[0]}

            export declare class ${modelName} {
                public find(args?: {
                    where?: ${node.name}Where;
                    ${hasFulltextArg ? `fulltext?: ${node.name}Fulltext;` : ""}
                    options?: ${node.name}Options;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<${node.name}[]>
                public create(args: {
                    input: ${node.name}CreateInput[];
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<Create${upperFirst(node.plural)}MutationResponse>
                public update(args: {
                    where?: ${node.name}Where;
                    update?: ${node.name}UpdateInput;
                    ${node.relationFields.length ? `connect?: ${node.name}ConnectInput` : ""}
                    ${node.relationFields.length ? `disconnect?: ${node.name}DisconnectInput` : ""}
                    ${node.relationFields.length ? `create?: ${node.name}CreateInput` : ""}
                    ${nodeHasConnectOrCreate ? `connectOrCreate?: ${node.name}ConnectOrCreateInput` : ""}
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<Update${upperFirst(node.plural)}MutationResponse>
                public delete(args: {
                    where?: ${node.name}Where;
                    ${node.relationFields.length ? `delete?: ${node.name}DeleteInput` : ""}
                    context?: any;
                    rootValue?: any;
                }): Promise<{ nodesDeleted: number; relationshipsDeleted: number; }>
                public aggregate(args: {
                    where?: ${node.name}Where;
                    ${hasFulltextArg ? `fulltext?: ${node.name}Fulltext;` : ""}
                    aggregate: ${node.name}AggregateSelectionInput;
                    context?: any;
                    rootValue?: any;
                }): Promise<${node.name}AggregateSelection>
            }
        `;

        content.push(model);
    });

    content.push(`
        export interface ModelMap {
            ${Object.entries(modeMap)
                .map(([k, v]) => `${k}: ${v}`)
                .join(";\n")}
        }
    `);

    const formattedContent = prettier.format(content.join("\n"), { parser: "typescript" });

    if (options.noWrite) {
        return formattedContent;
    }

    if (!options.outFile) {
        throw new Error("outFile or noWrite required");
    }

    await fs.promises.writeFile(options.outFile, formattedContent);

    return undefined;
}

export default generate;

function removeOptional(type: string): string {
    return type.replace(/\?$/, "");
}
