import React from "react";
import { graphql, auth } from "./contexts";
import { Home, SignUp, SignIn, Logout, Protected, Blog, Post } from "./components";
import { HashRouter, Switch, Route } from "react-router-dom";
import { NavBar, Dashboard } from "./components";
import "./main.css";
import constants from "./constants";

export default function App() {
    return (
        <graphql.Provider>
            <auth.Provider>
                <HashRouter>
                    <NavBar />
                    <Switch>
                        <Route exact path={constants.HOME_PAGE} component={Home} />
                        <Route exact path={constants.SIGN_UP_PAGE} component={SignUp} />
                        <Route exact path={constants.SIGN_IN_PAGE} component={SignIn} />
                        <Protected exact path={constants.LOG_OUT_PAGE} component={Logout} />
                        <Route exact path={constants.BLOG_PAGE + "/:id"} component={Blog} />
                        <Route exact path={constants.POST_PAGE + "/:id"} component={Post} />
                        <Protected exact path={constants.DASHBOARD_PAGE} component={Dashboard} />
                    </Switch>
                </HashRouter>
            </auth.Provider>
        </graphql.Provider>
    );
}
