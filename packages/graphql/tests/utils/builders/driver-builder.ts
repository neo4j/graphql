/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Driver, Session, Transaction } from "neo4j-driver";
import { Builder } from "./builder";

type RunFunction = ((...params) => any) & { calls: Array<Array<any>> };

export class DriverBuilder extends Builder<Driver, Partial<Driver>> {
    public runFunction: RunFunction;

    constructor(newOptions: Partial<Driver> = {}) {
        super({
            session() {
                return {
                    close() {},
                    lastBookmark() {},
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
                            commit() {},
                        } as unknown as Transaction;
                    },
                    readTransaction: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    writeTransaction: (cb: any) => {
                        return cb({ run: runMock });
                    },
                    close() {},
                    lastBookmark() {},
                } as unknown as Session;
            },
        });
        return runMock;
    }

    // Custom mock to support driver outside of jest
    private createRunMock(): RunFunction {
        const calls: Array<any> = [];
        function mockFunc(...params) {
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
