// jsonschema.mjs — a dependency-free JSON Schema (draft-07 subset) validator.
//
// Shared by scripts/validate-docs.mjs and scripts/apply-domain.mjs so the kit ships zero
// schema-validation dependencies (same offline ethos as the app itself).
//
// Supported keywords: type, required, properties, additionalProperties(bool|schema),
// items, enum, pattern, minItems, minimum. No $ref (the kit's schemas don't use it).

export function validate(data, schema, path = "", errors = []) {
  const fail = (msg) => errors.push(msg);
  const t = schema.type;
  if (t) {
    const ok =
      t === "object" ? data && typeof data === "object" && !Array.isArray(data)
      : t === "array" ? Array.isArray(data)
      : t === "integer" ? Number.isInteger(data)
      : t === "number" ? typeof data === "number"
      : t === "string" ? typeof data === "string"
      : t === "boolean" ? typeof data === "boolean"
      : true;
    if (!ok) {
      fail(`${path || "<root>"}: expected ${t}, got ${Array.isArray(data) ? "array" : typeof data}`);
      return errors;
    }
  }
  if (schema.enum && !schema.enum.includes(data))
    fail(`${path}: ${JSON.stringify(data)} not in enum ${JSON.stringify(schema.enum)}`);
  if (schema.pattern && typeof data === "string" && !new RegExp(schema.pattern).test(data))
    fail(`${path}: ${JSON.stringify(data)} does not match /${schema.pattern}/`);
  if (typeof schema.minimum === "number" && typeof data === "number" && data < schema.minimum)
    fail(`${path}: ${data} < minimum ${schema.minimum}`);

  if (t === "object" && data && typeof data === "object" && !Array.isArray(data)) {
    for (const req of schema.required || [])
      if (!(req in data)) fail(`${path}: missing required property '${req}'`);
    const props = schema.properties || {};
    if (schema.additionalProperties === false)
      for (const key of Object.keys(data))
        if (!(key in props)) fail(`${path}: unexpected property '${key}'`);
    for (const [key, sub] of Object.entries(props))
      if (key in data) validate(data[key], sub, path ? `${path}.${key}` : key, errors);
    if (schema.additionalProperties && typeof schema.additionalProperties === "object")
      for (const [key, val] of Object.entries(data))
        if (!(key in props)) validate(val, schema.additionalProperties, path ? `${path}.${key}` : key, errors);
  }
  if (t === "array" && Array.isArray(data)) {
    if (typeof schema.minItems === "number" && data.length < schema.minItems)
      fail(`${path}: array shorter than minItems ${schema.minItems}`);
    if (schema.items) data.forEach((el, i) => validate(el, schema.items, `${path}[${i}]`, errors));
  }
  return errors;
}
