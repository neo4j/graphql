function formatCypherProperties(properties: string[]): string {
    if (!properties.length) {
        return "";
    }

    return `{ ${properties.join(", ")} }`;
}

export default formatCypherProperties;
