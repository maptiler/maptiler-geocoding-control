import "dotenv/config";
import replace from "replace-in-file";

replace({
  files: ["dist.svelte/*.svelte", "dist.svelte/*.ts", "dist.svelte/*.js"],
  from: /\bimport\.meta\.env\.(\w+)/g,
  to: (_, name) => JSON.stringify(process.env[name]),
}).catch((err) => {
  console.error(err);

  process.exit(1);
});
