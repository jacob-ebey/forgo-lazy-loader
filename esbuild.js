const glob = require("glob");
const esbuild = require("esbuild");

const pkg = require("./package");
const date = new Date().toDateString();

const banner = `/**
 * ${pkg.name} v${pkg.version} build ${date}
 * ${pkg.homepage}
 * Copyright ${date.slice(-4)} ${pkg.author.name}
 * @license ${pkg.license}
 */`;
const entryPoints = glob.sync("src/*.ts");

const common = {
  entryPoints,
  platform: "node",
  bundle: false,
  minify: false,
  banner,
};

const configs = [
  {
    outdir: `lib`,
    format: "cjs",
  },
];

const t0 = Date.now();

Promise.all(
  configs.map((c) =>
    esbuild
      .build(Object.assign(c, common))
      .then(() => console.log(`Built ${c.format} in ${Date.now() - t0}ms`))
      .catch(() => process.exit(1))
  )
).then(() => console.log(`Finished build in ${Date.now() - t0}ms`));
