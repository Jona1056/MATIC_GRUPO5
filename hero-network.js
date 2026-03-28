require('dotenv').config();
const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

const HERO_NETWORK_URL = 'https://raw.githubusercontent.com/Jona1056/MATIC_GRUPO5/main/hero-network.csv';

async function loadHeroNetwork(session) {
  const query = `
    LOAD CSV WITH HEADERS FROM $url AS row
    CALL {
      WITH row
      WITH trim(row.hero1) AS hero1, trim(row.hero2) AS hero2
      WHERE hero1 IS NOT NULL AND hero1 <> '' 
        AND hero2 IS NOT NULL AND hero2 <> ''
        AND hero1 <> hero2

      MATCH (h1:Hero {name: hero1})
      MATCH (h2:Hero {name: hero2})

      MERGE (h1)-[r:APARECE_CON]->(h2)
      ON CREATE SET r.weight = 1
      ON MATCH SET r.weight = r.weight + 1

    } IN TRANSACTIONS OF 5000 ROWS
  `;

  await session.run(query, { url: HERO_NETWORK_URL });
}

async function verify(session) {
  const res = await session.run(`
    MATCH ()-[r:APARECE_CON]->()
    RETURN count(r) AS total_relaciones, sum(r.weight) AS total_interacciones
  `);

  if (res.records.length === 0) return { relaciones: 0, interacciones: 0 };

  return {
    relaciones: res.records[0].get('total_relaciones'),
    interacciones: res.records[0].get('total_interacciones')
  };
}

async function main() {
  const driver = neo4j.driver(
    URI,
    neo4j.auth.basic(USER, PASSWORD),
    { disableLosslessIntegers: true }
  );

  const session = driver.session();

  try {
    console.log('Cargando red de heroes en lotes de 5000...');
    await loadHeroNetwork(session);

    console.log('Verificando resultados...');
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