function escapeVar(str: string): string {
    return `\`${str}\``;
}

export default escapeVar;
