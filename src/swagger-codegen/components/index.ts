import { ComponentsSchemas, ConfigType } from '../types';
import { applyFormattingDefaults } from '../shared/format';
import { ComponentSchemaParser } from './schema-parser';
import { ComponentWriter } from './writer';

class Components {
	private parser: ComponentSchemaParser;
	private writer: ComponentWriter;

	constructor(schemas: ComponentsSchemas, config: ConfigType, options?: { appendMode?: boolean }) {
		const normalizedConfig = applyFormattingDefaults(config);
		this.parser = new ComponentSchemaParser(schemas, normalizedConfig);
		this.writer = new ComponentWriter(normalizedConfig, options);
	}

	async handle(): Promise<void> {
		const { enumsMap, schemasMap } = await this.parser.parse();
		await this.writer.writeSchemas(schemasMap);
		await this.writer.writeEnums(enumsMap);
	}
}

export default Components;
