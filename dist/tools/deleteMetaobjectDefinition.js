import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const DeleteMetaobjectDefinitionInputSchema = z.object({
    id: z.string().describe("The ID of the metaobject definition to delete"),
});
let shopifyClient;
export const deleteMetaobjectDefinition = {
    name: "delete-metaobject-definition",
    description: "Deletes a metaobject definition and all its metaobjects",
    schema: DeleteMetaobjectDefinitionInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        mutation metaobjectDefinitionDelete($id: ID!) {
          metaobjectDefinitionDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;
            const response = await shopifyClient.request(query, input);
            if (response.metaobjectDefinitionDelete?.userErrors?.length > 0) {
                return {
                    success: false,
                    errors: response.metaobjectDefinitionDelete.userErrors,
                };
            }
            return {
                success: true,
                deletedId: response.metaobjectDefinitionDelete?.deletedId,
            };
        }
        catch (error) {
            return handleToolError("deleteMetaobjectDefinition", error);
        }
    },
};
