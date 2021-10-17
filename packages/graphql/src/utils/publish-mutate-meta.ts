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
import { MutationMeta, MutationMetaCommon, UpdatedMutationMeta } from "../classes/WithProjector";
import { DEBUG_PUBLISH } from "../constants";
import { Context } from "../types";
import { ExecuteResult } from "./execute";

const debug = Debug(DEBUG_PUBLISH);

export interface MutationEvent extends Omit<MutationMeta, 'id'> {
    id: number;
    bookmark?: string | null;
}

export interface UpdatedMutationEvent extends Omit<MutationEvent, 'type'>, Omit<UpdatedMutationMeta, 'id'> {}


export function isUpdatedMutationEvent(
    ev: MutationEvent,
): ev is UpdatedMutationEvent {
    return ev.type === 'Updated';
}

function publishMutateMeta(input: {
    context: Context;
    executeResult: ExecuteResult;
}): void {
    const { context, executeResult } = input;

    let mutateMetas: MutationMetaCommon[] = [];

    // TODO: refactor duplicate combinator
    executeResult.records.forEach((r) => {
        const arrMutateMeta = r.mutateMeta;
        if (!Array.isArray(arrMutateMeta)) { return; }
        mutateMetas = mutateMetas.concat(
            arrMutateMeta
            .filter((mutateMeta) =>
                !mutateMetas.find((v) => JSON.stringify(v) === JSON.stringify(mutateMeta)
        )));
    });

    mutateMetas.forEach((meta) => {
        if (!meta.id) { return; }
        const trigger = `${ meta.name }.${ meta.type }`;
        const mutationEvent: UpdatedMutationEvent = {
            ...meta,
            id: meta.id.toNumber(),
            bookmark: executeResult.bookmark,
        };

        debug("%s", `${ trigger }: ${JSON.stringify(mutationEvent, null, 2)}`);

        context.pubsub.publish(trigger, mutationEvent)
            .catch((err) => debug(`Failed to publish ${ trigger }: %s`, err));
    });
}

export default publishMutateMeta;
