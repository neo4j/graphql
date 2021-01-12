export interface ExcludeConstructor {
    operations: string[];
}

class Exclude {
    public operations: string[];

    constructor(input: ExcludeConstructor) {
        this.operations = input.operations;
    }
}

export default Exclude;
