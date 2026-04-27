const { Parser } = require("hot-formula-parser");
const p = new Parser();

p.on('callRangeValue', (startCoord, endCoord, done) => {
    // Return a 2D array
    done([[1], [2], [3], [4]]);
});

p.on('callFunction', (name, params, done) => {
    if (name === 'MYRANGE') {
        console.log("MYRANGE got params:", JSON.stringify(params));
        done(params[0].length);
        return;
    }
});

p.parse('MYRANGE(A1:A4)');
