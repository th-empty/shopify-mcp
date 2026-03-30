import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const DeleteMetaobjectInputSchema = z.object({
  id: z.string().describe("The ID of the metaobject to delete"),
});

type DeleteMetaobjectInput = z.infer<typeof DeleteMetaobjectInputSchema>;

let shopifyClient: GraphQLClient;

export const deleteMetaobject = {
  name: "delete-metaobject",
  description: "Deletes a metaobject entry",
  schema: DeleteMetaobjectInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: DeleteMetaobjectInput) => {
    try {
      const query = gql`
        mutation metaobjectDelete($id: ID!) {
          metaobjectDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await shopifyClient.request<any>(query, input);

      if (response.metaobjectDelete?.userErrors?.length > 0) {
        return {
          success: false,
          errors: response.metaobjectDelete.userErrors,
        };
      }

      return {
        success: true,
        deletedId: response.metaobjectDelete?.deletedId,
      };
    } catch (error) {
      return handleToolError("deleteMetaobject", error);
    }
  },
};
