import { z } from "zod";
import { peopleRoutes } from "./people";
import { optText, optUrl, text } from "../lib/validate";

export const team = peopleRoutes({
  table: "team_members",
  columns: { name: "name", role: "role", tier: "tier", instagram: "instagram", bio: "bio", specialization: "specialization", contributions: "contributions", linkedin: "linkedin" },
  shape: {
    name: text(120), role: text(120), tier: z.enum(["leadership", "core"]), instagram: optUrl,
    // Optional profile details: "" and null are stored as NULL so the public card simply hides the field.
    bio: optText(400), specialization: optText(200), contributions: optText(400), linkedin: optUrl,
  },
});