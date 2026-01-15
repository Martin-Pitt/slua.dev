---
title: Performance
description: Guide on SLua performance
---

Currently this guide is specifically for considerations you may have to make with the SLua language in mind, rather than general programming advice.

For detailed technical information refer to https://luau.org/performance/

Here are the top level insights that may have an impact on how you write code:
* Compiler uses type information to make further optimisations
	* So make sure to use type refinement / typing to avoid ambuigity (e.g. `numeric | boolean` -> `numeric`)
* Table access for field lookup is optimised and very fast provided that:
	* The field name is known at compilete time (e.g. `table.field` or `table["field"]` where expression is a constant string)
	* Field access does not use metatables. The fastest way to work with tables is to store fields directly inside the table and methods in the metatable (static fields access through a class than object instance)
	* Object structure is usually uniform. While it is possible to use a generic function to access tables of different shapes — e.g. `function getX(obj) return obj.x end` used on any table that has a field `"x"` — it is best not to vary the keys used in tables too much, as it defeats this optimisation
* Fast method calls
	* Compiler emits a specialised instruction sequence when methods are called through `obj:Method` (aka colon syntax) instead of `obj.Method(obj)`. For this to be effective, it is crucial that `__index` in a metatable points to a table directly instead of a function. It is strongly recommended to avoid `__index` functions as well as deep `__index` chains; an ideal object is a table with a metatable that points to itself through `__index`.
	* As a result of optimisations, common Lua tricks of caching a method in a local variable are not productive
* Fastcall mechanism of builtin functions
	* Some functions in Luau are optimised through a special fastcall mechanism but for this to work the function call must be "obvious" to the compiler — it needs to call a builtin function directly, e.g. `math.max(x, 1)`, although this also works if the function is "localised" (`local max = math.max`); this does not work for indirect function calls and does not work for method calls (so calling `string.byte` is more efficient than `s:byte`)
	* Additionally some fastcall specialisations are partial in that they don't support all types of arguments, for example all `math` library builtins are specialised for numeric arguments, so calling `math.abs` with a string will back to a slower implementation that does string to number coercion
* Optimised table iteration
	* Iteration through tables typically doesn't result in function calls for every iteration; The performance of iteration using generalised iteration, `pairs` and `ipairs` is comparable, so generalised iteration (without the use of `pairs`/`ipairs`) is recommended unless code needs to be compatible with vanilla Lua or specifics of `ipairs` is required (which stops at first `nil`). Additionally generalised iteration avoids calling `pairs` when the loop starts which can be noticeable on very short tables
	* Iterating through array-like tables using `for i=1,#t` (instead of generalised iteration) tends to be slightly slower because of extra cost incurred when reading elements from the table
* Creating and modifying tables
	* SLua implements several optimisations for table creation. When creating object-like tables, it is recommended to use table literals (`{...}`) and to specify all table fields in the literal in one go instead of assigning them later; This triggers and optimisation inspired by LuaJIT called "table templates" and results in higher performance when creating objects. When creating array-like tables on the other hand, if the maximum size of the table is known up front, it is recommended to use `table.create` which can create an empty table with preallocated storage, and optionally fill it with a given value.
	* When the exact table shape is not known, the compiler can still predict the table capacity required in case the table is initialised with an empty literal (`{}`) and filled with fields subsequently. For example, the following code creates a correctly sized table implicitly:
		```slua
		local v = {}
		v.x = 1
		v.y = 2
		v.z = 3
		return v
		```
	* When appending elements to tables, it is recommend to use `table.insert`, which is the fastest method to append an element to a table if the table size is not known. In cases when a table is filled sequentially, however, it can be more efficient to use known index for insertion — together with preallocating tables using `table.create` this can result in much faster code, for example this is the fastest way to build a table of squares:
		```slua
		local t = table.create(N)
		for i=1,N do
			t[i] = i * i
		end
		```
* Native vector math
	* Vectors in Luau are optimised as 32-bit floating point vectors with 3 components with first class support for all math operations and component manipulation, which means native 3-wide SIMD support. For code that uses a lot of vector values this means smaller GC pressure and significantly faster execution.
* Closure caching
	* Creating new closures (function objects) requires allocating a new object every time. This can be problematic for cases when functions are passed to algorithms like `table.sort` or functions like `pcall` which can lead to more work for the garbage collector. To make closure creation cheaper, the compiler implements closure caching — when multiple executions of the same function expression are guaranteed to result in the function object that is semantically identical, the compiler may cache the closure and always return the same object. This changes the function identity which may affect code that uses function objects as table keys. 
* Fast memory allocator
	* A custom allocator is implemented that is highly specialised and tuned to common allocation workloads. This does not mean memory allocation si free — it is carefully optimised but still carries a cost, and a high rate of allocations require more work from the garbage collector. The GC is incremental. Thus for high performance code it is recommend to avoid allocating memory in tight loops, by avoiding temporary table and userdata creation.
* Optimised libraries
	* While the best performing code performs most of the time in the interpreter, the performance of the standard library functions is critical to some applications. In addition to specialising many small and simple functionds using the builtin fastcall mechanism, we spend extra care on optimising all library functions and providing additional functions beyond Lua's standard library to help achieve good performance
	* Functions from the `table` library like `insert`, `remove` and `move` have been tuned for performance on array-like tables. Luau provides additional functions like `create` and `find` to achieve further speedups. `sort` uses an `introsort` algorithm which results in guarnateed worst case `NlogN` complexity regardless of input
	* For `string` library a carefully tuned dynamic string buffer implementation is used. It is optimised for smaller strings to reduce garbage during string manipulation, and for larger strings it allows to produce a large string without extra copies, especially where the resulting size is known ahead of time. Additionally functions like `format` have been tuned to avoid the overhead of `sprintf` where possible
* Loop unrolling
	* Only loops with loop bounds known at compile time, such as for `i=1,4 do`, can be unrolled. The loop body must be simple enough for the optimisation to be profitable; compiler uses heuristics to estimate the performance benefit and automatically decide if unrolling should be performed
* Function inlining
	* Only local functions (defined either as `local function foo` or `local foo = function`) can be inlined. The function body must be simple enough for the optimization to be profitable; compiler uses heuristics to estimate the performance benefit and automatically decide if each call to the function should be inlined instead. Additionally recursive invocations of a function can’t be inlined at this time.



<Attribution
	title="Luau Library Documentation"
	source="https://luau.org/performance/"
	author="2019-2025 Roblox Corporation, 1994–2019 Lua.org, PUC-Rio"
	license="MIT"
/>

