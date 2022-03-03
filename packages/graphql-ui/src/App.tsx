import Main from "./components/main/Main";
import "./index.css";
import * as AuthContext from "./contexts/auth";

const App = () => {
    return (
        <AuthContext.Provider>
            <Main />
        </AuthContext.Provider>
    );
};

export default App;
