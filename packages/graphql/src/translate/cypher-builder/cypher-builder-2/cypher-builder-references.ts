import { stringifyObject } from "../../utils/stringify-object";
import { escapeLabel, padLeft } from "../utils";
import { CypherContext } from "./CypherContext";

type NodeInput = {
    labels?: Array<string>;
    parameters?: Record<string, Param<any>>;
};

export interface CypherReference {
    readonly prefix: string;
    getCypher(context: CypherContext): string;
}

export class Node implements CypherReference {
    public readonly prefix = "this";
    private labels: Array<string>;
    private parameters: Record<string, Param<any>>;

    constructor(input: NodeInput) {
        this.labels = input.labels || [];
        this.parameters = input.parameters || {};
    }

    public getCypher(context: CypherContext) {
        const referenceId = context.getReferenceId(this);
        let parametersStr = "";
        if (this.hasParameters()) {
            const parameters = serializeParameters(this.parameters, context);
            parametersStr = padLeft(parameters);
        }
        return `(${referenceId}${this.getLabelsString()}${parametersStr})`;
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    private getLabelsString(): string {
        const escapedLabels = this.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }
}

export type RelationshipInput = {
    source: Node;
    target: Node;
    type?: string;
    parameters?: Record<string, Param<any>>;
    directed?: boolean;
};

export class Relationship implements CypherReference {
    public readonly prefix = "this";
    public readonly source: Node;
    public readonly target: Node;

    private type?: string;
    private parameters: Record<string, Param<any>>;
    private directed: boolean;

    constructor(input: RelationshipInput) {
        this.type = input.type || undefined;
        this.parameters = input.parameters || {};
        this.source = input.source;
        this.target = input.target;
        this.directed = input.directed === undefined ? true : input.directed;
    }

    public getCypher(context: CypherContext) {
        const referenceId = context.getReferenceId(this);
        let parametersStr = "";
        if (this.hasParameters()) {
            const parameters = serializeParameters(this.parameters, context);
            parametersStr = padLeft(parameters);
        }

        const sourceStr = this.source.getCypher(context);
        const targetStr = this.target.getCypher(context);
        const arrowStr = this.getRelationshipArrow();
        const relationshipStr = `${referenceId || ""}${this.getTypeString()}${parametersStr}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    private getRelationshipArrow(): "-" | "->" {
        return this.directed ? "->" : "-";
    }

    private getTypeString(): string {
        return this.type ? `:${escapeLabel(this.type)}` : "";
    }
}

export class Param<T> {
    public readonly prefix = "param";
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    public getCypher(context: CypherContext): string {
        return `$${context.getParamId(this)}`;
    }
}

// TODO: move to a separate file?

function serializeParameters(parameters: Record<string, Param<any>>, context: CypherContext): string {
    const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
        acc[key] = param.getCypher(context);
        return acc;
    }, {} as Record<string, string>);

    return stringifyObject(paramValues);
}
