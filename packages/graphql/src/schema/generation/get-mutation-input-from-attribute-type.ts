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

import type { GraphQLInputType } from "graphql";
import {
    BigIntListMutations,
    BigIntScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/BigIntScalarMutations";
import {
    BooleanListMutations,
    BooleanScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/BooleanScalarMutations";
import {
    CartesianPointListMutations,
    CartesianPointMutations,
} from "../../graphql/input-objects/generic-mutation-operations/CartesianPointMutations";
import {
    DateListMutations,
    DateScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/DateScalarMutations";
import {
    DateTimeListMutations,
    DateTimeScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/DateTimeScalarMutations";
import {
    DurationListMutations,
    DurationScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/DurationScalarMutations";
import {
    FloatListMutations,
    FloatScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/FloatScalarMutations";
import {
    IDListMutations,
    IDScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/IDScalarMutations";
import {
    IntListMutations,
    IntScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/IntScalarMutations";
import {
    LocalDateTimeListMutations,
    LocalDateTimeScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/LocalDateTimeScalarMutations";
import {
    LocalTimeListMutations,
    LocalTimeScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/LocalTimeScalarMutations";
import {
    PointListMutations,
    PointMutations,
} from "../../graphql/input-objects/generic-mutation-operations/PointMutations";
import {
    StringListMutations,
    StringScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/StringScalarMutations";
import {
    TimeListMutations,
    TimeScalarMutations,
} from "../../graphql/input-objects/generic-mutation-operations/TimeScalarMutations";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";

export function getMutationInputFromAttributeType(attribute: AttributeAdapter): GraphQLInputType | string {
    // // NOTE: static types returned here must be added to schema-validation > validateUserDefinition
    if (attribute.typeHelper.isBoolean()) {
        if (attribute.typeHelper.isList()) {
            return BooleanListMutations;
        }
        return BooleanScalarMutations;
    }
    if (attribute.typeHelper.isID()) {
        if (attribute.typeHelper.isList()) {
            return IDListMutations;
        }
        return IDScalarMutations;
    }
    if (attribute.typeHelper.isString()) {
        if (attribute.typeHelper.isList()) {
            return StringListMutations;
        }
        return StringScalarMutations;
    }
    if (attribute.typeHelper.isInt()) {
        if (attribute.typeHelper.isList()) {
            return IntListMutations;
        }
        return IntScalarMutations;
    }
    if (attribute.typeHelper.isFloat()) {
        if (attribute.typeHelper.isList()) {
            return FloatListMutations;
        }
        return FloatScalarMutations;
    }
    if (attribute.typeHelper.isBigInt()) {
        if (attribute.typeHelper.isList()) {
            return BigIntListMutations;
        }
        return BigIntScalarMutations;
    }
    if (attribute.typeHelper.isTime()) {
        if (attribute.typeHelper.isList()) {
            return TimeListMutations;
        }
        return TimeScalarMutations;
    }
    if (attribute.typeHelper.isPoint()) {
        if (attribute.typeHelper.isList()) {
            return PointListMutations;
        }
        return PointMutations;
    }
    if (attribute.typeHelper.isCartesianPoint()) {
        if (attribute.typeHelper.isList()) {
            return CartesianPointListMutations;
        }
        return CartesianPointMutations;
    }
    if (attribute.typeHelper.isDateTime()) {
        if (attribute.typeHelper.isList()) {
            return DateTimeListMutations;
        }
        return DateTimeScalarMutations;
    }
    if (attribute.typeHelper.isLocalTime()) {
        if (attribute.typeHelper.isList()) {
            return LocalTimeListMutations;
        }
        return LocalTimeScalarMutations;
    }
    if (attribute.typeHelper.isLocalDateTime()) {
        if (attribute.typeHelper.isList()) {
            return LocalDateTimeListMutations;
        }
        return LocalDateTimeScalarMutations;
    }
    if (attribute.typeHelper.isDuration()) {
        if (attribute.typeHelper.isList()) {
            return DurationListMutations;
        }
        return DurationScalarMutations;
    }
    if (attribute.typeHelper.isDate()) {
        if (attribute.typeHelper.isList()) {
            return DateListMutations;
        }
        return DateScalarMutations;
    }

    if (attribute.typeHelper.isEnum()) {
        if (attribute.typeHelper.isList()) {
            return `${attribute.getTypeName()}ListEnumScalarMutations`;
        }
        return `${attribute.getTypeName()}EnumScalarMutations`;
    }

    if (attribute.typeHelper.isUserScalar()) {
        if (attribute.typeHelper.isList()) {
            return `${attribute.getTypeName()}ListScalarMutations`;
        }
        return `${attribute.getTypeName()}ScalarMutations`;
    }

    throw new Error(`No scalar mutation found for attribute ${attribute.type.name}`);
}
