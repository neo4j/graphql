import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { icons } from "./utils";

library.add(...icons);

ReactDOM.render(<App />, document.querySelector("#root"));
