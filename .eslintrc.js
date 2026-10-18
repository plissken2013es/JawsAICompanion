module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint'
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended'
	],
	rules: {
		'@typescript-eslint/explicit-function-return-type': 0,
		'@typescript-eslint/ban-ts-ignore': 0,
		'@typescript-eslint/no-namespace': ['error', { 'allowDeclarations': true }],
		'@typescript-eslint/member-delimiter-style': 0,
		'@typescript-eslint/no-explicit-any': 0,
		'@typescript-eslint/interface-name-prefix': 0
	},
	overrides: [
		{
			// Act II core must be deterministic and reproducible from a seed (docs/acto2/SPECS.md §6)
			files: ['src/act2/core/**/*.ts'],
			rules: {
				'no-restricted-properties': ['error',
					{ object: 'Math', property: 'random', message: 'Not allowed in the Act II core: use the seeded Rng (src/act2/core/rng.ts).' },
					{ object: 'Date', property: 'now', message: 'Not allowed in the Act II core: it must be deterministic.' }
				],
				'no-restricted-globals': ['error', { name: 'Date', message: 'Not allowed in the Act II core: it must be deterministic.' }]
			}
		}
	]
}