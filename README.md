# Twitter HSE

## Приложения развернуто по ссылке: https://twitter-hse.vercel.app/

## Node.js verison: 18

## Для запуска:

1.  ```npm install```
2.  создать .env файл с сылкой на подключени к бд, ключи к Clerk и ключи к Redis

    названия полей:

- DATABASE_URL=""
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
- CLERK_SECRET_KEY=""
- UPSTASH_REDIS_REST_URL=""
- UPSTASH_REDIS_REST_TOKEN=""

3. Выполнить миграцию бд с помощью команды ```npx prisma migrate dev --name "Название миграции"```
4. Скрипт для запуска: ```npm run dev```

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
