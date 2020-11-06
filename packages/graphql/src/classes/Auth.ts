export type AuthOperations = "create" | "read" | "update" | "delete";

export type AuthRule = {
    isAuthenticated?: boolean;
    operations?: AuthOperations[];
    allow?: { [k: string]: any } | "*";
    roles?: string[];
};

export interface AuthConstructor {
    rules: AuthRule[];
}

class Auth {
    public rules: AuthRule[];

    public type: "JWT";

    constructor(input: AuthConstructor) {
        this.rules = input.rules;
        this.type = "JWT";
    }
}

export default Auth;
