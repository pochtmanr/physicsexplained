// scripts/content/publish-problems.ts
// Sync the lib/content/problems.ts + lib/content/equations.ts registries
// and their per-locale messages/<locale>/{problems,equations}/** strings
// into the Supabase tables: problems, problem_topic_links, problem_strings,
// equations, equation_strings.
//
// Usage:
//   pnpm content:publish-problems
//   pnpm content:publish-problems --only the-simple-pendulum-easy-period-from-length
//   pnpm content:publish-problems --locale en
//   pnpm content:publish-problems --kind problems   # skip equations
//   pnpm content:publish-problems --kind equations  # skip problems
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { getServiceClient } from "@/lib/supabase-server";
import { PROBLEMS } from "@/lib/content/problems";
import { EQUATIONS } from "@/lib/content/equations";

const ROOT = path.resolve(__dirname, "..", "..");

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function publishProblems(only: string | null, localeFilter: string | null) {
  const db = getServiceClient();
  const problems = only ? PROBLEMS.filter((p) => p.id === only) : PROBLEMS;
  if (problems.length === 0) {
    console.log("  no problems to publish");
    return { problems: 0, links: 0, strings: 0 };
  }

  let problemRows = 0;
  let linkRows = 0;
  for (const p of problems) {
    const { error } = await db.from("problems").upsert({
      id: p.id,
      primary_topic_slug: p.primaryTopicSlug,
      difficulty: p.difficulty,
      equation_slugs: p.equationSlugs,
      inputs_json: p.inputs,
      steps_json: p.steps,
      solver_path: p.solverPath,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    problemRows++;

    // Replace topic links (delete + upsert is the simplest correct path).
    await db.from("problem_topic_links").delete().eq("problem_id", p.id);
    const links = [
      { problem_id: p.id, topic_slug: p.primaryTopicSlug, role: "primary" as const },
      ...p.relatedTopicSlugs.map((s) => ({
        problem_id: p.id,
        topic_slug: s,
        role: "related" as const,
      })),
    ];
    const { error: linkErr } = await db.from("problem_topic_links").upsert(links);
    if (linkErr) throw linkErr;
    linkRows += links.length;
    console.log(`  problem ${p.id}`);
  }

  // String files: messages/<locale>/problems/<branch>/<topic>/<id>.json
  const stringFiles = fg.sync("messages/*/problems/**/*.json", { cwd: ROOT });
  let stringRows = 0;
  for (const file of stringFiles) {
    const m = file.match(/^messages\/([a-z]{2})\/problems\/.+\/([^/]+)\.json$/);
    if (!m) continue;
    const [, locale, problemId] = m;
    if (only && problemId !== only) continue;
    if (localeFilter && locale !== localeFilter) continue;
    if (!PROBLEMS.some((p) => p.id === problemId)) {
      console.warn(`  skipping orphan strings file: ${file} (no problem in registry)`);
      continue;
    }
    const obj = JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
    const { error } = await db.from("problem_strings").upsert({
      problem_id: problemId,
      locale,
      statement: obj.statement,
      steps_json: obj.steps,
      walkthrough: obj.walkthrough ?? "",
    });
    if (error) throw error;
    stringRows++;
    console.log(`  strings ${problemId} (${locale})`);
  }

  return { problems: problemRows, links: linkRows, strings: stringRows };
}

async function publishEquations(only: string | null, localeFilter: string | null) {
  const db = getServiceClient();
  const equations = only ? EQUATIONS.filter((e) => e.slug === only) : EQUATIONS;
  if (equations.length === 0) {
    console.log("  no equations to publish");
    return { equations: 0, strings: 0 };
  }

  let equationRows = 0;
  for (const e of equations) {
    const { error } = await db.from("equations").upsert({
      slug: e.slug,
      latex: e.latex,
      related_topic_slugs: e.relatedTopicSlugs,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    equationRows++;
    console.log(`  equation ${e.slug}`);
  }

  // String files: messages/<locale>/equations/<slug>.json
  const stringFiles = fg.sync("messages/*/equations/*.json", { cwd: ROOT });
  let stringRows = 0;
  for (const file of stringFiles) {
    const m = file.match(/^messages\/([a-z]{2})\/equations\/([^/]+)\.json$/);
    if (!m) continue;
    const [, locale, slug] = m;
    if (only && slug !== only) continue;
    if (localeFilter && locale !== localeFilter) continue;
    if (!EQUATIONS.some((e) => e.slug === slug)) {
      console.warn(`  skipping orphan strings file: ${file} (no equation in registry)`);
      continue;
    }
    const obj = JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
    const { error } = await db.from("equation_strings").upsert({
      slug,
      locale,
      name: obj.name,
      what_it_solves: obj.whatItSolves,
      when_to_use: obj.whenToUse,
      when_not_to: obj.whenNotTo,
      common_mistakes: obj.commonMistakes,
    });
    if (error) throw error;
    stringRows++;
    console.log(`  equation strings ${slug} (${locale})`);
  }

  return { equations: equationRows, strings: stringRows };
}

async function main() {
  const only = arg("--only");
  const localeFilter = arg("--locale");
  const kind = arg("--kind"); // 'problems' | 'equations' | null (both)

  const stats = { problems: 0, links: 0, problemStrings: 0, equations: 0, equationStrings: 0 };

  if (kind === null || kind === "problems") {
    console.log("== problems ==");
    const r = await publishProblems(only, localeFilter);
    stats.problems = r.problems;
    stats.links = r.links;
    stats.problemStrings = r.strings;
  }

  if (kind === null || kind === "equations") {
    console.log("== equations ==");
    const r = await publishEquations(only, localeFilter);
    stats.equations = r.equations;
    stats.equationStrings = r.strings;
  }

  console.log(
    `\ndone: ${stats.problems} problems, ${stats.links} topic links, ${stats.problemStrings} problem strings, ${stats.equations} equations, ${stats.equationStrings} equation strings`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
