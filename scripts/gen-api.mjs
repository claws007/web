import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

loadEnvFile(".env");
loadEnvFile(".env.local");

const swaggerUrl = process.env.SWAGGER_URL ||
	"http://localhost:8000/swagger.json";

const packageManagerEntrypoint = process.env.npm_execpath;

if (!packageManagerEntrypoint) {
	throw new Error(
		"npm_execpath is not available in the current environment.",
	);
}

execFileSync(
	process.execPath,
	[
		packageManagerEntrypoint,
		"exec",
		"swagger-typescript-api",
		"generate",
		"--path",
		swaggerUrl,
		"--output",
		"./src/api",
		"--name",
		"generated.ts",
	],
	{
		cwd: projectRoot,
		stdio: "inherit",
	},
);

function loadEnvFile(fileName) {
	const filePath = resolve(projectRoot, fileName);
	if (!existsSync(filePath)) {
		return;
	}

	const content = readFileSync(filePath, "utf8");
	for (const line of content.split(/\r?\n/)) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const separatorIndex = trimmedLine.indexOf("=");
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmedLine.slice(0, separatorIndex).trim();
		const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
		if (!key || process.env[key] !== undefined) {
			continue;
		}

		process.env[key] = rawValue.replace(/^['\"]|['\"]$/g, "");
	}
}
