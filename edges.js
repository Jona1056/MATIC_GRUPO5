require('dotenv').config();
const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

const EDGES_URL = 'https://raw.githubusercontent.com/Jona1056/MATIC_GRUPO5/main/edges.csv';

async function loadEdges(session) {
  const query = `
    LOAD CSV WITH HEADERS FROM $url AS row
    CALL {
      WITH row
      WITH trim(row.hero) AS hero, trim(row.comic) AS comic
      WHERE hero IS NOT NULL AND hero <> '' 
        AND comic IS NOT NULL AND comic <> ''

      MATCH (h:Hero {name: hero})
      MATCH (c:Comic {name: comic})

      MERGE (h)-[:APARECE_EN]->(c)
    } IN TRANSACTIONS OF 5000 ROWS
  `;

  await session.run(query, { url: EDGES_URL });
}

async function verify(session) {
  const res = await session.run(`
    MATCH ()-[r:APARECE_EN]->()
    RETURN count(r) AS total
  `);

  if (res.records.length === 0) return 0;

  return res.records[0].get('total') || 0;
}
async function main() {
  const driver = neo4j.driver(
    URI,
    neo4j.auth.basic(USER, PASSWORD),
    { disableLosslessIntegers: true }
  );

  const session = driver.session();

  try {
    console.log('Cargando relaciones Hero-Comic en lotes de 5000...');
    await loadEdges(session);

    console.log('Verificando relaciones...');
    const total = await verify(session);
    console.log('Total relaciones APARECE_EN:', total);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();