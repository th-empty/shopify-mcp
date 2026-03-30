import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const MetaobjectFieldDefinitionUpdateInputSchema = z.object({
  key: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

const UpdateMetaobjectDefinitionInputSchema = z.object({
  id: z.string().describe("The ID of the metaobject definition to update"),
  name: z.string().optional(),
  description: z.string().optional(),
  fieldDefinitions: z
    .array(MetaobjectFieldDefinitionUpdateInputSchema)
    .optional(),
});

type UpdateMetaobjectDefinitionInput = z.infer<
  typeof UpdateMetaobjectDefinitionInputSchema
>;

let shopifyClient: GraphQLClient;

export const updateMetaobjectDefinition = {
  name: "update-metaobject-definition",
  description:
    "Updates a metaobject definition's configuration and field structure",
  schema: UpdateMetaobjectDefinitionInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: UpdateMetaobjectDefinitionInput) => {
    try {
      const query = gql`
        mutation metaobjectDefinitionUpdate(
          $id: ID!
          $definition: MetaobjectDefinitionUpdateInput!
        ) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
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

      const { id, ...definitionInput } = input;
      const variables = { id, definition: definitionInput };
      const response = await shopifyClient.request<any>(query, variables);

      if (response.metaobjectDefinitionUpdate?.userErrors?.length > 0) {
        return {
          success: false,
          errors: response.metaobjectDefinitionUpdate.userErrors,
        };
      }

      return {
        success: true,
        metaobjectDefinition:
          response.metaobjectDefinitionUpdate?.metaobjectDefinition,
      };
    } catch (error) {
      return handleToolError("updateMetaobjectDefinition", error);
    }
  },
};
