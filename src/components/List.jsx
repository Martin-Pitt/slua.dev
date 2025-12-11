import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { signal, effect, computed } from '@preact/signals';

let tag = signal(null);

export default function List({ items }) {
	const Categories = Array.from(new Set(items.flatMap(([, tags]) => tags))).sort();
	const onChange = useCallback((e) => {
		tag.value = e.target.value || null;
	}, []);
	
	return (
		<div class="filterable-list not-content">
			<select class="tag-filter" onChange={onChange}>
				<option value="">All</option>
				{Categories.map(tag => <option value={tag}>{tag}</option>)}
			</select>
			<style>
				{`.filterable-list {
					${tag.value? `
					code.categorised-list { display: none }
					.ec-line { display: none }
					.ec-line[data-tags*="${tag.value}"] { display: list-item; }
					` : `
					code.raw-list { display: none }
					`}
				}`}
			</style>
			<div class="expressive-code">
				<figure class="frame not-content">
					<figcaption class="header"></figcaption>
					<pre data-language="slua">
						<code class="raw-list">
							{items.map(([key, tags]) => {
								const functionName = key.replace('ll.', '');
								return (
									<div key={key} data-tags={tags.join(' ')} class="ec-line">
										<div class="code"><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span style="--0:#B392F0;--1:#6F42C1">{functionName}</span><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></div>
									</div>
								)
							})}
						</code>
						<code class="categorised-list">
							{Categories.map((category, index) => (
								<>
								{index? <div class="ec-line"><div class="code">{'\n'}</div></div> : null}
								<div class="ec-line"><div class="code"><span style="--0:#99A0A6;--1:#616972">-- {category}</span></div></div>
								{items.filter(([_, tags]) => tags.includes(category)).map(([key, tags]) => {
									const functionName = key.replace('ll.', '');
									return (
										<div key={key} class="ec-line">
											<div class="code"><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span style="--0:#B392F0;--1:#6F42C1">{functionName}</span><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></div>
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