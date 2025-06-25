<!-- markdownlint-disable -->
<div align="center">

<img width="128" src="https://github.com/BuildTheEarth/assets/blob/main/images/logos/logo.gif?raw=true" />

# Main Bot

_The main discord bot for the BuildTheEarth Discord server._

![official](https://go.buildtheearth.net/official-shield)
![build](https://github.com/BuildTheEarth/main-bot/actions/workflows/build.yml/badge.svg)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/buildtheearth)
[![donate](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dbuildtheearth%26type%3Dpatrons&style=flat)](https://patreon.com/buildtheearth)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lines](https://sloc.xyz/github/buildtheearth/main-bot)](https://tenor.com/view/programming-crazy-hard-typing-mad-gif-7866344)
[![license: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![nps friendly](https://img.shields.io/badge/nps-friendly-blue.svg?style=flat)](https://www.npmjs.com/package/nps)

</div>
<!-- markdownlint-restore -->

-   [BuildTheEarth](#BuildTheEarth)
-   [Bot](#Bot)
-   [Rewrite](#Rewrite)
-   [Development](#Development)
    -   [Contributors](#Contributors)
    -   [Contributing](#Contributing)
        -   [Setup](#Setup)
        -   [Standards](#Standards)
-   [Changelog](#Changelog)
-   [License](#License)

## BuildTheEarth

Our mission is to fully recreate the entire Earth in Minecraft at a 1:1 scale. One block in Minecraft equates to roughly one meter in the real world, meaning that this project will fully recreate the size of our planet. Anyone is able to join us and contribute to the largest and most expansive build project to ever have been attempted in Minecraft. Every language, nationality, and regional difference is accepted and regarded as our greatest attribute as we continue our journey to unite all of Humanity's greatest achievements into a single Minecraft world.
Join us in this massive project as we recreate the Earth in Minecraft, in 1:1 scale, one block at a time. [**Discord Server**][invite]

## Bot

This bot is used both in the main Build The Earth server and in the staff server. It's filled with features crafted by our projects unique wants and needs. These features, include moderation and management commands, suggestions, and utilities exclusive to our project operations.

This bot is highly customized to the needs of BuildTheEarth, it is for that reason that we advise against using for your own personal use, and running the bot is not supported, many commits are not production ready. Although we would love to provide support if you plan on contributing.

## Rewrite

This project originated as a complete rewrite of our servers old bot, an extension of the **[AlphaConsole bot][]**. As the old code was unmaintainable and riddled with bugs, we decided that a whole rewrite was the best option. This bot has sense had almost two more complete rewrites with the update to [discord.js v13][] and the added support for Discord Slash Command interactions.

## Development

-   The bot is written in **[TypeScript][]**, a statically-typed superset of JavaScript;
-   It uses **[discord.js][]** for interacting with Discord's API;
-   **[TypeORM][]** for object–relational mapping;
-   And it follows object-oriented and modularization principles.
-   For version control, it follows a superset of the **[Conventional Commits][]** specification.
-   **[Docker][]** is used for containerization and deployment.

### Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
              <td align="center" valign="top" width="16.66%"><a href="https://github.com/XboxBedrock"><img src="https://avatars2.githubusercontent.com/u/68715625?v=4?s=100" width="100px;" alt="XboxBedrock"/><br /><sub><b>XboxBedrock</b></sub></a><br /><a href="#projectManagement-XboxBedrock" title="Project Management">📆</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=XboxBedrock" title="Code">💻</a> <a href="#maintenance-XboxBedrock" title="Maintenance">🚧</a> <a href="#infra-XboxBedrock" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#plugin-cAttte" title="Plugin/utility libraries">🔌</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=XboxBedrock" title="Documentation">📖</a> <a href="#ideas-XboxBedrock" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="16.66%"><a href="http://noahhusby.com"><img src="https://avatars3.githubusercontent.com/u/32528627?v=4?s=100" width="100px;" alt="Noah Husby"/><br /><sub><b>Noah Husby</b></sub></a><br /><a href="#projectManagement-noahhusby" title="Project Management">📆</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/cAttte"><img src="https://avatars0.githubusercontent.com/u/26514199?v=4?s=100" width="100px;" alt="cAttte"/><br /><sub><b>cAttte</b></sub></a><br /><a href="#projectManagement-cAttte" title="Project Management">📆</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=cAttte" title="Code">💻</a> <a href="#maintenance-cAttte" title="Maintenance">🚧</a> <a href="#infra-cAttte" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#plugin-cAttte" title="Plugin/utility libraries">🔌</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=cAttte" title="Documentation">📖</a> <a href="#ideas-cAttte" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/arc25275"><img src="https://avatars2.githubusercontent.com/u/55003876?v=4?s=100" width="100px;" alt="arc25275"/><br /><sub><b>arc25275</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=arc25275" title="Code">💻</a> <a href="#maintenance-arc25275" title="Maintenance">🚧</a> <a href="#ideas-arc25275" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/mebrooks01"><img src="https://avatars.githubusercontent.com/u/39204478?v=4?s=100" width="100px;" alt="Malachi Brooks"/><br /><sub><b>Malachi Brooks</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=mebrooks01" title="Code">💻</a> <a href="#maintenance-mebrooks01" title="Maintenance">🚧</a> <a href="https://github.com/BuildTheEarth/main-bot/commits?author=mebrooks01" title="Documentation">📖</a> <a href="#ideas-mebrooks01" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/Mr-Smarty"><img src="https://avatars0.githubusercontent.com/u/69656599?v=4?s=100" width="100px;" alt="Mr-Smarty"/><br /><sub><b>Mr-Smarty</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=Mr-Smarty" title="Code">💻</a> <a href="#ideas-Mr-Smarty" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="16.66%"><a href="http://sky.shiiyu.moe"><img src="https://avatars0.githubusercontent.com/u/43897385?v=4?s=100" width="100px;" alt="metalcupcake5"/><br /><sub><b>metalcupcake5</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=metalcupcake5" title="Code">💻</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/evilpauwse1"><img src="https://avatars3.githubusercontent.com/u/40669563?v=4?s=100" width="100px;" alt="evil"/><br /><sub><b>evil</b></sub></a><br /><a href="https://github.com/BuildTheEarth/main-bot/commits?author=evilpauwse1" title="Code">💻</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/olivephio"><img src="https://avatars1.githubusercontent.com/u/76128526?v=4?s=100" width="100px;" alt="olivephio"/><br /><sub><b>olivephio</b></sub></a><br /><a href="#design-olivephio" title="Design">🎨</a> <a href="#ideas-olivephio" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="16.66%"><a href="https://github.com/vicrobex"><img src="https://avatars1.githubusercontent.com/u/56770982?v=4?s=100" width="100px;" alt="vicrobex"/><br /><sub><b>vicrobex</b></sub></a><br /><a href="#design-vicrobex" title="Design">🎨</a></td>
      <td align="center" valign="top" width="16.66%"><a href="http://axolotlagatsuma.github.io"><img src="https://avatars.githubusercontent.com/u/154734794?v=4?s=100" width="100px;" alt="axolotl_"/><br /><sub><b>axolotl_</b></sub></a><br /><a href="#translation-axolotlagatsuma" title="Translation">🌍</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [All Contributors][] specification. Contributions of any kind are welcome!

### Contributing

If you wish to help by contributing to this project we greatly appreciate it but there are a few things you need to do first. To begin all of your contributions must follow our [Code Of Conduct](code_of_conduct.md) and we ask that you check with a member of the bot development team before working on and proposing any major changes.

-   The bot is written in **[TypeScript][]**, a statically-typed superset of JavaScript;
-   It uses **[discord.js][]** for interacting with Discord's API;
-   **[TypeORM][]** for object–relational mapping;
-   And it follows object-oriented and modularization principles.
-   For version control, it follows a superset of the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification, hwoever this does not to be strictly followed.

#### Setup

To install and configure this bot see our [installation guide](installation.md)

#### Standards

Format the codebase with [Prettier][] using `npm start format`.

Lint the codebase with [ESLint][] using `npm start lint`.

## Changelog

To follow all of the changes made to the bot since its first release, check the [Changelog](changelog.md).

## License

This bot is licensed under the [MIT License](license).

<!-- References -->

[invite]: https://discord.gg/QEkPmBy
[all contributors]: https://allcontributors.org
[alphaconsole bot]: https://github.com/AlphaConsole/AlphaConsoleBot/
[typescript]: https://www.typescriptlang.org/
[discord.js]: http://discord.js.org/
[discord.js v13]: https://github.com/discordjs/discord.js/releases?q=13
[typeorm]: https://typeorm.io/
[docker]: https://www.docker.com/
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/
[pm2]: https://pm2.io/
[docker]: https://docker.com/
[prettier]: https://prettier.io/
[eslint]: https://eslint.org/
