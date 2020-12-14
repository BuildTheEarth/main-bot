<div align="center">

<img width="128" src="https://buildtheearth.net/assets/img/site-logo-animated.gif" />

# main-bot

_The main bot for the BuildTheEarth Discord server._

</div>

-   [BuildTheEarth](#BuildTheEarth)
-   [Bot](#Bot)
-   [Rewrite](#Rewrite)
-   [Contributors](#Contributors)
-   [Development](#Development)
    -   [Cloning](#Cloning)
    -   [Dependency setup](#Dependency-setup)
    -   [Configuration](#Configuration)
    -   [Scripts](#Scripts)

## BuildTheEarth

Join us in this massive project as we recreate the Earth in Minecraft, in 1:1 scale, one block at a time. [**Discord Server**](https://discord.gg/QEkPmBy)

## Bot

This bot is used both in the main Build The Earth server and in the staff server. It's filled with features useful for both of these, including moderation and management commands, suggestions, and utilities exclusive to our project operations.

You shouldn't use this bot on your own servers as it's heavily customized for our needs. Running the bot is not supported (unless you're planning on contributing!).

## Rewrite

This project originated as a complete rewrite of our old bot, an extension of the **[AlphaConsole bot](https://github.com/AlphaConsole/AlphaConsoleBot/)**.

As the old code was entirely unmaintainable and riddled with bugs, we decided that a whole rewrite was the best option.

## Contributors

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- prettier-ignore-end -->

This project follows the [all-contributors](https://allcontributors.org) specification. Contributions of any kind are welcome!

## Development

-   The bot is written in **[TypeScript](https://www.typescriptlang.org/)**, a statically-typed superset of JavaScript;
-   It uses **[discord.js](http://discord.js.org/)** for interacting with Discord's API;
-   **[TypeORM](https://typeorm.io/)** for object–relational mapping;
-   And it follows object-oriented and modularization principles.
-   For version control, it follows a superset of the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification.

### Cloning

    $ git clone https://github.com/BuildTheEarth/main-bot
    $ cd main-bot

### Dependency setup

    $ npm install

### Configuration

Rename the `_config.yml` file to `config.yml` and fill in all of the fields:

-   **token**: The Discord bot's token.
-   **modpack**: The secret key for our modpack image API (required for the `modpack` command).
-   **prefix**: The command prefix.
-   **logs**: The logs channel ID (enclosed in quotes).
-   **appeal**: The ban appeal message.
-   **guilds**: The guild IDs for the main and staff servers:
    -   **main**
    -   **staff**
-   **suggestions**: The channel IDs for the main and staff servers' suggestions channel:
    -   **main**
    -   **staff**
-   **reactionRoles**: A map of the reaction roles.
    -   **\<channel ID>**
        -   **\<message ID>**
            -   **\<emoji name>**: A role ID (enclosed in quotes).
-   **colors**: The color palette for message embeds.
    -   **success**
    -   **error**
    -   **suggestions**
        -   **approved**
        -   **denied**
        -   **forwarded**
        -   **information**
        -   **in-progress**
-   **assets**: URLs pointing to the asset images (from [`/assets/`](https://github.com/BuildTheEarth/main-bot/tree/main/assets)). This is required as attachments are **(a)** a burden to work with and **(b)** not editable.
    -   **suggestions**
        -   **approved**
        -   **denied**
        -   **forwarded**
        -   **information**
        -   **in-progress**
    -   **cases**
        -   **warn**
        -   **mute**
        -   **kick**
        -   **ban**
        -   **unmute**
        -   **unban**
-   **database**: The information/credentials for connecting to the database.
    -   **host**: The database host (most likely `localhost`).
    -   **name**: The name of the database.
    -   **user**: The username to connect with.
    -   **pass**: The password of the user to connect with.

### Scripts

#### build

Compile the TypeScript code into pure JavaScript.

    $ npm run build

#### watch

Watch for file changes and compile the code.

    $ npm run watch

#### start

Start the bot, from the compiled `dist/` folder.

    $ npm start
