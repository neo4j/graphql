import { gql } from "graphql-tag";
import { GraphQLError } from "graphql";
import { buildSubgraphSchema } from "@apollo/subgraph";

class DeliveryEstimates {
    estimatedDelivery: string;
    fastestDelivery: string;

    constructor() {
        this.estimatedDelivery = "5/1/2019";
        this.fastestDelivery = "5/1/2019";
    }
}

const typeDefs = gql`
    extend schema
        @link(
            url: "https://specs.apollo.dev/federation/v2.0"
            import: ["@key", "@requires", "@shareable", "@provides", "@external", "@tag"]
        )

    extend type Product @key(fields: "id") {
        id: ID! @external
        dimensions: ProductDimension @external
        delivery(zip: String): DeliveryEstimates @requires(fields: "dimensions { size weight }")
    }

    type ProductDimension @shareable {
        size: String
        weight: Float
    }

    type DeliveryEstimates {
        estimatedDelivery: String
        fastestDelivery: String
    }
`;

const resolvers = {
    Product: {
        delivery: (product, args) => {
            // Validate Product has external information as per @requires
            if (product.id != "apollo-federation") throw new GraphQLError("product.id was not 'apollo-federation'");
            if (product.dimensions.size != "small") throw new GraphQLError("product.dimensions.size was not 'small'");
            if (product.dimensions.weight != 1) throw new GraphQLError("product.dimensions.weight was not '1'");
            if (args.zip != "94111") throw new GraphQLError("product.delivery input zip was not '94111'");

            return new DeliveryEstimates();
        },
    },
};

export const schema = buildSubgraphSchema({ typeDefs, resolvers });
