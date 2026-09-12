اخبارك - إعداد لوحة التحكم وربط الأخبار بـ Supabase

1) أنشئ مشروعًا في Supabase.
2) افتح SQL Editor والصق كل محتوى schema.sql ثم Run.
3) من Authentication > Users أنشئ مستخدم المدير بالبريد وكلمة المرور.
4) انسخ UUID الخاص بالمستخدم، ثم في SQL Editor نفّذ:
   insert into public.admin_users (user_id) values ('ضع-UUID-هنا');
5) افتح Project Settings > API وانسخ Project URL و anon public key.
6) افتح supabase-config.js وضعهما بدل YOUR_SUPABASE_URL و YOUR_SUPABASE_ANON_KEY.
7) ارفع كل ملفات المشروع على GitHub Pages.
8) افتح admin.html من موقعك للدخول وإدارة الأخبار.

مهم: لا تضع Service Role Key في الموقع. استخدم anon public key فقط.
التصميم الأصلي محفوظ؛ تم فقط استبدال الأخبار الثابتة ببيانات ديناميكية من Supabase.
