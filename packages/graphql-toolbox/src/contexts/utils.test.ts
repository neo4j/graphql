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

import { getConnectUrlSearchParamValue } from "./utils";

describe("getConnectUrlSearchParamValue", () => {
    test("should process connectURL query param with only username present", () => {
        const tmpOriginalWindowLocationHref = "http://localhost?connectURL=bolt://testuser1@localhost:3333";
        window.history.replaceState({}, "", tmpOriginalWindowLocationHref);

        const { url, username, password, protocol } = getConnectUrlSearchParamValue() || {};
        expect(url).toBe("bolt://localhost:3333");
        expect(username).toBe("testuser1");
        expect(password).toBeNull();
        expect(protocol).toBe("bolt");
    });

    test("should process connectURL query param with username and password present", () => {
        const tmpOriginalWindowLocationHref = "http://localhost?connectURL=bolt://testuser1:password@localhost:3333";
        window.history.replaceState({}, "", tmpOriginalWindowLocationHref);

        const { url, username, password, protocol } = getConnectUrlSearchParamValue() || {};
        expect(url).toBe("bolt://localhost:3333");
        expect(username).toBe("testuser1");
        expect(password).toBe("password");
        expect(protocol).toBe("bolt");
    });

    test("should process connectURL query param without username or password present", () => {
        const tmpOriginalWindowLocationHref = "http://localhost?connectURL=bolt://localhost:3333";
        window.history.replaceState({}, "", tmpOriginalWindowLocationHref);

        const { url, username, password, protocol } = getConnectUrlSearchParamValue() || {};
        expect(url).toBe("bolt://localhost:3333");
        expect(username).toBeNull();
        expect(password).toBeNull();
        expect(protocol).toBe("bolt");
    });

    test("should process connectURL query param with secure bolt protocol", () => {
        const tmpOriginalWindowLocationHref = "http://localhost?connectURL=bolt%2Bs://localhost:3333";
        window.history.replaceState({}, "", tmpOriginalWindowLocationHref);

        const { url, username, password, protocol } = getConnectUrlSearchParamValue() || {};
        expect(url).toBe("bolt+s://localhost:3333");
        expect(username).toBeNull();
        expect(password).toBeNull();
        expect(protocol).toBe("bolt+s");
    });
});
