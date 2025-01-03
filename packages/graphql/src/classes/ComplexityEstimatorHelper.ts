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
import { type DefinitionNode,type GraphQLFieldExtensions, type GraphQLSchema, GraphQLInterfaceType, GraphQLObjectType, Kind } from "graphql";
import type { ComplexityEstimator} from "graphql-query-complexity";
import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity";

export class ComplexityEstimatorHelper {
    private objectTypeNameToFieldNamesMapForComplexityExtensions: Map<string, string[]>;
    private useComplexityEstimators: boolean;

    constructor(useComplexityEstimators: boolean) {
        this.useComplexityEstimators = useComplexityEstimators
        this.objectTypeNameToFieldNamesMapForComplexityExtensions = new Map<string, string[]>();
    }

    public registerField(parentObjectTypeNameOrInterfaceTypeName: string, fieldName: string): void {
        if(this.useComplexityEstimators) {
            const existingFieldsForTypeName = this.objectTypeNameToFieldNamesMapForComplexityExtensions.get(parentObjectTypeNameOrInterfaceTypeName) ?? []
            this.objectTypeNameToFieldNamesMapForComplexityExtensions.set(parentObjectTypeNameOrInterfaceTypeName, existingFieldsForTypeName.concat(fieldName))
        }
    }

    public hydrateDefinitionNodeWithComplexityExtensions(definition: DefinitionNode): DefinitionNode {
        if(definition.kind !== Kind.OBJECT_TYPE_DEFINITION && definition.kind !== Kind.INTERFACE_TYPE_DEFINITION) {
            return definition;
        }
        if(!this.objectTypeNameToFieldNamesMapForComplexityExtensions.has(definition.name.value)) {
            return definition
        }
        
        const fieldsWithComplexity = definition.fields?.map(f => {
            const hasFieldComplexityEstimator = this.getFieldsForParentTypeName(definition.name.value).find(fieldName => fieldName === f.name.value)
            if (!hasFieldComplexityEstimator) {
                return f
            }
            return {
                ...f,
                extensions: {
                    // COMPLEXITY FORMULA
                    // c = c_child + lvl_limit * c_field, where
                    // c_field = 1
                    // lvl_limit defaults to 1
                    // c_child comes from simpleEstimator 
                    complexity: ({childComplexity, args}) => {
                        const fieldDefaultComplexity = 1
                        const defaultLimitIfNotProvided = 1
                        if(args.limit ?? args.first) {
                            return childComplexity + (args.limit ?? args.first) * fieldDefaultComplexity
                        }
                        return childComplexity + defaultLimitIfNotProvided
                        
                    },
                },
            }
        })
        return {
            ...definition,
            fields: fieldsWithComplexity,
        }
    }


    public hydrateSchemaFromSDLWithASTNodeExtensions(schema: GraphQLSchema): void {
        const types = schema.getTypeMap();
        Object.values(types).forEach((type) => {
            if (type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType) {
                const fields = type.getFields();
                Object.values(fields).forEach((field) => {
                    if (field.astNode && 'extensions' in field.astNode) {
                        field.extensions = field.astNode.extensions as GraphQLFieldExtensions<any, any, any>;
                    }
                });
            }
        });
    }

    public getComplexityEstimators(): ComplexityEstimator[] {
        if (!this.useComplexityEstimators) {
            return []
        }
        return [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
        ];
    }

    private getFieldsForParentTypeName(parentObjectTypeNameOrInterfaceTypeName: string): string[] {
        return this.objectTypeNameToFieldNamesMapForComplexityExtensions.get(parentObjectTypeNameOrInterfaceTypeName) || []
    }
}
