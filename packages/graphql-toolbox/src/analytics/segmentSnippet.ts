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

export const invokeSegmentAnalytics = (key: string) => {
    // INFO: This code is provided by Segment. The code was only formatted.

    const analytics = (window.analytics = window.analytics || []);
    if (!analytics.initialize) {
        if (analytics.invoked) {
            console.error("Segment snippet included twice.");
        } else {
            analytics.invoked = !0;
            analytics.methods = [
                "trackSubmit",
                "trackClick",
                "trackLink",
                "trackForm",
                "pageview",
                "identify",
                "reset",
                "group",
                "track",
                "ready",
                "alias",
                "debug",
                "page",
                "once",
                "off",
                "on",
                "addSourceMiddleware",
                "addIntegrationMiddleware",
                "setAnonymousId",
                "addDestinationMiddleware",
            ];
            analytics.factory = function (e: string) {
                return function () {
                    // eslint-disable-next-line prefer-rest-params
                    const t = Array.prototype.slice.call(arguments);
                    t.unshift(e);
                    analytics.push(t);
                    return analytics;
                };
            };
            for (let e = 0; e < analytics.methods.length; e++) {
                const key = analytics.methods[e];
                analytics[key] = analytics.factory(key);
            }
            analytics.load = function (key: string, e: string | undefined) {
                const t = document.createElement("script");
                t.type = "text/javascript";
                t.async = !0;
                t.src = `https://cdn.segment.com/analytics.js/v1/${key}/analytics.min.js`;
                const n = document.getElementsByTagName("script")[0];
                n?.parentNode?.insertBefore(t, n);
                analytics._loadOptions = e;
            };
            analytics._writeKey = key;
            analytics.SNIPPET_VERSION = "4.15.3";
            analytics.load(key);
            analytics.page();
        }
    }
};
