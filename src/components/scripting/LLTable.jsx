import { useState, useEffect, useRef, useCallback, useMemo } from 'preact/hooks';
import { signal, effect, computed } from '@preact/signals';
import classNames from 'classnames';

import ll_categories from '~/data/ll_categories.json';
import lsl_definitions from '~/data/lsl_definitions.json';
import { default as Translations } from '~/data/i18n/categories.en.json';

const RemovedFunctions = {
	'SetTimerEvent': 'Conflicts with LLTimers',
	'ResetTime': 'Conflicts with LLTimers',
	'GetAndResetTime': 'Conflicts with LLTimers',
	'SetMemoryLimit': 'Not applicable to SLua',
};
const DuplicateFunctions = {
	'Abs': 'math.abs',
	'Fabs': 'math.fabs',
	'Ceil': 'math.ceil',
	'Round': 'math.round',
	'Floor': 'math.floor',
	'ModPow': '(a^b)%c',
	'Sqrt': 'math.sqrt',
	'Sin': 'math.sin',
	'Cos': 'math.cos',
	'Tan': 'math.tan',
	'Asin': 'math.asin',
	'Acos': 'math.acos',
	'Atan': 'math.atan',
	'Atan2': 'math.atan2',
	'Pow': 'math.pow',
	'Exp': 'math.exp',
	'Log': 'math.log',
	'Log10': 'math.log10',
	'Frand': 'math.random',
	'Char': 'string.char, utf8.char',
	'Ord': 'string.byte, utf8.codepoint',
	'GetTime': 'os.clock',
	'GetUnixTime': 'os.time',
	'GetTimestamp': 'os.date',
	'GetDate': 'os.date',
	'StringLength': '#string, string.len, utf8.len',
	'ToUpper': 'string.upper',
	'ToLower': 'string.lower',
	'VecMag': 'vector.magnitude',
	'VecNorm': 'vector.normalize',
	'VecDist': 'vector.magnitude(v1 - v2)',
};

const selectedCategory = signal(null);
const view = signal('list'); // 'list' | 'details'
const search = signal('');

function sortByRelevance(a, b) {
	const searchTerm = search.value.toLowerCase();
	const aNameIndex = a.name.toLowerCase().indexOf(searchTerm);
	const bNameIndex = b.name.toLowerCase().indexOf(searchTerm);
	if(aNameIndex !== -1 && bNameIndex === -1) return -1;
	if(aNameIndex === -1 && bNameIndex !== -1) return 1;
	if(aNameIndex !== bNameIndex) return aNameIndex - bNameIndex;
	
	return a.name.localeCompare(b.name);
}

function debounce(func, wait) {
	let timeout;
	return function() {
		const context = this;
		const args = arguments;
		const later = function() {
			timeout = null;
			func.apply(context, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

export default function LLTable() {
	const fullItems = useMemo(() => {
		return Object.entries(ll_categories)
			.filter(([name, _]) => {
				const definition = lsl_definitions.functions[name];
				if(!definition) return true; // Doesn't exist in LSL?
				if(definition.private) return false; // Do not include in documentation
				if(definition.deprecated) return false; // Do not include deprecated functions
				return true;
			})
			.map(([name, categories]) => ({ name, categories }))
	}, []);
	
	const { items, categories, translations, removedItems, duplicateItems } = useMemo(() => {
		const items = [];
		const removedItems = [];
		const duplicateItems = [];
		
		for(const item of fullItems) {
			if(RemovedFunctions[item.name]) removedItems.push(item);
			else if(DuplicateFunctions[item.name]) duplicateItems.push(item);
			else items.push(item);
		}
		
		const categories = Array.from(new Set(items.flatMap(({ categories }) => categories))).sort();
		const translations = categories.reduce((acc, c) => ({ ...acc, [c]: Translations[c] || c }), {});
		return { items, categories, translations, removedItems, duplicateItems };
	}, [fullItems]);
	
	const { narrowItems, narrowRemoved, narrowDuplicates } = useMemo(() => {
		const searchTerm = search.value.toLowerCase();
		const narrowItems = searchTerm? items.filter(({ name, categories }) => {
			if(name.toLowerCase().includes(searchTerm)) return true;
			for(const category of categories) {
				if(category.toLowerCase().includes(searchTerm)) return true;
				const translated = Translations[category];
				if(translated && translated.toLowerCase().includes(searchTerm)) return true;
			}
			return false;
		}) : items;
		
		const narrowRemoved = [];
		for(const item of removedItems) {
			if(item.name.toLowerCase().includes(searchTerm)) narrowRemoved.push(item);
			else {
				for(const category of item.categories) {
					if(category.toLowerCase().includes(searchTerm)) {
						narrowRemoved.push(item);
						break;
					}
					const translated = Translations[category];
					if(translated && translated.toLowerCase().includes(searchTerm)) {
						narrowRemoved.push(item);
						break;
					}
				}
			}
		}
		
		const narrowDuplicates = [];
		for(const item of duplicateItems) {
			if(item.name.toLowerCase().includes(searchTerm)) narrowDuplicates.push(item);
			else {
				for(const category of item.categories) {
					if(category.toLowerCase().includes(searchTerm)) {
						narrowDuplicates.push(item);
						break;
					}
					const translated = Translations[category];
					if(translated && translated.toLowerCase().includes(searchTerm)) {
						narrowDuplicates.push(item);
						break;
					}
				}
			}
		}
		
		return { narrowItems, narrowDuplicates, narrowRemoved };
	}, [items, search.value]);
	
	const onChange = useCallback((event) => {
		selectedCategory.value = event.target.value || null;
	}, []);
	
	const onSearch = useCallback(debounce((event) => {
		search.value = event.target.value;
	}, 20), []);
	
	const hasDuplicateItems = !!narrowDuplicates?.length; // useMemo(() => selectedCategory.value? duplicateItems.some(({ categories }) => categories.includes(selectedCategory.value)) : !!duplicateItems.length, [selectedCategory.value]);
	const hasRemovedItems = !!narrowRemoved?.length; // useMemo(() => selectedCategory.value? removedItems.some(({ categories }) => categories.includes(selectedCategory.value)) : !!removedItems.length, [selectedCategory.value]);
	
	return (<>
		<div class="library-view not-content">
			<div class="options">
				<input class="search" type="search" placeholder="Fuzzy Search" value={search.value} onInput={onSearch} />
				{/* <div class="view" role="group" aria-label="View Mode">
					<button type="button" class={classNames({ selected: view.value === 'list' })} aria-label="List View" title="List View" onClick={() => view.value = 'list'}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6H20V4H4V6ZM4 13H20V11H4V13ZM4 20H20V18H4V20Z"></path></svg>
					</button>
					<button type="button" class={classNames({ selected: view.value === 'details' })} aria-label="Detailed View" title="Detailed View" onClick={() => view.value = 'details'}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6H14V4H4V6ZM16 6H20V4H16V6ZM4 13H14V11H4V13ZM16 13H20V11H16V13ZM4 20H14V18H4V20ZM16 20H20V18H16V20Z"></path></svg>
					</button>
				</div> */}
				<label class="categories dropdown">
					<span class="sr-only">Select category</span>
					<select onChange={onChange} ref={element => element && (selectedCategory.value = element.value)}>
						<option value="">All Categories</option>
						{categories.map(tag => <option value={tag}>{translations[tag]}</option>)}
					</select>
					<svg aria-hidden="true" class="icon caret" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="--sl-icon-size: 1em;"><path d="M17 9.17a1 1 0 0 0-1.41 0L12 12.71 8.46 9.17a1 1 0 1 0-1.41 1.42l4.24 4.24a1.002 1.002 0 0 0 1.42 0L17 10.59a1.002 1.002 0 0 0 0-1.42Z"></path></svg>
				</label>
			</div>
			<div class="expressive-code">
				<figure class="frame not-content">
					<figcaption class="header"></figcaption>
					<pre data-language="slua">
						{selectedCategory?.value? (
						<code class="raw-list">
							{narrowItems
							?.sort(sortByRelevance)
							.map(({ name, categories }) => {
								let functionName = name.replace('ll.', '');
								let slug = functionName.toLowerCase();
								
								// If search then use <mark> tags around matched text
								if(search.value) {
									const regex = new RegExp(`(${search.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
									functionName = functionName.replace(regex, '<mark>$1</mark>');
								}
								
								return (
									<div key={name} data-tags={categories.join(' ')} class="ec-line">
										<div class="code"><a href={`./${slug}`}><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span class="method" style="--0:#B392F0;--1:#6F42C1" dangerouslySetInnerHTML={{ __html: functionName }}/><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></a></div>
									</div>
								)
							})}
						</code>
						):(
						<code class="categorised-list">
							{categories
							.filter(category => narrowItems?.some(({ categories }) => categories.includes(category)))
							// If search then sort by categories that have direct match or match in their items
							.sort((a, b) => {
								const searchTerm = search.value.toLowerCase();
								
								const aCategoryIndex = a.replace(/_/g, ' ').toLowerCase().indexOf(searchTerm);
								const bCategoryIndex = b.replace(/_/g, ' ').toLowerCase().indexOf(searchTerm);
								if(aCategoryIndex !== -1 && bCategoryIndex === -1) return -1;
								if(aCategoryIndex === -1 && bCategoryIndex !== -1) return 1;
								if(aCategoryIndex !== bCategoryIndex) return aCategoryIndex - bCategoryIndex;
								
								const aItemIndex = narrowItems
									.map(({ name }) => name.toLowerCase().indexOf(searchTerm))
									.filter(index => index !== -1)
									.sort((x, y) => x - y)[0] || Infinity;
								const bItemIndex = narrowItems
									.map(({ name }) => name.toLowerCase().indexOf(searchTerm))
									.filter(index => index !== -1)
									.sort((x, y) => x - y)[0] || Infinity;
								if(aItemIndex !== bItemIndex) return aItemIndex - bItemIndex;
								
								// Finally alphabetical
								return a.localeCompare(b);
							})
							.map((category, index) => {
								let categoryName = translations[category] || category;
								
								if(search.value) {
									const regex = new RegExp(`(${search.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
									categoryName = categoryName.replace(regex, '<mark>$1</mark>');
								}
								
								return (
									<>
									{index? <div class="ec-line"><div class="code">{'\n'}</div></div> : null}
									<div class="ec-line"><div class="code"><span style="--0:#99A0A6;--1:#616972">-- <span dangerouslySetInnerHTML={{ __html: categoryName }}></span></span></div></div>
									{narrowItems
									?.filter(({ categories }) => categories.includes(category))
									.sort(sortByRelevance)
									.map(({ name }) => {
										let functionName = name.replace('ll.', '');
										let slug = functionName.toLowerCase();
										
										// If search then use <mark> tags around matched text
										if(search.value) {
											const regex = new RegExp(`(${search.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
											functionName = functionName.replace(regex, '<mark>$1</mark>');
										}
										
										return (
											<div key={name} class="ec-line">
												<div class="code"><a href={`./${slug}`}><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span class="method" style="--0:#B392F0;--1:#6F42C1" dangerouslySetInnerHTML={{ __html: functionName }}/><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></a></div>
											</div>
										)
									})}
								</>)
							})}
						</code>
						)}
					</pre>
				</figure>
			</div>
		</div>
		<aside aria-label="Duplicate Functionality" class="duplicated-functionality starlight-aside starlight-aside--tip">
			<p class="starlight-aside__title" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.43909 8.85483L1.44039 8.85354L4.96668 5.33815C5.30653 4.99386 5.7685 4.79662 6.2524 4.78972L6.26553 4.78963L12.9014 4.78962L13.8479 3.84308C16.9187 0.772319 20.0546 0.770617 21.4678 0.975145C21.8617 1.02914 22.2271 1.21053 22.5083 1.4917C22.7894 1.77284 22.9708 2.13821 23.0248 2.53199C23.2294 3.94517 23.2278 7.08119 20.1569 10.1521L19.2107 11.0983V17.7338L19.2106 17.7469C19.2037 18.2308 19.0067 18.6933 18.6624 19.0331L15.1456 22.5608C14.9095 22.7966 14.6137 22.964 14.29 23.0449C13.9663 23.1259 13.6267 23.1174 13.3074 23.0204C12.9881 22.9235 12.7011 22.7417 12.4771 22.4944C12.2533 22.2473 12.1006 21.9441 12.0355 21.6171L11.1783 17.3417L6.65869 12.822L4.34847 12.3589L2.38351 11.965C2.05664 11.8998 1.75272 11.747 1.50564 11.5232C1.25835 11.2992 1.07653 11.0122 0.979561 10.6929C0.882595 10.3736 0.874125 10.034 0.955057 9.7103C1.03599 9.38659 1.20328 9.09092 1.43909 8.85483ZM6.8186 10.8724L2.94619 10.096L6.32006 6.73268H10.9583L6.8186 10.8724ZM15.2219 5.21703C17.681 2.75787 20.0783 2.75376 21.1124 2.8876C21.2462 3.92172 21.2421 6.31895 18.783 8.77812L12.0728 15.4883L8.51172 11.9272L15.2219 5.21703ZM13.9042 21.0538L13.1279 17.1811L17.2676 13.0414V17.68L13.9042 21.0538Z"></path><path d="M9.31827 18.3446C9.45046 17.8529 9.17864 17.3369 8.68945 17.1724C8.56178 17.1294 8.43145 17.1145 8.30512 17.1243C8.10513 17.1398 7.91519 17.2172 7.76181 17.3434C7.62613 17.455 7.51905 17.6048 7.45893 17.7835C6.97634 19.2186 5.77062 19.9878 4.52406 20.4029C4.08525 20.549 3.6605 20.644 3.29471 20.7053C3.35607 20.3395 3.45098 19.9148 3.59711 19.476C4.01221 18.2294 4.78141 17.0237 6.21648 16.5411C6.39528 16.481 6.54504 16.3739 6.65665 16.2382C6.85126 16.0016 6.92988 15.678 6.84417 15.3647C6.83922 15.3466 6.83373 15.3286 6.82767 15.3106C6.74106 15.053 6.55701 14.8557 6.33037 14.7459C6.10949 14.6389 5.84816 14.615 5.59715 14.6994C5.47743 14.7397 5.36103 14.7831 5.24786 14.8294C3.22626 15.6569 2.2347 17.4173 1.75357 18.8621C1.49662 19.6337 1.36993 20.3554 1.30679 20.8818C1.27505 21.1464 1.25893 21.3654 1.25072 21.5213C1.24662 21.5993 1.24448 21.6618 1.24337 21.7066L1.243 21.7226L1.24235 21.7605L1.2422 21.7771L1.24217 21.7827L1.24217 21.7856C1.24217 22.3221 1.67703 22.7579 2.2137 22.7579L2.2155 22.7579L2.22337 22.7578L2.23956 22.7577C2.25293 22.7575 2.27096 22.7572 2.29338 22.7567C2.33821 22.7555 2.40073 22.7534 2.47876 22.7493C2.63466 22.7411 2.85361 22.725 3.11822 22.6932C3.64462 22.6301 4.36636 22.5034 5.13797 22.2464C6.58274 21.7653 8.3431 20.7738 9.17063 18.7522C9.21696 18.639 9.26037 18.5226 9.30064 18.4029C9.30716 18.3835 9.31304 18.364 9.31827 18.3446Z"></path></svg>
				Duplicate Functionality
			</p>
			<div class="starlight-aside__content">
				<p>The following functions provide duplicate functionality that is available through the namespaced libraries or operators which may also offer better performance:</p>
				<ul>
					{narrowDuplicates?.map(({ name, categories }) => (
						<li data-tags={categories.join(' ')}>
							<code>{name}</code> by <code>{DuplicateFunctions[name.replace('ll.', '')]}</code>
						</li>
					))}
				</ul>
			</div>
		</aside>
		<aside aria-label="Removed Functions" class="removed-functions starlight-aside starlight-aside--danger">
			<p class="starlight-aside__title" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon"><path d="M12 7C11.7348 7 11.4804 7.10536 11.2929 7.29289C11.1054 7.48043 11 7.73478 11 8V12C11 12.2652 11.1054 12.5196 11.2929 12.7071C11.4804 12.8946 11.7348 13 12 13C12.2652 13 12.5196 12.8946 12.7071 12.7071C12.8946 12.5196 13 12.2652 13 12V8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7ZM12 15C11.8022 15 11.6089 15.0586 11.4444 15.1685C11.28 15.2784 11.1518 15.4346 11.0761 15.6173C11.0004 15.8 10.9806 16.0011 11.0192 16.1951C11.0578 16.3891 11.153 16.5673 11.2929 16.7071C11.4327 16.847 11.6109 16.9422 11.8049 16.9808C11.9989 17.0194 12.2 16.9996 12.3827 16.9239C12.5654 16.8482 12.7216 16.72 12.8315 16.5556C12.9414 16.3911 13 16.1978 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15ZM21.71 7.56L16.44 2.29C16.2484 2.10727 15.9948 2.00368 15.73 2H8.27C8.00523 2.00368 7.75163 2.10727 7.56 2.29L2.29 7.56C2.10727 7.75163 2.00368 8.00523 2 8.27V15.73C2.00368 15.9948 2.10727 16.2484 2.29 16.44L7.56 21.71C7.75163 21.8927 8.00523 21.9963 8.27 22H15.73C15.9948 21.9963 16.2484 21.8927 16.44 21.71L21.71 16.44C21.8927 16.2484 21.9963 15.9948 22 15.73V8.27C21.9963 8.00523 21.8927 7.75163 21.71 7.56ZM20 15.31L15.31 20H8.69L4 15.31V8.69L8.69 4H15.31L20 8.69V15.31Z"></path></svg>
				Removed Functions
			</p>
			<div class="starlight-aside__content">
				<p>The following functions are not available in <code dir="auto">ll</code> and may be available in <code dir="auto">llcompat</code> instead:</p>
				<ul>
					{narrowRemoved?.map(({ name, categories }) => (
						<li data-tags={categories.join(' ')}>
							<code>{name}</code> - {RemovedFunctions[name.replace('ll.', '')]}
						</li>
					))}
				</ul>
			</div>
		</aside>
		<style>
			{`@layer components {
				.library-view {
					code { display: block }
					${selectedCategory.value? `
					.categorised-list { display: none }
					.ec-line { display: none }
					.ec-line[data-tags*="${selectedCategory.value}"] { display: list-item }
					` : `
					code.raw-list { display: none }
					`}
					.categorised-list { columns: 45ch }
					
					a {
						display: inline-block;
						text-decoration: none;
					}
					a:hover {
						.code:has(&) {
							background-color: oklch(50% 0 0 / 0.2);
						}
						.method {
							text-decoration: underline;
						}
					}
				}
				
				.duplicated-functionality,
				.removed-functions {
					${selectedCategory.value && `
					li { display: none }
					li[data-tags*="${selectedCategory.value}"] { display: list-item }
					`}
					
					&:has(ul:empty) { display: none }
				}
				${hasDuplicateItems? '' : '.duplicated-functionality { display: none }'}
				${hasRemovedItems? '' : '.removed-functions { display: none }'}
				
				
				.expressive-code .ec-line :where(span[style^='--']:not([class])),
				:root:not([data-theme='dark']) .expressive-code[data-theme='dark'] .ec-line :where(span[style^='--']:not([class])) {
					color: var(--0, inherit);
					background-color: var(--0bg, transparent);
					font-style: var(--0fs, inherit);
					font-weight: var(--0fw, inherit);
					text-decoration: var(--0td, inherit)
				}
				
				@media (prefers-color-scheme: light) {
					:root:not([data-theme='dark']) .expressive-code .ec-line :where(span[style^='--']:not([class])) {
						color: var(--1, inherit);
						background-color: var(--1bg, transparent);
						font-style: var(--1fs, inherit);
						font-weight: var(--1fw, inherit);
						text-decoration: var(--1td, inherit)
					}
				}
				
				:root[data-theme='light'] .expressive-code:not([data-theme='dark']) .ec-line :where(span[style^='--']:not([class])),
				.expressive-code[data-theme='light'] .ec-line :where(span[style^='--']:not([class])) {
					color: var(--1, inherit);
					background-color: var(--1bg, transparent);
					font-style: var(--1fs, inherit);
					font-weight: var(--1fw, inherit);
					text-decoration: var(--1td, inherit)
				}
				
				
				.options {
					display: grid;
					grid-template-columns: auto auto auto 1fr;
					grid-gap: 20px;
					align-items: baseline;
					margin-bottom: 20px;
					
					.search {
						height: 2rem;
						padding-inline-start: 0.75rem;
						padding-inline-end: 0.5rem;
						border: 1px solid var(--sl-color-gray-5);
						border-radius: 0.25rem;
						background-color: var(--sl-color-black);
						color: var(--sl-color-gray-2);
						font-size: var(--sl-text-sm);
						
						&:hover {
							border-color: var(--sl-color-gray-2);
							color: var(--sl-color-white);
						}
						&::-webkit-search-cancel-button {
							cursor: pointer;
						}
					}
					
					.view {
						display: inline-flex;
						
						button {
							display: inline-block;
							appearance: none;
							height: 2rem;
							padding: 0 0.8rem;
							border: 0;
							border-radius: 0;
							background-color: oklch(50% 0 0 / 0.2);
							cursor: pointer;
							
							&:first-child {
								border-radius: 0.25rem 0 0 0.25rem;
							}
							&:last-child {
								border-radius: 0 0.25rem 0.25rem 0;
							}
							
							svg {
								display: inline-block;
								aspect-ratio: 1;
								vertical-align: -0.15rem;
								fill: currentColor;
							}
							
							&:hover {
								background-color: oklch(50% 0 0 / 0.4);
							}
							
							&.selected {
								background-color: var(--sl-color-text-accent);
								color: var(--sl-color-text-invert);
							}
						}
					}
					
					.categories {
						position: relative;
						height: 2rem;
						cursor: pointer;
						
						select {
							appearance: none;
							height: 100%;
							padding: 0 0.8rem;
							border: 0;
							background-color: transparent;
							color: inherit;
							text-overflow: ellipsis;
							cursor: pointer;
							
							option {
								background-color: var(--sl-color-bg-nav);
								color: var(--sl-color-gray-1)
							}
						}
							
						.icon {
							position: absolute;
							top: 50%;
							transform: translateY(-50%);
							pointer-events: none;
						}
						.caret {
							inset-inline-end: 0;
						}
					}
				}

			}`}
		</style>
	</>);
}

// Function, Description, Parameters, Returns, Permissions, Experience



