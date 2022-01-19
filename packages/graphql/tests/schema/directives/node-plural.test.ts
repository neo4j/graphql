import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql/utilities";
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";

describe("Node Directive", () => {
    describe("Plural option", () => {
        test("Partial types with plural", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Techs") {
                    name: String
                }

                type Tech {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateTechsMutationResponse {
                  info: CreateInfo!
                  techs: [Tech!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createTechs(input: [TechCreateInput!]!): CreateTechsMutationResponse!
                  deleteTechs(where: TechWhere): DeleteInfo!
                  updateTechs(update: TechUpdateInput, where: TechWhere): UpdateTechsMutationResponse!
                }

                type Query {
                  techs(options: TechOptions, where: TechWhere): [Tech!]!
                  techsAggregate(where: TechWhere): TechAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type Tech {
                  name: String
                  value: String
                }

                type TechAggregateSelection {
                  count: Int!
                  name: StringAggregateSelectionNullable!
                  value: StringAggregateSelectionNullable!
                }

                input TechCreateInput {
                  name: String
                  value: String
                }

                input TechOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more TechSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [TechSort]
                }

                \\"\\"\\"Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.\\"\\"\\"
                input TechSort {
                  name: SortDirection
                  value: SortDirection
                }

                input TechUpdateInput {
                  name: String
                  value: String
                }

                input TechWhere {
                  AND: [TechWhere!]
                  OR: [TechWhere!]
                  name: String
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_IN: [String]
                  name_NOT: String
                  name_NOT_CONTAINS: String
                  name_NOT_ENDS_WITH: String
                  name_NOT_IN: [String]
                  name_NOT_STARTS_WITH: String
                  name_STARTS_WITH: String
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateTechsMutationResponse {
                  info: UpdateInfo!
                  techs: [Tech!]!
                }
                "
            `);
        });

        test("Partial types with same plural in both", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Techs") {
                    name: String
                }

                type Tech @node(plural: "Techs") {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateTechsMutationResponse {
                  info: CreateInfo!
                  techs: [Tech!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createTechs(input: [TechCreateInput!]!): CreateTechsMutationResponse!
                  deleteTechs(where: TechWhere): DeleteInfo!
                  updateTechs(update: TechUpdateInput, where: TechWhere): UpdateTechsMutationResponse!
                }

                type Query {
                  techs(options: TechOptions, where: TechWhere): [Tech!]!
                  techsAggregate(where: TechWhere): TechAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type Tech {
                  name: String
                  value: String
                }

                type TechAggregateSelection {
                  count: Int!
                  name: StringAggregateSelectionNullable!
                  value: StringAggregateSelectionNullable!
                }

                input TechCreateInput {
                  name: String
                  value: String
                }

                input TechOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more TechSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [TechSort]
                }

                \\"\\"\\"Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.\\"\\"\\"
                input TechSort {
                  name: SortDirection
                  value: SortDirection
                }

                input TechUpdateInput {
                  name: String
                  value: String
                }

                input TechWhere {
                  AND: [TechWhere!]
                  OR: [TechWhere!]
                  name: String
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_IN: [String]
                  name_NOT: String
                  name_NOT_CONTAINS: String
                  name_NOT_ENDS_WITH: String
                  name_NOT_IN: [String]
                  name_NOT_STARTS_WITH: String
                  name_STARTS_WITH: String
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateTechsMutationResponse {
                  info: UpdateInfo!
                  techs: [Tech!]!
                }
                "
            `);
        });

        test("Partial types with different plural", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Techs") {
                    name: String
                }

                type Tech @node(plural: "Technologies") {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateTechnologiesMutationResponse {
                  info: CreateInfo!
                  technologies: [Tech!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createTechnologies(input: [TechCreateInput!]!): CreateTechnologiesMutationResponse!
                  deleteTechnologies(where: TechWhere): DeleteInfo!
                  updateTechnologies(update: TechUpdateInput, where: TechWhere): UpdateTechnologiesMutationResponse!
                }

                type Query {
                  technologies(options: TechOptions, where: TechWhere): [Tech!]!
                  technologiesAggregate(where: TechWhere): TechAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type Tech {
                  name: String
                  value: String
                }

                type TechAggregateSelection {
                  count: Int!
                  name: StringAggregateSelectionNullable!
                  value: StringAggregateSelectionNullable!
                }

                input TechCreateInput {
                  name: String
                  value: String
                }

                input TechOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more TechSort objects to sort Technologies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [TechSort]
                }

                \\"\\"\\"Fields to sort Technologies by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.\\"\\"\\"
                input TechSort {
                  name: SortDirection
                  value: SortDirection
                }

                input TechUpdateInput {
                  name: String
                  value: String
                }

                input TechWhere {
                  AND: [TechWhere!]
                  OR: [TechWhere!]
                  name: String
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_IN: [String]
                  name_NOT: String
                  name_NOT_CONTAINS: String
                  name_NOT_ENDS_WITH: String
                  name_NOT_IN: [String]
                  name_NOT_STARTS_WITH: String
                  name_STARTS_WITH: String
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateTechnologiesMutationResponse {
                  info: UpdateInfo!
                  technologies: [Tech!]!
                }
                "
            `);
        });

        test("Collision between Type and plural", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Techs") {
                    name: String
                }

                type Techs {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateTechsMutationResponse {
                  info: CreateInfo!
                  techs: [Techs!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createTechs(input: [TechsCreateInput!]!): CreateTechsMutationResponse!
                  deleteTechs(where: TechsWhere): DeleteInfo!
                  updateTechs(update: TechsUpdateInput, where: TechsWhere): UpdateTechsMutationResponse!
                }

                type Query {
                  techs(options: TechsOptions, where: TechsWhere): [Techs!]!
                  techsAggregate(where: TechsWhere): TechsAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type Techs {
                  value: String
                }

                type TechsAggregateSelection {
                  count: Int!
                  value: StringAggregateSelectionNullable!
                }

                input TechsCreateInput {
                  value: String
                }

                input TechsOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more TechsSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [TechsSort]
                }

                \\"\\"\\"Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechsSort object.\\"\\"\\"
                input TechsSort {
                  value: SortDirection
                }

                input TechsUpdateInput {
                  value: String
                }

                input TechsWhere {
                  AND: [TechsWhere!]
                  OR: [TechsWhere!]
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateTechsMutationResponse {
                  info: UpdateInfo!
                  techs: [Techs!]!
                }
                "
            `);
        });

        test("Same plural on multiple nodes", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Techs") {
                    name: String
                }

                type User @node(plural: "Techs") {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateTechsMutationResponse {
                  info: CreateInfo!
                  techs: [User!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createTechs(input: [UserCreateInput!]!): CreateTechsMutationResponse!
                  deleteTechs(where: UserWhere): DeleteInfo!
                  updateTechs(update: UserUpdateInput, where: UserWhere): UpdateTechsMutationResponse!
                }

                type Query {
                  techs(options: UserOptions, where: UserWhere): [User!]!
                  techsAggregate(where: UserWhere): UserAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateTechsMutationResponse {
                  info: UpdateInfo!
                  techs: [User!]!
                }

                type User {
                  value: String
                }

                type UserAggregateSelection {
                  count: Int!
                  value: StringAggregateSelectionNullable!
                }

                input UserCreateInput {
                  value: String
                }

                input UserOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more UserSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [UserSort]
                }

                \\"\\"\\"Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
                input UserSort {
                  value: SortDirection
                }

                input UserUpdateInput {
                  value: String
                }

                input UserWhere {
                  AND: [UserWhere!]
                  OR: [UserWhere!]
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }
                "
            `);
        });

        test("Collision with pluralize", () => {
            const typeDefs = gql`
                type Tech @node(plural: "Users") {
                    name: String
                }

                type User {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateUsersMutationResponse {
                  info: CreateInfo!
                  users: [User!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
                  deleteUsers(where: UserWhere): DeleteInfo!
                  updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
                }

                type Query {
                  users(options: UserOptions, where: UserWhere): [User!]!
                  usersAggregate(where: UserWhere): UserAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateUsersMutationResponse {
                  info: UpdateInfo!
                  users: [User!]!
                }

                type User {
                  value: String
                }

                type UserAggregateSelection {
                  count: Int!
                  value: StringAggregateSelectionNullable!
                }

                input UserCreateInput {
                  value: String
                }

                input UserOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [UserSort]
                }

                \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
                input UserSort {
                  value: SortDirection
                }

                input UserUpdateInput {
                  value: String
                }

                input UserWhere {
                  AND: [UserWhere!]
                  OR: [UserWhere!]
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }
                "
            `);
        });

        test("Type collision with pluralize", () => {
            const typeDefs = gql`
                type User {
                    name: String
                }

                type Users {
                    value: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateUsersMutationResponse {
                  info: CreateInfo!
                  users: [Users!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Mutation {
                  createUsers(input: [UsersCreateInput!]!): CreateUsersMutationResponse!
                  deleteUsers(where: UsersWhere): DeleteInfo!
                  updateUsers(update: UsersUpdateInput, where: UsersWhere): UpdateUsersMutationResponse!
                }

                type Query {
                  users(options: UsersOptions, where: UsersWhere): [Users!]!
                  usersAggregate(where: UsersWhere): UsersAggregateSelection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type UpdateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateUsersMutationResponse {
                  info: UpdateInfo!
                  users: [Users!]!
                }

                type Users {
                  value: String
                }

                type UsersAggregateSelection {
                  count: Int!
                  value: StringAggregateSelectionNullable!
                }

                input UsersCreateInput {
                  value: String
                }

                input UsersOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"Specify one or more UsersSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
                  sort: [UsersSort]
                }

                \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UsersSort object.\\"\\"\\"
                input UsersSort {
                  value: SortDirection
                }

                input UsersUpdateInput {
                  value: String
                }

                input UsersWhere {
                  AND: [UsersWhere!]
                  OR: [UsersWhere!]
                  value: String
                  value_CONTAINS: String
                  value_ENDS_WITH: String
                  value_IN: [String]
                  value_NOT: String
                  value_NOT_CONTAINS: String
                  value_NOT_ENDS_WITH: String
                  value_NOT_IN: [String]
                  value_NOT_STARTS_WITH: String
                  value_STARTS_WITH: String
                }
                "
            `);
        });
    });
});
