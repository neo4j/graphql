import React, { Fragment } from "react";
import { graphql, auth } from "./contexts";
import { Home, SignUp, SignIn, Logout, Protected, Blog, Post } from "./components";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { NavBar, Dashboard } from "./components";
import constants from "./constants";
import "./main.css";

const Root = (): JSX.Element => {
    const navigate = useNavigate();

    return (
        <Fragment>
            <NavBar />
            <Routes>
                <Route path={constants.HOME_PAGE} element={Home()} />
                <Route path={constants.SIGN_UP_PAGE} element={SignUp(navigate)} />
                <Route path={constants.SIGN_IN_PAGE} element={SignIn(navigate)} />
                <Protected path={constants.LOG_OUT_PAGE} navigate={navigate} component={Logout(navigate)} />
                <Route path={constants.BLOG_PAGE + "/:id"} element={Blog(navigate)} />
                <Route path={constants.POST_PAGE + "/:id"} element={Post(navigate)} />
                <Protected path={constants.DASHBOARD_PAGE} navigate={navigate} component={Dashboard} />
            </Routes>
        </Fragment>
    );
};

export default function App() {
    return (
        <graphql.Provider>
            <auth.Provider>
                {/* @ts-ignore - Needs further investigation */}
                <HashRouter>
                    <Root />
                </HashRouter>
            </auth.Provider>
        </graphql.Provider>
    );
}
