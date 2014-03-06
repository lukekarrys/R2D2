var colors = require('colors');
var R2D2 = ["", ""];
R2D2.push("           .-\"\"-.         ");
R2D2.push("          /" + "[O]".blue + " __\\         ");
R2D2.push("         _|__" + "o".blue + " LI|_         ");
R2D2.push("        / | " + "====".blue + " | \\       ");
R2D2.push("        |_| " + "====".blue + " |_|        ");
R2D2.push("         " + "|".blue + "|\" ||  |" + "|".blue + "        ");
R2D2.push("         " + "|".blue + "|LI  " + "o".blue + " |" + "|".blue + "         ");
R2D2.push("         " + "|".blue + "|'----'|" + "|".blue + "         ");
R2D2.push("        /__|    |__\\       ");
R2D2.push("");
R2D2.push("");
R2D2 = R2D2.join('\n');

module.exports = R2D2;

if (require.main.filename === __filename) {
    console.log(R2D2);
}