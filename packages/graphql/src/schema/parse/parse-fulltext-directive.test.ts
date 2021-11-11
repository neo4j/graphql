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

import { gql } from "apollo-server-core";
import { DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import getObjFieldMeta from "../get-obj-field-meta";
import parseFulltextDirective from "./parse-fulltext-directive";

describe("parseFulltextDirective", () => {
    test("should throw error when directive has duplicate name", () => {
        const typeDefs = gql`
            type Movie
                @fulltext(indexes: [{ name: "MyIndex", fields: ["title"] }, { name: "MyIndex", fields: ["title"] }]) {
                title: String
                description: String
            }
        `;

        const definition = (typeDefs.definitions[0] as unknown) as ObjectTypeDefinitionNode;
        const directive = (definition.directives || [])[0] as DirectiveNode;

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums: [],
            interfaces: [],
            scalars: [],
            unions: [],
            objects: [],
        });

        expect(() =>
            parseFulltextDirective({
                directive,
                definition,
                nodeFields,
            })
        ).toThrow("Node 'Movie' @fulltext index contains duplicate name 'MyIndex'");
    });

    test("should throw error when directive field is missing", () => {
        const typeDefs = gql`
            type Movie @fulltext(indexes: [{ name: "MyIndex", fields: ["title"] }]) {
                description: String
                imdbRating: Int
            }
        `;

        const definition = (typeDefs.definitions[0] as unknown) as ObjectTypeDefinitionNode;
        const directive = (definition.directives || [])[0] as DirectiveNode;

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums: [],
            interfaces: [],
            scalars: [],
            unions: [],
            objects: [],
        });

        expect(() =>
            parseFulltextDirective({
                directive,
                definition,
                nodeFields,
            })
        ).toThrow("Node 'Movie' @fulltext index contains invalid index 'MyIndex' cannot use find String field 'title'");
    });

    test("should return valid Fulltext", () => {
        const typeDefs = gql`
            type Movie
                @fulltext(
                    indexes: [
                        { name: "MovieTitle", fields: ["title"] }
                        { name: "MovieDescription", fields: ["description"] }
                    ]
                ) {
                title: String
                description: String
            }
        `;

        const definition = (typeDefs.definitions[0] as unknown) as ObjectTypeDefinitionNode;
        const directive = (definition.directives || [])[0] as DirectiveNode;

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums: [],
            interfaces: [],
            scalars: [],
            unions: [],
            objects: [],
        });

        const result = parseFulltextDirective({
            directive,
            definition,
            nodeFields,
        });

        expect(result).toEqual({
            indexes: [
                { name: "MovieTitle", fields: ["title"] },
                { name: "MovieDescription", fields: ["description"] },
            ],
        });
    });
});
