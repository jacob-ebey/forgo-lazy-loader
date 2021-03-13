import childProcess from "child_process";
import path from "path";

import request from "supertest";

describe("simple", () => {
  it("works", async () => {
    await new Promise<void>((resolve, reject) => {
      childProcess.exec(
        "yarn",
        { cwd: path.join(__dirname, "simple") },
        (err, stdout, stderr) => {
          if (err) {
            return reject(err);
          }
          console.log(stderr);
          console.log(stdout);
          return resolve();
        }
      );
    });

    await new Promise<void>((resolve, reject) => {
      childProcess.exec(
        "yarn build",
        { cwd: path.join(__dirname, "simple") },
        (err, stdout, stderr) => {
          if (err) {
            return reject(err);
          }
          console.log(stderr);
          console.log(stdout);
          return resolve();
        }
      );
    });

    const app = require("./simple/dist/server/main");
    const res = await request(app.default).get("/").expect(200);
    expect(res.text).toMatchSnapshot();
  });
});
