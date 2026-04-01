import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const GetDeliveryProfilesInputSchema = z.object({
    first: z
        .number()
        .optional()
        .default(10)
        .describe("Number of delivery profiles to fetch"),
    merchantOwnedOnly: z
        .boolean()
        .optional()
        .describe("Exclude profiles managed by third-party apps"),
});
let shopifyClient;
const getDeliveryProfiles = {
    name: "shipping-get-delivery-profiles",
    description: "Get a list of delivery profiles (shipping zones and rates).",
    schema: GetDeliveryProfilesInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            const query = gql `
        query getDeliveryProfiles($first: Int!, $merchantOwnedOnly: Boolean) {
          deliveryProfiles(
            first: $first
            merchantOwnedOnly: $merchantOwnedOnly
          ) {
            nodes {
              id
              name
              default
              activeMethodDefinitionsCount
              profileLocationGroups {
                locationGroup {
                  id
                }
                locationGroupZones(first: 10) {
                  nodes {
                    zone {
                      id
                      name
                    }
                    methodDefinitions(first: 10) {
                      nodes {
                        id
                        name
                        description
                        rateProvider {
                          ... on DeliveryRateDefinition {
                            id
                            price {
                              amount
                              currencyCode
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
            const response = await shopifyClient.request(query, {
                first: args.first,
                merchantOwnedOnly: args.merchantOwnedOnly,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ deliveryProfiles: response.deliveryProfiles.nodes }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return handleToolError("GetDeliveryProfiles", error);
        }
    },
};
export { getDeliveryProfiles };
