import { stringifyObject } from "../utils/stringify-object";
import { CypherContext, CypherReference } from "./cypher-builder-types";
import { escapeLabel, padLeft } from "./utils";

type NodeInput = {
    labels?: Array<string>;
    parameters?: Record<string, Param>;
};

export class Node extends CypherReference {
    public readonly prefix = "this";
    private labels: Array<string>;
    private parameters: Record<string, Param>;

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
        // const [parametersQuery, _] = this.parseNodeParameters(referenceId, this.parameters);

        return `(${referenceId || ""}${this.getLabelsString()}${parametersStr})`;
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    // public getParams(): NestedRecord<string> {
    //     // TODO: need nested record?
    //     const [_, parameters] = this.parseNodeParameters(this.id, this.parameters);
    //     return parameters;
    // }

    private getLabelsString(): string {
        const escapedLabels = this.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }

    // private parseNodeParameters(nodeVar: string, parameters: CypherParams | undefined) {
    //     if (!nodeVar && parameters) throw new Error("noveVar not defined with parameters");
    //     return this.serializeParameters(parameters, context);
    // }

    private serializeParameters(context: CypherContext): string {
        // if (!parameters) return ["", {}];
        //
        // const cypherParameters: CypherParams = {};
        // const nodeParameters: Record<string, string> = {};
        //
        // for (const [key, value] of Object.entries(parameters)) {
        //     const paramKey = generateParameterKey(keyprefix, key);
        //     cypherParameters[paramKey] = value;
        //     nodeParameters[key] = `$${paramKey}`;
        // }

        const paramValues = Object.entries(this.parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(context);
            return acc;
        }, {} as Record<string, string>);

        return stringifyObject(paramValues);
    }
}

export class Param extends CypherReference {
    public readonly prefix = "param";

    getCypher(context: CypherContext): string {
        return `$${context.getReferenceId(this)}`;
    }
}
