import { z } from "zod";

export const RecommendationSchema = z.object({
  diagnosis: z
    .string()
    .describe("One or two sentence summary of the most likely cause of the reported handling symptom."),
  recommendations: z
    .array(
      z.object({
        parameter: z
          .string()
          .describe("Name of the setup parameter to adjust, matching the car's parameter table keys (e.g. camberFront, aRBRear, brakeBias)."),
        direction: z.enum(["increase", "decrease", "set", "no_change"]),
        clicks: z
          .number()
          .nullable()
          .describe("Number of clicks to move by, if the parameter uses a click/index encoding. Null if not applicable or unconfirmed."),
        suggestedValue: z
          .number()
          .nullable()
          .describe("Suggested real-unit target value (e.g. degrees, PSI, mm), if determinable. Null if not applicable."),
        reasoning: z.string().describe("Why this change addresses the symptom, in one or two sentences."),
        confidence: z.enum(["high", "medium", "low"]),
      })
    )
    .describe("Ordered list of setup changes, most impactful first."),
  cautions: z
    .array(z.string())
    .describe("Any caveats — e.g. a suggested parameter's click range is unconfirmed for this car, or the symptom description was ambiguous."),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
