import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetShopLocalesInputSchema = z.object({
  published: z.boolean().optional().describe("Only return published locales"),
});

type GetShopLocalesInput = z.infer<typeof GetShopLocalesInputSchema>;

let shopifyClient: GraphQLClient;

const getShopLocales = {
  name: "translation-get-locales",
  description: "Get the list of active locales/languages enabled on the store.",
  schema: GetShopLocalesInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetShopLocalesInput) => {
    try {
      const query = gql`
        query getShopLocales($published: Boolean) {
          shopLocales(published: $published) {
            locale
            name
            primary
            published
          }
        }
      `;

      const response = await shopifyClient.request<any>(query, {
        published: args.published,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ locales: response.shopLocales }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetShopLocales", error);
    }
  },
};

export { getShopLocales };
