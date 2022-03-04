import { useCallback } from "react";
import { useContext, useState } from "react";
import * as AuthContext from "../../contexts/auth";
import { FormInput } from "./FormInput";
import { Button } from "@neo4j-ndl/react";

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const auth = useContext(AuthContext.Context);

    const onSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        (async () => {
            try {
                const data = new FormData(event.currentTarget);
                const username = data.get("username") as string;
                const password = data.get("password") as string;
                const url = data.get("url") as string;

                await auth.login({
                    username,
                    password,
                    url,
                });
            } catch (error) {
                setLoading(false);
                setError((error as Error).message as string);
            }
        })();
    }, []);

    return (
        <div className="grid place-items-center h-screen bg-secondarydark">
            <div className="w-full max-w-md">
                <form onSubmit={onSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <FormInput
                            id="username"
                            label="Username"
                            name="username"
                            placeholder="admin"
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-6">
                        <FormInput
                            id="password"
                            label="Password"
                            name="password"
                            placeholder="password"
                            required={true}
                            type="password"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-8">
                        <FormInput
                            id="url"
                            label="Bolt URL"
                            name="url"
                            placeholder="bolt://localhost:7687"
                            defaultValue="bolt://localhost:7687"
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button fill="outlined" type="submit" disabled={loading}>
                            {loading ? <>Logging In</> : <span>Sign In</span>}
                        </Button>
                    </div>

                    {error && (
                        <p className="mt-4 inline-block align-baseline font-bold text-sm text-red-500">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
