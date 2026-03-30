import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetOrderReturnsInputSchema = z.object({
  orderId: z
    .string()
    .describe(
      "The ID of the order to get returns for (gid://shopify/Order/...)",
    ),
  first: z
    .number()
    .optional()
    .default(10)
    .describe("Number of returns to fetch"),
});

type GetOrderReturnsInput = z.infer<typeof GetOrderReturnsInputSchema>;

let shopifyClient: GraphQLClient;

const getOrderReturns = {
  name: "order-get-returns",
  description: "Get all returns associated with a specific order.",
  schema: GetOrderReturnsInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetOrderReturnsInput) => {
    try {
      const query = gql`
        query getOrderReturns($id: ID!, $first: Int!) {
          order(id: $id) {
            id
            returns(first: $first) {
              nodes {
                id
                name
                status
                createdAt
                totalQuantity
                returnLineItems(first: 10) {
                  nodes {
                    id
                    quantity
                    returnReasonNote
                    fulfillmentLineItem {
                      lineItem {
                        title
                        sku
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<{
        order: any;
      }>(query, {
        id: args.orderId,
        first: args.first,
      });

      if (!response.order) {
        throw new Error(`Order not found with ID ${args.orderId}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { returns: response.order.returns.nodes },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetOrderReturns", error);
    }
  },
};

export { getOrderReturns };
