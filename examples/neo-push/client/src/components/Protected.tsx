import React, { useContext } from "react";
import { NavigateFunction, useLocation, Route } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../contexts";
import constants from "../constants";
import "../main.css";

function NoPowerHere(navigate: NavigateFunction) {
    const location = useLocation();

    return (
        <div className="mt-3">
            <div className="jumbotron-component d-flex flex-column align-items-center">
                <h1>You have no power here!</h1>
                <FontAwesomeIcon size="6x" icon="user-lock" />
                <Button
                    size="lg"
                    className="mt-4"
                    onClick={() => navigate(constants.SIGN_IN_PAGE, { replace: location.pathname as any })}
                >
                    Sign In
                </Button>
            </div>
        </div>
    );
}

function Protected({
    path,
    component: Component,
    navigate,
}: {
    path: string;
    component: any;
    navigate: NavigateFunction;
}) {
    const { isLoggedIn } = useContext(auth.Context);

    return <Route path={path} element={isLoggedIn ? <Component /> : NoPowerHere(navigate)} />;
}

export default Protected;
