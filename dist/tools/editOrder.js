import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";
const EditOrderInputSchema = z.object({
    orderId: z
        .string()
        .describe("The ID of the order to edit (gid://shopify/Order/...)"),
    addVariants: z
        .array(z.object({
        variantId: z
            .string()
            .describe("The ID of the product variant to add (gid://shopify/ProductVariant/...)"),
        quantity: z.number().describe("Quantity to add"),
    }))
        .optional()
        .describe("List of variants to add to the order"),
    addCustomItems: z
        .array(z.object({
        title: z.string().describe("Name of the custom item"),
        price: z.number().describe("Price per unit"),
        quantity: z.number().describe("Quantity to add"),
        currencyCode: z
            .string()
            .default("USD")
            .describe("Currency code (e.g. USD, EUR)"),
    }))
        .optional()
        .describe("List of custom line items to add"),
    setQuantities: z
        .array(z.object({
        lineItemId: z
            .string()
            .describe("The ID of the EXISTING line item to adjust (gid://shopify/LineItem/...)"),
        quantity: z
            .number()
            .describe("The NEW total quantity for this line item (0 to completely remove)"),
        restock: z
            .boolean()
            .default(true)
            .describe("Whether to restock inventory if quantity is decreased"),
    }))
        .optional()
        .describe("List of existing line items to adjust quantity for"),
    notifyCustomer: z
        .boolean()
        .default(false)
        .describe("Whether to send an email notification to the customer about the edit"),
    staffNote: z
        .string()
        .optional()
        .describe("Internal note about this edit (visible to staff only)"),
});
let shopifyClient;
const editOrder = {
    name: "order-edit",
    description: "Begin, modify, and commit edits to an existing order (add variants, custom items, or modify/remove quantities).",
    schema: EditOrderInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            // Step 1: Begin the edit session
            const beginMutation = gql `
        mutation orderEditBegin($id: ID!) {
          orderEditBegin(id: $id) {
            calculatedOrder {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const beginRes = await shopifyClient.request(beginMutation, {
                id: args.orderId,
            });
            checkUserErrors(beginRes.orderEditBegin.userErrors, "execute mutation");
            const calculatedOrderId = beginRes.orderEditBegin.calculatedOrder.id;
            // Step 2: Apply changes
            // 2a. Add Variants
            if (args.addVariants && args.addVariants.length > 0) {
                for (const variant of args.addVariants) {
                    const addVarMutation = gql `
            mutation orderEditAddVariant(
              $id: ID!
              $variantId: ID!
              $quantity: Int!
            ) {
              orderEditAddVariant(
                id: $id
                variantId: $variantId
                quantity: $quantity
              ) {
                userErrors {
                  field
                  message
                }
              }
            }
          `;
                    const res = await shopifyClient.request(addVarMutation, {
                        id: calculatedOrderId,
                        variantId: variant.variantId,
                        quantity: variant.quantity,
                    });
                    checkUserErrors(res.orderEditAddVariant.userErrors, "execute mutation");
                }
            }
            // 2b. Add Custom Items
            if (args.addCustomItems && args.addCustomItems.length > 0) {
                for (const item of args.addCustomItems) {
                    const addCustomMutation = gql `
            mutation orderEditAddCustomItem(
              $id: ID!
              $title: String!
              $quantity: Int!
              $price: MoneyInput!
            ) {
              orderEditAddCustomItem(
                id: $id
                title: $title
                quantity: $quantity
                price: $price
              ) {
                userErrors {
                  field
                  message
                }
              }
            }
          `;
                    const res = await shopifyClient.request(addCustomMutation, {
                        id: calculatedOrderId,
                        title: item.title,
                        quantity: item.quantity,
                        price: {
                            amount: item.price.toString(),
                            currencyCode: item.currencyCode,
                        },
                    });
                    checkUserErrors(res.orderEditAddCustomItem.userErrors, "execute mutation");
                }
            }
            // 2c. Modify existing quantities
            if (args.setQuantities && args.setQuantities.length > 0) {
                for (const item of args.setQuantities) {
                    // Convert LineItem ID to CalculatedLineItem ID format
                    const calcLineItemId = item.lineItemId.replace("LineItem", "CalculatedLineItem");
                    const setQtyMutation = gql `
            mutation orderEditSetQuantity(
              $id: ID!
              $lineItemId: ID!
              $quantity: Int!
              $restock: Boolean
            ) {
              orderEditSetQuantity(
                id: $id
                lineItemId: $lineItemId
                quantity: $quantity
                restock: $restock
              ) {
                userErrors {
                  field
                  message
                }
              }
            }
          `;
                    const res = await shopifyClient.request(setQtyMutation, {
                        id: calculatedOrderId,
                        lineItemId: calcLineItemId,
                        quantity: item.quantity,
                        restock: item.restock,
                    });
                    checkUserErrors(res.orderEditSetQuantity.userErrors, "execute mutation");
                }
            }
            // Step 3: Commit the edit session
            const commitMutation = gql `
        mutation orderEditCommit(
          $id: ID!
          $notifyCustomer: Boolean
          $staffNote: String
        ) {
          orderEditCommit(
            id: $id
            notifyCustomer: $notifyCustomer
            staffNote: $staffNote
          ) {
            order {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 20) {
                nodes {
                  id
                  title
                  quantity
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const commitRes = await shopifyClient.request(commitMutation, {
                id: calculatedOrderId,
                notifyCustomer: args.notifyCustomer,
                staffNote: args.staffNote,
            });
            checkUserErrors(commitRes.orderEditCommit.userErrors, "execute mutation");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ order: commitRes.orderEditCommit.order }, null, 2),
                        title: "Order successfully edited",
                    },
                ],
            };
        }
        catch (error) {
            return handleToolError("EditOrder", error);
        }
    },
};
export { editOrder };
