module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "plugin:react/recommended",
    "airbnb",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ["react", "react-hooks", "prettier"],
  rules: {
    "prettier/prettier": 'error',
    "react/jsx-one-expression-per-line": 'off',
    "react-hooks/rules-of-hooks": 'error',
    "react-hooks/exhaustive-deps": 'warn',
    "react/jsx-filename-extension": [
      1,
      {
        "extensions": [".tsx"]
      }
    ],
    "import/prefer-default-export": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "ts": "never",
        "tsx": "never"
      }
    ]
  },
  settings: {
    "import/resolver": {
      "typescript": {}
    }
  }
};
