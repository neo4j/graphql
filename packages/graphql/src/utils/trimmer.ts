// Replace all \n with a space & replace all spaces > 1 with a single space
function trimmer(str: string): string {
    return str.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
}

export default trimmer;
