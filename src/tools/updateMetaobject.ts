import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const MetaobjectFieldUpdateInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const UpdateMetaobjectInputSchema = z.object({
  id: z.string().describe("The ID of the metaobject to update"),
  handle: z.string().optional().describe("New handle"),
  fields: z
    .array(MetaobjectFieldUpdateInputSchema)
    .optional()
    .describe("Fields to update"),
});

type UpdateMetaobjectInput = z.infer<typeof UpdateMetaobjectInputSchema>;

let shopifyClient: GraphQLClient;

export const updateMetaobject = {
  name: "update-metaobject",
  description: "Updates a metaobject entry",
  schema: UpdateMetaobjectInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: UpdateMetaobjectInput) => {
    try {
      const query = gql`
        mutation metaobjectUpdate(
          $id: ID!
          $metaobject: MetaobjectUpdateInput!
        ) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject {
              id
              handle
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const { id, ...metaobjectInput } = input;
      const variables = { id, metaobject: metaobjectInput };
      const response = await shopifyClient.request<any>(query, variables);

      if (response.metaobjectUpdate?.userErrors?.length > 0) {
        return {
          success: false,
          errors: response.metaobjectUpdate.userErrors,
        };
      }

      return {
        success: true,
        metaobject: response.metaobjectUpdate?.metaobject,
      };
    } catch (error) {
      return handleToolError("updateMetaobject", error);
    }
  },
};
