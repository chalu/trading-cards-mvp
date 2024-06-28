import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import helmet from 'helmet';
import * as jsyaml from 'js-yaml';
import rateLimit from 'express-rate-limit';
import * as OpenApiValidator from 'express-openapi-validator';
import { Config } from './config/index.js'
import { logAs, logMiddleware } from './logger.js';
import { isUlidFormat } from './apispec-formats/index.js';

import {type Server} from 'node:http';
import express, {
	type Request, type Router, type Response,
	type RequestHandler, type ErrorRequestHandler
} from 'express';
import { type CatchAllError, type ServeStatic} from './types.js';

const appName = Config.appName;
const __filename = fileURLToPath(import.meta.url);

export * from './auth.js';
export * from './logger.js';
export * from './drizzle/db.js';
export * from './config/index.js';
export const apiDocumentationRoot = path.join(path.dirname(__filename), 'docs');

const log = logAs('backend-core');
const ymlFilePath = path.resolve(path.dirname(__filename), 'api.yaml');
const ymlAsString = fs.readFileSync(ymlFilePath, 'utf8');
const apiSpecYaml = jsyaml.load(ymlAsString) as string;

const rateLimitHours = Number.parseInt(Config.rateLimit.hours, 10);
const rateLimitWindowMs = rateLimitHours * 60 * 60 * 1000;
const rateLimitMaxRequestWithinWindow = Number.parseInt(Config.rateLimit.maxRequestsPerHour, 10);

type SingleCachePeriod = 'day' | 'hour' | 'week';
type MultipleCachePeriod = `${SingleCachePeriod}s`;
type CacheRangeMap = { [k in SingleCachePeriod | MultipleCachePeriod]: number; };

const cacheMap: CacheRangeMap = {
	day: 1 * 24 * 60 * 60 * 1000,
	days: 1 * 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	weeks: 7 * 24 * 60 * 60 * 1000,
	hour: 1 * 60 * 60 * 1000,
	hours: 1 * 60 * 60 * 1000,
};

type CachePeriodType = keyof CacheRangeMap;

type CachePeriodSpecifier<T extends number> =
	`${T}` extends '0' | `-${string}`
	? never
	: `${T}` extends '1'
		? `${T} ${SingleCachePeriod}`
		: `${T} ${MultipleCachePeriod}`;

export const apiAutoValidator = OpenApiValidator.middleware({
	apiSpec: apiSpecYaml,
	validateRequests: {
		allowUnknownQueryParameters: false,
	},
	validateResponses: {
		onError(error: { message?: string }, _json: any, request: Request) {
			const { method, originalUrl } = request;
			log.warn(`${method.toUpperCase()} ${originalUrl} failed response validation - ${error.message}`);
		},
	},

	formats: {
		ulid: isUlidFormat,
	},

	ignorePaths: /docs/
});

export const apiRateLimiter = rateLimit({
	legacyHeaders: false,
	standardHeaders: true,
	windowMs: rateLimitWindowMs,
	limit: rateLimitMaxRequestWithinWindow,
	message: `You have exceeded the ${rateLimitMaxRequestWithinWindow} requests in ${rateLimitHours} hrs limit!`,
});

export const cacheFor = <T extends number>(spec: CachePeriodSpecifier<T>): string => {
	const [period, periodType] = spec.trim().split(/\s+/);
	if (!period || !periodType || !(periodType in cacheMap)) {
		throw new Error(`Invalid cache specifier used: ${spec}`);
	}

	const factor = parseInt(period || '1', 10);
	const duration: CachePeriodType = periodType as CachePeriodType;
	return `private, max-age=${factor * cacheMap[duration]}`;
};

const terminateGracefully = (server: Server, signal: string) => {
	function terminationHandler() {
		log.info(`[${appName} Server] Received ${signal.toUpperCase()} - terminating gracefully...`);
		server.close(() => {
			console.log(`[${appName} Server] terminated by ${signal.toUpperCase()}`);
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit(0);
		});
	}

	return terminationHandler;
};

export const expressApp = (
	router: Router,
	preRouteMiddlewares: RequestHandler[],
	statics?: ServeStatic[],
) => {
	const app = express();
	app.use(cors());
	app.use(helmet({
		contentSecurityPolicy: {
			reportOnly: true,
			directives: {
				defaultSrc: ['\'self\''],
				fontSrc: ['\'self\'', '\'unsafe-inline\'', '\'https://fonts.googleapis.com\''],
				styleSrc: ['\'self\'', '\'unsafe-inline\'', '\'https://fonts.googleapis.com\''],
				scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'https://cdn.redoc.ly/redoc/v2.1.3/bundles/redoc.standalone.js\''],
				scriptSrcElem: ['\'self\'', '\'unsafe-inline\'', '\'https://cdn.redoc.ly/redoc/v2.1.3/bundles/redoc.standalone.js\''],

			},

		},
	}));
	app.use(express.json());
	app.use(logMiddleware);
	app.disable('x-powered-by');

	for (const mw of preRouteMiddlewares) {
		app.use('/', mw);
	}

	app.use('/', router);

	if (statics) {
		// Serve static files e.g for API documentation
		for (const {route, directory} of statics) {
			app.use(route, express.static(directory));
		}
	}

	const catchAllErrorHandler: ErrorRequestHandler = (
		error_: CatchAllError, _request, response: Response, _next,
	) => {
		const error = error_ || {};
		error.status ??= 500;
		log.error(error);
		response.status(error.status).json({
			message: error_.message,
			errors: error_.errors,
		});
	};

	app.use(catchAllErrorHandler);

	const port = Config.port;
	const server = app.listen(port, () => {
		log.info(`[${appName} Server] Ready : http://localhost:${port}`);
	});

	process.on('SIGINT', terminateGracefully(server, 'SIGINT'));
	process.on('SIGTERM', terminateGracefully(server, 'SIGTERM'));
};

export type BackendService = {
	useRouter: (router: Router) => void;
};

export type Rec = Record<string, unknown>;
export type RequestCanQuery<QueryType = Rec, ParametersType = Rec> = Request<ParametersType, Rec, Rec, QueryType>;
export type RequestHasBody<BodyType, ParametersType = Rec> = Request<ParametersType, Rec, BodyType, Rec>;

type Endpoint = {
	path?: unknown;
	query?: unknown;
	resBody?: unknown;
	reqBody?: unknown;
};

export type Controller<E extends Endpoint> = RequestHandler<E['path'], E['resBody'], E['reqBody'], E['query']>;
