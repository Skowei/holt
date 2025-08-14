import { Context } from "elysia";
type ExtractFn = (context: Pick<Context, "request" | "headers" | "body" | "path" | "set">) => string;
export interface HoltConfig {
    format: string;
    colorful: boolean;
}
export interface HeaderMatchPair {
    rawMatch: string;
    headerKey: string;
}
export interface CustomToken {
    token: string;
    extractFn: ExtractFn;
}
export declare class HoltLogger {
    private static readonly DEFAULT_FORMAT;
    private config;
    private tokens;
    constructor(partialConfig?: Partial<HoltConfig>);
    getLogger(): any;
    token(token: string, extractFn: ExtractFn): HoltLogger;
    private static tokenize;
    private static configFromPartial;
    private static extractHeaderKeysFromFormat;
    private static getColorByConfig;
}
export {};
