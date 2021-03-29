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

import { DocumentNode, ObjectTypeDefinitionNode } from "graphql";

interface CustomResolvers {
    customQuery?: ObjectTypeDefinitionNode;
    customCypherQuery?: ObjectTypeDefinitionNode;
    customMutation?: ObjectTypeDefinitionNode;
    customCypherMutation?: ObjectTypeDefinitionNode;
    customSubscription?: ObjectTypeDefinitionNode;
}

function getCustomResolvers(document: DocumentNode): CustomResolvers {
    const customResolvers = (document.definitions || []).reduce((res: CustomResolvers, definition) => {
        if (definition.kind !== "ObjectTypeDefinition") {
            return res;
        }

        if (!["Query", "Mutation", "Subscription"].includes(definition.name.value)) {
            return res;
        }

        const cypherOnes = (definition.fields || []).filter(
            (field) => field.directives && field.directives.find((direc) => direc.name.value === "cypher")
        );
        const normalOnes = (definition.fields || []).filter(
            (field) =>
                (field.directives && !field.directives.find((direc) => direc.name.value === "cypher")) ||
                !field.directives
        );

        if (definition.name.value === "Query") {
            if (cypherOnes.length) {
                res.customCypherQuery = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customQuery = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Mutation") {
            if (cypherOnes.length) {
                res.customCypherMutation = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customMutation = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Subscription") {
            if (normalOnes.length) {
                res.customSubscription = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        return res;
    }, {});

    return customResolvers;
}

export default getCustomResolvers;
