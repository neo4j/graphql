import { Context, Neo4jGraphQLCallbacks } from "../types";

export interface Callback {
    functionName: string;
    paramName: string;
}

export class CallbackBucket {
    public callbacks: Callback[];
    private context: Context;

    constructor(context: Context) {
        this.context = context;
        this.callbacks = [];
    }

    public addCallback(callback: Callback) {
        this.callbacks.push(callback);
    }

    public async resolveCallbacks(): Promise<Record<string, unknown>> {
        const params: Record<string, unknown> = {};

        await Promise.all(
            this.callbacks.map(async (cb) => {
                const func = (this.context?.callbacks as Neo4jGraphQLCallbacks)[cb.functionName] as () => Promise<any>;
                params[cb.paramName] = await func();
            })
        );

        return params;
    }
}
