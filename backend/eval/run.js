#!/usr/bin/env node
/**
 * Run the timetable parser over the evaluation set and report metrics.
 *
 *   npm run eval                          # real run, needs ANTHROPIC_API_KEY
 *   npm run eval -- --model <model-id>    # compare another model
 *   npm run eval -- --oracle              # offline self-check: scores ground truth, must be 1.0
 *
 * Writes a JSON report (parameters, git commit, per-case scores and errors,
 * aggregate metrics) to eval/results/ and prints a Markdown summary.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('../config');
const { parseTimetable } = require('../lib/timetableParser');
const { scoreExamCase, scoreScheduleCase, aggregate } = require('./score');

function parseArgs(argv) {
  const opts = { dataset: 'v1', model: config.anthropicModel, concurrency: 3, oracle: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--oracle') opts.oracle = true;
    else if (arg === '--dataset') opts.dataset = argv[++i];
    else if (arg === '--model') opts.model = argv[++i];
    else if (arg === '--concurrency') opts.concurrency = Number(argv[++i]);
    else if (arg === '--only') opts.only = argv[++i];
  }
  return opts;
}

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

/** Run `worker` over `items` with at most `limit` in flight, preserving order. */
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

function tagBreakdown(results) {
  const tags = [...new Set(results.flatMap((r) => r.tags))].sort();
  return tags.map((tag) => {
    const subset = results.filter((r) => r.tags.includes(tag) && r.score);
    const agg = aggregate(subset);
    const entry = agg.exam || agg.schedule;
    return {
      tag,
      cases: subset.length,
      f1: entry?.f1 ?? 0,
      exact_record_rate: entry?.exact_record_rate ?? 0,
    };
  });
}

function toMarkdown(report) {
  const lines = [
    `## Timetable parser evaluation — dataset ${report.params.dataset}`,
    '',
    `Model \`${report.params.model}\` · temperature ${report.params.temperature} · commit ${report.git_commit} · ${report.created_at}`,
    '',
    '| Document type | Cases | Precision | Recall | F1 | Exact records |',
    '|---|---|---|---|---|---|',
  ];
  for (const [type, s] of Object.entries(report.summary)) {
    lines.push(
      `| ${type} | ${s.cases} | ${pct(s.precision)} | ${pct(s.recall)} | ${pct(s.f1)} | ${pct(s.exact_record_rate)} |`,
    );
  }
  if (report.summary.exam) {
    lines.push('', '| Exam field | Accuracy (on matched records) |', '|---|---|');
    for (const [field, acc] of Object.entries(report.summary.exam.field_accuracy))
      lines.push(`| ${field} | ${pct(acc)} |`);
  }
  lines.push('', '| Slice | Cases | F1 | Exact records |', '|---|---|---|---|');
  for (const t of report.by_tag)
    lines.push(`| ${t.tag} | ${t.cases} | ${pct(t.f1)} | ${pct(t.exact_record_rate)} |`);
  if (report.failures.length) {
    lines.push(
      '',
      `**${report.failures.length} case(s) failed to run:** ${report.failures.map((f) => f.id).join(', ')}`,
    );
  }
  if (report.usage.input_tokens) {
    lines.push('', `Tokens: ${report.usage.input_tokens} in / ${report.usage.output_tokens} out`);
  }
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const datasetDir = path.join(__dirname, 'dataset', opts.dataset);
  const manifest = JSON.parse(fs.readFileSync(path.join(datasetDir, 'manifest.json'), 'utf8'));
  const cases = opts.only ? manifest.cases.filter((c) => c.id.includes(opts.only)) : manifest.cases;

  if (!opts.oracle && !config.anthropicApiKey) {
    process.stderr.write('ANTHROPIC_API_KEY is not set. Add it to backend/.env or use --oracle.\n');
    process.exit(1);
  }
  const client = opts.oracle ? null : require('../lib/anthropic');

  const usage = { input_tokens: 0, output_tokens: 0 };
  const failures = [];

  const results = await mapLimit(cases, opts.concurrency, async (testCase) => {
    const started = Date.now();
    let predicted;
    try {
      if (opts.oracle) {
        predicted = testCase.expected;
      } else {
        const fileBase64 = fs.readFileSync(path.join(datasetDir, testCase.file)).toString('base64');
        const out = await parseTimetable({
          client,
          model: opts.model,
          fileBase64,
          mimeType: testCase.mimeType,
          type: testCase.type,
        });
        predicted = out.data;
        usage.input_tokens += out.usage?.input_tokens || 0;
        usage.output_tokens += out.usage?.output_tokens || 0;
      }
    } catch (err) {
      failures.push({ id: testCase.id, error: err.message });
      process.stderr.write(`✗ ${testCase.id}: ${err.message}\n`);
      return { id: testCase.id, type: testCase.type, tags: testCase.tags, score: null };
    }

    const score =
      testCase.type === 'exam'
        ? scoreExamCase(predicted, testCase.expected)
        : scoreScheduleCase(predicted, testCase.expected);
    process.stdout.write(`✓ ${testCase.id}  F1 ${pct(score.f1)}  (${Date.now() - started} ms)\n`);
    return {
      id: testCase.id,
      type: testCase.type,
      tags: testCase.tags,
      latency_ms: Date.now() - started,
      score,
      predicted,
    };
  });

  const report = {
    created_at: new Date().toISOString(),
    git_commit: gitCommit(),
    params: {
      dataset: opts.dataset,
      dataset_seed: manifest.seed,
      model: opts.oracle ? 'oracle' : opts.model,
      temperature: 0,
      max_tokens: 4096,
      cases: cases.length,
    },
    summary: aggregate(results),
    by_tag: tagBreakdown(results),
    usage,
    failures,
    cases: results,
  };

  const outDir = path.join(__dirname, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = report.created_at.replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `${stamp}_${report.params.model}_${opts.dataset}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);

  const markdown = toMarkdown(report);
  fs.writeFileSync(outFile.replace(/\.json$/, '.md'), `${markdown}\n`);
  process.stdout.write(`\n${markdown}\n\nReport: ${path.relative(process.cwd(), outFile)}\n`);
  if (failures.length) process.exitCode = 1;
  // The oracle scores ground truth against itself, so anything below 100%
  // means the dataset, loader or scorer is broken.
  const imperfect = Object.values(report.summary).some(
    (s) => s.f1 !== 1 || s.exact_record_rate !== 1,
  );
  if (opts.oracle && imperfect) {
    process.stderr.write('Oracle self-check failed: expected a perfect score.\n');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
