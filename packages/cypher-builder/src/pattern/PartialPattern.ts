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

import type { CypherEnvironment } from "../Environment";
import type { RelationshipRef } from "../references/RelationshipRef";
import { NodeRef } from "../references/NodeRef";
import { Pattern } from "./Pattern";
import { PatternElement } from "./PatternElement";
import type { Param } from "../references/Param";
import { escapeType } from "../utils/escape";

type LengthOption =
    | number
    | "*"
    | { min: number; max?: number }
    | { min?: number; max: number }
    | { min: number; max: number };

/** Partial pattern, cannot be used until connected to a node
 * @group Patterns
 */
export class PartialPattern extends PatternElement<RelationshipRef> {
    private length: LengthOption | undefined;
    private withType = true;
    private withVariable = true;
    private direction: "left" | "right" | "undirected" = "right";
    private previous: Pattern;
    private properties: Record<string, Param> | undefined;

    constructor(rel: RelationshipRef, previous: Pattern) {
        super(rel);
        this.previous = previous;
    }

    public to(node?: NodeRef): Pattern {
        if (!node) node = new NodeRef();
        return new Pattern(node, this);
    }

    public withoutType(): this {
        this.withType = false;
        return this;
    }

    public withoutVariable(): this {
        this.withVariable = false;
        return this;
    }

    public withDirection(direction: "left" | "right" | "undirected"): this {
        this.direction = direction;
        return this;
    }

    public withProperties(properties: Record<string, Param>): this {
        this.properties = properties;
        return this;
    }

    public withLength(option: LengthOption): this {
        this.length = option;
        return this;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const prevStr = this.previous.getCypher(env);

        const typeStr = this.withType ? this.getRelationshipTypesString(this.element) : "";
        const relStr = this.withVariable ? `${this.element.getCypher(env)}` : "";

        const propertiesStr = this.properties ? this.serializeParameters(this.properties || {}, env) : "";

        const lengthStr = this.generateLengthStr();

        const leftArrow = this.direction === "left" ? "<-" : "-";
        const rightArrow = this.direction === "right" ? "->" : "-";

        return `${prevStr}${leftArrow}[${relStr}${typeStr}${lengthStr}${propertiesStr}]${rightArrow}`;
    }

    private generateLengthStr(): string {
        if (this.length === undefined) return "";
        if (typeof this.length === "number") {
            return `*${this.length}`;
        } else if (this.length === "*") {
            return "*";
        } else {
            return `*${this.length.min || ""}..${this.length.max || ""}`;
        }
    }

    private getRelationshipTypesString(relationship: RelationshipRef): string {
        const type = relationship.type;
        // TODO: escape label is breaking change
        // const type = relationship.type ? escapeType(relationship.type) : undefined;
        return relationship.type ? `:${type}` : "";
    }
}
