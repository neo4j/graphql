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

import { LOCAL_STATE_ENABLE_PRODUCT_USAGE_TRACKING } from "src/constants";
import { Storage } from "./storage";

class Tracking {
    public trackFavorites = () => {
        this.fireTrackingEvent("ux", "favorites");
    };

    private fireTrackingEvent = (eventCategory: string, eventLabel: string, eventProperties = {}) => {
        const trackingConsent = Storage.retrieve(LOCAL_STATE_ENABLE_PRODUCT_USAGE_TRACKING);

        if (trackingConsent !== "true") return;
        if (!window.analytics || !window.analytics.track) return;

        const enrichedEventProperties = {
            graphQLToolboxVersion: process.env.VERSION,
            neo4jGraphQLLibraryVersion: process.env.NEO4J_GRAPHQL_VERSION,
            ...eventProperties,
        };
        window.analytics.track(`${eventCategory}-${eventLabel}`, enrichedEventProperties);
    };
}

export const tracking = new Tracking();
