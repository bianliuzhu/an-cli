import type { IContentType } from '../types';

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

// 这里不使用字面量元组类型，而是显式标注为 IContentType 数组，
// 这样在调用 .includes(contentType) 时参数类型可以是 IContentType，
// 避免与更窄的字面量联合类型产生冲突。
export const SUPPORTED_REQUEST_UPLOAD_TYPES: IContentType[] = ['application/octet-stream', 'multipart/form-data'];
