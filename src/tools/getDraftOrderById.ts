import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetDraftOrderByIdInputSchema = z.object({
  id: z
    .string()
    .describe("The ID of the draft order (gid://shopify/DraftOrder/...)"),
});

type GetDraftOrderByIdInput = z.infer<typeof GetDraftOrderByIdInputSchema>;

let shopifyClient: GraphQLClient;

const getDraftOrderById = {
  name: "draft-order-get-by-id",
  description: "Get detailed information about a specific draft order.",
  schema: GetDraftOrderByIdInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetDraftOrderByIdInput) => {
    try {
      const query = gql`
        query getDraftOrderById($id: ID!) {
          draftOrder(id: $id) {
            id
            name
            status
            createdAt
            invoiceUrl
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              id
              email
            }
            lineItems(first: 10) {
              nodes {
                id
                title
                name
                quantity
                originalTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<{
        draftOrder: any;
      }>(query, {
        id: args.id,
      });

      if (!response.draftOrder) {
        throw new Error(`Draft order not found with ID ${args.id}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ draftOrder: response.draftOrder }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetDraftOrderById", error);
    }
  },
};

export { getDraftOrderById };
