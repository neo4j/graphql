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

export type FilterFn<T> = (rootValue: T) => boolean | Promise<boolean>;

// Based on https://github.com/apollographql/graphql-subscriptions/blob/master/src/with-filter.ts
export function filterAsyncIterator<T>(
    asyncIterator: AsyncIterator<T>,
    filterFn: FilterFn<T>
): AsyncIterableIterator<T> {
    return {
        next() {
            return getNextPromise(asyncIterator, filterFn);
        },
        return() {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return asyncIterator.return!();
        },
        throw(error) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return asyncIterator.throw!(error);
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };
}

function getNextPromise<T>(asyncIterator: AsyncIterator<T>, filterFn: FilterFn<T>) {
    return new Promise<IteratorResult<T>>((resolve, reject) => {
        const inner = () => {
            asyncIterator
                .next()
                .then((payload) => {
                    if (payload.done === true) {
                        resolve(payload);
                        return;
                    }
                    Promise.resolve(filterFn(payload.value))
                        .then((filterResult) => {
                            if (filterResult === true) {
                                resolve(payload);
                            } else {
                                // Skip the current value and wait for the next one
                                inner();
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        };

        inner();
    });
}
