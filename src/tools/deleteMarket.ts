import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const DeleteMarketInputSchema = z.object({
  id: z.string().describe("The ID of the market to delete."),
});
type DeleteMarketInput = z.infer<typeof DeleteMarketInputSchema>;

let shopifyClient: GraphQLClient;

export const deleteMarket = {
  name: "delete-market",
  description: "Deletes a market definition",
  schema: DeleteMarketInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: DeleteMarketInput) => {
    try {
      const query = gql`
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

      const response = await shopifyClient.request<any>(query, input);

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
    } catch (error) {
      return handleToolError("deleteMarket", error);
    }
  },
};
