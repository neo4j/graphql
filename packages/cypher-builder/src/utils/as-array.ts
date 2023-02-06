/** Makes sure input is an array, if not it turns into an array (empty array if input is null or undefined) */
export function asArray<T>(raw: T | Array<T> | undefined | null): Array<T> {
    if (Array.isArray(raw)) return raw;
    if (raw === undefined || raw === null) return [];
    return [raw];
}
