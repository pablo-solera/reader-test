import {$} from "bun";

const response = await fetch("https://example.com");

const newVar = process.env.TEST_ENV

// Use Response as stdin.
const numberOfWords = await $`cat < ${response} | wc -c`.text(); // 1256

console.log("Number of words: " + numberOfWords);
console.log("Mi variable de entorno de prueba es " + newVar)

const tareaPesada = () => {

    return new Promise(((resolve, reject) => {
        setTimeout(() => {
            resolve("Datos cargados")
        }, 10_000)
    }))
}

console.log("Cargando datos...")
const resultado = await tareaPesada()
console.log(resultado)

