// After the LSL and SLua definitions are updated, run this script to update their grammars

import { readFile, writeFile, mkdir, access, unlink } from 'fs/promises';
import { load, dump } from 'js-yaml';
import { platform } from 'os';

const lslDefinitionsPath = 'src/data/lsl_definitions.yaml';
const lslGrammarPath = 'src/data/lsl.tmLanguage.json';
const sluaDefinitionsPath = 'src/data/slua_definitions.yaml';
const sluaGrammarPath = 'src/data/slua.tmLanguage.json';

const lsl = load(await readFile(lslDefinitionsPath, 'utf8'));
const lslGrammar = JSON.parse(await readFile(lslGrammarPath, 'utf8'));
const slua = load(await readFile(sluaDefinitionsPath, 'utf8'));
const sluaGrammar = JSON.parse(await readFile(sluaGrammarPath, 'utf8'));



/**
 * Creates an optimized regex pattern from an array of strings using trie-based optimization.
 * This algorithm builds a prefix tree (trie) and converts it to a regex pattern that
 * efficiently matches all input strings while minimizing the pattern length.
 * 
 * @param {string[]} strings - Array of strings to create regex for
 * @param {Object} options - Configuration options
 * @param {boolean} options.wordBoundaries - Whether to add word boundaries (default: true)
 * @param {boolean} options.caseInsensitive - Whether to make regex case insensitive (default: false)
 * @returns {string} Optimized regex pattern
 */
function createOptimizedRegex(strings, options = {}) {
    const { wordBoundaries = true, caseInsensitive = false } = options;
    
    // Trie node class for building the prefix tree
    class TrieNode {
        constructor() {
            this.children = new Map();
            this.isEndOfWord = false;
        }
    }
    
    /**
     * Builds a trie (prefix tree) from the input strings
     * @param {string[]} strings - Input strings
     * @returns {TrieNode} Root node of the trie
     */
    function buildTrie(strings) {
        const root = new TrieNode();
        
        for (const str of strings) {
            let current = root;
            const processedStr = caseInsensitive ? str.toLowerCase() : str;
            
            for (const char of processedStr) {
                if (!current.children.has(char)) {
                    current.children.set(char, new TrieNode());
                }
                current = current.children.get(char);
            }
            current.isEndOfWord = true;
        }
        
        return root;
    }
    
    /**
     * Converts a trie to an optimized regex pattern
     * @param {TrieNode} node - Current trie node
     * @returns {string} Regex pattern for this subtree
     */
    function trieToRegex(node) {
        if (!node || node.children.size === 0) {
            return '';
        }
        
        const alternatives = [];
        
        // Process each child node
        for (const [char, childNode] of node.children) {
            const childPattern = trieToRegex(childNode);
            
            if (childNode.isEndOfWord && childNode.children.size === 0) {
                // Leaf node - just the character
                alternatives.push(escapeRegexChar(char));
            } else if (childNode.isEndOfWord && childNode.children.size > 0) {
                // Node that ends a word but also has continuations (optional suffix)
                if (childPattern) {
                    alternatives.push(escapeRegexChar(char) + '(?:' + childPattern + ')?');
                } else {
                    alternatives.push(escapeRegexChar(char));
                }
            } else if (childNode.children.size > 0) {
                // Node with only continuations
                alternatives.push(escapeRegexChar(char) + childPattern);
            }
        }
        
        // Combine alternatives into a group
        if (alternatives.length === 0) {
            return '';
        } else if (alternatives.length === 1) {
            return alternatives[0];
        } else {
            return '(?:' + alternatives.join('|') + ')';
        }
    }
    
    /**
     * Escapes special regex characters
     * @param {string} char - Character to escape
     * @returns {string} Escaped character
     */
    function escapeRegexChar(char) {
        const specialChars = /[.*+?^${}()|[\]\\]/g;
        return char.replace(specialChars, '\\$&');
    }
    
    // Validate input
    if (!Array.isArray(strings) || strings.length === 0) {
        throw new Error('Input must be a non-empty array of strings');
    }
    
    // Remove duplicates and empty strings
    const uniqueStrings = [...new Set(strings.filter(s => s && typeof s === 'string'))];
    
    if (uniqueStrings.length === 0) {
        throw new Error('No valid strings provided');
    }
    
    // Build trie and convert to regex
    const root = buildTrie(uniqueStrings);
    const pattern = trieToRegex(root);
    
    // Add word boundaries if requested
    let finalPattern = pattern;
    if (wordBoundaries) {
        finalPattern = '\\b' + pattern + '\\b';
    }
    
    return finalPattern;
}


// LSL Grammar

// Update LSL types
const types = Object.keys(lsl.types);
const patternTypes = lslGrammar.repository.types.patterns.find(pattern => pattern.name == 'storage.type.lsl');
patternTypes.match = createOptimizedRegex(types);

// Update LSL Events
const events = Object.keys(lsl.events);
const patternEvents = lslGrammar.repository.events.patterns.find(pattern => pattern.name == 'constant.language.events.lsl');
patternEvents.match = createOptimizedRegex(events);

// Update LSL Functions
const functions = [];
const functionsGodMode = [];
const functionsDeprecated = [];
for (const name in lsl.functions)
{
	const definition = lsl.functions[name];
	if(definition.private) continue; // Skip anything marked as private (not to be included in generated documentation)
	
	if(definition.deprecated) functionsDeprecated.push(name);
	else if(definition['god-mode']) functionsGodMode.push(name);
	else functions.push(name);
}

const patternFunctions = lslGrammar.repository.functions.patterns.find(pattern => pattern.name == 'support.function.lsl');
const patternFunctionsGodMode = lslGrammar.repository.functions.patterns.find(pattern => pattern.name == 'support.function.god-mode.lsl');
const patternFunctionsDeprecated = lslGrammar.repository.functions.patterns.find(pattern => pattern.name == 'invalid.deprecated.support.function.lsl');

patternFunctions.match = createOptimizedRegex(functions);
patternFunctionsGodMode.match = createOptimizedRegex(functionsGodMode);
patternFunctionsDeprecated.match = createOptimizedRegex(functionsDeprecated);

// Update LSL Constants
const constants = [];
const constantsDeprecated = [];
for (const constant in lsl.constants)
{
	if(constant == 'TRUE' || constant == 'FALSE') continue; // Skip boolean constants
	if(lsl.constants[constant].deprecated) constantsDeprecated.push(constant);
	else constants.push(constant);
}

const patternConstants = lslGrammar.repository.constants.patterns.find(pattern => pattern.name == 'support.constant.lsl');
const patternConstantsDeprecated = lslGrammar.repository.constants.patterns.find(pattern => pattern.name == 'invalid.deprecated.constant.lsl');

patternConstants.match = createOptimizedRegex(constants);
patternConstantsDeprecated.match = createOptimizedRegex(constantsDeprecated);


console.log(`Writing updated LSL grammar to ${lslGrammarPath}`);
await writeFile(lslGrammarPath, JSON.stringify(lslGrammar, null, '\t'), 'utf8');





// Update SLua grammar

const globalFunctions = slua.libraries.global.functions.flatMap(item =>
	Array.isArray(item)? item : ('list' in item? item.list : item)
).map(item => item.name);
const globalConstants = slua.libraries.global.constants.flatMap(item =>
	Array.isArray(item)? item : ('list' in item? item.list : item)
).map(item => item.name);

const luauFunctions = Object.entries(slua.libraries)
	.filter(([key]) => key !== 'global') // Exclude global namespace
	.filter(([key]) => !key.toLowerCase().startsWith('ll')) // Exclude ll/LL
	.flatMap(([namespace, lib]) =>
		(lib.functions || []).flatMap(item =>
			Array.isArray(item)? item : ('list' in item? item.list : item)
		).map(item => namespace + '.' + item.name)
	)
	.filter(item => item?.length);
const luauConstants = Object.entries(slua.libraries)
	.filter(([key]) => key !== 'global') // Exclude global namespace
	.filter(([key]) => !key.toLowerCase().startsWith('ll')) // Exclude ll/LL
	.flatMap(([namespace, lib]) =>
		(lib.constants || []).flatMap(item =>
			Array.isArray(item)? item : ('list' in item? item.list : item)
		).map(item => namespace + '.' + item.name)
	)
	.filter(item => item?.length);

const platformFunctions = Object.entries(slua.libraries)
	.filter(([key]) => key.toLowerCase().startsWith('ll'))
	.flatMap(([namespace, lib]) =>
		(lib.functions || []).flatMap(item =>
			Array.isArray(item)? item : ('list' in item? item.list : item)
		).map(item => namespace + '.' + item.name)
	)
	.filter(item => item?.length);
const platformConstants = Object.entries(slua.libraries)
	.filter(([key]) => key.toLowerCase().startsWith('ll'))
	.flatMap(([namespace, lib]) =>
		(lib.constants || []).flatMap(item =>
			Array.isArray(item)? item : ('list' in item? item.list : item)
		).map(item => namespace + '.' + item.name)
	)
	.filter(item => item?.length);



// Replace standard library
const standard = [];

// Global functions and constants
if(globalFunctions.length) standard.push({
	name: 'support.function.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(globalFunctions),
});
if(globalConstants.length) standard.push({
	name: 'constant.language.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(globalConstants),
});

// Luau libraries/constants
if(luauFunctions.length) standard.push({
	name: 'support.function.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(luauFunctions),
});
if(luauConstants.length) standard.push({
	name: 'support.constant.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(luauConstants),
});

// Platform libraries/constants
if(platformFunctions.length) standard.push({
	name: 'support.function.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(platformFunctions),
});
if(platformConstants.length) standard.push({
	name: 'support.constant.luau',
	match: '(?<![^.]\\.|:)' + createOptimizedRegex(platformConstants),
});

sluaGrammar.repository.standard_library.patterns = standard;


// Update primitive types
sluaGrammar.repository.type_literal.patterns
.find(pattern => pattern.name === 'support.type.primitive.luau')
.match = `\\b(${Object.keys(slua.types).filter(type => type != 'table').join('|')}|unknown|never|any)\\b`;



console.log(`Writing updated SLua grammar to ${sluaGrammarPath}`);
await writeFile(sluaGrammarPath, JSON.stringify(sluaGrammar, null, '\t'), 'utf8');
