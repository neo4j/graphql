import { CypherEnvironment } from "../Environment";
import type { NodeProperties, NodeRef } from "../references/NodeRef";
import type { RelationshipProperties, RelationshipRef } from "../references/RelationshipRef";
import type { CypherCompilable } from "../types";
import { escapeLabel } from "../utils/escape-label";
import { padBlock } from "../utils/pad-block";
import { padLeft } from "../utils/pad-left";
import { stringifyObject } from "../utils/stringify-object";

const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");

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

    /** Custom string for browsers and templating
     * @hidden
     */
    public toString() {
        const cypher = padBlock(this.getCypher(new CypherEnvironment()));
        return `<${this.constructor.name}> """\n${cypher}\n"""`;
    }

    /** Custom log for console.log in Node
     * @hidden
     */
    [customInspectSymbol](): string {
        return this.toString();
    }
}

export class Pattern extends PatternElement<NodeRef> {
    private withLabels = true;
    private withProperties = true;
    private withVariable = true;
    private previous: PartialPattern | undefined;

    constructor(node: NodeRef, previous?: PartialPattern) {
        super(node);
        this.previous = previous;
    }

    public withoutLabels(): this {
        this.withLabels = false;
        return this;
    }

    public withoutVariable(): this {
        this.withVariable = false;
        return this;
    }

    public withoutProperties(): this {
        this.withProperties = false;
        return this;
    }

    public related(rel: RelationshipRef): PartialPattern {
        return new PartialPattern(rel, this);
    }

    public getCypher(env: CypherEnvironment): string {
        const prevStr = this.previous?.getCypher(env) || "";

        const nodeRefId = this.withVariable ? `${this.element.getCypher(env)}` : "";

        const propertiesStr = this.withProperties ? this.serializeParameters(this.element.properties || {}, env) : "";
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
    private withType = true;
    private withProperties = true;
    private withVariable = true;
    private previous: Pattern;
    private direction: "left" | "right" | "undirected" = "left";

    constructor(rel: RelationshipRef, parent: Pattern) {
        super(rel);
        this.previous = parent;
    }

    public to(node: NodeRef): Pattern {
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

    public withoutProperties(): this {
        this.withProperties = false;
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

        const typeStr = this.withType ? this.getRelationshipTypesString(this.element) : "";
        const relStr = this.withVariable ? `${this.element.getCypher(env)}` : "";
        const propertiesStr = this.withProperties ? this.serializeParameters(this.element.properties || {}, env) : "";

        const leftArrow = this.direction === "left" ? "<-" : "-";
        const rightArrow = this.direction === "right" ? "->" : "-";

        return `${prevStr}${leftArrow}[${relStr}${typeStr}${propertiesStr}]${rightArrow}`;
    }

    private getRelationshipTypesString(relationship: RelationshipRef): string {
        const type = relationship.type; // TODO: escape label
        return relationship.type ? `:${type}` : "";
    }
}
