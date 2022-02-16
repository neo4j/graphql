import { stringifyObject } from "../../utils/stringify-object";
import { CypherContext, CypherReference } from "./cypher-builder-types";
import { escapeLabel, padLeft } from "../utils";

type NodeInput = {
    labels?: Array<string>;
    parameters?: Record<string, Param<any>>;
};

export class Node extends CypherReference {
    public readonly prefix = "this";
    private labels: Array<string>;
    private parameters: Record<string, Param<any>>;

    constructor(input: NodeInput) {
        super();
        this.labels = input.labels || [];
        this.parameters = input.parameters || {};
    }

    public getCypher(context: CypherContext) {
        const referenceId = context.getReferenceId(this);
        let parametersStr = "";
        if (this.hasParameters()) {
            const parameters = this.serializeParameters(context);
            parametersStr = padLeft(parameters);
        }
        return `(${referenceId || ""}${this.getLabelsString()}${parametersStr})`;
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    private getLabelsString(): string {
        const escapedLabels = this.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }

    private serializeParameters(context: CypherContext): string {
        const paramValues = Object.entries(this.parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(context);
            return acc;
        }, {} as Record<string, string>);

        return stringifyObject(paramValues);
    }
}

export class Param<T> extends CypherReference {
    public readonly prefix = "param";
    private value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }

    public getCypher(context: CypherContext): string {
        return `$${context.getReferenceId(this)}`;
    }

    public getParam(context: CypherContext): [string, T] {
        const key = context.getReferenceId(this);
        return [key, this.value];
    }
}
