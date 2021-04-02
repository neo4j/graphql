import debug from "debug";

const main = debug("Server");

export default function createDebugger(input: string): (...any) => void {
    return main.extend(input);
}
