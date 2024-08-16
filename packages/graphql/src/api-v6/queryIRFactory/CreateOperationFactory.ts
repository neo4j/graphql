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

import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { IdField } from "../../translate/queryAST/ast/input-fields/IdField";
import type { InputField } from "../../translate/queryAST/ast/input-fields/InputField";
import { PropertyInputField } from "../../translate/queryAST/ast/input-fields/PropertyInputField";
import { getAutogeneratedFields } from "../../translate/queryAST/factory/parsers/get-autogenerated-fields";
import type { V6ReadOperation } from "../queryIR/ConnectionReadOperation";
import { V6CreateOperation } from "../queryIR/CreateOperation";
import { ReadOperationFactory } from "./ReadOperationFactory";
import type { GraphQLTreeCreate, GraphQLTreeCreateInput } from "./resolve-tree-parser/graphql-tree/graphql-tree";
import { raiseOnConflictingInput } from "./utils/raise-on-conflicting-input";
import { getAttribute } from "./utils/get-attribute";

export class CreateOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    private readFactory: ReadOperationFactory;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
        this.readFactory = new ReadOperationFactory(schemaModel);
    }

    public createAST({
        graphQLTreeCreate,
        entity,
    }: {
        graphQLTreeCreate: GraphQLTreeCreate;
        entity: ConcreteEntity;
    }): QueryAST {
        const operation = this.generateCreateOperation({
            graphQLTreeCreate,
            entity,
        });
        return new QueryAST(operation);
    }

    private generateCreateOperation({
        graphQLTreeCreate,
        entity,
    }: {
        graphQLTreeCreate: GraphQLTreeCreate;
        entity: ConcreteEntity;
    }): V6CreateOperation {
        const topLevelCreateInput = graphQLTreeCreate.args.input;
        const targetAdapter = new ConcreteEntityAdapter(entity);
        let projection: V6ReadOperation | undefined;
        if (graphQLTreeCreate.fields) {
            projection = this.readFactory.generateMutationProjection({
                graphQLTreeNode: graphQLTreeCreate,
                entity,
            });
        }

        const inputFields = this.getInputFields({
            target: targetAdapter,
            createInput: topLevelCreateInput,
        });
        const createOP = new V6CreateOperation({
            target: targetAdapter,
            createInputParam: new Cypher.Param(topLevelCreateInput),
            projection,
            inputFields,
        });

        return createOP;
    }

    private getInputFields({
        target,
        createInput,
    }: {
        target: ConcreteEntityAdapter;
        createInput: GraphQLTreeCreateInput[];
    }): InputField[] {
        // inputFieldsExistence is used to keep track of the fields that have been added to the inputFields array
        // as with the unwind clause we define a single tree for multiple inputs
        // this is to avoid adding the same field multiple times
        const inputFieldsExistence = new Set<string>();
        const inputFields: InputField[] = this.addAutogeneratedFields(target, inputFieldsExistence);

        for (const inputItem of createInput) {
            raiseOnConflictingInput(inputItem, target.entity);
            for (const key of Object.keys(inputItem)) {
                const attribute = getAttribute(target, key);

                const attachedTo = "node";
                if (inputFieldsExistence.has(attribute.name)) {
                    continue;
                }
                inputFieldsExistence.add(attribute.name);
                const propertyInputField = new PropertyInputField({
                    attribute,
                    attachedTo,
                });
                inputFields.push(propertyInputField);
            }
        }
        return inputFields;
    }

    private addAutogeneratedFields(target: ConcreteEntityAdapter, inputFieldsExistence: Set<string>): InputField[] {
        // TODO: remove generated field filter when we support other autogenerated fields
        const autoGeneratedFields = getAutogeneratedFields(target).filter((field) => field instanceof IdField);
        const inputFields: InputField[] = [];
        for (const field of autoGeneratedFields) {
            if (inputFieldsExistence.has(field.name)) {
                continue;
            }
            inputFieldsExistence.add(field.name);
            inputFields.push(field);
        }
        return inputFields;
    }
}
