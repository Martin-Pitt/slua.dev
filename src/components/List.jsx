import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { signal, effect, computed } from '@preact/signals';

let tag = signal(null);

export default function List({ items, categories, translations }) {
	const onChange = useCallback((e) => {
		tag.value = e.target.value || null;
	}, []);
	
	return (
		<div class="filterable-list not-content">
			<label>
				Categories: <select class="tag-filter" onChange={onChange} ref={element => element && (tag.value = element.value)}>
					<option value="">All</option>
					{categories.map(tag => <option value={tag}>{translations[tag]}</option>)}
				</select>
			</label>
			<style>
				{`@layer components {
					.filterable-list {
						.categorised-list { columns: 45ch }
						${tag.value? `
						.categorised-list { display: none }
						.ec-line { display: none }
						.ec-line[data-tags*="${tag.value}"] { display: list-item; }
						` : `
						code.raw-list { display: none }
						`}
						
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
				}`}
			</style>
			<div class="expressive-code">
				<figure class="frame not-content">
					<figcaption class="header"></figcaption>
					<pre data-language="slua">
						<code class="raw-list">
							{items.map(({ name, categories }) => {
								const functionName = name.replace('ll.', '');
								return (
									<div key={name} data-tags={categories.join(' ')} class="ec-line">
										<div class="code"><a href={`./${functionName.toLowerCase()}`}><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span class="method" style="--0:#B392F0;--1:#6F42C1">{functionName}</span><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></a></div>
									</div>
								)
							})}
						</code>
						<code class="categorised-list">
							{categories.map((category, index) => (
								<>
								{index? <div class="ec-line"><div class="code">{'\n'}</div></div> : null}
								<div class="ec-line"><div class="code"><span style="--0:#99A0A6;--1:#616972">-- {translations[category]}</span></div></div>
								{items.filter(({ categories }) => categories.includes(category)).map(({ name, categories }) => {
									const functionName = name.replace('ll.', '');
									return (
										<div key={name} class="ec-line">
											<div class="code"><a href={`./${functionName.toLowerCase()}`}><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span class="method" style="--0:#B392F0;--1:#6F42C1">{functionName}</span><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></a></div>
										</div>
									)
								})}
								</>
							))}
						</code>
					</pre>
				</figure>
			</div>
		</div>
	)
}