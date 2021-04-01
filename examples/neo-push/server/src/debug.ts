import debug from "debug";

const main = debug("Server");

export default function createDebugger(input: string): (...any) => void {
    // @ts-ignore: Property does exist
    return main.extend(input);
}
