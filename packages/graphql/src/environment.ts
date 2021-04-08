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

/*  Getters: 
    https://stackoverflow.com/questions/45194598/using-process-env-in-typescript
    https://dev.to/isthatcentered/typing-process-env-and-dealing-with-nodeenv-3ilm
    If you just do;
        exports const NEO4J_GRAPHQL_JWT_ROLES_OBJECT_PATH = process.env.NEO4J_GRAPHQL_JWT_ROLES_OBJECT_PATH;
    the const will be undefined.
*/
const environment = {
    get NEO4J_GRAPHQL_JWT_SECRET() {
        return process.env.NEO4J_GRAPHQL_JWT_SECRET;
    },
    get NEO4J_GRAPHQL_JWT_NO_VERIFY() {
        return Boolean(process.env.NEO4J_GRAPHQL_JWT_NO_VERIFY || false);
    },
    get NEO4J_GRAPHQL_DISABLE_REGEX() {
        return Boolean(process.env.NEO4J_GRAPHQL_DISABLE_REGEX || false);
    },
    get NEO4J_GRAPHQL_JWT_ROLES_OBJECT_PATH() {
        return process.env.NEO4J_GRAPHQL_JWT_ROLES_OBJECT_PATH;
    },
    get NPM_PACKAGE_VERSION() {
        return process.env.NPM_PACKAGE_VERSION as string;
    },
    get NPM_PACKAGE_NAME() {
        return process.env.NPM_PACKAGE_NAME as string;
    },
};

export default environment;
