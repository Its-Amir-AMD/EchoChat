# راهنمای استقرار و استفاده از بک‌اند PHP پیام‌رسان EchoChat

این دایرکتوری شامل پیاده‌سازی کامل و ماژولار بک‌اند اختصاصی پیام‌رسان **EchoChat** با زبان **PHP** و پایگاه‌داده (SQLite / MySQL) است.

---

## ۱. ساختار فایل‌ها

```
php_backend/
├── config/
│   └── db.php              # اتصال PDO به پایگاه داده و مهاجرت خودکار جداول
├── api/
│   ├── auth.php            # ثبت‌نام، ورود، ویرایش پروفایل و فهرست کاربران
│   ├── conversations.php   # مدیریت گفتگوها، ساخت گروه‌ها و کانال‌ها
│   ├── messages.php        # ارسال پیام، ویرایش، حذف، واکنش‌ها (Reactions) و نظرسنجی
│   ├── stories.php         # استوری‌های ۲۴ ساعته و لایک‌ها
│   └── ai_assistant.php    # پروکسی و هوش مصنوعی دستیار اکوچت با فال‌بک بومی
├── index.php               # روتر یکپارچه
├── schema.sql              # ساختار SQL پایگاه داده
└── echochat.sqlite         # فایل پایگاه داده خودکار (در صورت استفاده از SQLite)
```

---

## ۲. روش راه‌اندازی سریع در سرور PHP / هاست (cPanel / XAMPP / Nginx / Apache)

### روش اول: اجرای با سرور داخلی PHP (Local Development)
برای اجرای سریع این بک‌اند در محیط لوکال با PHP:
```bash
cd php_backend
php -S 0.0.0.0:8000 index.php
```
سپس آدرس API به صورت زیر در دسترس خواهد بود:
`http://localhost:8000/api/...`

### روش دوم: آپلود روی هاست اشتراکی (cPanel / DirectAdmin) یا هاست لینوکسی
1. محتویات پوشه `php_backend` را در پوشه `public_html` یا یک زیرشاخه (مثلاً `public_html/api`) هاست خود آپلود کنید.
2. به طور پیش‌فرض، بک‌اند از **SQLite** استفاده می‌کند که نیازی به ساخت پایگاه‌داده جداگانه ندارد و به صورت خودکار فایل داده را ایجاد می‌کند.
3. در صورت تمایل به استفاده از **MySQL / MariaDB**، کافیست در فایل `config/db.php` خط اتصال PDO را به مشخصات هاست خود تغییر دهید:
```php
$pdo = new PDO("mysql:host=localhost;dbname=your_db_name;charset=utf8mb4", "username", "password");
```
و سپس اسکریپت `schema.sql` را در phpMyAdmin اجرا فرمایید.

---

## ۳. فهرست اندپوینت‌های API

| متد | آدرس اندپوینت | توضیحات |
| :--- | :--- | :--- |
| **POST** | `/api/auth.php?action=login` | ورود به حساب کاربری |
| **POST** | `/api/auth.php?action=register` | ثبت‌نام شماره همراه و نام کاربری |
| **GET** | `/api/auth.php?action=users` | دریافت فهرست مخاطبین |
| **POST** | `/api/auth.php?action=profile` | به‌روزرسانی مشخصات و وضعیت حضور |
| **GET** | `/api/conversations.php?action=list` | دریافت گفتگوها با آخرین پیام |
| **POST** | `/api/conversations.php?action=create_group` | ساخت گروه جدید |
| **POST** | `/api/conversations.php?action=create_channel` | ساخت کانال جدید |
| **GET** | `/api/messages.php?conversation_id={id}` | دریافت پیام‌های یک گفتگو |
| **POST** | `/api/messages.php?action=send` | ارسال پیام جدید |
| **POST** | `/api/messages.php?action=edit` | ویرایش پیام |
| **POST** | `/api/messages.php?action=delete` | حذف پیام |
| **POST** | `/api/messages.php?action=react` | ثبت یا حذف واکنش ایموجی |
| **POST** | `/api/messages.php?action=poll_vote` | ثبت رأی در نظرسنجی |
| **GET** | `/api/stories.php?action=list` | دریافت استوری‌های فعال |
| **POST** | `/api/stories.php?action=create` | ارسال استوری جدید ۲۴ ساعته |
| **POST** | `/api/stories.php?action=like` | ثبت لایک استوری |
| **POST** | `/api/ai_assistant.php` | هوش مصنوعی (خلاصه، ترجمه، پیشنهاد پاسخ) |
