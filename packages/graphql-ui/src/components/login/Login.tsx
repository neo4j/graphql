import { useCallback } from "react";
import { useContext, useState } from "react";
import * as AuthContext from "../../contexts/auth";

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
            <div className="w-full max-w-xs">
                <form onSubmit={onSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Username"
                            required={true}
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            required={true}
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Bolt URL</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="url"
                            name="url"
                            type="text"
                            placeholder="bolt://localhost:7687"
                            required={true}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <>Logging In</> : <span> Sign In</span>}
                        </button>
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
