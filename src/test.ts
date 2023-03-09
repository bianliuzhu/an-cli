'use strict';
Object.defineProperty(exports, '__esModule', { value: !0 });
const e = require('fs'),
	s = require('./utils.js');
exports.default = async () => {
	const t = `${process.cwd()}/.vscode/settings.json`;
	if (e.existsSync(t)) {
		const s = e.readFileSync(t, 'utf-8'),
			r = JSON.parse(s);
		(r['editor.formatOnSave'] = !0),
			(r['editor.defaultFormatter'] = 'esbenp.prettier-vscode');
		const c = JSON.stringify(r, null, '\t');
		e.writeFileSync(t, c);
	} else {
		const t = `${process.cwd()}/.vscode`;
		try {
			e.mkdirSync(t),
				e.copyFileSync(
					`${__dirname.replace('lib/src', 'template/settings.json')}`,
					`${t}/settings.json`,
				),
				s.spinner.success('✨ .vscode/settings.json file write success!');
		} catch (e) {
			console.error('vscodeHandle======>', e);
		}
	}
};
