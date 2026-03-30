import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetDraftOrdersInputSchema = z.object({
  first: z
    .number()
    .optional()
    .default(10)
    .describe("Number of draft orders to fetch"),
  query: z.string().optional().describe("Search query (e.g., 'status:open')"),
});

type GetDraftOrdersInput = z.infer<typeof GetDraftOrdersInputSchema>;

let shopifyClient: GraphQLClient;

const getDraftOrders = {
  name: "draft-order-list",
  description: "Get a list of draft orders.",
  schema: GetDraftOrdersInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetDraftOrdersInput) => {
    try {
      const query = gql`
        query getDraftOrders($first: Int!, $query: String) {
          draftOrders(first: $first, query: $query) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              name
              status
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                id
                email
                firstName
                lastName
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<{
        draftOrders: any;
      }>(query, {
        first: args.first,
        query: args.query,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { draftOrders: response.draftOrders },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetDraftOrders", error);
    }
  },
};

export { getDraftOrders };
