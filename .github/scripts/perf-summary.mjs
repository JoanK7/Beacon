// Turns the Lighthouse and load-test output in ./perf into a Markdown table for
// the GitHub run page, plus one-line notices that show on the run's summary.
// Usage: node .github/scripts/perf-summary.mjs perf
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'perf';
const files = readdirSync(dir);
const out = [];
const notices = [];

out.push('## Lighthouse (mobile, simulated slow 4G, mid-range phone CPU)', '');
out.push('| Page | Performance | Accessibility | Best practices | First contentful paint | Largest contentful paint | Total blocking time | Layout shift |');
out.push('|---|---|---|---|---|---|---|---|');
for (const f of files.filter((f) => f.startsWith('lh-') && f.endsWith('.report.json')).sort()) {
  const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const score = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
  const audit = (k) => r.audits[k]?.displayValue ?? 'n/a';
  const page = new URL(r.finalDisplayedUrl ?? r.requestedUrl).pathname;
  out.push(
    `| \`${page}\` | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${audit('first-contentful-paint')} | ${audit('largest-contentful-paint')} | ${audit('total-blocking-time')} | ${audit('cumulative-layout-shift')} |`,
  );
  notices.push(`Lighthouse ${page}: performance ${score('performance')}, accessibility ${score('accessibility')}, LCP ${audit('largest-contentful-paint')}`);
}

out.push('', '## API load test (autocannon, 200 concurrent connections, 20 s)', '');
out.push('| Endpoint | Requests/s (avg) | Latency p50 | Latency p97.5 | Latency p99 | Errors | Non-2xx |');
out.push('|---|---|---|---|---|---|---|');
for (const f of files.filter((f) => f.startsWith('load-') && f.endsWith('.json')).sort()) {
  const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const name = f.replace(/^load-|\.json$/g, '');
  out.push(
    `| ${name} | ${Math.round(r.requests.average)} | ${r.latency.p50} ms | ${r.latency.p97_5} ms | ${r.latency.p99} ms | ${r.errors} | ${r.non2xx} |`,
  );
  notices.push(`Load ${name}: ${Math.round(r.requests.average)} req/s, p50 ${r.latency.p50} ms, p99 ${r.latency.p99} ms, errors ${r.errors}, non-2xx ${r.non2xx}`);
}

const table = out.join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
else console.log(table);
// Notices appear as annotations on the run page (and are readable through the public API).
for (const n of notices) console.log(`::notice title=Performance::${n}`);
