import { Node, Param, Relationship } from "./cypher-builder-references";

type ValidReferences = Node | Relationship;

export class CypherContext {
    private prefix: string;
    private params: Map<Param<any>, string> = new Map();
    private references: Map<ValidReferences, string> = new Map();

    constructor(prefix?: string) {
        this.prefix = prefix || "";
    }

    public getParamId(reference: Param<any>): string {
        const id = this.params.get(reference);
        if (!id) {
            return this.addParamReference(reference);
        }
        return id;
    }

    public getReferenceId(reference: ValidReferences): string {
        const id = this.references.get(reference);
        if (!id) {
            return this.addReference(reference);
        }
        return id;
    }

    public getParams(): Record<string, any> {
        const paramList = Array.from(this.params.keys());

        return paramList.reduce((acc, param: Param<any>) => {
            const key = this.getParamId(param);
            acc[key] = param.value;
            return acc;
        }, {} as Record<string, any>);
    }

    private addReference(reference: ValidReferences): string {
        const refIndex = this.references.size;
        const referenceId = `${this.prefix}${reference.prefix}${refIndex}`;
        this.references.set(reference, referenceId);
        return referenceId;
    }

    private addParamReference(param: Param<any>): string {
        const refIndex = this.params.size;
        const paramId = `${this.prefix}${param.prefix}${refIndex}`;
        this.params.set(param, paramId);
        return paramId;
    }
}
