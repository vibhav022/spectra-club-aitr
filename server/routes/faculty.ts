import { peopleRoutes } from "./people";
import { optText, text } from "../lib/validate";

export const faculty = peopleRoutes({
  table: "faculty",
  columns: { name: "name", designation: "designation", department: "department" },
  shape: { name: text(120), designation: text(120), department: optText(120) },
});
