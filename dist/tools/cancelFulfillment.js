import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";
const CancelFulfillmentInputSchema = z.object({
    id: z
        .string()
        .describe("The ID of the fulfillment to cancel (gid://shopify/Fulfillment/...)"),
});
let shopifyClient;
const cancelFulfillment = {
    name: "fulfillment-cancel",
    description: "Cancel an existing fulfillment in Shopify.",
    schema: CancelFulfillmentInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            const mutation = gql `
        mutation fulfillmentCancel($id: ID!) {
          fulfillmentCancel(id: $id) {
            fulfillment {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const response = await shopifyClient.request(mutation, {
                id: args.id,
            });
            const { userErrors, fulfillment } = response.fulfillmentCancel;
            checkUserErrors(userErrors, "execute mutation");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ fulfillment }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return handleToolError("CancelFulfillment", error);
        }
    },
};
export { cancelFulfillment };
