import { z } from "zod";

const optionsSchema = z.object({
  groups: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        type: z.enum(["single", "multi"]),
        values: z.array(
          z.object({
            label: z.string().min(1),
            priceDelta: z.number().min(0),
          })
        ),
      })
    )
    .min(0),
});

export function validateOptionsDefinition(definition) {
  return optionsSchema.parse(definition);
}

export function validateOptionsSelection(definition, selection) {
  const validatedDefinition = validateOptionsDefinition(definition);
  const errors = [];
  for (const group of validatedDefinition.groups) {
    const selectionValue = selection?.[group.id];
    if (group.type === "single") {
      if (selectionValue === undefined || selectionValue === null || selectionValue === "") {
        continue;
      }
      const found = group.values.find((value) => value.label === selectionValue);
      if (!found) {
        errors.push(`Invalid selection for ${group.label}`);
      }
    } else if (group.type === "multi") {
      if (selectionValue === undefined) {
        continue;
      }
      if (!Array.isArray(selectionValue)) {
        errors.push(`Multiple selection expected for ${group.label}`);
        continue;
      }
      for (const entry of selectionValue) {
        const found = group.values.find((value) => value.label === entry);
        if (!found) {
          errors.push(`Invalid option ${entry} in ${group.label}`);
        }
      }
    }
  }
  if (errors.length > 0) {
    const error = new Error("Options are invalid");
    error.status = 400;
    error.message = errors.join(", ");
    throw error;
  }
}
