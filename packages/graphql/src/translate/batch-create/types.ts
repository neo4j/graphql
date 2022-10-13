
export type CreateInput = Record<string, any>;

export interface TreeDescriptor {
    properties: Set<string>;
    childrens: Record<string, TreeDescriptor>;
}
