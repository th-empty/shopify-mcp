import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const DeleteFileInputSchema = z.object({
  fileIds: z
    .array(z.string())
    .min(1)
    .describe("List of File IDs to securely delete"),
});
type DeleteFileInput = z.infer<typeof DeleteFileInputSchema>;

let shopifyClient: GraphQLClient;

export const deleteFile = {
  name: "delete-file",
  description: "Permanently removes file assets from the store",
  schema: DeleteFileInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: DeleteFileInput) => {
    try {
      const query = gql`
        mutation fileDelete($fileIds: [ID!]!) {
          fileDelete(fileIds: $fileIds) {
            deletedFileIds
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = { fileIds: input.fileIds };
      const response = await shopifyClient.request<any>(query, variables);

      if (response.fileDelete?.userErrors?.length > 0) {
        return {
          success: false,
          errors: response.fileDelete.userErrors,
        };
      }

      return {
        success: true,
        deletedFileIds: response.fileDelete?.deletedFileIds,
      };
    } catch (error) {
      return handleToolError("deleteFile", error);
    }
  },
};
