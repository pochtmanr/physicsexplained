import { getServiceClient } from "@/lib/supabase-server";

export interface EquationStrings {
  name: string;
  whatItSolves: string;
  whenToUse: string;
  whenNotTo: string;
  commonMistakes: string;
}

export async function getEquationStringsForLocale(slug: string, locale: string): Promise<EquationStrings | null> {
  const db = getServiceClient();
  const { data } = await db.from("equation_strings")
    .select("name, what_it_solves, when_to_use, when_not_to, common_mistakes")
    .eq("slug", slug).eq("locale", locale).maybeSingle();
  if (!data) return null;
  return {
    name: data.name,
    whatItSolves: data.what_it_solves,
    whenToUse: data.when_to_use,
    whenNotTo: data.when_not_to,
    commonMistakes: data.common_mistakes,
  };
}

export async function getProblemsForEquationFromDb(slug: string, locale: string) {
  const db = getServiceClient();
  const { data } = await db
    .from("problems")
    .select("id, primary_topic_slug, difficulty, problem_strings!inner(statement)")
    .contains("equation_slugs", [slug])
    .eq("problem_strings.locale", locale);
  return (data ?? []) as Array<{ id: string; primary_topic_slug: string; difficulty: string; problem_strings: { statement: string }[] }>;
}
