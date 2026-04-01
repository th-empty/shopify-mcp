import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";
const ReturnCreateInputSchema = z.object({
    orderId: z
        .string()
        .describe("The ID of the order to return (gid://shopify/Order/...)"),
    returnLineItems: z
        .array(z.object({
        fulfillmentLineItemId: z
            .string()
            .describe("The fulfillment line item ID to return"),
        quantity: z.number().describe("The quantity to return"),
        returnReason: z
            .string()
            .optional()
            .describe("Reason for return (e.g. UNKNOWN, WRONG_ITEM, DEFECTIVE)"),
        returnReasonNote: z
            .string()
            .optional()
            .describe("Note about the reason"),
    }))
        .min(1)
        .describe("The items being returned"),
});
let shopifyClient;
const returnCreate = {
    name: "return-create",
    description: "Create a return for an order (requires fulfilled line items).",
    schema: ReturnCreateInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            const mutation = gql `
        mutation returnCreate($returnInput: ReturnInput!) {
          returnCreate(returnInput: $returnInput) {
            return {
              id
              status
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const response = await shopifyClient.request(mutation, {
                returnInput: {
                    orderId: args.orderId,
                    returnLineItems: args.returnLineItems.map((item) => ({
                        fulfillmentLineItemId: item.fulfillmentLineItemId,
                        quantity: item.quantity,
                        returnReason: item.returnReason || "UNKNOWN",
                        returnReasonNote: item.returnReasonNote || "",
                    })),
                },
            });
            const { userErrors, return: createdReturn } = response.returnCreate;
            checkUserErrors(userErrors, "execute mutation");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ return: createdReturn }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return handleToolError("ReturnCreate", error);
        }
    },
};
export { returnCreate };
