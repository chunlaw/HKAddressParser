import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import builtins from "rollup-plugin-node-builtins";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default [
	// browser-friendly UMD build
	{
		input: "src/main.js",
		external: ["proj4", "@turf/turf"],
		output: {
			name: "hk-address-parser",
			file: "dist/hk-address-parser.js",
			format: "umd",
            globals: {
			    "@turf/turf": "turf",
                "proj4": "proj4"
            }
		},
		plugins: [
            builtins(),
			resolve(),
			json(),
			commonjs(),
		]
	},

	// browser-friendly minified UMD build
	{
		input: "src/main.js",
		external: ["proj4", "@turf/turf"],
		output: {
			name: "hk-address-parser",
			file: pkg.browser,
			format: "umd",
            globals: {
                "@turf/turf": "turf",
                "proj4": "proj4"
            }
		},
		plugins: [
            builtins(),
			resolve(),
			json(),
			commonjs(),
			terser({
				output: {
					comments: function (node, comment) {
						let text = comment.value;
						let type = comment.type;
						if (type === "comment2") {
							// multiline comment
							return /@preserve|@license|@cc_on/i.test(text);
						}
					}
				}
			})
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it"s quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify 
	// `file` and `format` for each target)
	{
		input: "src/main.js",
		external: ["proj4", "@turf/turf"],
		output: [
			{ file: pkg.main, format: "cjs" },
			{ file: pkg.module, format: "es" }
		],
		plugins: [
			resolve(),
            commonjs(),
		]
	}
];
