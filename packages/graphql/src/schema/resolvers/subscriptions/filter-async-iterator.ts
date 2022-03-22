export type FilterFn<T> = (rootValue: T) => boolean | Promise<boolean>;

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
                        // .catch(() => false) // We ignore errors from filter function
                        .then((filterResult) => {
                            if (filterResult === true) {
                                resolve(payload);
                                return;
                            }
                            // Skip the current value and wait for the next one
                            inner();
                            return;
                        });
                })
                .catch((err) => {
                    reject(err);
                    return;
                });
        };

        inner();
    });
}
