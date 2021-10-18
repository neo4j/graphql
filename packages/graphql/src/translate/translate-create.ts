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

import { Node } from "../classes";
import WithProjector, { Projection } from "../classes/WithProjector";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { ConnectionField, Context } from "../types";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createCreateAndParams from "./create-create-and-params";
import createProjectionAndParams from "./create-projection-and-params";

function translateCreate({ context, node }: { context: Context; node: Node }): [string, any] {
    const connectionStrs: string[] = [];
    let connectionParams: any;

    const { resolveTree } = context;

    // Due to potential aliasing of returned object in response we look through fields of CreateMutationResponse
    // and find field where field.name ~ node.name which exists by construction
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { fieldsByTypeName } = Object.values(
        resolveTree.fieldsByTypeName[`Create${node.getPlural({ camelCase: false })}MutationResponse`]
    ).find((field) => field.name === node.getPlural({ camelCase: true }))!;

    const withProjector = new WithProjector({ variables: [] });

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;
            const withProjectorChild = withProjector.createChild(varName);
            withProjectorChild.addVariable(varName);

            const create = [`CALL {`];

            const createAndParams = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withProjector: withProjectorChild,
            });
            create.push(`${createAndParams[0]}`);
            create.push(withProjectorChild.nextReturn());
            create.push(`}`);
            create.push(withProjector.mergeWithChild(withProjectorChild));

            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    /* so projection params don't conflict with create params. We only need to call createProjectionAndParams once. */
    let projAuth = "";
    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName: "REPLACE_ME",
    });
    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    const replacedProjectionParams = Object.entries(projection[1]).reduce((res, [key, value]) => {
        return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
    }, {});

    if (projection[2]?.connectionFields?.length) {
        projection[2].connectionFields.forEach((connectionResolveTree) => {
            const connectionField = node.connectionFields.find(
                (x) => x.fieldName === connectionResolveTree.name
            ) as ConnectionField;
            const connection = createConnectionAndParams({
                resolveTree: connectionResolveTree,
                field: connectionField,
                context,
                nodeVariable: "REPLACE_ME",
            });
            connectionStrs.push(connection[0]);
            if (!connectionParams) connectionParams = {};
            connectionParams = { ...connectionParams, ...connection[1] };
        });
    }

    const replacedConnectionStrs = connectionStrs.length
        ? createStrs.map((_, i) => {
              return connectionStrs
                  .map((connectionStr) => {
                      return connectionStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const projections: Projection[] = createStrs.map((v, i) => {
        return {
            initialVariable: `this${ i }`,
            str: projection[0]
                // First look to see if projection param is being reassigned
                // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                .replace(/\$REPLACE_ME/g, "$projection")
                .replace(/REPLACE_ME/g, `this${i}`),
        }
    });

    const authCalls = createStrs
        .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
        .join("\n");

    const cypher = [`${createStrs.join("\n")}`, authCalls, ...replacedConnectionStrs, withProjector.nextReturn(projections)];

    return [cypher.filter(Boolean).join("\n"), { ...params, ...replacedProjectionParams, ...replacedConnectionParams }];
}

export default translateCreate;
