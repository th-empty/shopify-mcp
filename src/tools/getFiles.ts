import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { edgesToNodes, handleToolError } from "../lib/toolUtils.js";

const GetFilesInputSchema = z.object({
  first: z
    .number()
    .min(1)
    .max(250)
    .default(50)
    .optional()
    .describe("Number of files to return (max 250)"),
  query: z
    .string()
    .optional()
    .describe(
      "Search query for files (e.g. 'filename:image.jpg' or 'media_type:IMAGE')",
    ),
});
type GetFilesInput = z.infer<typeof GetFilesInputSchema>;

let shopifyClient: GraphQLClient;

export const getFiles = {
  name: "get-files",
  description: "Retrieves a paginated list of files uploaded to the store",
  schema: GetFilesInputSchema,

  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: GetFilesInput) => {
    try {
      const query = gql`
        query GetFiles($first: Int!, $query: String) {
          files(first: $first, query: $query) {
            edges {
              node {
                __typename
                ... on GenericFile {
                  id
                  url
                  alt
                  fileStatus
                }
                ... on MediaImage {
                  id
                  alt
                  fileStatus
                  image {
                    url
                    width
                    height
                  }
                }
                ... on Video {
                  id
                  alt
                  fileStatus
                  sources {
                    url
                    format
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const variables = {
        first: input.first ?? 50,
        query: input.query,
      };

      const response = await shopifyClient.request<any>(query, variables);

      return {
        success: true,
        files: edgesToNodes(response.files),
        pageInfo: response.files?.pageInfo,
      };
    } catch (error) {
      return handleToolError("getFiles", error);
    }
  },
};
