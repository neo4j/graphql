/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export type SubscriptionEventType = "create" | "update" | "delete" | "create_relationship" | "delete_relationship";

type StandardType = Record<string, Record<string, unknown>>;
type UnionType = Record<string, StandardType>;
type InterfaceType = Record<string, unknown>;
export type RecordType = Record<string, unknown>;
export type RelationshipType = Record<string, Record<string, UnionType | InterfaceType | StandardType>>;
