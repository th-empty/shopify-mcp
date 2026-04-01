import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const UpdateMarketInputSchema = z.object({
    id: z.string().describe("The ID of the market to update."),
    name: z.string().optional().describe("The name of the market."),
    handle: z.string().optional().describe("A unique identifier for the market."),
    status: z
        .enum(["ACTIVE", "DRAFT"])
        .optional()
        .describe("The status of the market."),
});
let shopifyClient;
export const updateMarket = {
    name: "update-market",
    description: "Updates an existing Market",
    schema: UpdateMarketInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation marketUpdate($id: ID!, $input: MarketUpdateInput!) {
          marketUpdate(id: $id, input: $input) {
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
            const { id, ...updateInput } = input;
            const variables = { id, input: updateInput };
            const response = await shopifyClient.request(query, variables);
            if (response.marketUpdate?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.marketUpdate.userErrors,
                };
            }
            return {
                success: true,
                market: response.marketUpdate?.market,
            };
        }
        catch (error) {
            return handleToolError("updateMarket", error);
        }
    },
};
