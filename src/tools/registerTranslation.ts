import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { checkUserErrors, handleToolError } from "../lib/toolUtils.js";

const RegisterTranslationInputSchema = z.object({
  resourceId: z
    .string()
    .describe(
      "The ID of the translatable resource (e.g. gid://shopify/Product/...)",
    ),
  translations: z
    .array(
      z.object({
        key: z
          .string()
          .describe(
            "The field name to translate (e.g. 'title', 'body_html') - find this via translation-get-resource",
          ),
        value: z.string().describe("The translated text"),
        locale: z
          .string()
          .describe("The language code to translate into (e.g. 'es', 'fr')"),
        translatableContentDigest: z
          .string()
          .describe(
            "The digest hash of the original content - MUST match what is returned by translation-get-resource",
          ),
      }),
    )
    .min(1)
    .describe("List of translations to apply"),
});

type RegisterTranslationInput = z.infer<typeof RegisterTranslationInputSchema>;

let shopifyClient: GraphQLClient;

const registerTranslation = {
  name: "translation-register",
  description:
    "Register or update translations for a Shopify resource (like Products, Collections). Note: You MUST fetch the translatableContentDigest first using translation-get-resource!",
  schema: RegisterTranslationInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: RegisterTranslationInput) => {
    try {
      const mutation = gql`
        mutation translationsRegister(
          $resourceId: ID!
          $translations: [TranslationInput!]!
        ) {
          translationsRegister(
            resourceId: $resourceId
            translations: $translations
          ) {
            translations {
              key
              value
              locale
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await shopifyClient.request<any>(mutation, {
        resourceId: args.resourceId,
        translations: args.translations,
      });

      const { userErrors, translations } = response.translationsRegister;
      checkUserErrors(userErrors, "register translations");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, translatedKeys: translations },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return handleToolError("RegisterTranslation", error);
    }
  },
};

export { registerTranslation };
