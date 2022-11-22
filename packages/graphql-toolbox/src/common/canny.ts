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
