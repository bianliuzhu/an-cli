import type { ComponentsSchemas, ConfigType } from '../types';

import { applyFormattingDefaults } from '../shared/format';
import { ComponentSchemaResolver } from './schema-resolver';
import { ComponentWriter } from './writer';

class Components {
	private parser: ComponentSchemaResolver;
	private writer: ComponentWriter;

	constructor(schemas: ComponentsSchemas, config: ConfigType, options?: { appendMode?: boolean }) {
		const normalizedConfig = applyFormattingDefaults(config);
		this.parser = new ComponentSchemaResolver(schemas, normalizedConfig);
		this.writer = new ComponentWriter(normalizedConfig, options);
	}

	async handle(): Promise<void> {
		const { enumsMap, schemasMap } = this.parser.main();
		await this.writer.writeSchemas(schemasMap);
		await this.writer.writeEnums(enumsMap);
	}
}

export default Components;
