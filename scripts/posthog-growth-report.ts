const FUNNEL_STAGES = [
  "landing_cta_clicked",
  "signup_started",
  "signup_completed",
  "profile_completed",
  "first_meal_logged",
  "third_tracked_day",
  "paywall_viewed",
  "checkout_started",
  "subscription_started",
] as const;

const CUSTOMER_TRAFFIC_FILTER =
  "coalesce(person.properties.traffic_type, 'customer') = 'customer'";

interface QueryResponse {
  columns?: string[];
  results?: unknown[][];
}

function readDays(arguments_: string[]): number {
  const index = arguments_.indexOf("--days");
  const rawValue = index === -1 ? "30" : arguments_[index + 1];
  const days = Number(rawValue);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("--days must be a whole number between 1 and 365");
  }

  return days;
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function runHogQl(query: string): Promise<QueryResponse> {
  const apiKey = requireEnvironment("POSTHOG_PERSONAL_API_KEY");
  const projectId = requireEnvironment("POSTHOG_PROJECT_ID");
  const host = (
    process.env.POSTHOG_API_HOST ?? "https://eu.posthog.com"
  ).replace(/\/$/u, "");
  const response = await fetch(
    `${host}/api/projects/${encodeURIComponent(projectId)}/query/`,
    {
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `PostHog query failed (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return (await response.json()) as QueryResponse;
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function printFunnel(response: QueryResponse): void {
  const counts = new Map(
    (response.results ?? []).map((row) => [
      String(row[0]),
      { events: asNumber(row[2]), users: asNumber(row[1]) },
    ]),
  );

  console.log("\nGrowth funnel (unique users; directional stage volume)");
  console.log("stage\tusers\tevents\tfrom previous");

  let previousUsers: number | undefined;
  for (const stage of FUNNEL_STAGES) {
    const count = counts.get(stage) ?? { events: 0, users: 0 };
    const conversion =
      previousUsers && previousUsers > 0
        ? `${((count.users / previousUsers) * 100).toFixed(1)}%`
        : "—";
    console.log(`${stage}\t${count.users}\t${count.events}\t${conversion}`);
    previousUsers = count.users;
  }
}

function printBreakdown(title: string, response: QueryResponse): void {
  console.log(`\n${title}`);
  console.log("event\tsegment\tusers");
  for (const row of response.results ?? []) {
    console.log(
      `${String(row[0])}\t${String(row[1] ?? "unknown")}\t${asNumber(row[2])}`,
    );
  }
}

async function main(): Promise<void> {
  const days = readDays(process.argv.slice(2));
  const events = FUNNEL_STAGES.map((event) => `'${event}'`).join(", ");
  const dateFilter = `timestamp >= now() - INTERVAL ${days} DAY`;

  const [funnel, acquisition, monetization, imports] = await Promise.all([
    runHogQl(`
      SELECT event, uniq(person_id) AS users, count() AS events
      FROM events
      WHERE ${dateFilter}
        AND ${CUSTOMER_TRAFFIC_FILTER}
        AND event IN (${events})
      GROUP BY event
      ORDER BY event
    `),
    runHogQl(`
      SELECT event,
             coalesce(
               person.properties['$initial_utm_source'],
               properties.source,
               'direct'
             ) AS segment,
             uniq(person_id) AS users
      FROM events
      WHERE ${dateFilter}
        AND ${CUSTOMER_TRAFFIC_FILTER}
        AND event IN ('landing_cta_clicked', 'signup_started')
      GROUP BY event, segment
      ORDER BY event, users DESC
    `),
    runHogQl(`
      SELECT event,
             coalesce(properties.plan, properties.feature_name, properties.source, 'unknown') AS segment,
             uniq(person_id) AS users
      FROM events
      WHERE ${dateFilter}
        AND ${CUSTOMER_TRAFFIC_FILTER}
        AND event IN ('paywall_viewed', 'checkout_started', 'subscription_started')
      GROUP BY event, segment
      ORDER BY event, users DESC
    `),
    runHogQl(`
      SELECT event, coalesce(properties.import_source, 'unknown') AS segment,
             uniq(person_id) AS users
      FROM events
      WHERE ${dateFilter}
        AND ${CUSTOMER_TRAFFIC_FILTER}
        AND (event IN ('import_previewed', 'import_completed')
             OR (event = 'first_meal_logged' AND properties.entry_method = 'import'))
      GROUP BY event, segment
      ORDER BY event, users DESC
    `),
  ]);

  console.log(`PostHog growth report — last ${days} days`);
  printFunnel(funnel);
  printBreakdown("Acquisition sources", acquisition);
  printBreakdown("Monetization", monetization);
  printBreakdown("Imports", imports);
  console.log(
    "\nNote: customer traffic only. Stage volume is directional, not an ordered cohort funnel; use the saved PostHog dashboard for ordered conversion.",
  );
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
