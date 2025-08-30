const express = require("express");
const path = require("path");
const compression = require("compression");
const app = express();
const port = process.env.PORT || 8080;   // railway suele usar 8080

app.use(compression());
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "7d",
  setHeaders: (res, filePath) => {
    if (/\.(html)$/.test(filePath)) res.setHeader("Cache-Control", "no-cache");
  }
}));

// entrega index de forma explícita
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (_, res) => res.send("ok"));

app.listen(port, () => console.log(`Listening on ${port}`));