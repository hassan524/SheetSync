function splitTopLevelArgs(argsStr) {
  const args = [];
  let depth = 0;
  let inStr = false;
  let strChar = "";
  let current = "";

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inStr) {
      current += ch;
      if (ch === strChar && argsStr[i - 1] !== "\\") inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strChar = ch; current += ch;
    } else if (ch === "(") {
      depth++; current += ch;
    } else if (ch === ")") {
      depth--; current += ch;
    } else if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

const columns = [{key: "name"}];
function findColumnIndex(name) { return columns.findIndex(c => c.key === name); }

const formula = '=SUBSTITUTE(name, old value, new value)';
const expr = formula.substring(1).trim();
const fnMatch = expr.match(/^([A-Z_][A-Z0-9_]*)\s*\((.*)\)$/is);

if (fnMatch) {
    let fn = fnMatch[1].toUpperCase();
    let args = splitTopLevelArgs(fnMatch[2]);
    console.log("Parsed Args:", args);
    
    // Auto-quote strings
    args = args.map(arg => {
        // Already quoted
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg;
        }
        // Number
        if (!isNaN(Number(arg))) return arg;
        // Column name
        if (findColumnIndex(arg) !== -1) return arg;
        // A1 Ref
        if (/^[A-Z]+\d+$/i.test(arg)) return arg;
        // Reserved boolean/null
        if (/^(true|false|null|undefined)$/i.test(arg)) return arg;

        // Otherwise, wrap in quotes
        return `"${arg}"`;
    });
    console.log("Auto-quoted Args:", args);
    const newExpr = `${fn}(${args.join(", ")})`;
    console.log("New Expr:", newExpr);
}

