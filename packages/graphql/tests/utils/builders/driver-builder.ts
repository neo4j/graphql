/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Driver, Session, Transaction } from "neo4j-driver";
import { Record } from "neo4j-driver";
import { DBMS_COMPONENTS_QUERY } from "../../../src/constants";
import { Builder } from "./builder";

type RunFunction = ((...params) => any) & { calls: Array<Array<any>> };

export class DriverBuilder extends Builder<Driver, Partial<Driver>> {
    public runFunction: RunFunction;

    constructor(newOptions: Partial<Driver> = {}) {
        super({
            session() {
                return {
                    close: () => true,
                    lastBookmark: () => [],
                };
            },
            ...newOptions,
        } as Driver);

        this.runFunction = this.addFakeSession();
    }

    public with(newOptions: Partial<Driver>): DriverBuilder {
        this.options = { ...this.options, ...newOptions };
        return this;
    }

    public instance(): Driver {
        return {
            ...this.options,
        } as Driver;
    }

    private addFakeSession(): RunFunction {
        const runMock = this.createRunMock();
        this.with({
            session() {
                return {
                    beginTransaction: () => {
                        return {
                            run: runMock,
                            commit: () => true,
                        } as unknown as Transaction;
                    },
                    readTransaction: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    writeTransaction: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    executeRead: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    executeWrite: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    close: () => true,
                    lastBookmark: () => [],
                    lastBookmarks: () => [],
                } as unknown as Session;
            },
        });
        return runMock;
    }

    private createRunMock(): RunFunction {
        const calls: Array<any> = [];
        function mockFunc(...params) {
            // this is needed as the first query could be the DB version check query
            if (params?.[0].includes(DBMS_COMPONENTS_QUERY)) {
                return {
                    records: [new Record(["version", "edition"], ["5.0.0", "enterprise"])],
                    summary: {
                        counters: {
                            updates() {
                                return "";
                            },
                        },
                        server: {
                            protocolVersion: 4,
                        },
                    },
                };
            }
            calls.push(params);
            return {
                records: [],
                summary: {
                    counters: {
                        updates() {
                            return "";
                        },
                    },
                },
            };
        }

        mockFunc.calls = calls;
        return mockFunc;
    }
}
