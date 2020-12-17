## [v1.1.1][] <sub><sup><sub>17/12/20</sub></sup></sub>

-   Started deleting erroring commands (and error message themselves) in `#suggestions`.

## [v1.1.0][] <sub><sup><sub>17/12/20</sub></sup></sub>

-   Created `language` command.

## [v1.0.0][] <sub><sup><sub>17/12/20</sub></sup></sub>

This is the initial release for the rewrite of our main bot, which means all _changes_ are not actually changes, but rather _recreations_. Here are some of them:

**General changes:**

-   Entire rewrite of the old bot.
-   The interface has been reworked to be more user friendly, which includes more customized and descriptive success/error messages and more lenient argument parsing.
-   Suggestions now also work in the main server.

**Moderation changes:**

-   `=kick` and `=warn` now show errors when a reason was not provided (instead of silently failing).
-   `=case delete` now requires a reason.
-   Cases older than 3 months are now marked with an emoji (📜) in `=check`.
-   You can now provide images (as links or as attachments) to the punishment commands and they will be shown directly in `=case`.
-   You can now ban people that are not in the server.
-   `=check` now shows if the user is currently muted or banned.
-   You can no longer punish staff members (except muting and warning yourself).
-   `=case`s now show icons depending on the case type.
-   `=case`s now store and show the date at which they were created.
-   Mutes and bans now show when they're going to end (in `=case`).
-   Cases are no longer fully deleted, which means you can still see them if you have their IDs or by using `=check <user> deleted`. They also show extra information about the deletion (deleter, reason, and timestamp).
-   `=slowmode` is now stricter with its allowed input.
-   Moderation logs are now more consistent.

**Development changes:**

-   The bot now uses TypeScript (instead of JavaScript).
-   It now uses a more object-oriented approach to everything. No more WET code!
-   All of the old, inefficient, and irrelevant code is gone. This includes the files which only consisted of commented out code, repeating code for every unit of time in punishment commands, variable names such as `theMsage`, and so on. No more 500-line-long files!
-   The bot now uses TypeORM for object-relational mapping. No more raw SQL queries!
-   Irrelevant tables (such as the empty `Server` and `Config`) are gone.
-   The `Members` table, which stored every member that had ever joined the server—used for storing punishments—is also gone. It was replaced by the new `timed_punishments`.

<!-- References -->

[v1.0.0]: https://github.com/cAttte/cop/releases/tag/v1.0.0
