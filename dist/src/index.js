import chalk from "chalk";
import { Elysia } from "elysia";
import { StatusMap } from "./types";
export class HoltLogger {
    static DEFAULT_FORMAT = ":date | :method :path - :status (:request-duration ms)";
    config;
    tokens = [];
    constructor(partialConfig = {}) {
        this.config = HoltLogger.configFromPartial(partialConfig);
    }
    getLogger() {
        return new Elysia({ name: "@tlscipher/holt" })
            .derive({ as: 'global' }, async () => {
            return {
                _holtRequestStartTime: Date.now(),
            };
        })
            .onAfterResponse({ as: 'global' }, ({ request, set, path, headers, body, _holtRequestStartTime }) => {
            let message = this.config.format
                .replaceAll(":date", new Date().toISOString())
                .replaceAll(":method", request.method)
                .replaceAll(":path", path)
                .replaceAll(":status", set.status ? set.status.toString() : "<unknown status>")
                .replaceAll(":request-duration", `${Date.now() - _holtRequestStartTime}`);
            for (const token of this.tokens) {
                message = message.replaceAll(HoltLogger.tokenize(token.token), token.extractFn({
                    request,
                    headers,
                    set,
                    path,
                    body,
                }));
            }
            for (const headerPair of HoltLogger.extractHeaderKeysFromFormat(this.config.format)) {
                message = message.replaceAll(headerPair.rawMatch, request.headers.get(headerPair.headerKey) ?? "-");
            }
            if (!this.config.colorful || !set.status) {
                console.log(message);
            }
            else {
                const colorFn = HoltLogger.getColorByConfig(set.status);
                console.log(colorFn(message));
            }
        });
    }
    token(token, extractFn) {
        this.tokens.push({
            token,
            extractFn,
        });
        return this;
    }
    static tokenize(token) {
        return `:${token}`;
    }
    static configFromPartial(partialConfig) {
        const colorful = partialConfig.colorful === undefined ? true : false;
        const format = partialConfig.format === undefined
            ? HoltLogger.DEFAULT_FORMAT
            : partialConfig.format;
        return {
            format,
            colorful,
        };
    }
    static extractHeaderKeysFromFormat(format) {
        const regex = /:header\[(.*?)\]/g;
        const matches = format.match(regex);
        return matches
            ? matches.map((match) => {
                return {
                    rawMatch: match,
                    headerKey: match.match(/:header\[(.*?)\]/)[1],
                };
            })
            : [];
    }
    static getColorByConfig(status) {
        const intStatus = typeof status === "number" ? status : StatusMap[status];
        switch (true) {
            case intStatus >= 500:
                return chalk.red;
            case intStatus >= 400:
                return chalk.yellow;
            case intStatus >= 300:
                return chalk.cyan;
            case intStatus >= 200:
                return chalk.green;
            default:
                return chalk.white;
        }
    }
}
