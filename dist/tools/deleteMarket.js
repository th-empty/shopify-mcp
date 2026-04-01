import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const DeleteMarketInputSchema = z.object({
    id: z.string().describe("The ID of the market to delete."),
});
let shopifyClient;
export const deleteMarket = {
    name: "delete-market",
    description: "Deletes a market definition",
    schema: DeleteMarketInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation marketDelete($id: ID!) {
          marketDelete(id: $id) {
            deletedMarketId
            userErrors {
              field
              message
            }
          }
        }
      `;
            const response = await shopifyClient.request(query, input);
            if (response.marketDelete?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.marketDelete.userErrors,
                };
            }
            return {
                success: true,
                deletedMarketId: response.marketDelete?.deletedMarketId,
            };
        }
        catch (error) {
            return handleToolError("deleteMarket", error);
        }
    },
};
