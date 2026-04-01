import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const CreateMarketInputSchema = z.object({
    name: z.string().describe("The name of the market. Not shown to customers."),
    handle: z
        .string()
        .optional()
        .describe("A unique identifier for the market. Auto-generated if not provided."),
    status: z
        .enum(["ACTIVE", "DRAFT"])
        .optional()
        .describe("The status of the market."),
});
let shopifyClient;
export const createMarket = {
    name: "create-market",
    description: "Creates a new Market",
    schema: CreateMarketInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation marketCreate($input: MarketCreateInput!) {
          marketCreate(input: $input) {
            market {
              id
              name
              handle
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const variables = { input };
            const response = await shopifyClient.request(query, variables);
            if (response.marketCreate?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.marketCreate.userErrors,
                };
            }
            return {
                success: true,
                market: response.marketCreate?.market,
            };
        }
        catch (error) {
            return handleToolError("createMarket", error);
        }
    },
};
