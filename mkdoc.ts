// run as `npx tsc -m es2022 --moduleResolution node --allowSyntheticDefaultImports mkdoc.ts && node mkdoc.js && rm mkdoc.js`

import { readFileSync } from "fs";
import ts from "typescript";

const text = readFileSync("src/lib/index.ts", { encoding: "utf8" });

const x = ts.createSourceFile(
  "foo",
  text,
  ts.ScriptTarget.ES2015,
  /*setParentNodes */ true
);

type Item = {
  name?: string;
  desc?: string;
  optional?: true;
  type?: string;
  default?: string;
};

for (const s of x.statements) {
  if (s.kind === ts.SyntaxKind.TypeAliasDeclaration) {
    s.forEachChild((c) => {
      c.forEachChild((cc) => {
        if (cc.kind === ts.SyntaxKind.PropertySignature) {
          const item: Item = {};

          const ps = cc as ts.PropertySignature;

          for (const tag of (ps as any).jsDoc?.[0]?.tags ?? []) {
            const t = tag as ts.JSDoc;

            const tagText = text.substring(t.pos, t.end).trim();

            if (tagText.startsWith("@default ")) {
              item.default = tagText.slice(9);
            }
          }

          item.desc = (ps as any).jsDoc?.[0]?.comment;

          ps.forEachChild((x) => {
            if (x.kind === ts.SyntaxKind.Identifier) {
              const i = x as ts.Identifier;

              item.name = i.getText();
            } else if (x.kind === ts.SyntaxKind.QuestionToken) {
              item.optional = true;
            } else {
              item.type = text.substring(x.pos, x.end).trim();
            }
          });

          console.log(
            `- \`${item.name}\`${item.optional ? "" : "<sup>*</sup>"}: \`${
              item.type
            }\` - ${item.desc?.replace(/\n/g, " ")}${
              item.default ? " Default `" + item.default + "`." : ""
            }`
          );
        }
      });
    });
  }
}
