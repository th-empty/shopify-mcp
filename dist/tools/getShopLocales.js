import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const GetShopLocalesInputSchema = z.object({
    published: z.boolean().optional().describe("Only return published locales"),
});
let shopifyClient;
const getShopLocales = {
    name: "translation-get-locales",
    description: "Get the list of active locales/languages enabled on the store.",
    schema: GetShopLocalesInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            const query = gql `
        query getShopLocales($published: Boolean) {
          shopLocales(published: $published) {
            locale
            name
            primary
            published
          }
        }
      `;
            const response = await shopifyClient.request(query, {
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
        }
        catch (error) {
            return handleToolError("GetShopLocales", error);
        }
    },
};
export { getShopLocales };
