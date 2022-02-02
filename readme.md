<div align="center">

<img width="128" src="https://buildtheearth.net/assets/img/site-logo-animated.gif" />

# main bot

_The main bot for the BuildTheEarth Discord servers._

![build](https://github.com/BuildTheEarth/main-bot/actions/workflows/build.yml/badge.svg)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/rCszwHjre5)
[![donate](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dbuildtheearth%26type%3Dpatrons&style=flat)](https://patreon.com/buildtheearth)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lines](https://img.shields.io/tokei/lines/github/buildtheearth/main-bot)](https://tenor.com/view/programming-crazy-hard-typing-mad-gif-7866344)
[![license: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![nps friendly](https://img.shields.io/badge/nps-friendly-blue.svg?style=flat)](https://www.npmjs.com/package/nps)


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
-   [Changelog](#Changelog)
-   [License](#License)

## BuildTheEarth

Join us in this massive project as we recreate the Earth in Minecraft, in 1:1 scale, one block at a time. [**Discord Server**][invite]

## Bot

This bot is used both in the main Build The Earth server and in the staff server. It's filled with features useful for both of these, including moderation and management commands, suggestions, and utilities exclusive to our project operations.

You shouldn't use this bot on your own servers as it's heavily customized for our needs. Running the bot is not supported (unless you're planning on contributing!).

## Rewrite

This project originated as a complete rewrite of our old bot, an extension of the **[AlphaConsole bot][]**. As the old code was unmaintainable and riddled with bugs, we decided that a whole rewrite was the best option.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/cAttte"><img src="https://avatars0.githubusercontent.com/u/26514199?v=4?s=100" width="100px;" alt=""/><br /><sub><b>cAttte</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=cAttte" title="Code">💻</a> <a href="#projectManagement-cAttte" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/vicrobex"><img src="https://avatars1.githubusercontent.com/u/56770982?v=4?s=100" width="100px;" alt=""/><br /><sub><b>vicrobex</b></sub></a><br /><a href="#design-vicrobex" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/arc25275"><img src="https://avatars2.githubusercontent.com/u/55003876?v=4?s=100" width="100px;" alt=""/><br /><sub><b>arc25275</b></sub></a><br /><a href="#ideas-arc25275" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://sky.shiiyu.moe"><img src="https://avatars0.githubusercontent.com/u/43897385?v=4?s=100" width="100px;" alt=""/><br /><sub><b>metalcupcake5</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=metalcupcake5" title="Code">💻</a></td>
    <td align="center"><a href="http://noahhusby.com"><img src="https://avatars3.githubusercontent.com/u/32528627?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Noah Husby</b></sub></a><br /><a href="#projectManagement-noahhusby" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/olivephio"><img src="https://avatars1.githubusercontent.com/u/76128526?v=4?s=100" width="100px;" alt=""/><br /><sub><b>olivephio</b></sub></a><br /><a href="#ideas-olivephio" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-olivephio" title="Design">🎨</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/XboxBedrock"><img src="https://avatars2.githubusercontent.com/u/68715625?v=4?s=100" width="100px;" alt=""/><br /><sub><b>XboxBedrock</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=XboxBedrock" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/evilpauwse1"><img src="https://avatars3.githubusercontent.com/u/40669563?v=4?s=100" width="100px;" alt=""/><br /><sub><b>evil</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=evilpauwse1" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Mr-Smarty"><img src="https://avatars0.githubusercontent.com/u/69656599?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mr-Smarty</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=Mr-Smarty" title="Code">💻</a></td>
    <td align="center"><a href="https://www.youtube.com/channel/UCxiYE392PghWtHEQaTN81oA"><img src="https://avatars.githubusercontent.com/u/53976867?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Fionn</b></sub></a><br /><a href="#infra-fnionn" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=fnionn" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mebrooks01"><img src="https://avatars.githubusercontent.com/u/39204478?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Malachi Brooks</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=mebrooks01" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [All Contributors][] specification. Contributions of any kind are welcome!

## Development

-   The bot is written in **[TypeScript][]**, a statically-typed superset of JavaScript;
-   It uses **[discord.js][]** for interacting with Discord's API;
-   **[TypeORM][]** for object–relational mapping;
-   And it follows object-oriented and modularization principles.
-   For version control, it follows a superset of the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification, hwoever this does not to be strictly followed.

### Cloning

    $ git clone https://github.com/BuildTheEarth/main-bot
    $ cd main-bot

### Dependency setup

    $ npm install

### Configuration

Rename the `config/_config.json5` file to `config/config.json5` and fill in all of the fields:

-   **prefix**: The command prefix.
-   **appeal**: The ban appeal message.
-   **vanity**: The vanity invite code to use when level 3 boosting is reached.
-   **logging**: The Channel IDs where certain actions will be logged.
    -   **modLogs**
    -   **snippetLogs**
-   **guilds**: The guild IDs for the main and staff servers:
    -   **main**
    -   **staff**
-   **suggestions**: The channel IDs for the main and staff servers' suggestions channel:
    -   **main**
    -   **staff**
-   **suggestionOffset**: The numbers from where to start counting suggestions:
    -   **main**
    -   **staff**
-   **reactionRoles**: A map of the reaction roles.
    -   **\<channel ID>**
        -   **\<message ID>**
            -   **\<emoji name>**: A role ID (enclosed in quotes).
-   **images**: Image webserver port and address.
    -   **bindPort**: Port to bind to
    -   **bindAddress**: Address that points to the machine the bot is on
-   **emojis**: Emojis to use for certain occasions. They can be Unicode emojis or custom emoji IDs.
    -   **upvote**
    -   **downvote**
    -   **left**
    -   **right**
    -   **text**: Emojis to be used in text. They can be virtually any string (but preferrably emojis).
        -   **online**
        -   **idle**
        -   **dnd**
        -   **offline**
-   **colors**: The color palette for message embeds.
    -   **success**
    -   **error**
    -   **info**
    -   **suggestions**
        -   **approved**
        -   **denied**
        -   **duplicate**
        -   **forwarded**
        -   **in-progress**
        -   **information**
        -   **invalid**
-   **assets**: URLs pointing to the asset images (from [`/assets/`](assets)). This is required as attachments are **(a)** a burden to work with and **(b)** not editable.
    -   **suggestions**
        -   **approved**
        -   **denied**
        -   **duplicate**
        -   **forwarded**
        -   **in-progress**
        -   **information**
        -   **invalid**
    -   **cases**
        -   **warn**
        -   **mute**
        -   **kick**
        -   **ban**
        -   **unmute**
        -   **unban**
-   **token**: The Discord bot's token.
-   **modpackAuth**: The key for our modpack image API (required for the `modpack` command).
-   **database**: The information/credentials for connecting to the database.
    -   **type**: The database type; `mariadb`, `mysql`, or `sqlite`.
    -   If using MariaDB or MySQL:
        -   **host**: The database host (most likely `localhost`).
        -   **name**: The name of the database.
        -   **user**: The username to connect with.
        -   **pass**: The password of the user to connect with.
    -   If using SQLite (currently broken):
        -   **path**: The path to the database file.

### Scripts

#### build

Compile the TypeScript code into pure JavaScript.

#### watch

Watch for file changes and compile the code.

#### start

Start the bot, from the compiled `dist/` folder.

#### start:production

Start the bot for production with [Docker][], which sets the environment variable `NODE_ENV` to `production` (see [`dockerfile`](Dockerfile)).

#### format

Format the codebase with [Prettier][].

#### lint

Lint the codebase with [ESLint][].

## Changelog

To follow all of the changes made to the bot since its first release, check the [Changelog](changelog.md).

## License

All of our bots are licensed under the [MIT License](license).

<!-- References -->

[invite]: https://discord.gg/QEkPmBy
[all contributors]: https://allcontributors.org
[alphaconsole bot]: https://github.com/AlphaConsole/AlphaConsoleBot/
[typescript]: https://www.typescriptlang.org/
[discord.js]: http://discord.js.org/
[typeorm]: https://typeorm.io/
[docker]: https://docker.com/
[prettier]: https://prettier.io/
[eslint]: https://eslint.org/
