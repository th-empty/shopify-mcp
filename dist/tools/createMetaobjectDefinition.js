import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const MetaobjectFieldDefinitionCreateInputSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z
        .string()
        .describe("e.g. 'single_line_text_field', 'multi_line_text_field', 'number_integer'"),
    required: z.boolean().optional(),
});
const CreateMetaobjectDefinitionInputSchema = z.object({
    type: z
        .string()
        .describe("The type namespace. Prefix with '$app:' to reserve for your app's exclusive use"),
    name: z.string(),
    description: z.string().optional(),
    fieldDefinitions: z
        .array(MetaobjectFieldDefinitionCreateInputSchema)
        .optional(),
});
let shopifyClient;
export const createMetaobjectDefinition = {
    name: "create-metaobject-definition",
    description: "Creates a metaobject definition that establishes the structure for custom data objects",
    schema: CreateMetaobjectDefinitionInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation metaobjectDefinitionCreate(
          $definition: MetaobjectDefinitionCreateInput!
        ) {
          metaobjectDefinitionCreate(definition: $definition) {
            metaobjectDefinition {
              id
              type
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            const variables = { definition: input };
            const response = await shopifyClient.request(query, variables);
            if (response.metaobjectDefinitionCreate?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.metaobjectDefinitionCreate.userErrors,
                };
            }
            return {
                success: true,
                metaobjectDefinition: response.metaobjectDefinitionCreate?.metaobjectDefinition,
            };
        }
        catch (error) {
            return handleToolError("createMetaobjectDefinition", error);
        }
    },
};
