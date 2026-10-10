# an-cli

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
  - 🌐 دعم تكوين خوادم Swagger متعددة
  - 🔧 دعم طرق HTTP مثل OPTIONS و HEAD و SEARCH

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

**تكوين خادم Swagger واحد:**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"swaggerConfig": {
		"url": "https://generator3.swagger.io/openapi2.json",
		"apiListFileName": "index.ts",
		"stripPathPrefix": "/api",
		"requestPathPrefix": "/gateway",
		"dataLevel": "serve",
		"parameterSeparator": "_",
		"headers": {
			"Authorization": "Bearer token"
		},
		"includeInterface": [
			{
				"path": "/api/user",
				"method": "get"
			}
		]
	},
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	}
}
```

**تكوين خوادم Swagger متعددة:**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"parameterSeparator": "_",
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	},
	"swaggerConfig": [
		{
			"url": "https://generator3.swagger.io/openapi.json",
			"apiListFileName": "op.ts",
			"requestPathPrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {},
			"includeInterface": [
				{
					"path": "/generate",
					"method": "post"
				}
			]
		},
		{
			"url": "https://generator3.swagger.io/openapi2.json",
			"apiListFileName": "index.ts",
			"stripPathPrefix": "/api",
			"dataLevel": "data",
			"headers": {}
		}
	]
}
```

#### شرح عناصر التكوين

| عنصر التكوين                                         | النوع                                                                           | مطلوب | الوصف                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| saveTypeFolderPath                                   | string                                                                          | نعم   | مسار حفظ ملفات تعريف الأنواع                                                                                                                                                                                                                                                                                                                                                                                 |
| saveApiListFolderPath                                | string                                                                          | نعم   | مسار حفظ ملفات دوال طلبات API                                                                                                                                                                                                                                                                                                                                                                                |
| saveEnumFolderPath                                   | string                                                                          | نعم   | مسار حفظ ملفات بيانات التعداد                                                                                                                                                                                                                                                                                                                                                                                |
| importEnumPath                                       | string                                                                          | نعم   | مسار استيراد التعداد (مسار ملف enum المُشار إليه في apps/types/models/\*.ts)                                                                                                                                                                                                                                                                                                                                 |
| swaggerJsonUrl                                       | string                                                                          | لا    | عنوان مستند Swagger JSON (تم نقله إلى `swaggerConfig`، محفوظ للتوافق مع التكوين القديم) **سيتم حذف هذا الحقل في الإصدارات التالية**                                                                                                                                                                                                                                                                          |
| swaggerConfig                                        | object \| Array<object>                                                         | لا    | تكوين خادم Swagger. يمكن ملء خادم واحد مباشرة ككائن، أو استخدام مصفوفة لخوادم متعددة. يمكن تكوين `url` و `stripPathPrefix` و `requestPathPrefix` و `apiListFileName` و `headers` و `dataLevel` و `parameterSeparator` و `includeInterface` و `excludeInterface` و `responseModelTransform` لكل خادم<br />يتوافق هذا الحقل مع أمثلة تكوين خادم Swagger الواحد وتكوين خوادم Swagger المتعددة، يرجى التمرير لأعلى للعرض |
| swaggerConfig[].url                                  | string                                                                          | نعم   | عنوان مستند Swagger JSON                                                                                                                                                                                                                                                                                                                                                                                     |
| swaggerConfig[].stripPathPrefix                         | string                                                                          | لا    | البادئة العامة على مسار url، على سبيل المثال: api/users، api/users/{id}، api هي البادئة العامة                                                                                                                                                                                                                                                                                                               |
| swaggerConfig[].requestPathPrefix                         | string                                                                          | لا    | بادئة مسار الطلب (يمكن فهمها كاسم وحدة)، سيتم إضافتها تلقائيًا أمام كل مسار طلب API.<br />على سبيل المثال: عندما `requestPathPrefix: "/forward"`، <br />`/stripPathPrefix/requestPathPrefix/user` سيصبح `/api/forward/user`                                                                                                                                                                                               |
| swaggerConfig[].apiListFileName                      | string                                                                          | لا    | اسم ملف قائمة API، الافتراضي هو `index.ts`. عند استخدام خوادم متعددة، يجب أن يكون اسم الملف لكل خادم فريدًا                                                                                                                                                                                                                                                                                                  |
| swaggerConfig[].headers                              | object                                                                          | لا    | تكوين رأس طلب هذا الخادم                                                                                                                                                                                                                                                                                                                                                                                     |
| swaggerConfig[].dataLevel                            | 'data' \| 'serve' \| 'axios'                                                    | لا    | مستوى بيانات إرجاع واجهة هذا الخادم. إذا لم يتم تعيينه، يتم استخدام تكوين `dataLevel` العام                                                                                                                                                                                                                                                                                                                  |
| swaggerConfig[].parameterSeparator                   | '$' \| '\_'                                                                     | لا    | الفاصل المستخدم عند إنشاء أسماء API وأسماء الأنواع لهذا الخادم. إذا لم يتم تعيينه، يتم استخدام تكوين `parameterSeparator` العام                                                                                                                                                                                                                                                                              |
| swaggerConfig[].includeInterface                     | Array<{path: string, method: string, dataLevel?: 'data' \| 'serve' \| 'axios'}> | لا    | قائمة الواجهات المضمنة في هذا الخادم. يمكن تكوين `dataLevel` لكل واجهة بشكل منفصل بأعلى أولوية. إذا لم يتم تعيينها، يتم استخدام تكوين `includeInterface` العام                                                                                                                                                                                                                                               |
| swaggerConfig[].excludeInterface                     | Array<{path: string, method: string}>                                           | لا    | قائمة الواجهات المستبعدة في هذا الخادم. إذا لم يتم تعيينها، يتم استخدام تكوين `excludeInterface` العام                                                                                                                                                                                                                                                                                                       |
| swaggerConfig[].responseModelTransform               | object                                                                          | لا    | تكوين تحويل نموذج الاستجابة لهذا الخادم. يدعم ثلاثة أوضاع: `unwrap` (استخراج نموذج الاستجابة)، `wrap` (إضافة نموذج الاستجابة)، `replace` (استبدال نموذج الاستجابة). إذا لم يتم تعيينه، يتم استخدام تكوين `responseModelTransform` العام. راجع [تحويل نموذج الاستجابة](#تحويل-نموذج-الاستجابة)                                                                                                                |
| swaggerConfig[].responseModelTransform.type          | `'unwrap'` \| `'wrap'` \| `'replace'`                                           | نعم   | نوع تحويل نموذج الاستجابة. `unwrap`: استخراج حقل البيانات من غلاف الاستجابة؛ `wrap`: إضافة هيكل غلاف موحد للاستجابة الأصلية؛ `replace`: استبدال الاستجابة بنوع مخصص. راجع [السيناريو 1](#السيناريو-1-إضافة-نموذج-استجابة-للواجهات-التي-لا-تحتوي-على-واحد-wrap)، [السيناريو 2](#السيناريو-2-إزالة-نموذج-الاستجابة-الموجود-unwrap)، [السيناريو 3](#السيناريو-3-استبدال-نموذج-الاستجابة-replace)                |
| swaggerConfig[].responseModelTransform.dataField     | string                                                                          | لا    | اسم حقل البيانات لأوضاع `unwrap` و `wrap`، القيمة الافتراضية `"data"`                                                                                                                                                                                                                                                                                                                                        |
| swaggerConfig[].responseModelTransform.wrapperFields | Record<string, string>                                                          | لا    | تعريفات حقل الغلاف لوضع `wrap`، المفتاح هو اسم الحقل، القيمة هي نوع الحقل. مثال: `{"success": "boolean", "code": "number", "message": "string", "data": "T"}`                                                                                                                                                                                                                                                |
| swaggerConfig[].responseModelTransform.wrapperType   | string                                                                          | لا    | سلسلة نوع الاستبدال لوضع `replace`. يمكن أن يكون أي نوع TypeScript، مثل: `"ApiResponse<T>"`                                                                                                                                                                                                                                                                                                                  |
| requestMethodsImportPath                             | string                                                                          | نعم   | مسار استيراد طرق الطلب                                                                                                                                                                                                                                                                                                                                                                                       |
| dataLevel                                            | 'data' \| 'serve' \| 'axios'                                                    | لا    | تكوين مستوى بيانات إرجاع الواجهة العامة، القيمة الافتراضية: `'serve'`. يمكن لكل خادم تكوينه بشكل منفصل للتجاوز                                                                                                                                                                                                                                                                                               |
| responseModelTransform                               | object                                                                          | لا    | تكوين تحويل نموذج الاستجابة العام. يمكن لكل خادم تجاوزه بشكل منفصل. عناصر التكوين نفسها كـ `swaggerConfig[].responseModelTransform`. راجع [تحويل نموذج الاستجابة](#تحويل-نموذج-الاستجابة)                                                                                                                                                                                                                    |
| formatting                                           | object                                                                          | لا    | تكوين تنسيق الكود                                                                                                                                                                                                                                                                                                                                                                                            |
| formatting.indentation                               | string                                                                          | لا    | حرف مسافة بادئة الكود، على سبيل المثال: `"\t"` أو `"  "` (مسافتان)                                                                                                                                                                                                                                                                                                                                           |
| formatting.lineEnding                                | string                                                                          | لا    | حرف سطر جديد، على سبيل المثال: `"\n"` (LF) أو `"\r\n"` (CRLF)                                                                                                                                                                                                                                                                                                                                                |
| headers                                              | object                                                                          | لا    | تكوين رأس الطلب (تم نقله إلى `swaggerConfig`، محفوظ للتوافق مع التكوين القديم)                                                                                                                                                                                                                                                                                                                               |
| includeInterface                                     | Array<{path: string, method: string, dataLevel?: 'data' \| 'serve' \| 'axios'}> | لا    | الواجهات المضمنة عالميًا: ملف قائمة الواجهات المحدد بـ `saveApiListFolderPath` سيتضمن فقط الواجهات في القائمة، متعارض مع حقل `excludeInterface`. يمكن تكوين `dataLevel` لكل واجهة بشكل منفصل. يمكن لكل خادم تكوينه بشكل منفصل للتجاوز                                                                                                                                                                        |
| excludeInterface                                     | Array<{path: string, method: string}>                                           | لا    | الواجهات المستبعدة عالميًا: نص قائمة الواجهات المحدد بـ `saveApiListFolderPath` لن يتضمن الواجهات في هذه القائمة، متعارض مع `includeInterface`. يمكن لكل خادم تكوينه بشكل منفصل للتجاوز                                                                                                                                                                                                                      |
| stripPathPrefix                                         | string                                                                          | لا    | البادئة العامة على مسار url عالميًا (تم نقله إلى `swaggerConfig`، محفوظ للتوافق مع التكوين القديم)                                                                                                                                                                                                                                                                                                           |
| requestPathPrefix                                         | string                                                                          | لا    | بادئة مسار الطلب العامة (يمكن لكل خادم تكوينه بشكل منفصل للتجاوز)                                                                                                                                                                                                                                                                                                                                            |
| apiListFileName                                      | string                                                                          | لا    | اسم ملف قائمة API العامة، الافتراضي هو `index.ts` (تم نقله إلى `swaggerConfig`، محفوظ للتوافق مع التكوين القديم)                                                                                                                                                                                                                                                                                             |
| enmuConfig                                           | object                                                                          | نعم   | كائن تكوين التعداد                                                                                                                                                                                                                                                                                                                                                                                           |
| enmuConfig.erasableSyntaxOnly                        | boolean                                                                         | نعم   | يتوافق مع خيار `compilerOptions.erasableSyntaxOnly` في tsconfig.json. عندما يكون `true`، يتم إنشاء كائن const بدلاً من enum (صيغة النوع فقط). القيمة الافتراضية: `false`                                                                                                                                                                                                                                     |
| enmuConfig.varnames                                  | string                                                                          | لا    | اسم الحقل في مخطط Swagger الذي يحتوي على أسماء عناصر التعداد المخصصة. القيمة الافتراضية: `enum-varnames`.                                                                                                                                                                                                                                                                                                    |
| enmuConfig.comment                                   | string                                                                          | لا    | اسم الحقل في مخطط Swagger الذي يحتوي على أوصاف عناصر التعداد (يُستخدم لإنشاء التعليقات). القيمة الافتراضية: `enum-descriptions`.                                                                                                                                                                                                                                                                             |
| parameterSeparator                                   | '$' \| '\_'                                                                     | لا    | الفاصل المستخدم بين أجزاء المسار والمعاملات عالميًا عند إنشاء أسماء API وأسماء الأنواع. على سبيل المثال، `/users/{userId}/posts` مع الفاصل `'_'` ينشئ `users_userId_posts_GET`. القيمة الافتراضية: `'_'`. يمكن لكل خادم تكوينه بشكل منفصل للتجاوز                                                                                                                                                            |

#### العلاقة بين عناصر التكوين والملفات المولدة

> يتم إنشاء هيكل الملف بناءً على ملف التكوين، والمُشار إليه بـ **غير مُتحكم به** يعني: يتم إنشاء هذا المجلد وملفاته تلقائيًا ولا تتحكم فيه عناصر التكوين

```
project/
├── apps/
│   ├── types/               		# محدد بواسطة عنصر التكوين saveTypeFolderPath
│   │   ├── models/          				# جميع ملفات تعريف الأنواع (باستثناء أنواع التعداد) غير مُتحكم به
│   │   ├── connectors/      				# تعريفات نوع API (ملفات تعريف الواجهة) غير مُتحكم به
│   └── api/                 		# ملف الطلب: محدد بواسطة عنصر التكوين saveApiListFolderPath
│   │    └── index.ts        				# قائمة دوال طلبات API (خادم واحد أو الخادم الأول) غير مُتحكم به
│   │    └── op.ts           				# ملفات قائمة API للخوادم الأخرى عند استخدام خوادم متعددة غير مُتحكم به
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

#### أولوية التكوين

تدعم الأداة التكوين العام والتكوين على مستوى الخادم، وتتبع قواعد الأولوية التالية:

**الأولوية: تكوين مستوى الواجهة > تكوين مستوى الخادم > التكوين العام > القيم الافتراضية**

عناصر التكوين التالية تدعم تجاوز الأولوية متعدد المستويات:

- `dataLevel`: مستوى بيانات إرجاع الواجهة
  - **مستوى الواجهة**: `includeInterface[].dataLevel` - أعلى أولوية
  - **مستوى الخادم**: `swaggerConfig[].dataLevel` - أولوية ثانوية
  - **التكوين العام**: `dataLevel` - الأولوية الأساسية
  - **القيمة الافتراضية**: `'serve'`
- `parameterSeparator`: الفاصل لأسماء API وأسماء الأنواع
- `includeInterface`: قائمة الواجهات المضمنة
- `excludeInterface`: قائمة الواجهات المستبعدة
- `requestPathPrefix`: بادئة مسار الطلب
- `stripPathPrefix`: البادئة العامة لـ URL
- `headers`: تكوين رأس الطلب

**مثال:**

```json
{
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"apiListFileName": "api1.ts"
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts"
		}
	]
}
```

في التكوين أعلاه:

- يستخدم `api1.ts` `dataLevel: "data"` (تكوين مستوى الخادم)
- يستخدم `api2.ts` `dataLevel: "serve"` (التكوين العام)
- يستخدم كلا الخادمين `parameterSeparator: "_"` (التكوين العام)

#### تحليل الأنواع

- يدعم جميع أنواع البيانات في مواصفات OpenAPI 3.0
- معالجة تلقائية للأنواع المتداخلة المعقدة
- يدعم أنواع المصفوفات والكائنات والتعدادات وغيرها
- توليد تعليقات الواجهة تلقائيًا

#### توليد التعداد

تدعم الأداة وضعين لتوليد التعداد، يتم التحكم فيهما من خلال تكوين `enmuConfig.erasableSyntaxOnly`:

**وضع التعداد التقليدي** (`enmuConfig.erasableSyntaxOnly: false`، القيمة الافتراضية):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**وضع الكائن الثابت** (`enmuConfig.erasableSyntaxOnly: true`):

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

#### تكوين مستوى البيانات (dataLevel)

يُستخدم `dataLevel` لتكوين مستوى استخراج البيانات المرتجعة من الواجهة، ويدعم ثلاثة خيارات:

1. **`'serve'` (القيمة الافتراضية)**: استخراج حقل `data` المرتجع من الخادم

   ```typescript
   // إرجاع الخادم: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // إرجاع الدالة: { id: 1, name: 'user' }
   ```

2. **`'data'`**: استخراج حقل `data.data` (مناسب لسيناريوهات data المتداخلة)

   ```typescript
   // إرجاع الخادم: { data: { code: 200, data: { id: 1, name: 'user' } } }
   // إرجاع الدالة: { id: 1, name: 'user' }
   ```

3. **`'axios'`**: إرجاع كائن استجابة axios الكامل
   ```typescript
   // إرجاع الخادم: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // إرجاع الدالة: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**أولوية التكوين:**

يدعم `dataLevel` أولوية تكوين ثلاثية المستويات:

```
مستوى الواجهة > مستوى الخادم > التكوين العام > القيمة الافتراضية
```

**مثال على التكوين:**

```json
{
	"dataLevel": "serve",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"includeInterface": [
				{
					"path": "/api/user/detail",
					"method": "get",
					"dataLevel": "axios"
				},
				{
					"path": "/api/user/list",
					"method": "get"
				}
			]
		}
	]
}
```

في التكوين أعلاه:

- واجهة `/api/user/detail` تستخدم `dataLevel: "axios"` (تكوين مستوى الواجهة، أعلى أولوية)
- واجهة `/api/user/list` تستخدم `dataLevel: "data"` (تكوين مستوى الخادم)
- واجهات الخادم الأخرى تستخدم `dataLevel: "serve"` (التكوين العام)

> **ملاحظة**:
>
> - تكوين `dataLevel` على مستوى الواجهة له أعلى أولوية، مناسب للسيناريوهات التي تحتاج فيها واجهات فردية إلى معالجة خاصة
> - تكوين `dataLevel` على مستوى الخادم سيتجاوز التكوين العام
> - يستخدم القيمة الافتراضية `'serve'` عندما لا يكون مكونًا

#### تحميل الملفات

عند اكتشاف نوع تحميل ملف، سيتم إضافة رأس الطلب المقابل تلقائيًا:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### تنسيق الكود

تدعم الأداة خيارات تنسيق كود مخصصة، يتم التحكم فيها من خلال تكوين `formatting`:

**مثال على التكوين:**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**شرح التكوين:**

- `indentation`: حرف مسافة بادئة الكود
  - `"\t"`: استخدام مسافة بادئة Tab (افتراضي)
  - `"  "`: استخدام مسافة بادئة بمسافتين
  - `"    "`: استخدام مسافة بادئة بأربع مسافات
- `lineEnding`: نوع حرف السطر الجديد
  - `"\n"`: LF (نمط Linux/macOS، موصى به)
  - `"\r\n"`: CRLF (نمط Windows)

**ملاحظة:** إذا تم تكوين Prettier في المشروع، سيتم تنسيق الكود المولد تلقائيًا باستخدام Prettier، وقد يتم تجاوز تكوين `formatting` بواسطة Prettier.

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
   - تنسيق التكوين هو مصفوفة كائنات تحتوي على `path` و `method` و `dataLevel` الاختياري
   - يمكن تكوين `dataLevel` لكل واجهة بشكل منفصل بأعلى أولوية

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
			"method": "get",
			"dataLevel": "data"
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

#### دعم خوادم Swagger متعددة

تدعم الأداة تكوين خوادم Swagger متعددة، ويمكن تكوين كل خادم بشكل مستقل:

- **خادم واحد**: يمكن ملء `swaggerConfig` مباشرة ككائن
- **خوادم متعددة**: استخدم `swaggerConfig` كمصفوفة، ويجب تكوين `apiListFileName` فريد لكل خادم

**كيفية العمل:**

- يتم توليد API للخادم الأول في `apiListFileName` المحدد (الافتراضي هو `index.ts`)
- يتم إلحاق API للخوادم اللاحقة بملفات `apiListFileName` الخاصة بها
- يتم دمج تعريفات الأنواع والتعدادات في مجلد موحد لتجنب التكرار

**تكوين على مستوى الخادم:**

كل خادم يدعم تكوينًا مستقلاً للخيارات التالية، إذا لم يتم تعيينها، يتم استخدام التكوين العام:

- `dataLevel` - مستوى بيانات إرجاع الواجهة
- `parameterSeparator` - الفاصل لأسماء API وأسماء الأنواع
- `includeInterface` - قائمة الواجهات المضمنة
- `excludeInterface` - قائمة الواجهات المستبعدة
- `requestPathPrefix` - بادئة مسار الطلب

#### بادئة المسار (requestPathPrefix)

يُستخدم `requestPathPrefix` لإضافة بادئة تلقائيًا أمام جميع مسارات طلبات API، وهو مفيد بشكل خاص في السيناريوهات التالية:

1. **سيناريو الوكيل العكسي**: عندما يتم توجيه خدمة الخلفية من خلال وكيل عكسي
2. **بوابة API**: إضافة بادئة بوابة موحدة أمام المسار
3. **تكوين بيئات متعددة**: استخدام بادئات مسار مختلفة لبيئات مختلفة

**مثال على الاستخدام:**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api.example.com/swagger.json",
			"requestPathPrefix": "/forward",
			"apiListFileName": "api.ts"
		}
	]
}
```

**التأثير:**

المسار `/api/user/list` المحدد في Swagger سيتم توليده كـ:

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**الفرق مع stripPathPrefix:**

- `stripPathPrefix`: يُستخدم لإزالة البادئة العامة من مسار الواجهة (يؤثر فقط على اسم الدالة المولدة)
- `requestPathPrefix`: يُستخدم لإضافة بادئة أمام مسار الطلب الفعلي (يؤثر على URL الطلب في وقت التشغيل)

**مثال على التكوين:**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"apiListFileName": "api1.ts",
			"stripPathPrefix": "/api/v1",
			"requestPathPrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {
				"Authorization": "Bearer token1"
			},
			"includeInterface": [
				{
					"path": "/api/v1/users",
					"method": "get"
				}
			]
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts",
			"stripPathPrefix": "/api/v2",
			"dataLevel": "data",
			"headers": {
				"Authorization": "Bearer token2"
			}
		}
	]
}
```

**ملاحظات حول الترحيل:**

- لا يزال التكوين القديم (`swaggerJsonUrl` و `stripPathPrefix` و `headers`) متوافقًا
- ستكتشف الأداة تلقائيًا التكوين القديم وتقترح طريقة الترحيل
- يُنصح بالترحيل إلى تكوين `swaggerConfig` الجديد للحصول على مرونة أفضل

#### دعم طرق HTTP

تدعم الأداة طرق HTTP التالية:

- `GET` - الحصول على الموارد
- `POST` - إنشاء الموارد
- `PUT` - تحديث الموارد (استبدال كامل)
- `PATCH` - تحديث الموارد (تحديث جزئي)
- `DELETE` - حذف الموارد
- `OPTIONS` - طلب التحقق المسبق
- `HEAD` - الحصول على رأس الاستجابة
- `SEARCH` - طلب البحث

جميع الطرق تدعم تعريفات أنواع آمنة للمعاملات والاستجابة.

#### تحويل نموذج الاستجابة

تتيح لك ميزة تحويل نموذج الاستجابة تحويل أنواع استجابة Swagger/OpenAPI تلقائيًا عند إنشاء أنواع TypeScript. تدعم ثلاثة أوضاع تحويل:

1. **unwrap (استخراج نموذج الاستجابة)**: استخراج حقل البيانات من غلاف الاستجابة
2. **wrap (إضافة نموذج الاستجابة)**: إضافة هيكل غلاف موحد للاستجابة الأصلية
3. **replace (استبدال نموذج الاستجابة)**: استبدال الاستجابة بنوع مخصص

##### موقع التكوين

أضف تكوين `responseModelTransform` في `swaggerConfig` في ملف `an.config.json`:

```json
{
	"swaggerConfig": [
		{
			"url": "./data/api.json",
			"apiListFileName": "api.ts",
			"responseModelTransform": {
				// عناصر التكوين
			}
		}
	]
}
```

##### السيناريو 1: إضافة نموذج استجابة للواجهات التي لا تحتوي على واحد (wrap)

**حالة الاستخدام**

عندما تُرجع تعريفات Swagger كائنات البيانات مباشرة، لكن استجابات API الفعلية تحتوي على هيكل غلاف موحد.

**مثال على المشكلة**

تعريف Swagger يُرجع بيانات المستخدم مباشرة:

```json
{
	"paths": {
		"/api/user/current": {
			"get": {
				"responses": {
					"200": {
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/UsersEntityDto"
								}
							}
						}
					}
				}
			}
		}
	}
}
```

النوع المولد (بدون نموذج استجابة):

```typescript
declare namespace ApiUserCurrent_GET {
	type Response = import('../models/users-entity-dto').UsersEntityDto;
}
```

استجابة API الفعلية:

```json
{
	"success": true,
	"code": 0,
	"message": "success",
	"data": {
		"uid": "user123",
		"username": "محمد",
		"email": "mohamed@example.com"
	}
}
```

**الحل**

أضف تحويل نموذج استجابة من نوع `wrap` في التكوين:

```json
{
	"swaggerConfig": [
		{
			"url": "./data/df.json",
			"apiListFileName": "df.ts",
			"responseModelTransform": {
				"type": "wrap",
				"dataField": "data",
				"wrapperFields": {
					"success": "boolean",
					"code": "number",
					"message": "string",
					"data": "T"
				}
			}
		}
	]
}
```

**وصف التكوين**

| الحقل           | النوع                    | مطلوب | الوصف                                                        |
| --------------- | ------------------------ | ----- | ------------------------------------------------------------ |
| `type`          | `"wrap"`                 | نعم   | نوع التحويل، ثابت كـ `"wrap"`                                |
| `dataField`     | `string`                 | لا    | اسم الحقل الذي توضع فيه البيانات الأصلية، الافتراضي `"data"` |
| `wrapperFields` | `Record<string, string>` | نعم   | تعريفات حقول الغلاف، المفتاح هو اسم الحقل، القيمة هي نوعه    |

**النوع المحول**

```typescript
declare namespace ApiUserCurrent_GET {
	interface Response {
		success?: boolean;
		code?: number;
		message?: string;
		data?: import('../models/users-entity-dto').UsersEntityDto;
	}
}
```

##### السيناريو 2: إزالة نموذج الاستجابة الموجود (unwrap)

**حالة الاستخدام**

عندما تتضمن تعريفات Swagger غلاف استجابة، لكنك تريد استخدام نوع البيانات الداخلي مباشرة.

**مثال على المشكلة**

تعريف Swagger يتضمن غلاف استجابة `ResultMessageBoolean`:

```json
{
	"paths": {
		"/op/trade/refund_order/createOrder": {
			"post": {
				"responses": {
					"200": {
						"content": {
							"*/*": {
								"schema": {
									"$ref": "#/components/schemas/ResultMessageBoolean"
								}
							}
						}
					}
				}
			}
		}
	},
	"components": {
		"schemas": {
			"ResultMessageBoolean": {
				"type": "object",
				"properties": {
					"success": { "type": "boolean" },
					"msg": { "type": "string" },
					"code": { "type": "integer" },
					"timestamp": { "type": "integer" },
					"data": { "type": "boolean" }
				}
			}
		}
	}
}
```

النوع المولد (مع نموذج استجابة):

```typescript
declare namespace OpTradeRefundOrderCreateorder_POST {
	type Body = import('../models/refund-order-create-dto').RefundOrderCreateDTO;
	type Response = import('../models/result-message-boolean').ResultMessageBoolean;
}
```

النوع المطلوب (حقل البيانات فقط):

```typescript
declare namespace OpTradeRefundOrderCreateorder_POST {
	type Body = import('../models/refund-order-create-dto').RefundOrderCreateDTO;
	type Response = boolean;
}
```

**الحل**

أضف تحويل نموذج استجابة من نوع `unwrap` في التكوين:

```json
{
	"swaggerConfig": [
		{
			"url": "./data/op.json",
			"apiListFileName": "op.ts",
			"responseModelTransform": {
				"type": "unwrap",
				"dataField": "data"
			}
		}
	]
}
```

**وصف التكوين**

| الحقل       | النوع      | مطلوب | الوصف                                   |
| ----------- | ---------- | ----- | --------------------------------------- |
| `type`      | `"unwrap"` | نعم   | نوع التحويل، ثابت كـ `"unwrap"`         |
| `dataField` | `string`   | لا    | اسم الحقل للاستخراج، الافتراضي `"data"` |

##### السيناريو 3: استبدال نموذج الاستجابة (replace)

**حالة الاستخدام**

عندما تريد استبدال نوع الاستجابة الأصلي بالكامل بنوع عام مخصص أو أنواع أخرى.

**الحل**

أضف تحويل نموذج استجابة من نوع `replace` في التكوين:

```json
{
	"swaggerConfig": [
		{
			"url": "./data/sau.json",
			"apiListFileName": "sau.ts",
			"responseModelTransform": {
				"type": "replace",
				"wrapperType": "ApiResponse<T>"
			}
		}
	]
}
```

**وصف التكوين**

| الحقل         | النوع       | مطلوب | الوصف                            |
| ------------- | ----------- | ----- | -------------------------------- |
| `type`        | `"replace"` | نعم   | نوع التحويل، ثابت كـ `"replace"` |
| `wrapperType` | `string`    | نعم   | سلسلة نوع الاستبدال              |

**ملاحظات**

- `wrapperType` يمكن أن يكون أي سلسلة نوع TypeScript
- إذا كنت تستخدم أنواعًا عامة (مثل `ApiResponse<T>`)، تأكد من تعريف النوع في مشروعك
- عادةً ما تحتاج إلى تعريف أنواع مخصصة في `api-type.d.ts`:

```typescript
// apps/api/api-type.d.ts
type ApiResponse<T> = {
	code: number;
	message: string;
	data: T;
	success: boolean;
};
```

##### الأسئلة الشائعة حول تحويل نموذج الاستجابة

**س1: هل يمكن لواجهات مختلفة استخدام تحويلات مختلفة؟**

ج: حاليًا، تكوين التحويل يكون لكل خدمة Swagger. إذا كنت بحاجة إلى تحويلات مختلفة لواجهات مختلفة في نفس ملف Swagger، يمكنك:

1. تقسيم Swagger إلى ملفات متعددة
2. استخدام `includeInterface` و `excludeInterface` لتكوين خدمات Swagger مختلفة لمجموعات واجهات مختلفة

**س2: ماذا لو فشل تحويل unwrap؟**

ج: يتطلب تحويل unwrap:

1. يجب أن يكون نوع الاستجابة من نوع مرجع `$ref` (وليس كائن مضمن)
2. يجب أن يحتوي المخطط المشار إليه على `dataField` المحدد (الافتراضي `data`)
3. إذا فشل التحويل، سيتم الاحتفاظ بالنوع الأصلي دون تغيير، وسيتم تسجيل تحذير

**س3: هل يمكنني تكوين تحويل افتراضي عالميًا؟**

ج: نعم، يمكنك تكوين `responseModelTransform` على المستوى الجذري خارج `swaggerConfig`، وستورثه جميع الخدمات بدون تكوين:

```json
{
	"responseModelTransform": {
		"type": "unwrap",
		"dataField": "data"
	},
	"swaggerConfig": [
		{
			"url": "./data/op.json",
			"apiListFileName": "op.ts"
			// سيستخدم التكوين العام
		},
		{
			"url": "./data/df.json",
			"apiListFileName": "df.ts",
			"responseModelTransform": {
				"type": "wrap",
				"dataField": "data",
				"wrapperFields": {
					"success": "boolean",
					"data": "T"
				}
			}
			// سيتجاوز التكوين العام
		}
	]
}
```

##### أفضل الممارسات

**1. معايير نموذج الاستجابة الموحدة**

إذا كانت واجهات API الخلفية تستخدم تنسيق استجابة موحد، يُنصح بـ:

- استخدام تحويل `wrap` لـ Swagger بدون نماذج استجابة
- استخدام تحويل `unwrap` لـ Swagger مع نماذج استجابة مختلفة
- الحفاظ في النهاية على أنواع استجابة متسقة لجميع واجهات API

**2. الاستخدام مع api-type.d.ts**

قم بتعريف أنواع الاستجابة الموحدة في `apps/api/api-type.d.ts`:

```typescript
type ResponseModel<T> = {
	code: number;
	message: string;
	data: T;
	success: boolean;
};
```

ثم استخدمها بشكل متسق في الكود:

```typescript
export const apiUserCurrent_GET = (params?: IRequestFnParams) => GET<ResponseModel<UsersEntityDto>>(`/api/user/current`, { ...params }, 'serve');
```

**3. الترحيل التدريجي**

إذا كان المشروع يستخدم بالفعل تعريفات أنواع قديمة، يُنصح بـ:

1. أولاً قم بتكوين تحويل نموذج الاستجابة لخدمات Swagger الجديدة
2. قم بترحيل الخدمات القديمة تدريجيًا
3. استخدم أدوات التحكم في الإصدار لضمان إمكانية عكس التغييرات

##### التفاصيل التقنية

**توقيت التحويل**

يحدث تحويل نموذج الاستجابة خلال مرحلة توليد النوع، العملية المحددة:

1. تحليل مستند Swagger/OpenAPI
2. تحليل أنواع الاستجابة
3. تطبيق تكوين `responseModelTransform`
4. توليد ملفات تعريف نوع TypeScript النهائية

**أنواع الاستجابة المدعومة**

- ✅ أنواع المرجع `$ref` (مثل `#/components/schemas/ResultMessageBoolean`)
- ✅ أنواع الكائنات المضمنة (مثل `{ type: 'object', properties: {...} }`)
- ✅ الأنواع الأولية (مثل `string`، `number`، `boolean`)
- ✅ أنواع المصفوفات (مثل `Array<T>`)
- ✅ أنواع الاتحاد (مثل `string | number`)

**السيناريوهات غير المدعومة**

- ❌ تحويل unwrap لأنواع الكائنات المضمنة (لا يمكن استخراج الحقول من المخطط)
- ❌ استخراج الحقول الديناميكي (يجب تحديد `dataField` صراحة)

### ملاحظات

1. تأكد من إمكانية الوصول إلى عنوان مستند Swagger JSON
2. يجب أن تكون المسارات في ملف التكوين نسبية إلى الدليل الجذر للمشروع
3. ستستبدل الملفات المولدة الملفات الموجودة بنفس الاسم (لكن `config.ts` و `error-message.ts` و `fetch.ts` و `api-type.d.ts` لن يتم استبدالها إذا كانت موجودة بالفعل)
4. يُنصح بإضافة الملفات المولدة إلى التحكم في الإصدار
5. عند استخدام خوادم Swagger متعددة، تأكد من أن `apiListFileName` لكل خادم فريد لتجنب استبدال الملفات
6. عند تكوين خوادم متعددة، سيتم دمج تعريفات الأنواع والتعدادات، وقد تحدث تعارضات إذا كانت هناك أنواع بنفس الاسم من خوادم مختلفة
7. تكوين مستوى الخادم (`dataLevel` و `parameterSeparator` و `includeInterface` و `excludeInterface` و `requestPathPrefix` و `responseModelTransform`) سيتجاوز التكوين العام
8. لا يمكن تكوين `includeInterface` و `excludeInterface` في نفس الوقت، إذا تم تكوينهما معًا، سيتم إعطاء الأولوية لـ `includeInterface`
9. عند استخدام `responseModelTransform`، تأكد من صحة التكوين، وإلا قد يتسبب في أخطاء إنشاء النوع
10. يتطلب تحويل `unwrap` أن يكون نوع الاستجابة من نوع مرجع `$ref` ويحتوي على `dataField` المحدد

### الأسئلة الشائعة

1. فشل تنسيق ملف النوع المولد
   - تحقق من تثبيت prettier
   - تأكد من وجود ملف تكوين prettier في الدليل الجذر للمشروع

2. خطأ في مسار استيراد دالة الطلب
   - تحقق من صحة تكوين requestMethodsImportPath
   - تأكد من وجود ملف طريقة الطلب

3. **متى تستخدم `requestPathPrefix`؟**
   - عندما تحتاج واجهة API الخاصة بك إلى الوصول عبر وكيل عكسي أو بوابة
   - على سبيل المثال: المحدد في Swagger هو `/api/user`، لكن الطلب الفعلي يحتاج إلى `/gateway/api/user`
   - ما عليك سوى تعيين `requestPathPrefix: "/gateway"`

4. **ما الفرق بين `stripPathPrefix` و `requestPathPrefix`؟**
   - `stripPathPrefix`: يزيل البادئة من مسار الواجهة، ويؤثر فقط على اسم الدالة المولدة
     - على سبيل المثال: `/api/user/list` بعد إزالة `/api`، يكون اسم الدالة `userListGet`
   - `requestPathPrefix`: يضيف بادئة أمام مسار الطلب، ويؤثر على URL الطلب الفعلي
     - على سبيل المثال: `/api/user/list` بعد إضافة `/forward`، يكون URL الطلب `/forward/api/user/list`

5. **كيفية تكوين `dataLevel` مختلف لخوادم متعددة؟**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://old-api.com/swagger.json",
   			"dataLevel": "axios",
   			"apiListFileName": "old-api.ts"
   		},
   		{
   			"url": "http://new-api.com/swagger.json",
   			"apiListFileName": "new-api.ts"
   		}
   	]
   }
   ```

   - يستخدم `old-api.ts` `dataLevel: "axios"`
   - يستخدم `new-api.ts` `dataLevel: "serve"` العام

6. **كيفية توليد واجهات جزئية فقط؟**
   - استخدم تكوين `includeInterface`:
     ```json
     {
     	"swaggerConfig": [
     		{
     			"url": "http://api.com/swagger.json",
     			"includeInterface": [
     				{ "path": "/api/user", "method": "get" },
     				{ "path": "/api/user/{id}", "method": "post" }
     			]
     		}
     	]
     }
     ```
   - أو استخدم `excludeInterface` لاستبعاد الواجهات غير المطلوبة

7. **ماذا تفعل إذا تم استبدال الملفات المولدة؟**
   - الملفات `config.ts` و `error-message.ts` و `fetch.ts` و `api-type.d.ts` تُنشأ فقط عند عدم وجودها لأول مرة
   - ملفات قائمة API وملفات الأنواع تُعاد توليدها في كل مرة
   - يُنصح بإدراج الملفات المولدة في التحكم في الإصدار لسهولة مراجعة التغييرات

8. **كيفية تكوين `dataLevel` مختلف للواجهات الفردية؟**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://api.com/swagger.json",
   			"apiListFileName": "api.ts",
   			"dataLevel": "data",
   			"includeInterface": [
   				{
   					"path": "/api/user/detail",
   					"method": "get",
   					"dataLevel": "axios"
   				},
   				{
   					"path": "/api/user/list",
   					"method": "get"
   				}
   			]
   		}
   	]
   }
   ```

   - `/api/user/detail` يستخدم `dataLevel: "axios"` على مستوى الواجهة (أعلى أولوية)
   - `/api/user/list` يستخدم `dataLevel: "data"` على مستوى الخادم
   - الواجهات الأخرى تستخدم `dataLevel: "serve"` العام

9. **كيفية استخدام تحويل نموذج الاستجابة؟**
   - راجع قسم [تحويل نموذج الاستجابة](#تحويل-نموذج-الاستجابة)
   - يدعم ثلاثة أوضاع تحويل: `unwrap` (استخراج)، `wrap` (إضافة)، `replace` (استبدال)
   - يمكن التكوين عالميًا أو بشكل فردي لكل خادم

10. **ماذا لو فشل تحويل نموذج الاستجابة؟**
    - تحقق من صحة عناصر التكوين، خاصة حقل `type`
    - وضع `unwrap` يتطلب أن يكون نوع الاستجابة من نوع مرجع `$ref`
    - وضع `wrap` يتطلب تكوين حقل `wrapperFields`
    - وضع `replace` يتطلب تكوين حقل `wrapperType`
    - تحقق من سجلات وحدة التحكم، والتي عادةً ما تُخرج معلومات خطأ مفصلة

11. **هل يمكن لواجهات مختلفة استخدام تحويلات نموذج استجابة مختلفة؟**
    - حاليًا، تكوين التحويل يكون على مستوى خدمة Swagger
    - إذا كنت بحاجة إلى تحويلات مختلفة لواجهات مختلفة في نفس ملف Swagger، يمكنك:
      1. تقسيم Swagger إلى ملفات متعددة
      2. استخدام `includeInterface` و `excludeInterface` لتكوين خدمات Swagger مختلفة لمجموعات واجهات مختلفة

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

بعد تنفيذ الأمر، ستظهر واجهة اختيار متعدد تفاعلية، يمكنك اختيار الأدوات التي تحتاج إلى تثبيتها:

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

استخدم **مفتاح المسافة** للاختيار/إلغاء الاختيار، **مفتاح Enter** للتأكيد.

### تفاصيل التكوين

#### 1. تكوين ESLint

- تثبيت التبعيات المطلوبة تلقائيًا
- يدعم إطارات React/Vue (سيُطلب منك اختيار إطار عمل إذا تم تحديده)
- توليد `.eslintrc.js` و `.eslintignore` تلقائيًا
- دمج دعم TypeScript

#### 2. تكوين Stylelint

- تثبيت التبعيات المتعلقة بـ stylelint تلقائيًا
- يدعم معالجات Less/Sass المسبقة (سيُطلب منك اختيار معالج مسبق إذا تم تحديده)
- توليد ملف تكوين `.stylelintrc.js`
- دمج دعم Prettier

#### 3. تكوين Prettier

- تثبيت التبعيات ذات الصلة بـ prettier تلقائيًا
- توليد ملف تكوين `.prettierrc.js`
- التكوين الافتراضي يتضمن:
  - عرض السطر: 80
  - مسافة بادئة Tab
  - استخدام علامات اقتباس مفردة
  - أقواس دالة السهم
  - معايير نمط الكود الأخرى

#### 4. تكوين CommitLint

- تثبيت التبعيات ذات الصلة بـ commitlint
- تكوين husky git hooks
- توليد `commitlint.config.js`
- توحيد رسالة git commit

#### 5. تكوين VSCode

- إنشاء `.vscode/settings.json`
- تكوين التنسيق التلقائي للمحرر
- تعيين أداة التنسيق الافتراضية
- يدعم تحديث ملفات التكوين الموجودة

### أمثلة الاستخدام

1. **تثبيت ESLint و Prettier فقط**
   - اختر ESLint و Prettier
   - إذا تم اختيار ESLint، سيُطلب منك اختيار إطار عمل (React/Vue)
   - بعد التثبيت، سيحتوي مشروعك على `.eslintrc.js` و `.prettierrc.js`

2. **التكوين الكامل**
   - اختر جميع الخيارات
   - أكمل اختيار إطار العمل والمعالج المسبق
   - سيتم تكوين نظام كامل لمعايير الكود في مشروعك

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
