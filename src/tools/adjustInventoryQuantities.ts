import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";

const AdjustInventoryQuantitiesInputSchema = z.object({
  reason: z
    .string()
    .describe(
      "Reason for the quantity adjustment (e.g. 'correction', 'received', 'reservation_created')",
    ),
  name: z
    .enum(["available", "on_hand"])
    .describe("Which quantity to adjust: 'available' or 'on_hand'"),
  changes: z
    .array(
      z.object({
        inventoryItemId: z.string().describe("Inventory item GID"),
        locationId: z.string().describe("Location GID"),
        delta: z
          .number()
          .describe("Relative quantity change (can be positive or negative)"),
      }),
    )
    .min(1)
    .describe("Changes to apply for each inventory item at each location"),
});

type AdjustInventoryQuantitiesInput = z.infer<
  typeof AdjustInventoryQuantitiesInputSchema
>;

let shopifyClient: GraphQLClient;

const adjustInventoryQuantities = {
  name: "inventory-adjust-quantities",
  description:
    "Adjust (increment or decrement) inventory quantities for items at specific locations.",
  schema: AdjustInventoryQuantitiesInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: AdjustInventoryQuantitiesInput) => {
    try {
      const mutation = gql`
        mutation inventoryAdjustQuantities(
          $input: InventoryAdjustQuantitiesInput!
        ) {
          inventoryAdjustQuantities(input: $input) {
            inventoryAdjustmentGroup {
              id
              reason
              changes {
                name
                delta
                quantityAfterChange
                item {
                  id
                  sku
                }
                location {
                  name
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

      const response = await shopifyClient.request<{
        inventoryAdjustQuantities: {
          inventoryAdjustmentGroup: any;
          userErrors: any[];
        };
      }>(mutation, {
        input: {
          reason: args.reason,
          name: args.name,
          changes: args.changes.map((change) => ({
            inventoryItemId: change.inventoryItemId,
            locationId: change.locationId,
            delta: change.delta,
          })),
        },
      });

      const { userErrors, inventoryAdjustmentGroup } =
        response.inventoryAdjustQuantities;
      checkUserErrors(userErrors, "execute mutation");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ inventoryAdjustmentGroup }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleToolError("InventoryAdjustQuantities", error);
    }
  },
};

export { adjustInventoryQuantities };
