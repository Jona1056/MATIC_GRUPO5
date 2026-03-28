require('dotenv').config();
const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

const NODES_URL = 'https://raw.githubusercontent.com/Jona1056/MATIC_GRUPO5/main/nodes.csv';

async function ensureConstraints(session) {
  await session.run(`
    CREATE CONSTRAINT hero_name_unique IF NOT EXISTS
    FOR (h:Hero) REQUIRE h.name IS UNIQUE
  `);

  await session.run(`
    CREATE CONSTRAINT comic_name_unique IF NOT EXISTS
    FOR (c:Comic) REQUIRE c.name IS UNIQUE
  `);
}

async function loadNodes(session) {
  // Procesa en lotes de 5000 filas 
  const query = `
    LOAD CSV WITH HEADERS FROM $url AS row
    CALL {
      WITH row
      // Validaciones básicas
      WITH trim(row.node) AS name, trim(row.type) AS type
      WHERE name IS NOT NULL AND name <> '' AND type IN ['hero','comic']

      // Crear nodos según tipo, idempotente por MERGE + constraint
      FOREACH (_ IN CASE WHEN type = 'hero' THEN [1] ELSE [] END |
        MERGE (h:Hero {name: name})
      )
      FOREACH (_ IN CASE WHEN type = 'comic' THEN [1] ELSE [] END |
        MERGE (c:Comic {name: name})
      )
    } IN TRANSACTIONS OF 5000 ROWS
  `;

  await session.run(query, { url: NODES_URL });
}

async function verify(session) {
  const res = await session.run(`
    MATCH (n)
    RETURN labels(n) AS labels, count(*) AS total
    ORDER BY labels
  `);

  return res.records.map(r => ({
    labels: r.get('labels'),
    total: r.get('total').toNumber ? r.get('total').toNumber() : r.get('total')
  }));
}

async function main() {
  const driver = neo4j.driver(
    URI,
    neo4j.auth.basic(USER, PASSWORD),
    { disableLosslessIntegers: true }
  );

  const session = driver.session();

  try {
    console.log('Creando constraints si no existen...');
    await ensureConstraints(session);

    console.log('Cargando nodos en lotes de 5000...');
    await loadNodes(session);

    console.log('Verificando conteos...');
    const stats = await verify(session);
    console.log(stats);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();