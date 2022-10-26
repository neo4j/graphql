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

export interface TypeDefinitionsAnalyticsResults {
    numberOfTypes: number;
    numberOfUnions: number;
    numberOfInterfaces: number;
    numberOfDirectives: number;
    quantityOfDirectiveUsage: number;
}

export const rudimentaryTypeDefinitionsAnalytics = (typeDefinitions: string): TypeDefinitionsAnalyticsResults => {
    const numberOfTypes = (typeDefinitions.match(/type (.*?){/g) || []).length;
    const numberOfInterfaces = (typeDefinitions.match(/interface (.*?){/g) || []).length;
    const numberOfDirectives = (typeDefinitions.match(/directive @/g) || []).length;
    const numberOfUnions = (typeDefinitions.match(/union (.*?)=/g) || []).length;
    const usedDirectives = (typeDefinitions.match(/@(.*?)[(\s]/g) || []).length;
    const quantityOfDirectiveUsage = usedDirectives - numberOfDirectives; // INFO: in case there are directives defined, remove them from the usage count

    return {
        numberOfTypes,
        numberOfUnions,
        numberOfInterfaces,
        numberOfDirectives,
        quantityOfDirectiveUsage,
    };
};
