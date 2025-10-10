const config = {
  // Lint & format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Format other files
  '**/*.{json,css,scss,md,mdx}': ['prettier --write'],
}

export default config
