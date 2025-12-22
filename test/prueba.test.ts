import {expect, test, describe} from "bun:test";

describe("Environmental variables", () => {

    test("process.env.TEST_ENV is a string", () => {
        expect(process.env.TEST_ENV).toBeString()
    })

    test("process.env.TEST_ENV is not empty", () => {
        expect(process.env.TEST_ENV).not.toBeEmpty()
    })
});

describe("General purpose", () => {

    test("2 + 2 = 4", () => {
        expect(2+2).toBe(4)
    })

    test("2 + 2 = 4", () => {
        expect(2+2).toBe(4)
    })


});
