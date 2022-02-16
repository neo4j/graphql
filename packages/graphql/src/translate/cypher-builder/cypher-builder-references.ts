import { CypherParams } from "../types";
import { CypherContext, CypherReference } from "./cypher-builder-types";
import { escapeLabel, padLeft, serializeParameters } from "./utils";

type NodeInput = {
    alias?: string;
    labels?: Array<string>;
};

export class Node implements CypherReference {
    public readonly alias?: string; // TODO: automatic alias
    private labels: Array<string>;
    private parameters?: Record<string, any>; // TODO: unused for now

    constructor(input: NodeInput) {
        this.alias = input.alias;
        this.labels = input.labels || [];
        if (!this.alias && this.labels.length === 0) throw new Error("Invalid Cypher Node");
    }

    // use alias if context is not provided?
    public getCypher(context: CypherContext) {
        const referenceId = context.getReferenceId(this); // referenceId should be alias (if provided)
        const [parametersQuery, _] = this.parseNodeParameters(referenceId, this.parameters);

        return `(${referenceId || ""}${this.getLabelsString()}${padLeft(parametersQuery)})`;
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

    private parseNodeParameters(nodeVar: string, parameters: CypherParams | undefined) {
        if (!nodeVar && parameters) throw new Error("noveVar not defined with parameters");
        return serializeParameters(nodeVar, parameters);
    }
}

export class Param {
    constructor(public id: string) {}
}
