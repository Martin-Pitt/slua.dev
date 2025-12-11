import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { signal, effect, computed } from '@preact/signals';

let tag = signal(null);

export default function List({ items }) {
	// return <pre>{JSON.stringify(items, null, '\t')}</pre>
	
	const onChange = useCallback((e) => {
		tag.value = e.target.value || null;
	}, []);
	
	return (
		<div class="filterable-list not-content">
			<select class="tag-filter" onChange={onChange}>
				<option value="">All</option>
				{Array.from(new Set(items.flatMap(([_, tags]) => tags)))
				.sort()
				.map(tag => <option value={tag}>{tag}</option>)}
			</select>
			<style>
				{tag.value && `.filterable-list {
					.ec-line { display: none; }
					.ec-line[data-tags*="${tag.value}"] { display: list-item; 
				}`}
			</style>
			<div class="expressive-code">
				<figure class="frame not-content">
					<figcaption class="header"></figcaption>
					<pre data-language="slua">
						<code>
							{items.map(([key, tags]) => {
								const functionName = key.replace('ll.', '');
								return (
									<div key={key} data-tags={tags.join(' ')} class="ec-line">
										<div class="code"><span style="--0:#F97583;--1:#BF3441">function</span><span style="--0:#E1E4E8;--1:#24292E"> </span><span style="--0:#B392F0;--1:#6F42C1">ll</span><span style="--0:#E1E4E8;--1:#24292E">.</span><span style="--0:#B392F0;--1:#6F42C1">{functionName}</span><span style="--0:#E1E4E8;--1:#24292E">(</span><span style="--0:#E1E4E8;--1:#24292E">)</span></div>
									</div>
								)
							})}
						</code>
					</pre>
				</figure>
			</div>
		</div>
	)
}