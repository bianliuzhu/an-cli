export const SUPPORTED_REQUEST_TYPES_ALL = [
	'application/json',
	'text/json',
	'text/plain',
	'application/x-www-form-urlencoded',
	'application/xml',
	'text/xml',
	'*/*',
	'application/octet-stream',
	'multipart/form-data',
] as const;

export const SUPPORTED_REQUEST_UPLOAD_TYPES = ['application/octet-stream', 'multipart/form-data'] as const;
