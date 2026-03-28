# Modelo de Grafo: Héroes y Cómics en Neo4j

## Descripción del Modelo

Este proyecto implementa un modelo de datos en Neo4j para representar la relación entre héroes y cómics, así como las interacciones entre héroes que aparecen juntos.

El modelo se basa en un grafo donde los nodos representan entidades y las relaciones representan interacciones entre dichas entidades.

---

## Tipos de Nodos

Se definieron dos tipos principales de nodos:

### 1. Hero
Representa a un personaje (héroe).

Propiedades:
- name: nombre del héroe

Ejemplo:
(:Hero {name: "Spider-Man"})

---

### 2. Comic
Representa un cómic.

Propiedades:
- name: nombre del cómic

Ejemplo:
(:Comic {name: "Avengers"})

---

## Tipos de Relaciones

Se definieron dos tipos de relaciones en el modelo:

### 1. APARECE_EN

(:Hero)-[:APARECE_EN]->(:Comic)

Descripción:
Indica que un héroe aparece en un cómic.

Origen: Hero  
Destino: Comic  

Ejemplo:
(:Hero {name: "Spider-Man"})-[:APARECE_EN]->(:Comic {name: "Avengers"})

---

### 2. APARECE_CON

(:Hero)-[:APARECE_CON {weight}]->(:Hero)

Descripción:
Indica que dos héroes aparecen juntos en uno o más cómics.

Propiedad:
- weight: número de veces que dos héroes aparecen juntos

Origen: Hero  
Destino: Hero  

Ejemplo:
(:Hero {name: "Spider-Man"})-[:APARECE_CON {weight: 5}]->(:Hero {name: "Iron Man"})

---

## Lógica de Relación entre Entidades

El modelo permite representar dos tipos de conexiones:

### 1. Relación directa

Dos héroes están directamente relacionados mediante:

(:Hero)-[:APARECE_CON]->(:Hero)

Esta relación indica co-apariciones acumuladas entre personajes.

---

### 2. Relación indirecta (por cómic)

Dos héroes pueden estar relacionados indirectamente si aparecen en el mismo cómic:

(:Hero)-[:APARECE_EN]->(:Comic)<-[:APARECE_EN]-(:Hero)

Esto permite identificar relaciones implícitas entre personajes.

---

## Integración de Relaciones

El modelo combina ambas relaciones para formar un grafo más completo:

(:Hero)-[:APARECE_EN]->(:Comic)<-[:APARECE_EN]-(:Hero)
(:Hero)-[:APARECE_CON]->(:Hero)

Esto permite:

- Identificar héroes que comparten cómics
- Analizar la fuerza de la relación entre ellos (weight)
- Diferenciar entre relación directa e indirecta

---

## Control de Duplicados

Para evitar duplicación de datos se utilizaron:

- MERGE para nodos y relaciones
- Constraints de unicidad en:
  - Hero.name
  - Comic.name

En la relación APARECE_CON se utilizó acumulación:

ON CREATE SET weight = 1  
ON MATCH SET weight = weight + 1  

Esto evita múltiples relaciones duplicadas y consolida la información en una sola relación con peso.

---

## Estructura General del Grafo

El grafo final tiene la siguiente forma:

(Hero)-[:APARECE_EN]->(Comic)
(Hero)-[:APARECE_CON]->(Hero)

Donde:

- APARECE_EN conecta entidades de distinto tipo
- APARECE_CON conecta entidades del mismo tipo con peso

---

