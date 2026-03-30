import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetDiscountsInputSchema = z.object({
  first: z
    .number()
    .optional()
    .default(10)
    .describe("Number of discounts to fetch"),
  query: z.string().optional().describe("Search query (e.g., 'status:active')"),
});

type GetDiscountsInput = z.infer<typeof GetDiscountsInputSchema>;

let shopifyClient: GraphQLClient;

const getDiscounts = {
  name: "discount-list",
  description:
    "Get a list of all discount nodes (both automatic and code-based).",
  schema: GetDiscountsInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetDiscountsInput) => {
    try {
      const query = gql`
        query getDiscounts($first: Int!, $query: String) {
          discountNodes(first: $first, query: $query) {
            nodes {
              id
              discount {
                ... on DiscountCodeBasic {
                  title
                  status
                  summary
                  createdAt
                }
                ... on DiscountAutomaticBasic {
                  title
                  status
                  summary
                  createdAt
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  summary
                  createdAt
                }
                ... on DiscountAutomaticBxgy {
                  title
                  status
                  summary
                  createdAt
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  summary
                  createdAt
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<any>(query, {
        first: args.first,
        query: args.query,
      });

      // Filter out empty discounts and format cleanly
      const discounts = response.discountNodes.nodes
        .filter((node: any) => node.discount !== null)
        .map((node: any) => ({
          id: node.id,
          ...node.discount,
        }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ discounts }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetDiscounts", error);
    }
  },
};

export { getDiscounts };
