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

import Debug from "debug";
import { Integer } from "neo4j-driver";
import { MutationMeta } from "../classes/WithProjector";
import { DEBUG_PUBLISH } from "../constants";
import { Context } from "../types";
import { ExecuteResult } from "./execute";

const debug = Debug(DEBUG_PUBLISH);

function publishMutateMeta(input: {
    context: Context;
    executeResult: ExecuteResult;
}): void {
    const { context, executeResult } = input;

    // eslint-disable-next-line no-restricted-syntax
    for (const x of executeResult.records) {
        if (x.mutateMeta && Array.isArray(x.mutateMeta)) {
            // eslint-disable-next-line no-restricted-syntax
            for (const meta of x.mutateMeta as MutationMeta[]) {
                // eslint-disable-next-line no-continue
                if (!meta.id) { continue; }
                meta.id = (meta.id as unknown as Integer).toNumber();
                const trigger = `${ meta.name }.${ meta.type }`;

                debug("%s", `${ trigger }: ${JSON.stringify(meta, null, 2)}`);

                context.pubsub.publish(trigger, meta)
                    .catch((err) => debug(`Failed to publish ${ trigger }: %s`, err));
            }

        }
    }
}

export default publishMutateMeta;
