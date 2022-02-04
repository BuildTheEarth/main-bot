
# Installation

  

This document will walk you though the installation process for both Windows and Linux].

  

## Dependencies

  

You will need to have these installed for proper configuration of the bot. (You only need one of the three database options)

  

-  [git][]

-  [nodejs][]

-  [npm][]

-  [docker][]

- A Database

-  [mariadb][]

-  [mysql][]

-  [sqlite][]

  

## Cloning

  

To clone the bot go to the directory you wish to have the bot nested in. Once there run the following

  

```cmd

$ git clone https://github.com/BuildTheEarth/main-bot && cd main-bot

```

  

## Setup

  

Now that you have cloned the bot you can setup the rest of the bot.

  

### Dependency Installation

  

Now the next step is to download all the node packages that are needed using the following

  

```cmd

$ npm install

```

  

### Configuration

  

Rename the `config/_config.json5` file to `config/config.json5` and fill in all of the fields:

  

-  **prefix**: The command prefix.

-  **appeal**: The ban appeal message.

-  **vanity**: The vanity invite code to use when level 3 boosting is reached.

- **developers**: The list of people who have bot developer bypass.

-  **isDev**: Boolean controlling if to boot in developer mode.

-  **jenkinsEnv**: Don't use this, only for jenkins build testing env.

-  **logging**: The Channel IDs where certain actions will be logged.

	-  **modLogs**

	-  **snippetLogs**

-  **guilds**: The guild IDs for the main and staff servers:

	-  **main**

	-  **staff**

-  **suggestions**: The channel IDs for the main and staff servers' suggestions channel:

	-  **main**

	-  **staff**
	
	- **discussion**: The channel IDs for the main and staff servers' suggestions-discussion channel:
		-  **main**

		-  **staff**

-  **suggestionOffset**: The numbers from where to start counting suggestions:

	-  **main**

		  **staff**

-  **reactionRoles**: A map of the reaction roles.

	-  **\<channel  ID>**

		-  **\<message  ID>**

			-  **\<emoji  name>**: A role ID (enclosed in quotes).

-  **images**: Image webserver port and address.

	-  **bindPort**: Port to bind to

	-  **bindAddress**: Address that points to the machine the bot is on

-  **emojis**: Emojis to use for certain occasions. They can be Unicode emojis or custom emoji IDs.

	-  **upvote**

	-  **downvote**

	-  **left**

	-  **right**

	-  **delete**

	-  **pin**

	-  **text**: Emojis to be used in text. They can be virtually any string (but preferrably emojis).

		-  **online**

		-  **idle**

		-  **dnd**

		-  **offline**

-  **colors**: The color palette for message embeds.

	-  **success**

	-  **error**

	-  **info**

	-  **suggestions**

		-  **approved**

		-  **denied**

		-  **duplicate**

		-  **forwarded**

		-  **in-progress**

		-  **information**

		-  **invalid**

-  **assets**: URLs pointing to the asset images (from [`/assets/`](assets)). This is required as attachments are **(a)** a burden to work with and **(b)** not editable.

	-  **suggestions**

		- **approved**

		-  **denied**

		-  **duplicate**

		-  **forwarded**

		-  **in-progress**

		-  **information**

		-  **invalid**

	-  **cases**

		-  **warn**

		-  **mute**

		-  **kick**

		-  **ban**

		-  **unmute**

		-  **unban**

-  **token**: The Discord bot's token.

-  **modpackAuth**: The key for our modpack image API (required for the `modpack` command).

-  **database**: The information/credentials for connecting to the database.

	-  **type**: The database type; `mariadb`, `mysql`, or `sqlite`.

- If using MariaDB or MySQL:

	-  **host**: The database host (most likely `localhost`).

	-  **name**: The name of the database.

	-  **user**: The username to connect with.

	-  **pass**: The password of the user to connect with.

- If using SQLite (recommended for easier development and testing, however currently broken):

	-  **path**: The path to the database file.

  

### Running the Bot

  

There are multiple ways to run the bot

1. [Docker]
		How we start the bot in production. In order to do this you can do: 
		
		$ npm start docker
2. [TS-node]
		This is well suited for testing environments. In order to do this you can do:
		
		$ npm start test
	
3. Build and Run
		This is well suited for testing how the code runs in a compiled state. In order to do this you can do:
		
		$ npm start build
		$ npm start

  
  

<!-- References -->

  

[git]: https://git-scm.com/

[nodejs]: https://nodejs.org/en/

[npm]: https://www.npmjs.com/

[ts-node]: https://typestrong.org/ts-node/

[docker]: https://www.docker.com/

[mariadb]: https://mariadb.org/

[mysql]: https://www.mysql.com/

[sqlite]: https://www.sqlite.org/index.html