import { $ } from "bun";

const response = await fetch("https://example.com");

const newVar = process.env.TEST_ENV

// Use Response as stdin.
const numberOfWords = $`cat < ${response} | wc -c`; // 1256

console.log("Number of words: " + numberOfWords);

console.log("Mi variable de entorno de prueba es " + newVar)

