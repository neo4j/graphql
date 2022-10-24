
export type CreateInput = Record<string, any>;

export interface TreeDescriptor {
    properties: Set<string>;
    childrens: Record<string, TreeDescriptor>;
    path: string;
}

export class UnsupportedUnwindOptimisation extends Error {
    readonly name;

    constructor(message: string) {
        super(message);

        // if no name provided, use the default. defineProperty ensures that it stays non-enumerable
        if (!this.name) {
            Object.defineProperty(this, "name", { value: "UnsupportedUnwindOptimisation" });
        }
    }
}
