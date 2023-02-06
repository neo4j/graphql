import type { CypherEnvironment } from "../Environment";
import type { NodeProperties, NodeRef } from "../references/NodeRef";
import type { RelationshipProperties, RelationshipRef } from "../references/RelationshipRef";
import type { CypherCompilable } from "../types";
import { escapeLabel } from "../utils/escape-label";
import { padLeft } from "../utils/pad-left";
import { stringifyObject } from "../utils/stringify-object";

abstract class PatternElement<T extends NodeRef | RelationshipRef> implements CypherCompilable {
    protected element: T;

    constructor(element: T) {
        this.element = element;
    }

    public abstract getCypher(env: CypherEnvironment): string;

    protected serializeParameters(parameters: NodeProperties | RelationshipProperties, env: CypherEnvironment): string {
        if (Object.keys(parameters).length === 0) return "";
        const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(env);
            return acc;
        }, {} as Record<string, string>);

        return padLeft(stringifyObject(paramValues));
    }
}

export class Pattern extends PatternElement<NodeRef> {
    private withLabels = true;
    private previous: PartialPattern | undefined;

    constructor(node: NodeRef, previous?: PartialPattern) {
        super(node);
        this.previous = previous;
    }

    public withoutLabels(): this {
        this.withLabels = false;
        return this;
    }

    public related(rel: RelationshipRef): PartialPattern {
        return new PartialPattern(rel, this);
    }

    public getCypher(env: CypherEnvironment): string {
        const prevStr = this.previous?.getCypher(env) || "";

        const nodeRefId = `${this.element.getCypher(env)}`;

        const propertiesStr = this.serializeParameters(this.element.properties || {}, env);
        const nodeLabelStr = this.withLabels ? this.getNodeLabelsString(this.element) : "";

        return `${prevStr}(${nodeRefId}${nodeLabelStr}${propertiesStr})`;
    }

    private getNodeLabelsString(node: NodeRef): string {
        const escapedLabels = node.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }
}

type LengthOption = number | "*" | { min: number; max: number };

export class PartialPattern extends PatternElement<RelationshipRef> {
    private length: { min; max } = { min: 2, max: 2 };
    private withLabels = true;
    private previous: Pattern;
    private direction: "left" | "right" | "undirected" = "left";

    constructor(rel: RelationshipRef, parent: Pattern) {
        super(rel);
        this.previous = parent;
    }

    public to(node: NodeRef): Pattern {
        return new Pattern(node, this);
    }

    public withoutLabels(): this {
        this.withLabels = false;
        return this;
    }

    public withDirection(direction: "left" | "right" | "undirected"): this {
        this.direction = direction;
        return this;
    }

    public withLength(option: LengthOption): this {
        this.length = {
            min: 2,
            max: 2,
        };
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const prevStr = this.previous.getCypher(env);

        const typeStr = this.getRelationshipTypesString(this.element);
        const relStr = `${this.element.getCypher(env)}${typeStr}`;
        const propertiesStr = this.serializeParameters(this.element.properties || {}, env);

        return `${prevStr}-[${relStr}${propertiesStr}]->`;
    }

    private getRelationshipTypesString(relationship: RelationshipRef): string {
        return relationship.type ? `:${escapeLabel(relationship.type)}` : "";
    }
}
