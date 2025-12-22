import { $ } from "bun";

const response = await fetch("https://example.com");

const
const newVar = process.env.TEST_ENV

// Use Response as stdin.
$`cat < ${response} | wc -c`; // 1256

console.log("Mi variable de entorno de prueba es " + newVar)

