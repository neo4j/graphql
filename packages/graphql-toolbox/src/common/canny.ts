/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const cannySettings = {
    appID: process.env.CANNY_GRAPHQL_TOOLBOX_APP_ID,
    position: "top",
    align: "left",
    labelIDs: ["637b589ef463447c410200e6"], // INFO: Show only GraphQL Toolbox entries
};

export const CannySDK = {
    init: () =>
        // Note: Code directly obtained from Canny.io
        new Promise(function (resolve, reject) {
            (function (w, d, i, s) {
                if (typeof w.Canny === "function") {
                    return;
                }

                const c = function () {
                    // eslint-disable-next-line prefer-rest-params
                    c.q.push(arguments);
                };
                c.q = [];
                w.Canny = c;
                function l() {
                    if (d.getElementById(i)) {
                        return;
                    }
                    const f = d.getElementsByTagName(s)[0];
                    const e = d.createElement(s);
                    e.setAttribute("type", "text/javascript");
                    e.setAttribute("src", "https://canny.io/sdk.js");
                    e.setAttribute("async", "true");
                    e.onerror = reject;
                    e.onload = resolve;
                    e.addEventListener("error", reject);
                    e.addEventListener("load", resolve);
                    f.parentNode?.insertBefore(e, f);
                }
                if (d.readyState === "complete") {
                    l();
                } else if (w.attachEvent) {
                    w.attachEvent("onload", l);
                } else {
                    w.addEventListener("load", l, false);
                }
            })(window, document, "canny-jssdk", "script");
        }),
};
