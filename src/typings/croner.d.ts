/* eslint-disable @typescript-eslint/ban-types */
declare module "croner" {
    export default Cron
    /**
     * Cron entrypoint
     *
     * @constructor
     * @param {string|Date} pattern - Input pattern, input date, or input ISO 8601 time string
     * @param {CronOptions|Function} [fnOrOptions1] - Options or function to be run each iteration of pattern
     * @param {CronOptions|Function} [fnOrOptions2] - Options or function to be run each iteration of pattern
     * @returns {Cron}
     */
    export function Cron(
        pattern: string | Date,
        fnOrOptions1?: CronOptions | Function,
        fnOrOptions2?: CronOptions | Function
    ): Cron
    export class Cron {
        /**
         * Cron entrypoint
         *
         * @constructor
         * @param {string|Date} pattern - Input pattern, input date, or input ISO 8601 time string
         * @param {CronOptions|Function} [fnOrOptions1] - Options or function to be run each iteration of pattern
         * @param {CronOptions|Function} [fnOrOptions2] - Options or function to be run each iteration of pattern
         * @returns {Cron}
         */
        constructor(
            pattern: string | Date,
            fnOrOptions1?: CronOptions | Function,
            fnOrOptions2?: CronOptions | Function
        )
        /** @type {CronOptions} */
        options: CronOptions
        once: CronDate
        pattern: CronPattern
        fn: Function
        /**
         * Find next runtime, based on supplied date. Strips milliseconds.
         *
         * @param {CronDate|Date|string} [prev] - Date to start from
         * @returns {Date | null} - Next run time
         */
        next(prev?: CronDate | Date | string): Date | null
        /**
         * Find next n runs, based on supplied date. Strips milliseconds.
         *
         * @param {number} n - Number of runs to enumerate
         * @param {Date|string} [previous] - Date to start from
         * @returns {Date[]} - Next n run times
         */
        enumerate(n: number, previous?: Date | string): Date[]
        /**
         * Is running?
         * @public
         *
         * @returns {boolean} - Running or not
         */
        public running(): boolean
        /**
         * Return previous run time
         * @public
         *
         * @returns {Date | null} - Previous run time
         */
        public previous(): Date | null
        /**
         * Returns number of milliseconds to next run
         * @public
         *
         * @param {CronDate|Date|string} [prev] - Starting date, defaults to now - minimum interval
         * @returns {number | null}
         */
        public msToNext(prev?: CronDate | Date | string): number | null
        /**
         * Stop execution
         * @public
         */
        public stop(): void
        /**
         * Pause executionR
         * @public
         *
         * @returns {boolean} - Wether pause was successful
         */
        public pause(): boolean
        /**
         * Pause execution
         * @public
         *
         * @returns {boolean} - Wether resume was successful
         */
        public resume(): boolean
        /**
         * Schedule a new job
         * @public
         *
         * @param {Function} func - Function to be run each iteration of pattern
         * @returns {Cron}
         */
        public schedule(func: Function): Cron
        currentTimeout: number
        previousrun: CronDate
        private _next
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * Converts date to CronDate
     * @constructor
     *
     * @param {CronDate|date|string} [date] - Input date, if using string representation ISO 8001 (2015-11-24T19:40:00) local timezone is expected
     * @param {string} [timezone] - String representation of target timezone in Europe/Stockholm format.
     */
    export function CronDate(date?: any, timezone?: string): void
    export class CronDate {
        /**
         * Converts date to CronDate
         * @constructor
         *
         * @param {CronDate|date|string} [date] - Input date, if using string representation ISO 8001 (2015-11-24T19:40:00) local timezone is expected
         * @param {string} [timezone] - String representation of target timezone in Europe/Stockholm format.
         */
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        constructor(date?: any, timezone?: string)
        timezone: string
        private fromDate
        milliseconds: any
        seconds: any
        minutes: any
        hours: any
        days: any
        months: any
        years: any
        private fromCronDate
        private apply
        private fromString
        /**
         * Increment to next run time
         * @public
         *
         * @param {string} pattern - The pattern used to increment current state
         * @param {CronOptions} options - Cron options used for incrementing
         * @param {boolean} [hasPreviousRun] - If this run should adhere to minimum interval
         * @return {CronDate|null} - Returns itself for chaining, or null if increment wasnt possible
         */
        public increment(
            pattern: string,
            options: CronOptions,
            hasPreviousRun?: boolean
        ): CronDate | null
        /**
         * Convert current state back to a javascript Date()
         * @public
         *
         * @param {boolean} internal - If this is an internal call
         * @returns {Date}
         */
        public getDate(internal: boolean): Date
        /**
         * Convert current state back to a javascript Date() and return UTC milliseconds
         * @public
         *
         * @param {boolean} internal - If this is an internal call
         * @returns {Date}
         */
        public getTime(internal: boolean): Date
        private parseISOLocal
    }
    /**
     * - Cron scheduler options
     */
    export type CronOptions = {
        /**
         * - Job is paused
         */
        paused?: boolean
        /**
         * - Job is about to be killed or killed
         */
        kill?: boolean
        /**
         * - Continue exection even if a unhandled error is thrown by triggered function
         */
        catch?: boolean
        /**
         * - Maximum nuber of executions
         */
        maxRuns?: number
        /**
         * - Minimum interval between executions, in seconds
         */
        interval?: number
        /**
         * - When to start running
         */
        startAt?: string | Date
        /**
         * - When to stop running
         */
        stopAt?: string | Date
        /**
         * - Time zone in Europe/Stockholm format
         */
        timezone?: string
        /**
         * - Combine day-of-month and day-of-week using OR. Default is AND.
         */
        legacyMode?: boolean
        /**
         * - Used to pass any object to scheduled function
         */
        context?: unknown
    }
    /**
     * @typedef {Object} CronOptions - Cron scheduler options
     * @property {boolean} [paused] - Job is paused
     * @property {boolean} [kill] - Job is about to be killed or killed
     * @property {boolean} [catch] - Continue exection even if a unhandled error is thrown by triggered function
     * @property {number} [maxRuns] - Maximum nuber of executions
     * @property {number} [interval] - Minimum interval between executions, in seconds
     * @property {string | Date} [startAt] - When to start running
     * @property {string | Date} [stopAt] - When to stop running
     * @property {string} [timezone] - Time zone in Europe/Stockholm format
     * @property {boolean} [legacyMode] - Combine day-of-month and day-of-week using OR. Default is AND.
     * @property {?} [context] - Used to pass any object to scheduled function
     */
    /**
     * Internal function that validates options, and sets defaults
     * @private
     *
     * @param {CronOptions} options
     * @returns {CronOptions}
     */
    export function CronOptions(options: CronOptions): CronOptions
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * Name for each part of the cron pattern
     */
    export type CronPatternPart =
        | "seconds"
        | "minutes"
        | "hours"
        | "days"
        | "months"
        | "daysOfWeek"
    /**
     * Offset, 0 or -1.
     *
     * 0 for seconds,minutes and hours as they start on 1.
     * -1 on days and months, as the start on 0
     */
    export type CronIndexOffset = number
    /**
     * Name for each part of the cron pattern
     * @typedef {("seconds" | "minutes" | "hours" | "days" | "months" | "daysOfWeek")} CronPatternPart
     */
    /**
     * Offset, 0 or -1.
     *
     * 0 for seconds,minutes and hours as they start on 1.
     * -1 on days and months, as the start on 0
     *
     * @typedef {Number} CronIndexOffset
     */
    /**
     * Create a CronPattern instance from pattern string ('* * * * * *')
     * @constructor
     * @param {string} pattern - Input pattern
     * @param {string} timezone - Input timezone, used for '?'-substitution
     */
    export function CronPattern(pattern: string, timezone: string): void
    export class CronPattern {
        /**
         * Name for each part of the cron pattern
         * @typedef {("seconds" | "minutes" | "hours" | "days" | "months" | "daysOfWeek")} CronPatternPart
         */
        /**
         * Offset, 0 or -1.
         *
         * 0 for seconds,minutes and hours as they start on 1.
         * -1 on days and months, as the start on 0
         *
         * @typedef {Number} CronIndexOffset
         */
        /**
         * Create a CronPattern instance from pattern string ('* * * * * *')
         * @constructor
         * @param {string} pattern - Input pattern
         * @param {string} timezone - Input timezone, used for '?'-substitution
         */
        constructor(pattern: string, timezone: string)
        pattern: string
        timezone: string
        seconds: any
        minutes: any
        hours: any
        days: any
        months: any
        daysOfWeek: any
        lastDayOfMonth: boolean
        starDayOfMonth: boolean
        starDayOfWeek: boolean
        private parse
        private partToArray
        private throwAtIllegalCharacters
        private handleNumber
        private handleRangeWithStepping
        private handleRange
        private handleStepping
        private replaceAlphaDays
        private replaceAlphaMonths
        private handleNicknames
    }
}
