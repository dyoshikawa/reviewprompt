import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { encode } from "@toon-format/toon";
import { runCli } from "repomix";
import { z } from "zod";

const VariantSchema = z.object({
  name: z.string(),
  include: z.array(z.string()).optional(),
  ignore: z.array(z.string()).optional(),
});

const ConfigSchema = z.object({
  variants: z.array(VariantSchema).min(1),
});

type Variant = z.infer<typeof VariantSchema>;

const baseDir = process.cwd();

const CONFIG_FILENAME = "security-scan.config.json";

// Fallback when no config file is present: scan the whole repository as a single variant.
const DEFAULT_VARIANTS: Variant[] = [{ name: "repomix-output-full" }];

function loadVariants(): Variant[] {
  const configPath = join(baseDir, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    console.log(`No ${CONFIG_FILENAME} found. Falling back to a single full-repository variant.`);
    return DEFAULT_VARIANTS;
  }

  const raw = readFileSync(configPath, "utf-8");
  const config = ConfigSchema.parse(JSON.parse(raw));
  console.log(`Loaded ${config.variants.length} variant(s) from ${CONFIG_FILENAME}.`);
  return config.variants;
}

async function generateVariants(): Promise<void> {
  const variants = loadVariants();

  for (const variant of variants) {
    const jsonPath = join(baseDir, `${variant.name}.json`);
    const toonPath = join(baseDir, `${variant.name}.toon`);

    console.log(`Generating ${variant.name}.json...`);

    const result = await runCli(["."], baseDir, {
      output: jsonPath,
      style: "json",
      ...(variant.include ? { include: variant.include.join(",") } : {}),
      ...(variant.ignore ? { ignore: variant.ignore.join(",") } : {}),
    });

    if (result) {
      console.log(
        `  Files: ${result.packResult.totalFiles}, Tokens: ${result.packResult.totalTokens}`,
      );
    }

    console.log(`Converting to ${variant.name}.toon...`);
    const jsonContent = readFileSync(jsonPath, "utf-8");
    const jsonData: unknown = JSON.parse(jsonContent);
    const toonContent = encode(jsonData);
    writeFileSync(toonPath, toonContent);

    console.log(`  Done: ${toonPath}\n`);
  }

  console.log("All variants generated successfully!");
}

generateVariants().catch((error: unknown) => {
  console.error("Error:", error);
  process.exit(1);
});
