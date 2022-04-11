import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { icons } from "./utils";

library.add(...icons);

const rootElement = document.getElementById("root");
// @ts-ignore
const root = createRoot(rootElement);

root.render(<App />);
