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
import type { AttributeType } from "./AttributeType";
import {
    EnumType,
    GraphQLBuiltInScalarType,
    InputType,
    InterfaceType,
    ListType,
    Neo4jCartesianPointType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    Neo4jPointType,
    ObjectType,
    ScalarType,
    UnionType,
    UserScalarType,
} from "./AttributeType";

export class AttributeTypeHelper {
    private assertionOptions: {
        includeLists: boolean;
    } = { includeLists: true };

    constructor(protected readonly type: AttributeType) {}

    /**
     * Just an helper to get the wrapped type in readonlyase of a list, useful for the assertions
     */
    private getTypeForAssertion(includeLists: boolean) {
        if (includeLists) {
            if (!this.isList()) {
                return this.type;
            }
            if (this.type.ofType instanceof ListType) {
                return this.type.ofType.ofType;
            }
            return this.type.ofType;
        }
        return this.type;
    }

    public isBoolean(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Boolean;
    }

    public isID(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.ID;
    }

    public isInt(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Int;
    }

    public isFloat(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Float;
    }

    public isString(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.String;
    }

    public isCartesianPoint(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof Neo4jCartesianPointType;
    }

    public isPoint(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof Neo4jPointType;
    }

    public isBigInt(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLNumberType.BigInt;
    }

    public isDate(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Date;
    }

    public isDateTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.DateTime;
    }

    public isLocalDateTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.LocalDateTime;
    }

    public isTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Time;
    }

    public isLocalTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.LocalTime;
    }

    public isDuration(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.Duration;
    }

    public isObject(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ObjectType;
    }

    public isEnum(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof EnumType;
    }

    public isInterface(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof InterfaceType;
    }

    public isUnion(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof UnionType;
    }

    public isList(): this is this & { type: ListType } {
        return this.type instanceof ListType;
    }

    public isInput(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof InputType;
    }

    public isUserScalar(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof UserScalarType;
    }

    public isTemporal(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in Neo4jGraphQLTemporalType;
    }

    public isListElementRequired(): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        return this.type.ofType.isRequired;
    }

    public isRequired(): boolean {
        return this.type.isRequired;
    }

    public isGraphQLBuiltInScalar(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in GraphQLBuiltInScalarType;
    }

    public isSpatial(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in Neo4jGraphQLSpatialType;
    }

    public isAbstract(options = this.assertionOptions): boolean {
        return this.isInterface(options) || this.isUnion(options);
    }

    public isNumeric(options = this.assertionOptions): boolean {
        return this.isBigInt(options) || this.isFloat(options) || this.isInt(options);
    }

    /**
     * Returns true for both built-in and user-defined scalars
     **/
    public isScalar(options = this.assertionOptions): boolean {
        return (
            this.isGraphQLBuiltInScalar(options) ||
            this.isTemporal(options) ||
            this.isBigInt(options) ||
            this.isUserScalar(options) ||
            this.isInput(options)
        );
    }
}
