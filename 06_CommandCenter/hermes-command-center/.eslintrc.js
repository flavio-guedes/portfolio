module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {},
  overrides: [
    {
      files: ['src/components/graph/ExecutionGraph.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/components/tools/ToolsPanel.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
