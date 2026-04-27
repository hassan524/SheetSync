const { Parser } = require("hot-formula-parser");
const p = new Parser();

p.on('callFunction', (name, params, done) => {
    if (name === 'MYCUSTOM') {
        done(params[0] + " IS CUSTOM");
        return;
    }
    // Do we call done() with something else to let it fall back?
    // Let's test not calling done
});

console.log("MYCUSTOM:", p.parse('MYCUSTOM("Hello")'));
console.log("SUM:", p.parse('SUM(1, 2)'));
