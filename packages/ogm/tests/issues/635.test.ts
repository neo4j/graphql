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

import { generate, OGM } from "../../src";

describe("issues/635", () => {
    test("should re-create issue and ensure no duplicate types", async () => {
        const typeDefs = `
        enum Role {
            SUPER_ADMIN
            ADMIN
            OWNER
            MANAGER
            EMPLOYEE
          }

          enum FeatureName {
            NONE
          }

          enum BodyStyle {
            MICRO
            SEDAN
            CUV
            SUV
            HATCHBACK
            MINIVAN
            CONVERTABLE
            COUPE
            SUPERCAR
            ROADSTER
            PICKUP
            VAN
            LIMOUSINE
            CAMPERVAN
            TRUCK
          }

          enum TimeClockType {
            IN
            OUT
            BREAK
            LUNCH
          }

          enum IntegrationNames {
            STRIPE
          }

          enum PriceTier {
            FREE
            PREMIUM
            PARTNER
          }
          ## END ENUMS ##

          ## START NODES ##
          type User {
            id: ID! @id
            email: String! @unique
            firstName: String!
            lastName: String!
            fullName: String! @customResolver
            role: Role!
            hashedPassword: String! @private
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp
            company: Company! @relationship(type: "WORKS_AT", direction: OUT)
            workHistory: [WorkOrderItem!]!
              @relationship(type: "WORKED_ON", direction: OUT)
            timeHistory: [TimeClock!]! @relationship(type: "CLOCK_FOR", direction: IN)
          }

          type TimeClock {
            id: ID! @id
            type: TimeClockType
            createdAt: DateTime! @timestamp(operations: [CREATE])
            user: User! @relationship(type: "CLOCK_FOR", direction: OUT)
          }

          type Company {
            id: ID! @id
            name: String! @unique
            stripeCustomerId: String @unique
            pricingTier: PriceTier
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp
            employees: [User!]! @relationship(type: "WORKS_AT", direction: IN)
            customers: [Customer!]! @relationship(type: "CUSTOMER_AT", direction: IN)
            workOrders: [WorkOrder!]! @relationship(type: "WORK_OWNED_BY", direction: IN)
            features: [CompanyFeatures!]!
              @relationship(type: "FEATURE_TOGGLED", direction: OUT)
            clockSettings: CompanyClockSettings!
              @relationship(type: "CLOCK_SETTINGS", direction: OUT)
            integrations: [CompanyIntegrations!]!
              @relationship(type: "INTEGRATION_FOR", direction: IN)
          }

          type CompanyIntegrations {
            id: ID! @id
            name: IntegrationNames!
            publicApiKey: String!
            privateApiKey: String!
            company: Company! @relationship(type: "INTEGRATION_FOR", direction: OUT)
          }

          type CompanyClockSettings {
            id: ID! @id
            breakTime: Int @default(value: 15)
            lunchTime: Int @default(value: 30)
            company: Company! @relationship(type: "CLOCK_SETTINGS", direction: IN)
          }

          type CompanyFeatures {
            id: ID! @id
            featureName: FeatureName!
            createdAt: DateTime! @timestamp(operations: [CREATE])
            company: Company! @relationship(type: "FEATURE_TOGGLED", direction: IN)
          }

          type WorkOrder {
            id: ID! @id
            budget: Float
            description: String!
            estimatedCompletionDate: DateTime!
            startDate: DateTime
            completedDate: DateTime
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp
            workedOnBy: Company! @relationship(type: "WORK_OWNED_BY", direction: OUT)
            workOrderItems: [WorkOrderItem!]!
              @relationship(type: "ITEM_FOR", direction: IN)
            vehicle: Vehicle! @relationship(type: "SERVICE_FOR", direction: OUT)
          }

          type WorkOrderItem {
            id: ID! @id
            item: String!
            cost: Float
            startedAt: DateTime
            completedAt: DateTime
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp
            completedBy: User @relationship(type: "WORKED_ON", direction: IN)
            workOrder: WorkOrder @relationship(type: "ITEM_FOR", direction: OUT)
          }

          type Customer {
            id: ID! @id
            email: String!
            firstName: String!
            lastName: String!
            fullName: String! @customResolver
            phoneNumber: String!
            servicer: Company @relationship(type: "CUSTOMER_AT", direction: OUT)
            vehicles: [Customer!]! @relationship(type: "VEHICLE_OWNED_BY", direction: IN)
          }

          type Vehicle {
            id: ID! @id
            vin: String!
            workOrders: [WorkOrder!]! @relationship(type: "SERVICE_FOR", direction: IN)
            owner: Customer! @relationship(type: "VEHICLE_OWNED_BY", direction: OUT)
            model: ModelTrim! @relationship(type: "VEHICLE_MODEL", direction: OUT)
          }

          type Manufacturer {
            id: ID! @id
            name: String! @unique
            models: [Model!]! @relationship(type: "MADE_BY", direction: IN)
          }

          type Model {
            id: ID! @id
            year: Int!
            style: BodyStyle!
            name: String!
            models: [Model!]! @relationship(type: "MADE_BY", direction: IN)
            trims: [ModelTrim!]! @relationship(type: "TRIM_FOR", direction: IN)
          }

          type ModelTrim {
            id: ID! @id
            name: String!
            model: Model @relationship(type: "TRIM_FOR", direction: OUT)
            customerVehicles: [Vehicle!]!
              @relationship(type: "VEHICLE_MODEL", direction: IN)
            paintCodes: [PaintCodes!]! @relationship(type: "HAS_PAINT", direction: OUT)
          }

          type PaintCodes {
            id: ID! @id
            code: String! @unique
            trims: [ModelTrim!]! @relationship(type: "HAS_PAINT", direction: IN)
          }
        `;

        const resolvers = {
            User: {
                fullName: () => "User's full name",
            },
            Customer: {
                fullName: () => "Customer's full name",
            },
        };

        const ogm = new OGM({
            typeDefs,
            resolvers,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toContain(`export type CompanyClockSettingsAggregateInput`);
        expect(generated).not.toContain(`export interface CompanyClockSettingsAggregateInput`);
        expect(generated).toContain(`export interface CompanyClockSettingsAggregateSelectionInput`);

        expect(generated).toContain(`export type CompanyFeaturesAggregateInput`);
        expect(generated).not.toContain(`export interface CompanyFeaturesAggregateInput`);
        expect(generated).toContain(`export interface CompanyFeaturesAggregateSelectionInput`);

        expect(generated).toContain(`export type CompanyIntegrationsAggregateInput`);
        expect(generated).not.toContain(`export interface CompanyIntegrationsAggregateInput`);
        expect(generated).toContain(`export interface CompanyIntegrationsAggregateSelectionInput`);
    });
});
