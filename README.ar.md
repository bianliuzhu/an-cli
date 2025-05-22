# an-cli

[English](./README.en.md) | [Español](./README.es.md) | العربية | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

## الوصف

an-cli هي أداة سطر الأوامر للواجهة الأمامية، وتتضمن الأمرين التاليين:

[أمر anl type](#أمر anl type): أداة سطر أوامر تقوم تلقائياً بإنشاء تعريفات أنواع TypeScript ودوال طلبات API استناداً إلى Swagger JSON.

[أمر anl lint](#أمر anl lint): يقوم بإنشاء إعدادات eslint و stylelint و prettier و commitLint و VSCode لمشاريع react أو vue

## المميزات

- `anl type`
  - 🚀 التحليل التلقائي لوثائق Swagger JSON
  - 📦 إنشاء ملفات تعريف أنواع TypeScript
  - 🔄 إنشاء دوال طلبات API آمنة النوع
  - 🎯 دعم معلمات المسار والاستعلام وجسم الطلب
  - 📝 إنشاء تلقائي لتعريفات الأنواع المعدودة
  - 🎨 دعم تنسيق الكود
  - ⚡️ دعم رفع الملفات
  - 🛠 خيارات قابلة للتكوين لإنشاء الكود
- `anl lint`
  - 🔍 تكوين جميع أدوات lint بنقرة واحدة
  - 🎨 تكوين تلقائي لـ ESLint
  - 🎯 تكوين تنسيق Prettier
  - 🔄 معايير الالتزام CommitLint
  - 📦 إعدادات محرر VSCode

## التثبيت

> [!NOTE]
>
> يتطلب التثبيت العالمي

```bash
$ npm install anl -g

$ yarn global add anl
```

## طريقة الاستخدام

1. تنفيذ الأمر

```bash
$ anl type
```

2. إكمال إعدادات المشروع

- عند تنفيذ `anl type` لأول مرة، سيتم إنشاء ملف التكوين `an.config.json` تلقائياً في جذر المشروع (يمكن إنشاؤه يدوياً أيضاً)
- راجع وصف الإعدادات للحصول على تفاصيل المعلمات
- لا يمكن تغيير اسم ملف التكوين

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

3. إنشاء تعريفات أنواع TypeScript ودوال طلبات API، قم بتنفيذ الأمر مرة أخرى

```bash
$ anl type
```

## وصف الإعدادات

| الإعداد                  | النوع                                 | إلزامي | الوصف                            |
| ------------------------ | ------------------------------------- | ------ | -------------------------------- |
| saveTypeFolderPath       | string                                | نعم    | مسار حفظ ملفات تعريف الأنواع     |
| saveApiListFolderPath    | string                                | نعم    | مسار حفظ ملفات دوال API          |
| saveEnumFolderPath       | string                                | نعم    | مسار حفظ ملفات الأنواع المعدودة  |
| importEnumPath           | string                                | نعم    | مسار استيراد الأنواع المعدودة    |
| swaggerJsonUrl           | string                                | نعم    | عنوان وثيقة Swagger JSON         |
| requestMethodsImportPath | string                                | نعم    | مسار استيراد طرق الطلب           |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | نعم    | مستوى بيانات الاستجابة           |
| formatting               | object                                | لا     | إعدادات تنسيق الكود              |
| headers                  | object                                | لا     | إعدادات رؤوس الطلب               |
| includeInterface         | Array<{path: string, method: string}> | لا     | قائمة الواجهات المطلوب تضمينها   |
| excludeInterface         | Array<{path: string, method: string}> | لا     | قائمة الواجهات المطلوب استبعادها |

## تصفية الواجهات

يمكنك استخدام `includeInterface` و `excludeInterface` للتحكم في الواجهات التي سيتم إنشاؤها:

### تضمين الواجهات (includeInterface)

عند تحديد `includeInterface`، سيتم إنشاء فقط الواجهات المطابقة للمسارات والطرق المحددة:

```json
{
	"includeInterface": [
		{ "path": "/api/user", "method": "GET" },
		{ "path": "/api/order", "method": "POST" }
	]
}
```

### استبعاد الواجهات (excludeInterface)

عند تحديد `excludeInterface`، سيتم إنشاء جميع الواجهات باستثناء تلك المطابقة للمسارات والطرق المحددة:

```json
{
	"excludeInterface": [
		{ "path": "/api/admin", "method": "GET" },
		{ "path": "/api/system", "method": "POST" }
	]
}
```

> [!NOTE]
>
> - لا يمكن استخدام `includeInterface` و `excludeInterface` في نفس الوقت
> - إذا تم تحديد `includeInterface`، سيتم تجاهل `excludeInterface`
> - المسارات تدعم المطابقة الجزئية (مثل `/api/user` سيطابق `/api/user/profile`)

## هيكل الملفات المنشأة

- يتم إنشاء هيكل الملفات هذا وفقاً لملف التكوين

project/
├── apps/
│ ├── types/
│ │ ├── models/ # جميع ملفات تعريف الأنواع (باستثناء الأنواع المعدودة)
│ │ ├── connectors/ # تعريفات أنواع API (ملفات تعريف الواجهة)
│ │ └── enums/ # تعريفات الأنواع المعدودة
│ └── api/
│ ├── fetch.ts # تنفيذ طرق الطلب
│ └── index.ts # دوال طلبات API

## أمثلة على الكود المنشأ

### ملف تعريف الأنواع

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
 * الحصول على تفاصيل المستخدم
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## وصف الميزات

### تحليل الأنواع

- دعم جميع أنواع البيانات في مواصفات OpenAPI 3.0
- معالجة تلقائية للأنواع المتداخلة المعقدة
- دعم المصفوفات والكائنات والأنواع المعدودة
- إنشاء تلقائي لتعليقات الواجهة

### رفع الملفات

عند اكتشاف نوع رفع الملفات، سيتم إضافة رؤوس الطلب المناسبة تلقائياً:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### معالجة الأخطاء

تتضمن الأداة آلية شاملة لمعالجة الأخطاء:

- تنبيهات أخطاء التحليل
- تحذيرات فشل إنشاء الأنواع
- معالجة استثناءات كتابة الملفات

## التطوير

```bash
# تثبيت التبعيات
npm install

# وضع التطوير
اضغط F5 للتصحيح

# البناء
npm run build

# الربط المحلي للتصحيح
npm run blink
```

## ملاحظات هامة

1. تأكد من إمكانية الوصول إلى عنوان وثيقة Swagger JSON
2. يجب أن تكون المسارات في ملف التكوين نسبية لجذر المشروع
3. سيتم استبدال الملفات الموجودة بنفس الاسم
4. يُنصح بإضافة الملفات المنشأة إلى نظام التحكم في الإصدار

## الأسئلة الشائعة

1. فشل تنسيق ملفات الأنواع المنشأة

   - تحقق من تثبيت prettier
   - تأكد من وجود ملف تكوين prettier في جذر المشروع

2. خطأ في مسار استيراد دوال الطلب
   - تحقق من صحة إعداد requestMethodsImportPath
   - تأكد من وجود ملف طرق الطلب

## دليل المساهمة

نرحب بتقديم المشكلات وطلبات السحب!

## الترخيص

ISC License

# أمر anl lint

### نظرة عامة على الوظائف

يوفر وظيفة تكوين أدوات lint المختلفة لمشروع الواجهة الأمامية بنقرة واحدة، بما في ذلك:

- فحص الكود ESLint
- تنسيق الكود Prettier
- معايير رسائل الالتزام CommitLint
- إعدادات محرر VSCode

### طريقة الاستخدام

```bash
$ anl lint
```

### تفاصيل التكوين

#### 1. تكوين ESLint

- تثبيت تلقائي للتبعيات المطلوبة
- دعم إطار عمل React/Vue
- إنشاء تلقائي لـ `.eslintrc.js` و `.eslintignore`
- دمج دعم TypeScript

#### 2. تكوين Prettier

- تثبيت تلقائي لتبعيات prettier
- إنشاء ملف تكوين `.prettierrc.js`
- التكوين الافتراضي يشمل:
  - عرض السطر: 80
  - مسافة بادئة Tab
  - استخدام علامات اقتباس فردية
  - أقواس دوال السهم
  - معايير نمط الكود الأخرى

#### 3. تكوين CommitLint

- تثبيت تبعيات commitlint
- تكوين خطاطيف git مع husky
- إنشاء `commitlint.config.js`
- توحيد رسائل git commit

#### 4. تكوين VSCode

- إنشاء `.vscode/settings.json`
- تكوين التنسيق التلقائي للمحرر
- تعيين أداة التنسيق الافتراضية
- دعم تحديث ملفات التكوين الموجودة
