export interface IgnoredConstructor {
    resolvers: string[];
}

class Ignored {
    public resolvers: string[];

    constructor(input: IgnoredConstructor) {
        this.resolvers = input.resolvers;
    }
}

export default Ignored;
