import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetTranslatableResourceInputSchema = z.object({
  resourceId: z
    .string()
    .describe(
      "The ID of the resource to translate (e.g. gid://shopify/Product/...)",
    ),
});

type GetTranslatableResourceInput = z.infer<
  typeof GetTranslatableResourceInputSchema
>;

let shopifyClient: GraphQLClient;

const getTranslatableResource = {
  name: "translation-get-resource",
  description:
    "Get all translatable content (and required hash digests) for a specific Shopify resource.",
  schema: GetTranslatableResourceInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetTranslatableResourceInput) => {
    try {
      const query = gql`
        query getTranslatableResource($resourceId: ID!) {
          translatableResource(resourceId: $resourceId) {
            resourceId
            translatableContent {
              key
              value
              digest
              locale
            }
            translations(first: 50) {
              edges {
                node {
                  key
                  value
                  locale
                  market {
                    id
                  }
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<any>(query, {
        resourceId: args.resourceId,
      });

      if (!response.translatableResource) {
        throw new Error(
          `Resource ${args.resourceId} not found or is not translatable.`,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                translatableContent:
                  response.translatableResource.translatableContent,
                existingTranslations:
                  response.translatableResource.translations.edges.map(
                    (e: any) => e.node,
                  ),
              },
              null,
              2,
            ),
            title: "Translatable Resource Data",
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetTranslatableResource", error);
    }
  },
};

export { getTranslatableResource };
