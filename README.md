# Quoridor

## Introduction

Welcome to our online adaptation of the classic board game, Quoridor! This repository contains the Quoridor API.

Also, be sure to check out [our UI repository](https://github.com/Kliunkius/quoridor-ui) for the user interface part of our Quoridor application.

## About the game

Quoridor is an abstract strategy game where players compete to be the first to navigate their pawn from one side of the board to the opposite side. The catch? Players can strategically place walls to impede their opponents' progress, adding a layer of tactical complexity. Players take turns moving their pawn or placing walls, aiming to outmaneuver their opponents and reach the goal. 

Join in the fun and challenge your strategic skills in the world of Quoridor!

# Configuration

## Setup development environment

Steps needed to setup develompment environment:
1. Download [Node.js](https://nodejs.org/en) **LTS** (Long-Term Support) version.
2. Open the terminal **in the project directory** and run `npm i` to install project dependencies.

## Recommended code formatting configuration

To ensure consistent code style and improve readability, we recommend setting up code formatting using the Prettier extension. Follow these steps:

1. Install the [`Prettier - Code formatter`](https://prettier.io/) extension in your preferred code editor or IDE.
2. In your editor, press `CTRL <` and type in `format`.
3. Select **Prettier** as your default formatter and enable the checkbox for `Editor: Format On Save`.

# Usage

## Launching the API

To launch the API, follow these steps:
1. Open the terminal **in the project directory**.
2. Type in `npm run dev`, this command will start the server on port 3005.

# Notes

## Files Documentation
## Files Documentation

1. **`.env`**: 
   - This file is for storing environment variables. They can be accessed by importing `dotenv/config` into a file, and then retrieved with `process.env.VARIABLE_NAME`.

2. **`.eslintrc`**: 
   - Used for defining rules that, when broken, throw an error and do not let someone commit their changes. For example, not placing semicolons at the end of the line.

3. **`.gitignore`**: 
   - Used for ignoring unnecessary files that need not be pushed to the repository. For example, `node_modules`.

4. **`prettier.json`**: 
   - Used for defining formatting rules. For example, strings must be single-quoted.

5. **`package.json`**: 
   - Used for handling dependencies that are downloaded with npm and utilities like scripts.

6. **`package-lock.json`**: 
   - Used for `locking` the dependency versions. When installing dependencies, npm will look at the `package-lock.json` file to determine which version should be downloaded (unless the version was changed in the `package.json` file).

7. **`tsconfig.json`**: 
   - Used for defining TypeScript rules. For example, whether the "any" type is required or not.
