# How to setup the development environment

```
1. Download node.js(url: https://nodejs.org/en), choose the LTS version.
2. Open the terminal in this directory and run "npm i".
```

# Recommended code formatting configuration

```
1. Download the "Prettier - Code formatter" extension.
2. Press "CTRL <" and type in "format".
3. Select prettier as your default formatter and enable the checkbox for "Editor: Format On Save".
```

# Launching the API

```
1. Open the terminal and type in "npm run dev", the server will run on port 3005.
```

# Notes for how the project is configured (for developers)

```
1. The ".env" file is for storing environment variables. They can be accessed by importing 'dotenv/config' into a file, and then be retrieved with "process.env.VARIABLE_NAME".
2. ".eslintrc" is used for defining rules that when broken, throw an error and does not let someone commit their changes. For example, not placing semicolons at the end of the line.
3. ".gitignore" is used for ignoring unnecessary files that need not be pushed to the repository. For example, "node_modules".
4. "prettier.json" is used for defining formatting rules. For example, strings must be single quoted.
5. "package.json" is used for handling dependencies that are downloaded with npm and utilities like scripts.
6. "package-lock.json" is used for "locking" the dependency versions. When installing dependencies, npm will look at the "package-lock.json" file to determine which version should be downloaded(unless the version was changed in the "package.json" file).
7. "tsconfig.json" is used for defining typescript rules. For example, whether the "any" type is required or not.
```
