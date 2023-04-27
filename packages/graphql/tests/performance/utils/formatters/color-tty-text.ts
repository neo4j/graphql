export enum TTYColors {
    yellow = "\x1b[33m",
    cyan = "\x1b[36m",
    red = "\x1b[31m",
    green = "\x1b[32m",
    magenta = "\x1b[45m",
}

const TTYReset = "\x1b[0m";

export function colorText(text: string, color: TTYColors): string {
    return `${color}${text}${TTYReset}`;
}
