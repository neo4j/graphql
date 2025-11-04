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

import type {
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    ObjectTypeDefinitionNode,
} from "graphql";
import { Kind, print } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { CartesianPointDistance } from "../../graphql/input-objects/CartesianPointDistance";
import { CartesianPointInput } from "../../graphql/input-objects/CartesianPointInput";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import { PointDistance } from "../../graphql/input-objects/PointDistance";
import { PointInput } from "../../graphql/input-objects/PointInput";
import { QueryOptions } from "../../graphql/input-objects/QueryOptions";
import { CartesianPoint } from "../../graphql/objects/CartesianPoint";
import { CreateInfo } from "../../graphql/objects/CreateInfo";
import { DeleteInfo } from "../../graphql/objects/DeleteInfo";
import { PageInfo } from "../../graphql/objects/PageInfo";
import { Point } from "../../graphql/objects/Point";
import { UpdateInfo } from "../../graphql/objects/UpdateInfo";
import * as Scalars from "../../graphql/scalars";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { getEntityAdapter } from "../../schema-model/utils/get-entity-adapter";
import type { DefinitionNodes } from "../get-definition-nodes";

export class AugmentedSchemaGenerator {
    private composer: SchemaComposer;

    constructor(
        private schemaModel: Neo4jGraphQLSchemaModel,
        private definitionNodes: DefinitionNodes,
        private rootTypesCustomResolvers: ObjectTypeDefinitionNode[]
    ) {
        this.composer = new SchemaComposer();
    }

    /**
     * This function will replace make-augmented-schema in orchestrating the creation of the types for each schemaModel construct
     *
     * @returns graphql-compose composer representing the augmented schema
     */
    generate() {
        let pointInTypeDefs = false;
        let cartesianPointInTypeDefs = false;
        let floatWhereInTypeDefs = false;

        for (const entity of this.schemaModel.entities.values()) {
            const model = getEntityAdapter(entity);

            // TODO: check if these can be created ad-hoc
            if (model instanceof ConcreteEntityAdapter || model instanceof InterfaceEntityAdapter) {
                for (const attribute of model.attributes.values()) {
                    if (attribute.typeHelper.isPoint()) {
                        pointInTypeDefs = true;
                    }
                    if (attribute.typeHelper.isCartesianPoint()) {
                        cartesianPointInTypeDefs = true;
                    }
                }
                if (model.annotations.fulltext || model.annotations.vector) {
                    floatWhereInTypeDefs = true;
                }
                if (model instanceof ConcreteEntityAdapter) {
                    for (const relationship of model.relationships.values()) {
                        for (const attribute of relationship.attributes.values()) {
                            if (attribute.typeHelper.isPoint()) {
                                pointInTypeDefs = true;
                            }
                            if (attribute.typeHelper.isCartesianPoint()) {
                                cartesianPointInTypeDefs = true;
                            }
                        }
                    }
                }
            }
        }

        // this.pipeDefs();
        this.addToComposer(this.getStaticTypes());
        this.addToComposer(this.getSpatialTypes(pointInTypeDefs, cartesianPointInTypeDefs));
        this.addToComposer(this.getTemporalTypes(floatWhereInTypeDefs));

        return this.composer;
    }

    private pipeDefs() {
        const pipedDefs = [
            ...this.definitionNodes.enumTypes,
            ...this.definitionNodes.scalarTypes,
            ...this.definitionNodes.inputObjectTypes,
            ...this.definitionNodes.unionTypes,
            ...this.definitionNodes.directives,
            ...this.rootTypesCustomResolvers,
        ].filter(Boolean);
        if (pipedDefs.length) {
            this.composer.addTypeDefs(print({ kind: Kind.DOCUMENT, definitions: pipedDefs }));
        }
    }

    private getStaticTypes() {
        return {
            objects: [CreateInfo, DeleteInfo, UpdateInfo, PageInfo],
            inputs: [QueryOptions],
            enums: [SortDirection],
            scalars: Object.values(Scalars),
        };
    }

    private getSpatialTypes(
        pointInTypeDefs: boolean,
        cartesianPointInTypeDefs: boolean
    ): {
        objects: GraphQLObjectType[];
        inputs: GraphQLInputObjectType[];
    } {
        const objects: GraphQLObjectType[] = [];
        const inputs: GraphQLInputObjectType[] = [];
        if (pointInTypeDefs) {
            objects.push(Point);
            inputs.push(PointInput, PointDistance);
        }
        if (cartesianPointInTypeDefs) {
            objects.push(CartesianPoint);
            inputs.push(CartesianPointInput, CartesianPointDistance);
        }
        return {
            objects,
            inputs,
        };
    }

    private getTemporalTypes(floatWhereInTypeDefs: boolean): {
        inputs: GraphQLInputObjectType[];
    } {
        const inputs: GraphQLInputObjectType[] = [];
        if (floatWhereInTypeDefs) {
            inputs.push(FloatWhere);
        }
        return {
            inputs,
        };
    }

    private addToComposer({
        objects = [],
        inputs = [],
        enums = [],
        scalars = [],
        interfaces = [],
    }: {
        objects?: GraphQLObjectType[];
        inputs?: GraphQLInputObjectType[];
        enums?: GraphQLEnumType[];
        scalars?: GraphQLScalarType[];
        interfaces?: GraphQLInterfaceType[];
    }) {
        objects.forEach((x) => this.composer.createObjectTC(x));
        inputs.forEach((x) => this.composer.createInputTC(x));
        enums.forEach((x) => this.composer.createEnumTC(x));
        interfaces.forEach((x) => this.composer.createInterfaceTC(x));
        scalars.forEach((scalar) => this.composer.addTypeDefs(`scalar ${scalar.name}`));
    }
}
