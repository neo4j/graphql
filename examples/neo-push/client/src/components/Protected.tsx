import React, { useContext } from "react";
import { Route } from "react-router-dom";
import { Jumbotron, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../contexts";
import { useHistory, useLocation } from "react-router-dom";
import constants from "../constants";

function NoPowerHere() {
    const history = useHistory();
    const location = useLocation();

    return (
        <div className="mt-3">
            <Jumbotron className="d-flex flex-column align-items-center">
                <h1>You have no power here!</h1>
                <FontAwesomeIcon size="6x" icon="user-lock" />
                <Button
                    size="lg"
                    className="mt-4"
                    onClick={() => history.push(constants.SIGN_IN_PAGE, { redirect: location.pathname })}
                >
                    Sign In
                </Button>
            </Jumbotron>
        </div>
    );
}

function Protected({ exact, path, component: Component }: { exact: boolean; path: string; component: any }) {
    const { isLoggedIn } = useContext(auth.Context);

    return (
        <Route
            exact={exact}
            path={path}
            render={(props) => {
                if (!isLoggedIn) {
                    return <NoPowerHere />;
                }

                return <Component {...props} />;
            }}
        />
    );
}

export default Protected;
