import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const FileCreateInputTypeSchema = z.object({
  originalSource: z
    .string()
    .describe(
      "An external URL (for images) or a staged upload URL. e.g. https://example.com/image.jpg",
    ),
  filename: z.string().optional().describe("Output filename"),
  alt: z.string().optional().describe("Alt text for the file"),
});

const CreateFileInputSchema = z.object({
  files: z
    .array(FileCreateInputTypeSchema)
    .min(1)
    .describe("List of files to create/upload"),
});
type CreateFileInput = z.infer<typeof CreateFileInputSchema>;

let shopifyClient: GraphQLClient;

export const createFile = {
  name: "create-file",
  description:
    "Creates files using external URLs (e.g. standard images). For non-image files, you need a Staged Upload URL first, which is not fully covered by this simple method.",
  schema: CreateFileInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: CreateFileInput) => {
    try {
      const query = gql`
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              __typename
              id
              fileStatus
              alt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = { files: input.files };
      const response = await shopifyClient.request<any>(query, variables);

      if (response.fileCreate?.userErrors?.length > 0) {
        return {
          success: false,
          errors: response.fileCreate.userErrors,
        };
      }

      return {
        success: true,
        files: response.fileCreate?.files,
      };
    } catch (error) {
      return handleToolError("createFile", error);
    }
  },
};
