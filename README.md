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

# Documentation

## Runtime environment

The API is setup to run on port 3005, so locally the full address would look like:
**`http://localhost:3005/`**
The API is waiting for the websocket handshake address on the same address, but with the **`ws`** prefix:
**`ws://localhost:3005/`**

Furthermore, the API does not require a database connection, because all the game information is kept **in memory**

## Supported API endpoints

### Endpoint

`POST /create-room`

#### Description

The endpoint creates a new room for the provided room code

#### Method

POST

#### Headers

| Key          | Value            |
| ------------ | ---------------- |
| Content-Type | application/json |

#### Request Body

The request body should be in JSON format and include the following fields:

```json
{
  "roomCode": "string"
}
```

#### Return Value

The server returns a JSON object in case of success

```json
{
  "success": true
}
```

or status code **404** in case the room code was not provided

## Supported WebSocket messages

- Once a client connects and completes the handshake request, the connection is upgraded to use the [TCP] protocol.
- Once the connection is upgraded, the server and client no longer communicate in HTTP requests, but rather, websocket messages. The message body structure is discussed below.
- Each client is assigned an id which is saved in the server memory(the client does not need to constantly send their id)

## Message body structure

The server accepts the messages in JSON format

```json
{
  "type": "MessageTypes",
  "data": "any"
}
```

**MessageTypes** is an enumerator with the starting value of 1. Below are the various **MessageTypes** the server supports
**data** is a property that is discussed below in each **Expected Message data** section

### JOIN_ROOM(1)

#### Description

When a user joins a freshly created room, they should send a **JOIN_ROOM** message, which handles various tasks:

- The client gets assigned an id which is saved in the server memory
- The client gets assigned a role in the room which they are joining(either host or player)
- The client gets saved in the users map which primarily holds the user id and room code for each player
- The client gets assigned to the rooms map which they are joining(provided in the message body)

#### Expected Message data

```json
{
  "roomCode": "string"
}
```

#### Return Value

The server responds by sending a message to all clients, who have joined the room of the provided **roomCode** in the message data

Message body

```json
{
  "type": "MessageTypes.JOIN_ROOM(1)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // the id that was assigned to the client
  "userId": "string",
  // for now it's the same as userId
  "yourName": "string",
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  "otherPlayer": {
    // a flag indicating whether the opposing player is ready
    "ready": "boolean",
    // for now it's the opposing player's id
    "name": "string"
  }
}
```

### RECONNECT(2)

#### Description

When a user wishes to reconnect to an ongoing game, they should send a **RECONNECT** message, which handles various tasks:

- The server checks if a user with the provided id was already deleted from the users map
- If the user was not yet deleted, the server then checks if the room with the user's associated room code was already deleted
- If both the user and room still exist, the new websocket connection is assigned with the provided id and the 60 seconds interval for a user's reconnect gets cleared(so the user does not get deleted after reconnecting)

#### Expected Message data

```json
{
  "userId": "string"
}
```

#### Return Value

The server responds by sending a message only to the reconnecting client

Message body

```json
{
  "type": "MessageTypes.RECONNECT(2)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  // a flag indicating whether it is the user's turn to move
  "yourTurn": "boolean"
}
```

### MOVE(3)

#### Description

When a user wishes to make a mover, they should send a **MOVE** message, which handles various tasks:

- The server first determines which board should be updated by checking which room the messaging player is associated to
- The server updates the room's board based on the type of move a player is making(player or wall placement) and the move's coordinates
- The board's update includes:
  - moving the player
  - placing walls
  - making some squares unavailable for wall placement(since walls cannot be placed on eachother)
- After updating the board based on the move made, the server then runs a pathfinding algorithm to determine legal moves(player's cannot get blocked in) and further updates the board's wall placement availability
- The server also checks if either player has won with this move, in which case the return value is different(check below)

#### Expected Message data

```json
{
  "coordinates": {
    "x": "number",
    "y": "number"
  },
  // 1 - Player
  // 2 - Wall
  "type": "SquareType"
}
```

#### Return Value

The server responds by sending a message to all clients, who are associated with the updated room

##### If the game is ongoing

Message body

```json
{
  "type": "MessageTypes.MOVE(3)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  // a flag indicating whether it is the user's turn to move
  "yourTurn": "boolean"
}
```

##### If either player won with this move

Message body

```json
{
  "type": "MessageTypes.FINISH(6)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  // a flag indicating whether the player is the winner
  "win": "boolean"
}
```

### ROOM_DELETED(4)

#### Description

**ROOM_DELETED** is a message type that the server sends to the client if the client is trying to join a room that was deleted or never existed

#### Return Value

The server sends a message only to the client trying to connect

Message body

```json
{
  "type": "MessageTypes.ROOM_DELETED(4)",
  "data": {}
}
```

### READY(5)

#### Description

When a user wishes to notify the server they are ready to start the game, they should send a **READY** message, which handles various tasks:

- The server first checks if both players in the associated room are ready, if not, the server continues to wait
- If both players in the room are ready, the server randomly chooses which player goes first
- For the player that is chosen to move, the server calculates the available moves

#### Expected Message data

Since the server saves the client id for each connection, there is no need to send any data, as the client id is associated with a room code

```json
{}
```

#### Return Value

The server responds by sending a message to all clients, who are associated with the updated room

Message body

```json
{
  "type": "MessageTypes.READY(5)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  // a flag indicating whether it is the user's turn to move
  "yourTurn": "boolean"
}
```

### FINISH(6)

#### Description

**FINISH** is a message type that the server sends to the client if one of the players wins the game

#### Return Value

The server sends a message to all players associated with the room of the player who won

Message body

```json
{
  "type": "MessageTypes.FINISH(6)",
  "data": "provided below"
}
```

- Message data:

```json
{
  // you can check the Board type in StateHandler/types.ts file
  "board": "Board",
  // a flag indicating whether the player is the winner
  "win": "boolean"
}
```

## WebSocket connection closure handling

- When a client disconnects, the server does not immediately delete all associated information.
- There is a grace period of 60 seconds in which the client can reconnect.
- The grace period is provided by using node.js built in **setTimeout** function.
- If the client reconnects within 60 seconds, the function which is to be executed by **setTimeout** gets canceled and the client gets assigned their old information to the new connection instance.

## Service rundown

### StateHandler

#### Description

The state handler service is responsible for any actions related managing the state. It provides an API for:

- Retrieving/Adding/Deleting users map
- Retrieving/Adding/Deleting rooms map
- Reseting state entirely

#### Dependencies

The state handler has no dependencies

### PlayerMoveCalculator

#### Description

The player move calculator service is solely used for calculating available moves for players. For example:

- Checking for 1 tile jumps
- Checking for 2 tile jumps when enemy player is adjacent
- Checking for diagonal jumps when enemy player is adjacent and there is a wall behind

#### Dependencies

The player move calculator has no dependencies

### BoardService

#### Description

The board service is responsible for any actions related to the board state:

- Updating board after wall placement
- Updating board after player movement
- Checking if the game is finished based on player positions
- Performing path finding to determine whether players have possible routes to the finish
- Updating available wall placements based on path finding results

#### Dependencies

- StateHandler
  Since the board service updates available wall placements, it needs to have access to the board state
- PlayerMoveCalculator
  The player move calculator service is needed when performing path finding algorithms to determine where a player can move

### Websocket

#### Description

The Websocket service is responsible for handling all communication between the server and client:

- Adding users to their associated rooms
- Updating the board when a player makes a move
- Handling disconnect and reconnect
- Notifying users of the opposing players' actions (MOVE, READY...)

#### Dependencies

- BoardService
  The websocket calls the board service every time a board update is needed
- StateHandler
  The state handler is only needed for state retrieval, since updating is handled by the board service
- PlayerMoveCalculator
  The player move calculator is called every time a player moves to determine which moves are available
