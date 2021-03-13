const express = require("express");

const app = express();

app.use("/static", express.static("dist/client"));

app.use(require("./dist/server/main").default);

app.listen(3000, () => console.log("Listening on http://localhost:3000"));
