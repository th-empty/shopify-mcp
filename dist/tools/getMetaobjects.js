import { gql } from "graphql-request";
import { z } from "zod";
import { edgesToNodes, handleToolError } from "../lib/toolUtils.js";
const GetMetaobjectsInputSchema = z.object({
    type: z.string().describe("The type of the metaobject (e.g. 'designer')"),
    first: z
        .number()
        .min(1)
        .max(250)
        .default(50)
        .optional()
        .describe("Number of items to return"),
    query: z
        .string()
        .optional()
        .describe("Search using syntax field:{key}:{value}"),
});
let shopifyClient;
export const getMetaobjects = {
    name: "get-metaobjects",
    description: "Returns a paginated list of Metaobject entries for a specific type",
    schema: GetMetaobjectsInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            const query = gql `
        query GetMetaobjects($type: String!, $first: Int!, $query: String) {
          metaobjects(type: $type, first: $first, query: $query) {
            edges {
              node {
                id
                type
                handle
                displayName
                fields {
                  key
                  value
                  type
                  reference {
                    ... on MediaImage {
                      id
                      image {
                        url
                      }
                    }
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
                type: input.type,
                first: input.first ?? 50,
                query: input.query,
            };
            const response = await shopifyClient.request(query, variables);
            return {
                success: true,
                metaobjects: edgesToNodes(response.metaobjects),
                pageInfo: response.metaobjects?.pageInfo,
            };
        }
        catch (error) {
            return handleToolError("getMetaobjects", error);
        }
    },
};
