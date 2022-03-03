import { useContext } from "react";
import * as AuthContext from "../../contexts/auth";

const Login = () => {
    const auth = useContext(AuthContext.Context);

    return (
        <div className="flex">
            {/* @ts-ignore*/}
            <button onClick={() => auth.login({})}>Click To Login</button>
        </div>
    );
};

export default Login;
