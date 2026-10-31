# Персонал на час: портал HoReCa

Работает сразу в **демо-режиме** (данные только в браузере). Чтобы запустить по-настоящему:

1. supabase.com → New project (бесплатно).
2. SQL Editor → вставьте `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers → Email: оставьте включённым **Confirm email**.
4. Authentication → URL Configuration: Site URL и Redirect URLs = адрес сайта (`https://ЛОГИН.github.io/personal-na-chas/`).
5. Project Settings → API: скопируйте Project URL и ключ **anon public** в `config.js`. Ключ `service_role` не использовать.
6. Загрузите файлы в GitHub. Зарегистрируйтесь с почтой `Waiter.trening@gmail.com` и подтвердите email: аккаунт станет админом.
7. Google-вход (по желанию): Authentication → Providers → Google, нужен OAuth Client из Google Cloud Console.

Роли: гость смотрит вакансии. Зарегистрированный размещает вакансии и резюме (после модерации админом), откликается, видит резюме и отклики. Админ модерирует всё и обрабатывает заявки на персонал.

## Проверка (этап 1)
Схема `supabase/schema.sql` прогнана в реальном Postgres: права по ролям, запрет самопубликации, запрет недопустимых статусов, лимиты длины, отклики только на опубликованные чужие вакансии. После запуска проверьте в боевом Supabase вход, вакансию, модерацию и отклик вручную.
