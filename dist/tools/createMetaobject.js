import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const MetaobjectFieldInputSchema = z.object({
    key: z.string(),
    value: z.string(),
});
const CreateMetaobjectInputSchema = z.object({
    type: z
        .string()
        .describe("The type of the metaobject (must match an existing definition)"),
    handle: z
        .string()
        .optional()
        .describe("Unique handle. Auto-generated if not provided."),
    fields: z
        .array(MetaobjectFieldInputSchema)
        .describe("Field values matching the definition"),
});
let shopifyClient;
export const createMetaobject = {
    name: "create-metaobject",
    description: "Creates a metaobject entry based on an existing MetaobjectDefinition",
    schema: CreateMetaobjectInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation metaobjectCreate($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject {
              id
              type
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const variables = { metaobject: input };
            const response = await shopifyClient.request(query, variables);
            if (response.metaobjectCreate?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.metaobjectCreate.userErrors,
                };
            }
            return {
                success: true,
                metaobject: response.metaobjectCreate?.metaobject,
            };
        }
        catch (error) {
            return handleToolError("createMetaobject", error);
        }
    },
};
