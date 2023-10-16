import type { ConcreteEntityAdapter } from "./model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "./model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "./model-adapters/UnionEntityAdapter";

export type EntityAdapter = ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter;
