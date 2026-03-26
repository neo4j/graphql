/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

type FilterFn<T> = (rootValue: T) => boolean | Promise<boolean>;

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
            return asyncIterator.return!();
        },
        throw(error) {
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
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                        });
                })
                .catch((err) => {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(err);
                });
        };

        inner();
    });
}
