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

import * as neo4j from "neo4j-driver";

/** Raw event metadata returned from queries */
export type EventMeta = {
    event: "create" | "update" | "delete";
    properties: {
        old: Record<string, any>;
        new: Record<string, any>;
    };
    typename: string;
    id: neo4j.Integer | string | number;
    timestamp: neo4j.Integer | string | number;
};

/** Serialized subscription event */
export type SubscriptionsEvent = (
    | {
          event: "create";
          properties: {
              old: undefined;
              new: Record<string, any>;
          };
      }
    | {
          event: "update";
          properties: {
              old: Record<string, any>;
              new: Record<string, any>;
          };
      }
    | {
          event: "delete";
          properties: {
              old: Record<string, any>;
              new: undefined;
          };
      }
) & { id: number; timestamp: number; typename: string };
