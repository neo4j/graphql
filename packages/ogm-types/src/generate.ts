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
import { OGM } from "@neo4j/graphql-ogm";
import upperFirst from "lodash.upperfirst";
import camelCase from "camelcase";
import pluralize from "pluralize";
import * as fs from "fs";
import * as graphql from "graphql";
import prettier from "prettier";

export interface IGenerateOptions {
    /**
        File to write types to
    */
    outFile?: string;
    /**
        If specified will return the string contents of file
    */
    noWrite?: boolean;
    /**
        Instance of @neo4j/graphql-ogm
    */
    ogm: OGM;
}

async function generate(options: IGenerateOptions): Promise<undefined | string> {
    const config: Types.GenerateOptions = {
        config: {},
        plugins: [
            {
                typescript: {},
            },
        ],
        filename: options.outFile || "some-random-file-name-thats-not-used",
        documents: [],
        schema: graphql.parse(graphql.printSchema(options.ogm.neoSchema.schema)),
        pluginMap: {
            typescript: typescriptPlugin,
        },
    };

    const output = await codegen(config);

    const content: string[] = [`import { SelectionSetNode, DocumentNode } from "graphql";`, output];

    options.ogm.neoSchema.nodes.forEach((node) => {
        const pluralized = pluralize(node.name);
        const camelName = camelCase(pluralized); // 🐪
        const upperCamel = upperFirst(camelName); // 🐫

        const model = `
            export declare class ${node.name}Model {
                public find(args: {
                    where?: ${node.name}Where;
                    options?: ${node.name}Options;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<${node.name}[]>

                public count(args: {
                    where?: ${node.name}Where;
                }): Promise<number>

                public create(args: {
                    input: ${node.name}CreateInput[];
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<Create${upperCamel}MutationResponse>

                public update(args: {
                    where?: ${node.name}Where;
                    update?: ${node.name}UpdateInput;
                    ${node.relationFields.length ? `connect?: ${node.name}ConnectInput` : ""}
                    ${node.relationFields.length ? `disconnect?: ${node.name}DisconnectInput` : ""}
                    ${node.relationFields.length ? `create?: ${node.name}CreateInput` : ""}
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                }): Promise<Update${upperCamel}MutationResponse>

                public delete(args: {
                    where?: ${node.name}Where;
                    ${node.relationFields.length ? `delete?: ${node.name}DeleteInput` : ""}
                    context?: any;
                    rootValue: any;
                }): Promise<{ nodesDeleted: number; relationshipsDeleted: number; }>
            }
        `;

        content.push(model);
    });

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
