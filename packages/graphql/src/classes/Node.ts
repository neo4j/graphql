export interface NodeConstructor {
    name: string;
}

class Node {
    public name: string;

    constructor(input: NodeConstructor) {
        this.name = input.name;
    }
}

export default Node;
