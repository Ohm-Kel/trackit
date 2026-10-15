# ADR 0001: Structured timetable extraction through forced tool use

- Status: Accepted
- Date: 2026-10-15

## Context

Timetable upload sends a PDF or image to Claude and needs back a list of
exams or a weekly schedule. The first version asked the model to reply with
"ONLY a JSON array", stripped markdown fences with a regular expression and
called `JSON.parse`. Any formatting slip (a preamble sentence, a trailing
comment, a truncated array) failed the whole upload, and the raw model text
was returned to the client in the error.

## Decision

Define the output as a Zod schema, convert it to JSON Schema with
`z.toJSONSchema`, and pass it as a tool's `input_schema`. Force the tool with
`tool_choice: { type: 'tool', name }` and `temperature: 0`. Validate the
returned tool input against the same Zod schema, row by row: keep valid
rows, drop invalid ones, and report the number dropped as a warning.

## Consequences

- One schema defines the model contract, the runtime validation and the
  OpenAPI documentation.
- The model can still return values that break the schema (for example a
  date in the wrong format). Row-level validation contains the damage to that
  row instead of the whole document.
- Prompt and schema changes are now measurable with the evaluation harness
  (`backend/eval`), which reuses `parseTimetable`.
- Alternatives considered: strict JSON mode via prompt only (the original
  problem), and a dedicated document-AI service (more cost and another
  vendor for a small feature).
