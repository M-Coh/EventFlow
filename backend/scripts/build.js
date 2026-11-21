const { copyFileSync, cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const build = join(root, "build");

mkdirSync(build, { recursive: true });
for (const file of ["server.js", "db.js", "keycloakAdmin.js", "package.json", "package-lock.json"]) {
  copyFileSync(join(root, file), join(build, file));
}
for (const directory of ["middleware", "database"]) {
  cpSync(join(root, directory), join(build, directory), { recursive: true });
}
