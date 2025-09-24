# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | العربية | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

## الوصف

an-cli هو أداة سطر أوامر للواجهات الأمامية وتوفر الأوامر التالية:

> `anl type`: أداة CLI تُولّد تلقائيًا تعريفات الأنواع TypeScript ودوال طلبات API اعتمادًا على ملف Swagger/OpenAPI JSON.

> `anl lint`: تُنشئ إعدادات ESLint وStylelint وPrettier وCommitLint وVSCode لمشاريع React أو Vue.

> `anl git`: تُنشئ إعدادات Git محلية تشمل فروع gitflow القياسية وموضوعات رسائل الالتزام وأوامر Git مخصصة.

## الميزات

- `anl type`
  - 🚀 تحليل تلقائي لملفات Swagger JSON
  - 📦 توليد ملفات تعريف الأنواع TypeScript
  - 🔄 توليد دوال طلبات API آمنة الأنواع
  - 🎯 دعم معاملات المسار والاستعلام ومتن الطلب
  - 📝 توليد تلقائي لتعريفات التعدادات
  - 🎨 دعم تنسيق الشيفرة
  - ⚡️ دعم رفع الملفات
  - 🛠 خيارات توليد قابلة للتهيئة

- `anl lint`
  - 🔍 إعداد أدوات الفحص البرمجي بنقرة واحدة
  - 🎨 تهيئة تلقائية لـ ESLint
  - 🎯 إعدادات Prettier
  - 🔄 معايير رسائل الالتزام عبر CommitLint
  - 📦 إعدادات محرر VSCode

## التثبيت

> ملاحظة
>
> يتطلب التثبيت عالميًا

```bash
$ npm install anl -g

$ yarn global add anl
```

## دليل الاستخدام

> تلميح
>
> 1. إن كانت هذه أول مرة، نفّذ الأمر أولًا لمعاينة التغييرات على مشروعك، ثم عدّل الإعدادات بحسب التوثيق وأعد التوليد حتى تصل للشكل المطلوب.
> 2. أو اتبع الخطوات أدناه واحدة تلو الأخرى.

# أمر anl type

## طريقة الاستخدام

1. تنفيذ الأمر

```bash
$ anl type
```

2. شرح ملف الإعداد

- عند أول تشغيل لـ `anl type` سيتم إنشاء ملف إعداد باسم `an.config.json` تلقائيًا في جذر المشروع (يمكن إنشاؤه يدويًا أيضًا).
- عند التشغيل سيبحث عن `an.config.json` في جذر المشروع ويقرأه ليُولّد غلاف Axios والإعدادات وقائمة الواجهات وأنواع الطلب/الاستجابة.
- جميع الحقول قابلة للتعديل بحرية.

3. مثال لملف `an.config.json`

- يجب أن يكون ملف الإعداد في جذر المشروع.
- لا يمكن تغيير اسم الملف.
- تفاصيل المعاملات في قسم «خيارات الإعداد».

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"swaggerJsonUrl": "https://generator3.swagger.io/openapi.json",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"headers": {},
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	]
}
```

3. حدّث الإعداد حسب الحاجة ثم نفّذ `anl type` مرة أخرى لتوليد الشيفرة وفق الإعدادات.

```bash
$ anl type
```

> ملاحظة
>
> إذا لم تكن متأكدًا من الخيارات، نفّذ `anl type` أولًا وعاين المخرجات ثم عدّل الخيارات وأعد التشغيل حتى تصل لما تريد.

## خيارات الإعداد

| الخيار                   | النوع                                 | إلزامي  | الوصف                         |
| ------------------------ | ------------------------------------- | ------- | ----------------------------- | --- | ---------------------- |
| saveTypeFolderPath       | string                                | نعم     | مسار حفظ ملفات تعريف الأنواع  |
| saveApiListFolderPath    | string                                | نعم     | مسار حفظ ملفات دوال طلبات API |
| saveEnumFolderPath       | string                                | نعم     | مسار حفظ ملفات التعدادات      |
| importEnumPath           | string                                | نعم     | مسار الاستيراد للتعدادات      |
| swaggerJsonUrl           | string                                | نعم     | رابط ملف Swagger JSON         |
| requestMethodsImportPath | string                                | نعم     | مسار الاستيراد لطرائق الطلب   |
| dataLevel                | 'data'                                | 'serve' | 'axios'                       | نعم | مستوى بيانات الاستجابة |
| formatting               | object                                | لا      | إعدادات تنسيق الشيفرة         |
| headers                  | object                                | لا      | ترويسات الطلب                 |
| includeInterface         | Array<{path: string, method: string}> | لا      | توليد الواجهات المذكورة فقط   |
| excludeInterface         | Array<{path: string, method: string}> | لا      | استبعاد الواجهات المذكورة     |

## بنية الملفات المولدة

- يتم توليد البنية التالية اعتمادًا على ملف الإعداد.

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # جميع تعريفات الأنواع (عدا التعدادات)
│   │   ├── connectors/      # تعريفات أنواع واجهات API (تعريفات الواجهات)
│   │   └── enums/           # تعريفات التعدادات
│   └── api/
│       ├── fetch.ts         # تنفيذ طرائق الطلب
│       └── index.ts         # دوال طلبات API
```

## أمثلة على الشيفرة المولدة

### تعريفات الأنواع

```typescript
declare namespace UserDetail_GET {
	interface Query {
		userId: string;
	}

	interface Response {
		id: string;
		name: string;
		age: number;
		role: UserRole;
	}
}
```

### دالة طلب API

```typescript
import { GET } from './fetch';

/**
 * جلب تفاصيل المستخدم
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## مزايا إضافية

### تحليل الأنواع

- يدعم جميع أنواع بيانات OpenAPI 3.0
- يتعامل تلقائيًا مع الأنواع المتداخلة المعقدة
- يدعم المصفوفات والكائنات والتعدادات وغيرها
- يُولّد تعليقات الواجهات تلقائيًا

### رفع الملفات

عند اكتشاف رفع ملفات، تُضاف الترويسات المناسبة تلقائيًا:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### معالجة الأخطاء

يوفر الأداة معالجة قوية للأخطاء:

- رسائل أخطاء التحليل
- تحذيرات عند فشل توليد الأنواع
- التعامل مع استثناءات كتابة الملفات

### ترشيح الواجهات

يمكن التحكم في الواجهات المولدة عبر الإعدادات:

1. تضمين واجهات محددة
   - استخدم `includeInterface` لتحديد الواجهات المراد توليدها
   - سيتم توليد المدرجة فقط
   - الصيغة: مصفوفة كائنات تحتوي `path` و`method`

2. استبعاد واجهات محددة
   - استخدم `excludeInterface` لتحديد الواجهات المستبعدة
   - سيتم توليد بقية الواجهات
   - الصيغة: مصفوفة كائنات تحتوي `path` و`method`

مثال:

```json
{
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	]
}
```

ملاحظة: لا يمكن استخدام `includeInterface` و`excludeInterface` معًا. عند وجودهما، تكون أولوية `includeInterface`.

## التطوير

```bash
# تثبيت الاعتمادات
npm install

# وضع التطوير
اضغط F5 لبدء التصحيح

# البناء
npm run build

# ربط محلي للتصحيح
npm run blink
```

## ملاحظات

1. تأكد من إمكانية الوصول إلى رابط Swagger JSON
2. المسارات في ملف الإعداد نسبية إلى جذر المشروع
3. سيتم استبدال الملفات المولدة للملفات الموجودة بنفس الاسم
4. يُنصح بإضافة الملفات المولدة إلى نظام التحكم بالإصدارات

## الأسئلة الشائعة

1. فشل تنسيق ملفات الأنواع المولدة
   - تحقق من تثبيت Prettier
   - تأكد من وجود ملف إعداد Prettier في الجذر

2. مسار الاستيراد في دوال الطلب غير صحيح
   - تحقق من صحة `requestMethodsImportPath`
   - تأكد من وجود ملف طرائق الطلب

# أمر anl lint

### نظرة عامة

إعداد سريع لأدوات الفحص البرمجي للواجهات الأمامية، بما في ذلك:

- ESLint لفحص الشيفرة
- Prettier لتنسيق الشيفرة
- CommitLint لمعايير رسائل الالتزام
- إعدادات محرر VSCode

### الاستخدام

```bash
$ anl lint
```

### تفاصيل الإعداد

#### 1. ESLint

- تثبيت الاعتمادات المطلوبة تلقائيًا
- دعم React/Vue
- توليد `.eslintrc.js` و `.eslintignore`
- دمج دعم TypeScript

#### 2. Prettier

- تثبيت اعتمادات Prettier تلقائيًا
- توليد `.prettierrc.js`
- الإعدادات الافتراضية:
  - عرض السطر: 80
  - استخدام Tab
  - علامات اقتباس أحادية
  - أقواس الدوال السهمية
  - قواعد تنسيق أخرى

#### 3. CommitLint

- تثبيت اعتمادات CommitLint
- تهيئة git hooks عبر Husky
- توليد `commitlint.config.js`
- توحيد رسائل الالتزام

#### 4. VSCode

- إنشاء `.vscode/settings.json`
- تفعيل التنسيق التلقائي عند الحفظ
- ضبط المُنسّق الافتراضي
- دعم تحديث الإعدادات الموجودة

# أمر anl git

### نظرة عامة

تطبيق قدرات Git التالية عبر اختيار متعدد تفاعلي:

- إنشاء فروع gitflow القياسية
  - نسخ `.gitscripts/` و`.gitconfig` و`.commit-type.js` إلى المشروع (إن لم تكن موجودة)
  - إعطاء صلاحية التنفيذ لـ `.gitscripts/random-branch.sh`
  - تنفيذ `git config --local include.path ../.gitconfig`
- ضبط موضوع رسالة الالتزام تلقائيًا
  - نسخ `.githooks/commit-msg` وضبطه كقابل للتنفيذ
  - تنفيذ `git config core.hooksPath .githooks`
- أوامر Git مخصصة
  - إضافة `.gitattributes` إلى المشروع (إن لم يكن موجودًا)

### الاستخدام

```bash
$ anl git
```

اختر وظيفة أو أكثر من القائمة. لن تُنشأ الملفات إلا عند عدم وجودها؛ وتحافظ الأداة على الملفات الموجودة.

### ملاحظات

- يُرجى التشغيل داخل مستودع Git.
- إذا فشلت أوامر الضبط التلقائي، نفّذ يدويًا:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# الترخيص

ISC License

# المساهمة

مرحبٌ بـ Issues و Pull Requests: https://github.com/bianliuzhu/an-cli
