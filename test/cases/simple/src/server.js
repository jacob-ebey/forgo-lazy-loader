import express from "express";
import path from "path";

import { h, createForgoInstance } from "forgo";
import { parseHTML } from "linkedom";

import App from "./app";

const app = express();

const stats = __non_webpack_require__(
  path.resolve(__dirname, "../client/lazy-stats.json")
);

app.get("/", async (req, res) => {
  const { window, document, HTMLElement } = parseHTML(
    "<html><head></head><body></body></html>"
  );

  window.HTMLElement = HTMLElement;
  window.Text = document.createTextNode().constructor;

  const forgoInstance = createForgoInstance({ window, document });

  const forgoNode = document.createElement("div");
  forgoNode.id = "__forgo";

  for (let i = 0; i < 10; i++) {
    try {
      const { nodes } = forgoInstance.render(<App />);

      nodes?.forEach((child) => forgoNode?.appendChild(child));
      document.body.appendChild(forgoNode);
      break;
    } catch (err) {
      if (err.then) {
        await err;
        continue;
      }
      throw err;
    }
  }

  const publicPath = stats?.publicPath || "auto";
  const hrefPrefix = publicPath === "auto" ? "/" : publicPath || "/";
  /** @type {Set} */
  const forgoLazyChunks = document.__FORGO_LAZY_CHUNKS__ || new Set();
  forgoLazyChunks.add("main");
  const lazyChunks = Array.from(forgoLazyChunks);
  const preloadAs = {
    ".css": "style",
    ".js": "script",
  };
  const headTags = [];
  for (const chunk of lazyChunks) {
    const files = stats?.assetsByChunkName?.[chunk] || [];

    for (const file of files) {
      const ext = path.extname(file);
      if (!(ext in preloadAs)) {
        continue;
      }

      const link = document.createElement("link");
      link.setAttribute("as", preloadAs[ext]);
      link.setAttribute("rel", "preload");
      link.setAttribute("href", hrefPrefix + file);
      document.head.appendChild(link);

      switch (ext) {
        case ".css": {
          const stylesheet = document.createElement("link");
          stylesheet.setAttribute("rel", "stylesheet");
          stylesheet.setAttribute("type", "text/css");
          stylesheet.setAttribute("href", hrefPrefix + file);
          headTags.push(stylesheet);
        }
      }
    }
  }

  for (const child of headTags) {
    document.head.appendChild(child);
  }

  stats?.assetsByChunkName?.main?.forEach((file) => {
    if (path.extname(file) !== ".js") {
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("src", hrefPrefix + file);
    document.body.appendChild(script);
  });

  res.status(200);
  res.send(`<!DOCTYPE html>\n${document.toString()}`);
  res.end();
});

app.use((err, res, next) => {
  if (err && !res.headersSent) {
    res.status(500);
    res.send(err.toString());
    return;
  }

  next();
});

export default app;
