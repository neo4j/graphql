import type { Debugger } from "debug";

/**
 *
 * @param debug A Debugger instance.
 * @param prefix The prefix to be added before logging the object. A colon will be added.
 * @example "successfully decoded JWT"
 * @param object The object to be logged.
 */
export function debugObject(debug: Debugger, prefix: string, object: unknown) {
    debug("%s: %O", prefix, object);
}
