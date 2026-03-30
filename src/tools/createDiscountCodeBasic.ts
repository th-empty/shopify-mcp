import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";

const CreateDiscountCodeBasicInputSchema = z.object({
  title: z.string().describe("The internal title of the discount"),
  code: z.string().describe("The code the customer enters (e.g. 'SUMMER20')"),
  startsAt: z
    .string()
    .describe("ISO 8601 date time (e.g. '2026-06-01T00:00:00Z')"),
  endsAt: z.string().optional().describe("Optional end time"),
  minimumRequirement: z
    .object({
      quantity: z.number().optional().describe("Minimum quantity of items"),
      subtotal: z.number().optional().describe("Minimum subtotal value"),
    })
    .optional()
    .describe("Either quantity OR subtotal minimum requirement"),
  customerSelection: z
    .enum(["all", "prerequisite"])
    .default("all")
    .describe("Whether all customers can use it"),
  usageLimit: z
    .number()
    .optional()
    .describe("Total number of times the discount can be used"),
  value: z
    .object({
      percentage: z
        .number()
        .optional()
        .describe("Percentage off (e.g. 0.20 for 20%)"),
      amount: z.number().optional().describe("Fixed amount off"),
    })
    .describe("Must provide EITHER percentage (0.1 = 10%) OR amount"),
});

type CreateDiscountCodeBasicInput = z.infer<
  typeof CreateDiscountCodeBasicInputSchema
>;

let shopifyClient: GraphQLClient;

const createDiscountCodeBasic = {
  name: "discount-code-create-basic",
  description: "Create a basic percentage or fixed amount discount code.",
  schema: CreateDiscountCodeBasicInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: CreateDiscountCodeBasicInput) => {
    try {
      const mutation = gql`
        mutation discountCodeBasicCreate(
          $basicCodeDiscount: DiscountCodeBasicInput!
        ) {
          discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  summary
                  status
                  codes(first: 5) {
                    nodes {
                      code
                    }
                  }
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

      let valueInput: any = {};
      if (args.value.percentage) {
        valueInput.percentage = args.value.percentage;
      } else if (args.value.amount) {
        valueInput.fixedAmount = { amount: args.value.amount };
      } else {
        throw new Error(
          "Either value.percentage or value.amount must be provided",
        );
      }

      let minRequirementInput: any = undefined;
      if (args.minimumRequirement) {
        if (args.minimumRequirement.quantity) {
          minRequirementInput = {
            quantity: {
              greaterThanOrEqualToQuantity:
                args.minimumRequirement.quantity.toString(),
            },
          };
        } else if (args.minimumRequirement.subtotal) {
          minRequirementInput = {
            subtotal: {
              greaterThanOrEqualToSubtotal:
                args.minimumRequirement.subtotal.toString(),
            },
          };
        }
      }

      const input = {
        title: args.title,
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        code: args.code,
        customerSelection:
          args.customerSelection === "all" ? { all: true } : undefined,
        customerGets: {
          value: valueInput,
          items: { all: true }, // Applies to all items in cart by default for simplicity
        },
        usageLimit: args.usageLimit,
        minimumRequirement: minRequirementInput,
      };

      const response = await shopifyClient.request<any>(mutation, {
        basicCodeDiscount: input,
      });

      const { userErrors, codeDiscountNode } = response.discountCodeBasicCreate;
      checkUserErrors(userErrors, "create basic discount code");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ discount: codeDiscountNode }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleToolError("CreateDiscountCodeBasic", error);
    }
  },
};

export { createDiscountCodeBasic };
