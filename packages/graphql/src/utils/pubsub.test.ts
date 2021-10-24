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

import { localEventEmitter, localPubSub, PubSubEventEmitter } from "./pubsub";


describe("pubsub", () => {
    test("should create an any listener", () => {
        
        const em = new PubSubEventEmitter();
        
        const events: { event: string | symbol, args: any[] }[] = [];
        
        em.addAnyListener((event, ...args) => {
            events.push({ event, args });
        });

        em.emit('test.event', 'a', 'b');
        em.emit('test.2', 'a');
        em.emit('test.42');

        expect(events).toEqual([
            {
                event: 'test.event',
                args: [ 'a', 'b' ],
            },
            {
                event: 'test.2',
                args: [ 'a' ],
            },
            {
                event: 'test.42',
                args: [],
            },
        ]);

    });


    test("should use the any listener in localPubSub", async () => {
        const events: any[] = [];
        function onEvent(event: string | symbol, payload) {
            events.push({ event, payload });
        }

        localEventEmitter.addAnyListener(onEvent);
        expect(localEventEmitter.rawAnyListeners()).toHaveLength(1);

        await localPubSub.publish('trigger', { hello: 'world' });

        expect(events).toEqual([{
            event: 'trigger',
            payload: {
                hello: 'world',
            },
        }]);

        localEventEmitter.removeAnyListener(onEvent);
        expect(localEventEmitter.rawAnyListeners()).toHaveLength(0);
    });
});
