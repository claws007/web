import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

loadEnvFile(".env");
loadEnvFile(".env.local");

const swaggerUrl = process.env.SWAGGER_URL ||
	"http://localhost:8000/swagger.json";

const asyncApiUrl = process.env.ASYNC_API_URL ||
	`${new URL(swaggerUrl).origin}/asyncapi.yaml`;

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
		"--",
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

try {
	await generateAsyncApi();
} catch (err) {
	console.warn(`⚠ AsyncAPI generation skipped: ${err.message}`);
}

// ---- AsyncAPI generator ----

async function generateAsyncApi() {
	const response = await fetch(asyncApiUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch AsyncAPI spec from ${asyncApiUrl}: ${response.status} ${response.statusText}`,
		);
	}
	const rawYaml = await response.text();
	// Fix common server-side YAML issues: stray `description:` lines at the
	// same indentation as a sequence item `- $ref:` (invalid YAML). Handles
	// both LF and CRLF line endings.
	const yamlText = rawYaml.replace(
		/^([ \t]+)- \$ref:[^\r\n]*[\r\n]+\1description:[^\r\n]*/gm,
		(m) => m.split(/\r?\n/)[0],
	);
	const { load } = await import("js-yaml");
	const spec = load(yamlText);

	const lines = [
		"// Auto-generated from AsyncAPI spec. Do not edit manually.",
		`// Source: ${asyncApiUrl}`,
		"",
	];

	const schemas = spec.components?.schemas ?? {};
	const messages = spec.components?.messages ?? {};
	const channels = spec.channels ?? {};

	// 1. Schema types
	for (const [name, schema] of Object.entries(schemas)) {
		lines.push(schemaTopLevel(name, schema, schemas));
		lines.push("");
	}

	// 2. Channel send/receive types
	for (const [channelKey, channel] of Object.entries(channels)) {
		emitChannelTypes(lines, channelKey, channel, messages);
	}

	const outputPath = resolve(projectRoot, "src/api/generated-ws.ts");
	writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
	console.log("✓ AsyncAPI types written to src/api/generated-ws.ts");
}

function schemaTopLevel(name, schema, allSchemas) {
	if (schema.type === "string" && Array.isArray(schema.enum)) {
		const values = schema.enum.map((v) => JSON.stringify(v)).join(" | ");
		return `export type ${name} = ${values};`;
	}

	if (schema.type === "object" || schema.properties) {
		return buildInterface(name, schema, allSchemas);
	}

	return `export type ${name} = ${resolveType(schema, allSchemas)};`;
}

function buildInterface(name, schema, allSchemas) {
	const out = [`export interface ${name} {`];
	const requiredSet = new Set(schema.required ?? []);

	for (const [prop, propSchema] of Object.entries(schema.properties ?? {})) {
		const opt = requiredSet.has(prop) ? "" : "?";
		out.push(`  ${prop}${opt}: ${resolveType(propSchema, allSchemas)};`);
	}

	if (
		schema.additionalProperties &&
		typeof schema.additionalProperties !== "boolean"
	) {
		out.push(
			`  [key: string]: ${
				resolveType(schema.additionalProperties, allSchemas)
			};`,
		);
	}

	out.push("}");
	return out.join("\n");
}

function resolveType(schema, allSchemas) {
	if (!schema) return "unknown";

	if (schema.$ref) {
		const refName = schema.$ref.split("/").pop();
		return schema.nullable ? `${refName} | null` : refName;
	}

	if (schema.oneOf) {
		const inner = schema.oneOf
			.map((s) => resolveType(s, allSchemas))
			.join(" | ");
		return schema.nullable ? `${inner} | null` : inner;
	}

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => resolveType(s, allSchemas));
		const joined = parts.length === 1 ? parts[0] : `(${parts.join(" & ")})`;
		return schema.nullable ? `${joined} | null` : joined;
	}

	if (Array.isArray(schema.enum)) {
		const vals = schema.enum.map((v) => JSON.stringify(v)).join(" | ");
		return schema.nullable ? `${vals} | null` : vals;
	}

	let base;
	switch (schema.type) {
		case "integer":
		case "number":
			base = "number";
			break;
		case "string":
			base = "string";
			break;
		case "boolean":
			base = "boolean";
			break;
		case "array":
			base = schema.items
				? `${resolveType(schema.items, allSchemas)}[]`
				: "unknown[]";
			break;
		case "object": {
			if (schema.properties) {
				const req = new Set(schema.required ?? []);
				const fields = Object.entries(schema.properties).map(
					([k, v]) =>
						`${k}${req.has(k) ? "" : "?"}: ${
							resolveType(v, allSchemas)
						}`,
				);
				if (
					schema.additionalProperties &&
					typeof schema.additionalProperties !== "boolean"
				) {
					fields.push(
						`[key: string]: ${
							resolveType(schema.additionalProperties, allSchemas)
						}`,
					);
				}
				base = `{ ${fields.join("; ")} }`;
			} else {
				base = "Record<string, unknown>";
			}
			break;
		}
		default:
			base = schema.nullable ? undefined : "unknown";
			break;
	}

	if (base === undefined) return "null";
	return schema.nullable ? `${base} | null` : base;
}

/**
 * Convert a channel key (which may be a URL path like `/user/ws` or
 * `/company/{companyId}/agent/{agentId}/task/{taskId}/ws`) into a valid
 * PascalCase TypeScript identifier, e.g. `UserWs` or `CompanyAgentTaskWs`.
 * Path parameter placeholders like `{companyId}` are stripped.
 */
function channelKeyToName(key) {
	// Remove all {param} placeholders first, then split on path/word separators
	return key
		.replace(/\{[^}]*\}/g, "")
		.split(/[/._-]+/)
		.filter((seg) => seg.length > 0)
		.map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
		.join("");
}

function emitChannelTypes(lines, channelKey, channel, messages) {
	const name = channelKeyToName(channelKey);
	const address = channel.address ?? channelKey;

	// Collect path parameters: prefer explicit channel.parameters, fall back
	// to extracting {param} tokens from the channel key or address.
	const explicitParams = channel.parameters ?? {};
	const paramNames = Object.keys(explicitParams).length > 0
		? Object.keys(explicitParams)
		: [...(channelKey + (address !== channelKey ? `/${address}` : ""))
			.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

	const uniqueParams = [...new Set(paramNames)];
	if (uniqueParams.length > 0) {
		const fields = uniqueParams.map((k) => `${k}: string`).join("; ");
		lines.push(`export interface ${name}Params { ${fields} }`);
		lines.push("");
	}

	const sendTypes = resolveMessagePayloadTypes(
		channel.publish?.message,
		messages,
	);
	const receiveTypes = resolveMessagePayloadTypes(
		channel.subscribe?.message,
		messages,
	);

	lines.push(
		`/** Messages sent by the client on the \`${address}\` channel */`,
	);
	lines.push(
		`export type ${name}Send = ${
			sendTypes.length ? sendTypes.join(" | ") : "never"
		};`,
	);
	lines.push(
		`/** Messages received by the client on the \`${address}\` channel */`,
	);
	lines.push(
		`export type ${name}Receive = ${
			receiveTypes.length ? receiveTypes.join(" | ") : "never"
		};`,
	);
	lines.push("");
}

function resolveMessagePayloadTypes(msgSpec, messages) {
	if (!msgSpec) return [];
	const refs = msgSpec.oneOf
		? msgSpec.oneOf.map((m) => m.$ref).filter(Boolean)
		: msgSpec.$ref
		? [msgSpec.$ref]
		: [];

	return refs.flatMap((ref) => {
		const msgName = ref.split("/").pop();
		const msg = messages[msgName];
		if (!msg?.payload?.$ref) return ["unknown"];
		return [msg.payload.$ref.split("/").pop()];
	});
}

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
