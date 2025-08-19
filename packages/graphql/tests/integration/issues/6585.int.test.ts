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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6585", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let UrlShortcutFamily: UniqueType;
    let CMSContent: UniqueType;
    let OrganizationUnit: UniqueType;
    let CMSProject: UniqueType;
    let UrlShortcut: UniqueType;
    let ActiveDirectoryUser: UniqueType;

    beforeEach(async () => {
        UrlShortcutFamily = testHelper.createUniqueType("UrlShortcutFamily");
        CMSContent = testHelper.createUniqueType("CMSContent");
        OrganizationUnit = testHelper.createUniqueType("OrganizationUnit");
        CMSProject = testHelper.createUniqueType("CMSProject");
        UrlShortcut = testHelper.createUniqueType("UrlShortcut");
        ActiveDirectoryUser = testHelper.createUniqueType("ActiveDirectoryUser");

        typeDefs = /* GraphQL */ `
            type ${UrlShortcutFamily} @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                changedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                cmsContent: [${CMSContent}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT"
                        properties: "UrlshortcutfamilyRedirectsToCmscontentProperties"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                createdAt: DateTime @timestamp(operations: [CREATE])
                id: ID! @settable(onCreate: true, onUpdate: false)
                isActive: Boolean! @default(value: false)
                organizationUnit: [${OrganizationUnit}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT"
                        properties: "UrlshortcutfamilyBelongsToOrganizationunitProperties"
                        direction: OUT
                        nestedOperations: [CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                releasedBy: [${ActiveDirectoryUser}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_IS_RELEASED_BY_ACTIVEDIRECTORYUSER"
                        properties: "UrlshortcutfamilyIsReleasedByActivedirectoryuserProperties"
                        direction: OUT
                        nestedOperations: [CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                requestedBy: [${ActiveDirectoryUser}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER"
                        properties: "UrlshortcutfamilyIsRequestedByActivedirectoryuserProperties"
                        direction: OUT
                        nestedOperations: [CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                urlPath: String!
                urlShortcuts: [${UrlShortcut}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT"
                        properties: "UrlshortcutfamilyConsistsOfUrlshortcutProperties"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
            }

            type ${CMSContent} @mutation(operations: [DELETE, CREATE, UPDATE]) @node @subscription(events: []) {
                changedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                createdAt: DateTime @timestamp(operations: [CREATE])
                gid: String! @settable(onCreate: true, onUpdate: false)
                organizationUnits: [${OrganizationUnit}!]!
                    @relationship(
                        type: "CMSCONTENT_BELONGS_TO_ORGANIZATIONUNIT"
                        direction: OUT
                        nestedOperations: []
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: false, onUpdate: false)
                project: [${CMSProject}!]!
                    @relationship(
                        type: "CMSCONTENT_IS_FOR_CMSPROJECT"
                        properties: "CmscontentIsForCmsprojectProperties"
                        direction: OUT
                        nestedOperations: [CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: false)
                projectId: String!
                    @settable(onCreate: true, onUpdate: false)
                    @populatedBy(callback: "CMSContentProjectIdCallback", operations: [CREATE])
            }

            type ${OrganizationUnit} @mutation(operations: []) @node @subscription(events: []) {
                abbreviation: String!
            }

            type ${CMSProject} @mutation(operations: [UPDATE]) @node @subscription(events: []) {
                changedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                createdAt: DateTime @timestamp(operations: [CREATE])
                id: String! @settable(onCreate: true, onUpdate: false)
            }

            type ${UrlShortcut} @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                changedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                createdAt: DateTime @timestamp(operations: [CREATE])
                id: ID! @settable(onCreate: true, onUpdate: false)
                urlPath: String!
                urlShortcutFamily: [${UrlShortcutFamily}!]!
                    @relationship(
                        type: "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT"
                        properties: "UrlshortcutfamilyConsistsOfUrlshortcutProperties"
                        direction: IN
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
            }

            type ${ActiveDirectoryUser}
                @mutation(operations: [])
                @node(labels: ["${ActiveDirectoryUser}"])
                @subscription(events: []) {
                userName: String!
            }

            type CmscontentIsForCmsprojectProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "CMSCONTENT_IS_FOR_CMSPROJECT_OUTGOING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }

            type UrlshortcutfamilyConsistsOfUrlshortcutProperties @relationshipProperties {
                _pkTo: String!
                    @populatedBy(
                        callback: "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT_INCOMING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }

            type UrlshortcutfamilyRedirectsToCmscontentProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT_OUTGOING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }

            type UrlshortcutfamilyBelongsToOrganizationunitProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT_OUTGOING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }

            type UrlshortcutfamilyIsReleasedByActivedirectoryuserProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "URLSHORTCUTFAMILY_IS_RELEASED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }

            type UrlshortcutfamilyIsRequestedByActivedirectoryuserProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        CMSContentProjectIdCallback: () => {
                            return "CMSContentProjectIdCallback";
                        },
                        CMSCONTENT_IS_FOR_CMSPROJECT_OUTGOING_TO_ONE_CONSTRAINT_Callback: () => {
                            return "CMSCONTENT_IS_FOR_CMSPROJECT_OUTGOING_TO_ONE_CONSTRAINT_Callback";
                        },
                        URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT_INCOMING_TO_ONE_CONSTRAINT_Callback: () => {
                            return "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT_INCOMING_TO_ONE_CONSTRAINT_Callback";
                        },
                        URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT_OUTGOING_TO_ONE_CONSTRAINT_Callback: () => {
                            return "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT_OUTGOING_TO_ONE_CONSTRAINT_Callback";
                        },
                        URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT_OUTGOING_TO_ONE_CONSTRAINT_Callback: () => {
                            return "URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT_OUTGOING_TO_ONE_CONSTRAINT_Callback";
                        },
                        URLSHORTCUTFAMILY_IS_RELEASED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback:
                            () => {
                                return "URLSHORTCUTFAMILY_IS_RELEASED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback";
                            },
                        URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback:
                            () => {
                                return "URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback";
                            },
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should trigger populatedBy callbacks on nested create simple", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUrlShortcutFamilies: ${UrlShortcutFamily.operations.create}(
                    input: [
                        {
                            id: "d10da25b-868b-4f7c-8ea4-72676d63794d"
                            isActive: false
                            urlPath: "test-create"
                            cmsContent: { create: [{ node: { gid: "ff24ca04-fa99-4d3f-9ef0-4b4a970aa3f7" } }] }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            createUrlShortcutFamilies: {
                info: {
                    nodesCreated: 2,
                    relationshipsCreated: 1,
                },
            },
        });

        const shortcutFamilyProperties = {
            id: "d10da25b-868b-4f7c-8ea4-72676d63794d",
            isActive: false,
            urlPath: "test-create",
            createdAt: expect.toBeDate(),
            changedAt: expect.toBeDate(),
        };

        await testHelper
            .expectRelationship(UrlShortcutFamily, CMSContent, "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT")
            .toEqual([
                {
                    from: shortcutFamilyProperties,
                    to: {
                        changedAt: expect.toBeDate(),
                        createdAt: expect.toBeDate(),
                        gid: "ff24ca04-fa99-4d3f-9ef0-4b4a970aa3f7",
                        projectId: "CMSContentProjectIdCallback",
                    },
                    relationship: {
                        _pkFrom: "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT_OUTGOING_TO_ONE_CONSTRAINT_Callback",
                    },
                },
            ]);
    });

    test("should trigger populatedBy callbacks on nested create", async () => {
        await testHelper.executeCypher(`
            CREATE (:${OrganizationUnit} { abbreviation: "Compl" })
            CREATE (:${CMSProject} { id:"27312f49-02e6-41ad-b754-2c79f53ee9a9", changedAt: date(), createdAt: date() })
            CREATE (:${ActiveDirectoryUser} { userName: "test"})
            `);

        const query = /* GraphQL */ `
            mutation {
                createUrlShortcutFamilies: ${UrlShortcutFamily.operations.create}(
                    input: [
                        {
                            id: "d10da25b-868b-4f7c-8ea4-72676d63794d"
                            isActive: false
                            urlPath: "test-create"
                            cmsContent: {
                                create: [
                                    {
                                        node: {
                                            gid: "ff24ca04-fa99-4d3f-9ef0-4b4a970aa3f7"
                                            project: {
                                                connect: [
                                                    {
                                                        where: {
                                                            node: { id: { eq: "27312f49-02e6-41ad-b754-2c79f53ee9a9" } }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                            organizationUnit: { connect: [{ where: { node: { abbreviation: { eq: "Compl" } } } }] }
                            requestedBy: { connect: [{ where: { node: { userName: { eq: "test" } } } }] }
                            urlShortcuts: {
                                create: [
                                    { node: { id: "59e10e44-b152-483a-a4eb-d386a2a0a9cf", urlPath: "test-create" } }
                                ]
                            }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            createUrlShortcutFamilies: {
                info: {
                    nodesCreated: 3,
                    relationshipsCreated: 5,
                },
            },
        });

        const shortcutFamilyProperties = {
            id: "d10da25b-868b-4f7c-8ea4-72676d63794d",
            isActive: false,
            urlPath: "test-create",
            createdAt: expect.toBeDate(),
            changedAt: expect.toBeDate(),
        };

        // .cmsContent
        await testHelper
            .expectRelationship(UrlShortcutFamily, CMSContent, "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT")
            .toEqual([
                {
                    from: shortcutFamilyProperties,
                    to: {
                        changedAt: expect.toBeDate(),
                        createdAt: expect.toBeDate(),
                        gid: "ff24ca04-fa99-4d3f-9ef0-4b4a970aa3f7",
                        projectId: "CMSContentProjectIdCallback",
                    },
                    relationship: {
                        _pkFrom: "URLSHORTCUTFAMILY_REDIRECTS_TO_CMSCONTENT_OUTGOING_TO_ONE_CONSTRAINT_Callback",
                    },
                },
            ]);

        // .cmsContent.project
        await testHelper.expectRelationship(CMSContent, CMSProject, "CMSCONTENT_IS_FOR_CMSPROJECT").toEqual([
            {
                from: expect.toBeObject(),
                to: {
                    changedAt: expect.toBeDate(),
                    createdAt: expect.toBeDate(),
                    id: "27312f49-02e6-41ad-b754-2c79f53ee9a9",
                },
                relationship: {
                    _pkFrom: "CMSCONTENT_IS_FOR_CMSPROJECT_OUTGOING_TO_ONE_CONSTRAINT_Callback",
                },
            },
        ]);

        // .organizationUnit
        await testHelper
            .expectRelationship(UrlShortcutFamily, OrganizationUnit, "URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT")
            .toEqual([
                {
                    from: shortcutFamilyProperties,
                    to: {
                        abbreviation: "Compl",
                    },
                    relationship: {
                        _pkFrom: "URLSHORTCUTFAMILY_BELONGS_TO_ORGANIZATIONUNIT_OUTGOING_TO_ONE_CONSTRAINT_Callback",
                    },
                },
            ]);

        // .requestedBy
        await testHelper
            .expectRelationship(
                UrlShortcutFamily,
                ActiveDirectoryUser,
                "URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER"
            )
            .toEqual([
                {
                    from: shortcutFamilyProperties,
                    to: {
                        userName: "test",
                    },
                    relationship: {
                        _pkFrom:
                            "URLSHORTCUTFAMILY_IS_REQUESTED_BY_ACTIVEDIRECTORYUSER_OUTGOING_TO_ONE_CONSTRAINT_Callback",
                    },
                },
            ]);

        // .urlShortcuts
        await testHelper
            .expectRelationship(UrlShortcutFamily, UrlShortcut, "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT")
            .toEqual([
                {
                    from: shortcutFamilyProperties,
                    to: {
                        changedAt: expect.toBeDate(),
                        createdAt: expect.toBeDate(),
                        id: "59e10e44-b152-483a-a4eb-d386a2a0a9cf",
                        urlPath: "test-create",
                    },
                    relationship: {
                        _pkTo: "URLSHORTCUTFAMILY_CONSISTS_OF_URLSHORTCUT_INCOMING_TO_ONE_CONSTRAINT_Callback",
                    },
                },
            ]);
    });
});
