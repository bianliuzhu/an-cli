# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | العربية | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

# نظرة عامة على الوظائف

> an-cli هو أداة سطر أوامر للواجهة الأمامية، يتضمن الأوامر التالية:
>
> - أمر `anl type`: أداة سطر أوامر لتوليد تعريفات أنواع TypeScript ودوال طلبات API تلقائيًا بناءً على Swagger JSON.
> - أمر `anl lint`: توليد تكوينات eslint و stylelint و prettier و commitLint و VSCode ذات الصلة لمشاريع react أو vue
> - أمر `anl git`: توليد تكوين git المحلي، مع وظائف اختيارية: إنشاء فروع gitflow القياسية، موضوعات رسائل git commit، تكوين أوامر git المخصصة

# الميزات الرئيسية

- `anl type`
  - 🚀 تحليل مستندات Swagger JSON تلقائيًا
  - 📦 توليد ملفات تعريف أنواع TypeScript
  - 🔄 توليد دوال طلبات API آمنة من حيث الأنواع
  - 🎯 دعم معاملات المسار ومعاملات الاستعلام وجسم الطلب
  - 📝 توليد تعريفات أنواع التعداد تلقائيًا
  - 🎨 دعم تنسيق الكود
  - ⚡️ دعم تحميل الملفات
  - 🛠 خيارات توليد كود قابلة للتكوين

- `anl lint`
  - 🔍 تكوين أدوات lint المختلفة بنقرة واحدة
  - 🎨 أتمتة تكوين ESLint
  - 🎯 تكوين تنسيق Prettier
  - 🔄 معيار التزام CommitLint
  - 📦 تكوين محرر VSCode

- `anl git`
  - 🔍 تثبيت اختياري لوظائف متعددة
  - 🎨 إنشاء فروع git flow القياسية
  - 🎯 تعيين موضوع تلقائي يتوافق مع معيار CommitLint
  - 🔄 توفير تكوين أوامر git المخصصة ونقطة الدخول
  - 📦 توليد تلقائي بدون تكوين

# التثبيت

> [!NOTE]
> يتطلب التثبيت العام

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# تعليمات الاستخدام

> [!TIP]
>
> 1. إذا كنت تستخدمه لأول مرة ولا تعرف ما هي النتائج، يُنصح بتنفيذ الأمر أولاً، ومراقبة التغييرات التي ستحدث في المشروع، ثم الجمع بين الوثائق، وتعديل التكوين بشكل أكبر، وإعادة التوليد، للوصول في النهاية إلى الشكل المثالي
> 2. أو اتبع الخطوات أدناه خطوة بخطوة، وستحصل على نتائج جيدة
> 3. يرجى تنفيذ أوامر `anl type` و `anl lint` و `anl git` في الدليل الجذر للمشروع

## تعليمات استخدام أمر `anl type`

- عند تنفيذ أمر `anl type` **للمرة الأولى**، سيتم _إنشاء تلقائي_ لملف تكوين باسم `an.config.json` في _الدليل الجذر للمشروع_ (يمكن أيضًا الإنشاء يدويًا) مع قالب تكوين أولي.

- عند تنفيذ أمر `anl type`، سيتم البحث عن ملف تكوين `an.config.json` في الدليل الجذر لمشروع المستخدم، وقراءة معلومات التكوين الخاصة به، وتوليد تغليف axios المقابل، والتكوين، وقائمة الواجهات، وطلبات الواجهة وأنواع TS لمعاملات الطلب والاستجابة لكل واجهة

- عناصر التكوين في ملف التكوين قابلة للتعديل بحرية

- حول ملف تكوين `an.config.json`
  - يجب أن يكون ملف التكوين في الدليل الجذر للمشروع

  - لا يمكن تغيير اسم ملف التكوين

  - للحصول على وصف تفصيلي للمعاملات، يرجى الاطلاع على [شرح ملف التكوين بالتفصيل](#شرح-ملف-التكوين-بالتفصيل)

- قم بتحديث ملف التكوين وفقًا لاحتياجاتك، ثم قم بتنفيذ أمر `anl type` مرة أخرى، وسيتم التوليد وفقًا لمعلومات التكوين المحددة في ملف التكوين، وتوليد معلومات النوع المقابلة

- إذا كانت ملفات 'config.ts' و 'error-message.ts' و 'fetch.ts' و 'api-type.d.ts' موجودة، فلن يتم توليدها مرة أخرى

-

> [!NOTE]
>
> إذا لم تكن واضحًا بشأن هذه التكوينات، يمكنك أولاً تنفيذ أمر anl type لتوليد الأنواع أولاً، ثم فحص دليل المشروع، والجمع بين شرح عناصر التكوين، وتعديل عناصر التكوين، وإعادة التوليد، والتحقق تدريجيًا من وظيفة عناصر المشروع، وإكمال التكوين النهائي

### طريقة الاستخدام

```bash
$ anl type
```

### شرح ملف التكوين بالتفصيل

#### مثال على ملف التكوين

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
	],
	"publicPrefix": "api",
	"erasableSyntaxOnly": false,
	"parameterSeparator": "_"
}
```

#### شرح عناصر التكوين

| عنصر التكوين             | النوع                                 | مطلوب | الوصف                                                                                                                                                                                            |
| ------------------------ | ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| saveTypeFolderPath       | string                                | نعم   | مسار حفظ ملفات تعريف الأنواع                                                                                                                                                                     |
| saveApiListFolderPath    | string                                | نعم   | مسار حفظ ملفات دوال طلبات API                                                                                                                                                                    |
| saveEnumFolderPath       | string                                | نعم   | مسار حفظ ملفات بيانات التعداد                                                                                                                                                                    |
| importEnumPath           | string                                | نعم   | مسار استيراد التعداد (مسار ملف enum المُشار إليه في apps/types/models/\*.ts)                                                                                                                     |
| swaggerJsonUrl           | string                                | نعم   | عنوان مستند Swagger JSON                                                                                                                                                                         |
| requestMethodsImportPath | string                                | نعم   | مسار استيراد طرق الطلب                                                                                                                                                                           |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | نعم   | مستوى بيانات استجابة الواجهة                                                                                                                                                                     |
| formatting               | object                                | لا    | تكوين تنسيق الكود                                                                                                                                                                                |
| headers                  | object                                | لا    | تكوين رأس الطلب                                                                                                                                                                                  |
| includeInterface         | Array<{path: string, method: string}> | لا    | الواجهات المضمنة: ملف قائمة الواجهات المحدد بـ `saveApiListFolderPath` سيتضمن فقط الواجهات في القائمة، متعارض مع حقل `excludeInterface`                                                          |
| excludeInterface         | Array<{path: string, method: string}> | لا    | الواجهات المستبعدة: نص قائمة الواجهات المحدد بـ `saveApiListFolderPath` لن يتضمن الواجهات في هذه القائمة، متعارض مع `includeInterface`                                                           |
| publicPrefix             | string                                | لا    | البادئة العامة على مسار url، على سبيل المثال: api/users، api/users/{id}، api هي البادئة العامة                                                                                                   |
| erasableSyntaxOnly       | boolean                               | نعم   | يتوافق مع خيار `compilerOptions.erasableSyntaxOnly` في tsconfig.json. عندما يكون `true`، يتم إنشاء كائن const بدلاً من enum (صيغة النوع فقط). القيمة الافتراضية: `false`                         |
| parameterSeparator       | string                                | لا    | الفاصل المستخدم بين أجزاء المسار والمعاملات عند إنشاء أسماء API وأسماء الأنواع. على سبيل المثال، `/users/{userId}/posts` مع الفاصل `'_'` ينشئ `users_userId_posts_GET`. القيمة الافتراضية: `'_'` |

#### العلاقة بين عناصر التكوين والملفات المولدة

> يتم إنشاء هيكل الملف بناءً على ملف التكوين، والمُشار إليه بـ **غير مُتحكم به** يعني: يتم إنشاء هذا المجلد وملفاته تلقائيًا ولا تتحكم فيه عناصر التكوين

```
project/
├── apps/
│   ├── types/               		# محدد بواسطة عنصر التكوين saveTypeFolderPath
│   │   ├── models/          				# جميع ملفات تعريف الأنواع (باستثناء أنواع التعداد) غير مُتحكم به
│   │   ├── connectors/      				# تعريفات نوع API (ملفات تعريف الواجهة) غير مُتحكم به
│   └── api/                 		# ملف الطلب: محدد بواسطة عنصر التكوين saveApiListFolderPath
│   │    ├── fetch.ts        				# تنفيذ طريقة الطلب غير مُتحكم به
│   │    └── index.ts        				# قائمة دوال طلبات API غير مُتحكم به
│   │    └── api-type.d.ts      		# ملف تعريف نوع الطلب غير مُتحكم به
│   │    └── config.ts       				# الطلب، اعتراض الاستجابة، تكوين الطلب غير مُتحكم به
│   │    └── error-message.ts   		# رسائل خطأ على مستوى النظام غير مُتحكم به
│   │    ├── fetch.ts        				# تغليف طلب axios، يمكن استبداله بـ fetch غير مُتحكم به
│   └── enums/               		# تعريف نوع بيانات التعداد: محدد بواسطة عنصر التكوين saveEnumFolderPath
```

### أمثلة على الكود المولد

#### تعريف نوع الواجهة

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

#### دالة طلب API

```typescript
import { GET } from './fetch';

/**
 * الحصول على تفاصيل المستخدم
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### شرح الميزات

#### تحليل الأنواع

- يدعم جميع أنواع البيانات في مواصفات OpenAPI 3.0
- معالجة تلقائية للأنواع المتداخلة المعقدة
- يدعم أنواع المصفوفات والكائنات والتعدادات وغيرها
- توليد تعليقات الواجهة تلقائيًا

#### توليد التعداد

تدعم الأداة وضعين لتوليد التعداد، يتم التحكم فيهما من خلال تكوين `erasableSyntaxOnly`:

**وضع التعداد التقليدي** (`erasableSyntaxOnly: false`، القيمة الافتراضية):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**وضع الكائن الثابت** (`erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **لماذا نستخدم وضع الكائن الثابت؟**
> عندما يتم تعيين `compilerOptions.erasableSyntaxOnly` في TypeScript إلى `true`، يمكن للكود استخدام صيغة النوع القابلة للمسح فقط. يولد `enum` التقليدي كود وقت التشغيل، بينما الكائن الثابت هو نوع خالص ويتم مسحه بالكامل بعد الترجمة. هذا يضمن التوافق مع أدوات البناء التي تتطلب صيغة النوع فقط.

**الاستخدام في الأنواع:**

```typescript
// وضع التعداد التقليدي
interface User {
	status: Status; // استخدام التعداد مباشرة كنوع
}

// وضع الكائن الثابت
interface User {
	status: StatusType; // استخدام النوع المولد بلاحقة 'Type'
}
```

#### تحميل الملفات

عند اكتشاف نوع تحميل ملف، سيتم إضافة رأس الطلب المقابل تلقائيًا:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### معالجة الأخطاء

تحتوي الأداة على آلية معالجة أخطاء كاملة:

- مطالبات أخطاء التحليل
- تحذيرات فشل توليد الأنواع
- معالجة استثناءات كتابة الملفات

#### تصفية الواجهات

تدعم الأداة تصفية الواجهات التي تحتاج إلى التوليد من خلال التكوين:

1. تضمين واجهات محددة
   - تحديد الواجهات التي تحتاج إلى التوليد من خلال عنصر التكوين `includeInterface`
   - سيتم توليد الواجهات المحددة في التكوين فقط
   - تنسيق التكوين هو مصفوفة كائنات تحتوي على `path` و `method`

2. استبعاد واجهات محددة
   - تحديد الواجهات التي تحتاج إلى الاستبعاد من خلال عنصر التكوين `excludeInterface`
   - سيتم توليد جميع الواجهات باستثناء تلك المحددة في التكوين
   - تنسيق التكوين هو مصفوفة كائنات تحتوي على `path` و `method`

مثال على التكوين: يتم تكوين هذا في `an.config.json`

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

ملاحظة: لا يمكن استخدام `includeInterface` و `excludeInterface` في نفس الوقت، إذا تم تكوينهما معًا، سيتم إعطاء الأولوية لـ `includeInterface`.

### ملاحظات

1. تأكد من إمكانية الوصول إلى عنوان مستند Swagger JSON
2. يجب أن تكون المسارات في ملف التكوين نسبية إلى الدليل الجذر للمشروع
3. ستستبدل الملفات المولدة الملفات الموجودة بنفس الاسم
4. يُنصح بإضافة الملفات المولدة إلى التحكم في الإصدار

### الأسئلة الشائعة

1. فشل تنسيق ملف النوع المولد
   - تحقق من تثبيت prettier
   - تأكد من وجود ملف تكوين prettier في الدليل الجذر للمشروع

2. خطأ في مسار استيراد دالة الطلب
   - تحقق من صحة تكوين requestMethodsImportPath
   - تأكد من وجود ملف طريقة الطلب

# تعليمات استخدام أمر `anl lint`

> يوفر وظيفة تكوين أدوات lint المختلفة لمشروع الواجهة الأمامية بنقرة واحدة، بما في ذلك:
>
> - فحص كود ESLint
> - تنسيق كود Prettier
> - معيار معلومات الالتزام CommitLint
> - تكوين محرر VSCode

### طريقة الاستخدام

```bash
$ anl lint
```

### تفاصيل التكوين

#### 1. تكوين ESLint

- تثبيت التبعيات المطلوبة تلقائيًا
- يدعم إطارات React/Vue
- توليد `.eslintrc.js` و `.eslintignore` تلقائيًا
- دمج دعم TypeScript

#### 2. تكوين Prettier

- تثبيت التبعيات ذات الصلة بـ prettier تلقائيًا
- توليد ملف تكوين `.prettierrc.js`
- التكوين الافتراضي يتضمن:
  - عرض السطر: 80
  - مسافة بادئة Tab
  - استخدام علامات اقتباس مفردة
  - أقواس دالة السهم
  - معايير نمط الكود الأخرى

#### 3. تكوين CommitLint

- تثبيت التبعيات ذات الصلة بـ commitlint
- تكوين husky git hooks
- توليد `commitlint.config.js`
- توحيد رسالة git commit

#### 4. تكوين VSCode

- إنشاء `.vscode/settings.json`
- تكوين التنسيق التلقائي للمحرر
- تعيين أداة التنسيق الافتراضية
- يدعم تحديث ملفات التكوين الموجودة

# أمر `anl git`

### نظرة عامة على الوظائف

- من خلال الاختيار المتعدد التفاعلي، يمكن تطبيق إمكانيات Git التالية على المستودع الحالي:
  - إنشاء فروع gitflow القياسية
    - نسخ `.gitscripts/` و `.gitconfig` و `.commit-type.cjs` إلى المشروع (فقط عند الغياب)
    - إضافة أذونات التنفيذ لـ `.gitscripts/random-branch.sh`
    - تنفيذ `git config --local include.path ../.gitconfig`
  - تعيين موضوع commit تلقائيًا
    - نسخ `.githooks/commit-msg` وتعيينه كقابل للتنفيذ
    - تنفيذ `git config core.hooksPath .githooks`
  - أوامر git المخصصة
    - إضافة `.gitattributes` إلى المشروع (فقط عند الغياب)

### طريقة الاستخدام

```bash
$ anl git
```

اختر وظيفة واحدة أو أكثر في المطالبة. يتم إنشاء الملفات فقط عند عدم وجودها؛ سيتم الاحتفاظ بالملفات الموجودة.

### ملاحظات

- يرجى التشغيل داخل مستودع Git.
- إذا فشل تنفيذ git config تلقائيًا، يرجى التنفيذ يدويًا:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# الترخيص

ISC License

# دليل المساهمة

نرحب بتقديم [القضايا](https://github.com/bianliuzhu/an-cli/issues) و [طلبات السحب](https://github.com/bianliuzhu/an-cli/pulls)!
