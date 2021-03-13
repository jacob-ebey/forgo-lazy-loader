import type webpack5 from "webpack";
// @ts-ignore
import type webpack from "@types/webpack";
import { createHash } from "crypto";

import { Parser, Node } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";

const parser = Parser.extend();

export async function loader(
  this: webpack.loader.LoaderContext,
  source: string,
  sourceMap?: string
) {
  const self = this;
  const callback = self.async();
  self.cacheable();

  const ast = parser.parse(source, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });

  const lazyCalls: Promise<Node>[] = [];
  const lazyNames = new Set();
  simple(ast, {
    ImportDeclaration(node: any) {
      if (node.source.value === "forgo-lazy" && node.specifiers) {
        node.specifiers.forEach((specifier: any) => {
          if (specifier.type === "ImportDefaultSpecifier") {
            lazyNames.add(specifier.local.name);
          }
        });
      }
    },
    CallExpression(node: any) {
      if (!node.callee || !lazyNames.has(node.callee.name)) {
        return;
      }

      if (node.arguments.length > 2) {
        throw new Error("lazy must contain less than two arguments");
      }

      const imported = new Set<string>();

      simple(node, {
        ImportExpression(node: any) {
          if (node.source && node.source.value) {
            imported.add(node.source.value);
          }
        },
      });

      if (imported.size === 0) {
        return;
      }

      if (imported.size > 1) {
        return callback!(
          new Error("Can not use more than 1 dynamic import inside of lazy.")
        );
      }

      const request = Array.from(imported)[0];

      if (self.mode !== "development") {
        lazyCalls.push(
          new Promise<Node>((resolve, reject) => {
            self.loadModule(request, (err, source, sourceMap, mod) => {
              if (err) {
                return reject(err);
              }

              const chunkName = createHash("sha1")
                .update(source)
                .digest("base64")
                .replace(/[\/\\]/g, "")
                .replace(/=$/, "");

              if (node.arguments.length === 1) {
                node.arguments.push({
                  type: "ObjectExpression",
                  properties: [],
                });

                node.arguments[1].properties.push({
                  type: "Property",
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: "Identifier",
                    name: "chunkName",
                  },
                  value: {
                    type: "Literal",
                    value: chunkName,
                  },
                  kind: "init",
                });
              }

              node.chunkName = chunkName;

              resolve(node);
            });
          })
        );
      } else {
        const chunkName = request.replace(/[\\|\/|\.|-|\s]/g, "");

        if (node.arguments.length === 1) {
          node.arguments.push({
            type: "ObjectExpression",
            properties: [],
          });

          node.arguments[1].properties.push({
            type: "Property",
            method: false,
            shorthand: false,
            computed: false,
            key: {
              type: "Identifier",
              name: "chunkName",
            },
            value: {
              type: "Literal",
              value: chunkName,
            },
            kind: "init",
          });
        }

        node.chunkName = chunkName;

        lazyCalls.push(node);
      }
    },
  });

  if (lazyCalls.length > 0) {
    const sortedLazyCalls = (await Promise.all(lazyCalls)).sort(
      (a, b) => b.start - a.start
    );

    const newCode = sortedLazyCalls.reduce((p, call) => {
      const callString = generate(call).replace(
        "import(",
        `import(/* webpackChunkName: '${(call as any).chunkName}' */ `
      );
      const start = p.slice(0, call.start);
      const end = p.slice(call.end, p.length);
      return start + callString + end;
    }, source);

    callback!(null, newCode, sourceMap);
    return;
  }

  callback!(null, source, sourceMap);
}
