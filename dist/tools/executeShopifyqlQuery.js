import { gql } from "graphql-request";
import { z } from "zod";
import { handleToolError } from "../lib/toolUtils.js";
const ShopifyqlQueryInputSchema = z.object({
    query: z
        .string()
        .describe("The ShopifyQL query string. Must include a FROM and SHOW clause. " +
        "Examples: 'FROM sales SHOW total_sales GROUP BY month SINCE -3m', " +
        "'FROM orders SHOW total_orders, total_sales GROUP BY day'"),
});
let shopifyClient;
const executeShopifyqlQuery = {
    name: "report-shopifylq-query",
    description: "Execute custom analytics and reporting queries using ShopifyQL (requires read_reports scope). Use to fetch aggregated sales, order, or customer metrics.",
    schema: ShopifyqlQueryInputSchema,
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (args) => {
        try {
            const query = gql `
        query shopifyql($query: String!) {
          shopifyqlQuery(query: $query) {
            tableData {
              columns {
                name
                dataType
                displayName
              }
              rowData
              unformattedData
            }
            parseErrors {
              message
              range {
                start {
                  line
                  character
                }
                end {
                  line
                  character
                }
              }
            }
          }
        }
      `;
            const response = await shopifyClient.request(query, {
                query: args.query,
            });
            const result = response.shopifyqlQuery;
            if (result.parseErrors && result.parseErrors.length > 0) {
                throw new Error(`ShopifyQL Parse Errors: ${result.parseErrors
                    .map((e) => e.message)
                    .join(", ")}`);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            columns: result.tableData?.columns || [],
                            rows: result.tableData?.unformattedData ||
                                result.tableData?.rowData ||
                                [],
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return handleToolError("Execute ShopifyQL Query", error);
        }
    },
};
export { executeShopifyqlQuery };
