/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import * as pack from "../package.json";

const environment = {
    NPM_PACKAGE_VERSION: pack.version,
    NPM_PACKAGE_NAME: pack.name,
};

export default environment;
