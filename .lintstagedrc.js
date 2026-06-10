export default {
  "*.{ts,tsx,js,jsx}": ["oxfmt --write", "oxlint --fix --max-warnings 0"],
  "*.{ts,tsx}": [() => "tsgo --noEmit", () => "pnpm test"],
  "**/*": ["secretlint --secretlintignore .gitignore", "cspell"],
};
