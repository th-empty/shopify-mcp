import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";

const GetCarrierServicesInputSchema = z.object({
  first: z
    .number()
    .optional()
    .default(10)
    .describe("Number of carrier services to fetch"),
  query: z.string().optional().describe("Filter query (e.g., 'active:true')"),
});

type GetCarrierServicesInput = z.infer<typeof GetCarrierServicesInputSchema>;

let shopifyClient: GraphQLClient;

const getCarrierServices = {
  name: "shipping-get-carrier-services",
  description: "Get a list of carrier services configured for the shop.",
  schema: GetCarrierServicesInputSchema,
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },
  execute: async (args: GetCarrierServicesInput) => {
    try {
      const query = gql`
        query getCarrierServices($first: Int!, $query: String) {
          carrierServices(first: $first, query: $query) {
            nodes {
              id
              name
              active
              callbackUrl
              supportsPrinterLabel
              format
              servicesForCountries {
                countryCode
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request<any>(query, {
        first: args.first,
        query: args.query,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { carrierServices: response.carrierServices.nodes },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return handleToolError("GetCarrierServices", error);
    }
  },
};

export { getCarrierServices };
