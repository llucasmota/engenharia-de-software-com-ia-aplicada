import { tool } from "@langchain/core/tools";
import csvtojson from "csvtojson";

import { z } from 'zod/v3';

export function getCSVTOJSONTool() {
  return tool(
    async ({ csvText }) => {
      const result = await csvtojson().fromString(csvText);
      console.log('[getCSVTOJSONTool] conversion result finished', result.length, 'records');

      return JSON.stringify(result);
    },
    {
      name: 'cst_to_json',
      description: 'Convert CSV to JSON format',
      schema: z.object({
        csvText: z.string().describe('CSV data to ve converted to JSON format')
      })
    }
  )
}