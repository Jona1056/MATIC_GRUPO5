
require('dotenv').config();
var neo4j = require('neo4j-driver');
(async () => {
 
  // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
  const URI =  process.env.NEO4J_URI
  const USER = process.env.NEO4J_USERNAME
  const PASSWORD = process.env.NEO4J_PASSWORD
  let driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
  console.log("Conexion exitosa a Neo4j Aura")
  await driver.close()
})();