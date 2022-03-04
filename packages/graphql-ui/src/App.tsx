import Main from "./components/main/Main";
import * as AuthContext from "./contexts/auth";
import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import "./index.css";

const App = () => {
    return (
        <AuthContext.Provider>
            <Main />
        </AuthContext.Provider>
    );
};

export default App;
