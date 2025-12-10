import { readFile, writeFile, access } from 'fs/promises';
import { load } from 'js-yaml';

const yamlPath = 'src/data/lsl_definitions.yaml';
const jsonPath = 'src/data/lsl_definitions.json';

async function fileExists(filePath) {
	try {
		await access(yamlPath);
		return true;
	} catch {
		return false;
	}
}

if(!await fileExists(yamlPath)) {
	console.error(`YAML file not found at path: ${yamlPath}`);
	process.exit(1);
}

const yamlContent = await readFile(yamlPath, 'utf8');
const definitions = load(yamlContent);
await writeFile(jsonPath, JSON.stringify(definitions, null, '\t'), 'utf8');
console.log('LSL definitions updated');
