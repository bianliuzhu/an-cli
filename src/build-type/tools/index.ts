import fs from 'fs';
import path from 'path';
import { TemplateBaseType, TreeInterface, TreeInterfacePropertiesItem } from '../types';
/** 工作区路径 */
export const WORKSPACE_PATH = 'TS';
/** 默认缩进单位 */
export const BASE_INDENTATION = ' ';
/** 默认缩进宽度 */
export const BASE_INDENTATION_COUNT = 2;
export const templateConfig: TemplateBaseType = {};
/**
 * 动态导入一个 JS 文件
 * @param modulePath 要导入的文件路径
 * @param clearCache 是否清除缓存
 */
export function requireModule(modulePath: string, clearCache = true) {
	try {
		const m = require(modulePath);
		if (clearCache) {
			setTimeout(() => {
				delete require.cache[require.resolve(modulePath)];
			}, 200);
		}
		return m;
	} catch (error: any) {
		throw new Error(error);
	}
}

/**
 * 中划线转驼峰
 * @param {String} str
 * @param {Boolean} c 首字母是否大写
 */
export function toCamel(str: string, c?: boolean, s = '-'): string {
	const REG = new RegExp(`([^${s}])(?:${s}+([^${s}]))`, 'g');
	let strH = str.replace(REG, (_, $1, $2) => $1 + $2.toUpperCase());
	if (c) strH = strH.slice(0, 1).toUpperCase() + strH.slice(1);
	return strH;
}
/** 解析返回结果 */
function parseResponse(data: TreeInterface, indentation = 0): string[] {
	const res = parseProperties('Response', templateConfig?.response?.(data), Object.assign(data), data.response, indentation);
	// res.pop() // 删除多余空行
	return res;
}
/**
 * 生成一组随机 ID
 * @param {String} 格式, x 为随机字符
 */
export function randomId(t = 'id-xxxxx'): string {
	return t.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * 通过路径查找值
 * @param obj
 * @param path
 * @param splitStr
 */
export function getValueByPath<T = any>(obj: any, path: string): T | undefined {
	if (!obj) return undefined;

	let tempObj = obj;
	let pathH = path.replace(/\[(\w+)\]/g, '.$1');
	pathH = pathH.replace(/^[\.|\/]/, '');
	const keyArr = pathH.split(/[\.|\/]/);

	let i = 0;
	for (let len = keyArr.length; i < len - 1; ++i) {
		const key = keyArr[i];
		if (key in tempObj) {
			tempObj = tempObj[key];
		} else {
			break;
		}
	}
	return tempObj ? tempObj[keyArr[i]] : undefined;
}
export function isDef<T>(val: T): val is NonNullable<T> {
	return val !== undefined && val !== null;
}

/**
 * 保存文件
 * @param docStr
 * @param filePath
 */
export async function saveDocument(docStr: string, filePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		try {
			fs.writeFileSync(filePath, docStr, 'utf-8');
			resolve(void 0);
		} catch (error: any) {
			console.error(error, true);
			reject();
		}
	});
}

/**
 * 删除多余空行
 * @param arr
 * @returns
 */
function removeEmptyLines(arr: string[]): string[] {
	if (arr[0] === '') {
		arr.shift();
		if (arr[0] === '') return removeEmptyLines(arr);
	}

	if (arr[arr.length - 1] === '') {
		arr.pop();
		if (arr[arr.length - 1] === '') return removeEmptyLines(arr);
	}

	return arr;
}

/**
 * 处理数据类型
 * @param type
 */
export function handleType(type?: string): string {
	switch (type) {
		case 'integer':
			return 'number';

		case 'file':
			return 'File';

		case 'ref':
			return 'any // BUG: Type Error (ref)';

		case 'object':
			return 'any';

		default:
			return type || 'any';
	}
}

/**
 * 解析头部信息
 * @param data
 */
function parseHeaderInfo(data: TreeInterface): string[] {
	const lines = [
		'/**',
		` * @name     ${data.title || ''} (${data.groupName})`,
		` * @base     ${data.basePath || ''}`,
		` * @path     ${data.path}`,
		` * @method   ${data.method.toUpperCase()}`,
		` * @savePath ${data.savePath}`,
		` * @update   ${new Date().toLocaleString()}`,
		' */',
		'',
	];

	return lines;
	// data.savePath ? ` * @savePath   ${data.savePath}` : undefined,
}

/**
 * 处理缩进层级
 * @param indentation
 */
function handleIndentation(indentation = 0): string {
	return new Array(indentation * BASE_INDENTATION_COUNT + 1).join(BASE_INDENTATION);
}

/**
 * 首字母大写
 * @param {String} str
 */
function toUp(str: string) {
	if (typeof str !== 'string') return '';
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

/**
 * 将枚举类型解析为元组
 * @param name
 * @param enumArr
 * @param indentation
 * @returns
 */
function parseEnumToUnionType(enumArr?: string[]): string {
	if (!enumArr || !enumArr.length) return 'any';
	return `${enumArr.map((v) => `'${v}'`).join(' | ')}`;
}
/**
 * 解析命名空间
 * @param name
 * @param content
 * @param indentation
 */
function parseNameSpace(item: TreeInterface, content: string[], indentation = 0): string[] {
	const indentationSpace = handleIndentation(indentation);

	return [`${indentationSpace}declare namespace ${item.interfaceNamespace} {`, ...content.map((v) => `${indentationSpace}${v}`), `${indentationSpace}}`];
}
/** 解析详细属性 */
function parseProperties(
	interfaceType: 'Params' | 'Response',
	interfaceName: string | undefined,
	data: TreeInterface,
	properties: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string | undefined,
	indentation = 0,
): string[] {
	const indentationSpace = handleIndentation(indentation); // 一级缩进
	const indentationSpace2 = handleIndentation(indentation + 1); // 二级缩进
	const interfaceList = [];
	let content: string[] = [];

	if (!interfaceName) interfaceName = interfaceType;

	if (Array.isArray(properties)) {
		if (properties.length === 1 && properties[0].name === '____body_root_param____') {
			let type = properties[0].type;
			if (type === 'array') {
				type = `${type === 'array' ? handleType(properties[0].items?.type) : type}[]`;
			}

			const description: string = properties[0].description ? `${indentationSpace}/** ${properties[0].description} */\n` : '';

			interfaceList.push(`${description}${indentationSpace}type ${interfaceName} = ${type}`, '');
			return interfaceList;
		}

		content = properties.map((v) => {
			let type = handleType(v.type);
			if (v.item) {
				type = `${interfaceName}${toUp(v.name)}`;
				if (v.type === 'array') type = `${type}Item`;

				interfaceList.push(...parseProperties(interfaceType, type, data, v.item, indentation));
			}

			try {
				// @ts-ignore
				if (!v.item.properties.length) type = 'Record<string, unknown>';
			} catch (error) {
				// console.warn(error)
			}

			if (v.enum) {
				type = parseEnumToUnionType(v.enum);
			} else if (v.items?.enum) {
				type = parseEnumToUnionType(v.items.enum);
			}

			if (v.type === 'array') {
				if ((v.enum || v.items?.enum) && type !== 'any') {
					type = `(${type})`;
				}
				type = `${type === 'array' ? handleType(v.itemsType || 'any') : type}[]`;
			}

			let defaultValDesc = v.default || v.items?.default || '';
			if (typeof defaultValDesc === 'object') {
				defaultValDesc = JSON.stringify(defaultValDesc);
			}
			if (defaultValDesc) {
				defaultValDesc = `[default:${defaultValDesc}]`;
			}

			let description: string = v.description || '';
			if (defaultValDesc) {
				description = description ? `${description} -- ${defaultValDesc}` : defaultValDesc;
			}
			if (description) {
				description = `${indentationSpace2}/** ${description} */\n`;
			}

			let keyValue = `${v.name}${v.required ? ':' : '?:'} ${type}`;

			if (interfaceType === 'Params' && templateConfig.paramsItem) {
				const res = templateConfig.paramsItem(Object.assign({}, v, { type }), data);
				if (res) keyValue = res;
			} else if (interfaceType === 'Response' && templateConfig.responseItem) {
				const res = templateConfig.responseItem(Object.assign({}, v, { type }), data);
				if (res) keyValue = res;
			}

			return `${description}${indentationSpace2}${keyValue}`;
		});
	} else if (typeof properties === 'object') {
		let arr: TreeInterfacePropertiesItem[] = [];

		if (properties.properties && Array.isArray(properties.properties)) arr = properties.properties;
		if (properties.item && Array.isArray(properties.item)) arr = properties.item;
		if (arr.length) {
			interfaceList.push(...parseProperties(interfaceType, `${interfaceName}${toUp(properties.name)}`, data, arr, indentation));
		}
	} else if (typeof properties === 'string') {
		interfaceList.push(`${indentationSpace}type ${interfaceName} = ${handleType(properties)}`, '');
	}

	if (content.length) {
		interfaceList.push(`${indentationSpace}interface ${interfaceName} {`, ...content, `${indentationSpace}}`, '');
	}

	return interfaceList;
}

/** 解析参数接口 */
function parseParams(data: TreeInterface, indentation = 0): string[] {
	const res = parseProperties('Params', templateConfig?.params?.(data), Object.assign(data), data.params, indentation);
	// res.pop() // 删除多余空行
	return res;
}

/**
 * 渲染 Typescript Interface
 * @param data
 * @returns
 */
export function renderToInterface(data: TreeInterface): string {
	// const name = data.operationId.replace('_', '')
	// const name = data.pathName

	const paramsArr = removeEmptyLines(parseParams(data, 1));
	const resArr = removeEmptyLines(parseResponse(data, 1));

	let content = paramsArr;
	if (content.length) content.push('');
	content = content.concat(resArr);

	const lines: string[] = [...parseHeaderInfo(data), ...parseNameSpace(data, content), ''];

	return lines.join('\n');
}
