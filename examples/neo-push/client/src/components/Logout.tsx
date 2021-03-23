import React, { useContext, useEffect } from "react";
import { auth } from "../contexts";
import { useHistory } from "react-router-dom";
import * as config from "../config";
import constants from "../constants";

function Logout() {
    const history = useHistory();
    const { getSetValue } = useContext(auth.Context);

    useEffect(() => {
        getSetValue()((v: any) => ({ ...v, isLoggedIn: false }));
        localStorage.removeItem(config.JWT_KEY as string);
        history.push(constants.HOME_PAGE);
    }, [getSetValue]);

    return <></>;
}

export default Logout;
