declare module 'nps-utils' {
    export function rimraf(path: string): string;
    export function series(...scripts: Array<string>): string;
}