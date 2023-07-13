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

import { MathModel } from "./MathModel";
import { AggregationModel } from "./AggregationModel";
import { ListModel } from "./ListModel";
import type { Attribute } from "../Attribute";
import type { Annotations } from "../../annotation/Annotation";
import type { AttributeType } from "../AbstractAttribute";
import { AbstractAttribute } from "../AbstractAttribute";
import { ne } from "@faker-js/faker";

// Maybe rename it to GraphQL model
export class AttributeModel extends AbstractAttribute {
    private _listModel: ListModel | undefined;
    private _mathModel: MathModel | undefined;
    private _aggregationModel: AggregationModel | undefined;
    public name: string;
    public annotations: Partial<Annotations>;
    public type: AttributeType;

    constructor(attribute: Attribute) {
        super({ name: attribute.name, type: attribute.type, annotations: attribute.annotations });
        this.name = attribute.name;
        this.annotations = attribute.annotations;
        this.type = attribute.type;
    }

    /**
     * 
     * /**
     *  Previously defined as:
     * [
            ...this.temporalFields,
            ...this.enumFields,
            ...this.objectFields,
            ...this.scalarFields, 
            ...this.primitiveFields, 
            ...this.interfaceFields,
            ...this.objectFields,
            ...this.unionFields,
            ...this.pointFields,
        ];
     */
    isMutable(): boolean {
        // this is based on the assumption that interface fields and union fields are object fields
        return this.isTemporal() || this.isEnum() || this.isObject() || this.isScalar() || 
        this.isPrimitive() || this.isInterface() || this.isUnion() || this.isPoint();
    }

    isUnique(): boolean {
        // TODO: add it when the annotations are merged
        // return this.attribute.annotations.unique ? true : false;
        return false;
    }
    /**
     *  Previously defined as:
     * [...this.primitiveFields,
       ...this.scalarFields,
       ...this.enumFields,
       ...this.temporalFields,
       ...this.pointFields,]
     */

    isConstrainable(): boolean {
        return this.isPrimitive() || this.isScalar() || this.isEnum() || this.isTemporal() || this.isPoint();
    }
    // TODO: remember to figure out constrainableFields

    /**
     * @throws {Error} if the attribute is not a list
     */
    get listModel(): ListModel {
        if (!this._listModel) {
            this._listModel = new ListModel(this);
        }
        return this._listModel;
    }

    /**
     * @throws {Error} if the attribute is not a scalar
     */
    get mathModel(): MathModel {
        if (!this._mathModel) {
            this._mathModel = new MathModel(this);
        }
        return this._mathModel;
    }

    get aggregationModel(): AggregationModel {
        if (!this._aggregationModel) {
            this._aggregationModel = new AggregationModel(this);
        }
        return this._aggregationModel;
    }
}
