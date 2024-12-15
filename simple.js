import { createClient } from "@clickhouse/client"; // or '@clickhouse/client-web'

async function previewQuery(query, params = {}) {
  try {
    // Get the formatted query with parameters
    const formattedQuery = client.format(query, params);
    console.log("\n=== Preview of SQL Query ===");
    console.log(formattedQuery);
    console.log("===========================\n");
    return formattedQuery;
  } catch (error) {
    console.error("Error formatting query:", error);
    throw error;
  }
}

void (async () => {
  const tableName = "array_json_each_row";
  const client = createClient({
    url: "http://localhost:18123",
    database: "my_database",
    username: "username",
    password: "password",
  });
  await client.command({
    query: `DROP TABLE IF EXISTS ${tableName}`,
  });
  await client.command({
    query: `
      CREATE TABLE ${tableName}
      (id UInt64, name String, timestamp DateTime64(3, 'UTC'))
      ENGINE MergeTree()
      ORDER BY (id)
    `,
  });

  const ts = 1734084332.997;
  console.log(new Date(ts * 1000));
  await client.insert({
    table: tableName,
    // structure should match the desired format, JSONEachRow in this example
    values: [
      { id: 42, name: "foo", timestamp: new Date(ts * 1000) },
      { id: 42, name: "bar", timestamp: new Date((ts + 1) * 1000) },
    ],
    clickhouse_settings: {
      // Allows to insert serialized JS Dates (such as '2023-12-06T10:54:48.000Z')
      date_time_input_format: "best_effort",
    },
    format: "JSONEachRow",
  });

  const rows = await client.query({
    query: `SELECT * FROM ${tableName}`,
    format: "JSONEachRow",
  });

  console.info(await rows.json());
  await client.close();
})();
