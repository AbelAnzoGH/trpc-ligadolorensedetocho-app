# Guía de estudio: Liga Dolorense de Tocho — Backend con Next.js + tRPC + Prisma

Esta guía reconstruye, paso a paso, todo lo que hemos hecho en el proyecto `trpc-ligadolorensedetocho-app` desde su creación hasta tener el endpoint `getUser` funcionando con autenticación. Cada sección trae el código correcto (ya corregido), una explicación de cómo funciona, para qué sirve, y cuál es el siguiente paso lógico.

---

## 1. Crear el proyecto Next.js

Todo empezó con el generador oficial de Next.js, que arma el esqueleto del proyecto (TypeScript, App Router, ESLint, Tailwind):

```bash
npx create-next-app@latest trpc-ligadolorensedetocho-app
```

Durante el asistente interactivo se eligieron: TypeScript, App Router, Tailwind CSS y ESLint. Esto crea `app/`, `public/`, `tsconfig.json`, `next.config.ts`, etc., y hace el primer commit ("Initial commit from Create Next App").

**¿Cómo funciona?** `create-next-app` clona una plantilla base y configura el `package.json` con los scripts estándar:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**¿Para qué nos sirve?** Es la base de toda la aplicación: el App Router de `app/` es donde vamos a colgar tanto las páginas como nuestra API (incluida la ruta de tRPC).

**Siguiente paso:** instalar las dependencias que no vienen por defecto — tRPC, Prisma, Zod, bcrypt, JWT.

---

## 2. Instalar las dependencias del backend

```bash
npm install @trpc/server zod superjson bcryptjs jsonwebtoken pg
npm install prisma @prisma/client @prisma/adapter-pg --save
npm install -D @types/bcryptjs @types/jsonwebtoken @types/pg
```

Esto deja en el `package.json` (resumido):

```json
"dependencies": {
  "@prisma/adapter-pg": "^7.9.1",
  "@prisma/client": "^7.9.1",
  "@trpc/server": "^11.18.0",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3",
  "pg": "^8.23.0",
  "prisma": "^7.9.1",
  "superjson": "^2.2.6",
  "zod": "^4.4.3"
}
```

**¿Cómo funciona?** Cada paquete cubre una responsabilidad puntual:

- `@trpc/server`: crea el servidor de procedimientos tipados (queries y mutations) que consumiremos desde el cliente sin escribir REST a mano.
- `zod`: valida y tipa los datos de entrada (inputs) antes de que lleguen a la lógica de negocio.
- `superjson`: serializa tipos que JSON normal no soporta bien (fechas, `undefined`, etc.) entre cliente y servidor de tRPC.
- `bcryptjs`: hashea contraseñas antes de guardarlas.
- `jsonwebtoken`: genera y verifica los tokens JWT de sesión.
- `prisma` / `@prisma/client`: el ORM y su motor de generación de tipos.
- `@prisma/adapter-pg` + `pg`: el *driver adapter* de Postgres que Prisma 7 exige de forma obligatoria (ver sección 8).

**¿Para qué nos sirve?** Con esto ya tenemos todas las piezas para construir autenticación, validación y acceso a base de datos de forma tipada de extremo a extremo.

**Siguiente paso:** levantar una base de datos Postgres local con Docker.

---

## 3. Docker Compose: Postgres + pgAdmin

Creamos `docker-compose.yaml` en la raíz del proyecto para levantar, con un solo comando, tanto la base de datos como una interfaz gráfica para administrarla:

```yaml
services:
  postgres:
    image: postgres:latest
    container_name: postgresldt
    ports:
      - '6500:5432'
    volumes:
      - posgresDB:/var/lib/postgresql
    env_file:
      - ./.env
  pgAdmin:
    image: dpage/pgadmin4
    container_name: pgAdminLDT
    env_file:
      - ./.env
    ports:
      - '5050:80'
volumes:
  posgresDB:
```

**¿Cómo funciona?**

- El servicio `postgres` corre la imagen oficial de Postgres. El puerto `6500` de tu máquina se mapea al `5432` interno del contenedor (así puedes tener varios Postgres en tu máquina sin choques de puerto).
- El volumen `posgresDB` persiste los datos en disco, para que no se pierdan cada vez que apagas el contenedor.
- El servicio `pgAdmin` levanta una interfaz web de administración de Postgres en el puerto `5050`.
- Ambos servicios leen sus variables (usuario, contraseña, credenciales de pgAdmin) del archivo `.env`.

**¿Para qué nos sirve?** Nos da una base de datos real, aislada, reproducible y desechable para desarrollo, sin instalar Postgres directamente en la máquina.

**Siguiente paso:** definir las variables de entorno que estos contenedores necesitan, y levantarlos.

---

## 4. Variables de entorno (`.env`)

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=6500
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=trpc_ldt

DATABASE_URL=postgresql://postgres:password@localhost:6500/trpc_ldt?schema=public

PGADMIN_DEFAULT_EMAIL=main@main.com
PGADMIN_DEFAULT_PASSWORD=password

JWT_SECRET=clave-secreta
```

**¿Cómo funciona?** Docker Compose inyecta estas variables a los contenedores (usuario/contraseña de Postgres, credenciales de pgAdmin), y Prisma lee `DATABASE_URL` para saber a qué base de datos conectarse. `JWT_SECRET` es la clave con la que firmamos y verificamos los tokens de sesión — nunca debe compartirse ni subirse a git (por eso `.env*` está en `.gitignore`).

**¿Para qué nos sirve?** Separa la configuración sensible del código fuente, y nos permite tener distintos valores en desarrollo, pruebas y producción sin tocar una sola línea de código.

Con el `.env` listo, levantamos los contenedores:

```bash
docker compose up -d
```

**Siguiente paso:** definir el esquema de la base de datos con Prisma.

---

## 5. Inicializar Prisma y definir el modelo

```bash
npx prisma init
```

Esto crea `prisma/schema.prisma`. Lo dejamos así, con el modelo `User`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String  @id @default(uuid())
  name      String  @db.VarChar(255)
  email     String  @unique
  verified  Boolean @default(false)

  password  String
  role      RoleEnumType? @default(user)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  provider String? @default("local")

  @@map(name: "users")
}

enum RoleEnumType {
  user
  admin
}
```

**¿Cómo funciona?**

- El bloque `generator client` le dice a Prisma dónde generar el cliente tipado (`app/generated/prisma`, en vez del típico `node_modules/.prisma`) — por eso esa carpeta está en `.gitignore`, ya que se regenera automáticamente.
- El bloque `datasource db` declara que usamos Postgres, y Prisma toma la conexión de `DATABASE_URL` (variable de entorno) automáticamente.
- El modelo `User` define la tabla `users` (gracias a `@@map`), con un `id` tipo UUID autogenerado, un `email` único, un `role` con enum (`user` o `admin`) y timestamps automáticos (`createdAt`, `updatedAt`).

**¿Para qué nos sirve?** Este archivo es la única fuente de verdad del esquema de datos: a partir de él Prisma genera tanto las migraciones SQL como el cliente TypeScript totalmente tipado.

**Siguiente paso:** convertir este esquema en una migración real sobre la base de datos.

---

## 6. Migración de la base de datos

```bash
npx prisma migrate dev --name init
```

Esto genera `prisma/migrations/20260813044122_init/migration.sql`:

```sql
-- CreateEnum
CREATE TYPE "RoleEnumType" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "role" "RoleEnumType" DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT DEFAULT 'local',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

**¿Cómo funciona?** `prisma migrate dev` compara el `schema.prisma` contra el estado actual de la base de datos, genera el SQL necesario para llevarla a ese estado, lo aplica sobre el Postgres que levantamos con Docker, y además regenera el `PrismaClient` con los tipos actualizados. Cada migración queda numerada con fecha y guardada en `prisma/migrations/`, para tener un historial versionable en git.

**¿Para qué nos sirve?** Nos da trazabilidad: cualquier persona (o cualquier entorno, como producción) puede reconstruir la base de datos desde cero corriendo `npx prisma migrate deploy`, aplicando las migraciones en orden.

**Siguiente paso:** verificar visualmente que la tabla se creó correctamente, usando pgAdmin.

---

## 7. Entrar a pgAdmin y verificar la base de datos

1. Abrir `http://localhost:5050` en el navegador (el puerto que mapeamos en el `docker-compose.yaml`).
2. Iniciar sesión con las credenciales del `.env`:
   - Email: `main@main.com`
   - Password: `password`
3. Dentro de pgAdmin, clic derecho en **Servers** → **Register** → **Server...**, y registrar la conexión a nuestro Postgres:
   - **General → Name:** el que quieras (p. ej. `LDT Local`).
   - **Connection → Host name/address:** `postgres` (el nombre del servicio en `docker-compose.yaml`, ya que pgAdmin se conecta *dentro* de la red de Docker) o `host.docker.internal` según tu configuración.
   - **Connection → Port:** `5432` (el puerto interno del contenedor, no el `6500` que expusimos hacia afuera).
   - **Connection → Username / Password:** `postgres` / `password`.
4. Una vez conectado, navegar a `Databases → trpc_ldt → Schemas → public → Tables → users` para confirmar que la tabla y sus columnas (`id`, `name`, `email`, `role`, etc.) existen tal cual las definimos en el `schema.prisma`.

**¿Para qué nos sirve?** Es la forma más directa de confirmar "a ojo" que la migración se aplicó bien, sin depender del código de la aplicación — muy útil para depurar cuando algo en Prisma no cuadra con lo que hay realmente en la base de datos.

**Siguiente paso:** conectar nuestra aplicación Next.js a esta base de datos, mediante un cliente Prisma reutilizable.

---

## 8. Cliente Prisma como singleton (`lib/prisma.ts`)

```ts
import { PrismaClient } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };
```

**¿Cómo funciona?**

- Desde Prisma 7, `PrismaClient` ya no se conecta solo: hay que pasarle explícitamente un *driver adapter* (`PrismaPg`, en nuestro caso) construido con la cadena de conexión (`DATABASE_URL`). Por eso instalamos `@prisma/adapter-pg` y `pg` en el paso 2.
- El patrón "singleton" evita crear una instancia nueva de `PrismaClient` en cada hot-reload de Next.js en desarrollo (cosa que agotaría rápidamente las conexiones disponibles de Postgres). Guardamos la instancia en `globalThis.prisma`; si ya existe, la reutilizamos; si no, la creamos una sola vez.
- El `if (process.env.NODE_ENV !== 'production')` limita ese guardado global solo a desarrollo — en producción cada proceso crea su propia instancia limpia, que es lo esperado en un entorno serverless o de contenedores.

**¿Para qué nos sirve?** Nos da un único punto (`import { prisma } from '@/lib/prisma'`) desde el que cualquier parte del backend puede hacer consultas a la base de datos, sin duplicar conexiones ni lógica de inicialización.

**Siguiente paso:** validar los datos que van a entrar a nuestros endpoints, antes de tocar la base de datos.

---

## 9. Validación de esquemas con Zod (`lib/user-schema.ts`)

```ts
import * as z from "zod";

export const createUserSchema = z.object({
  name: z.string({ error: "Name is required" }).min(1, { error: "Name is required" }),

  email: z
    .string({ error: "El Email es requerido" })
    .min(1, { error: "El Email es requerido" }),

  password: z
    .string({ error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" })
    .max(32, { error: "Password must be less than 32 characters" }),

  passwordConfirm: z
    .string({ error: "Por favor confirma tu contraseña" })
    .min(1, { error: "Por favor confirma tu contraseña" }),

}).refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Las contraseñas no coinciden',
})

export const loginUserSchema = z.object({
  email: z
    .string({ error: "El Email es requerido" })
    .min(1, { error: "El Email es requerido" }),
  password: z
    .string({ error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" })
    .max(32, { error: "Password must be less than 32 characters" }),
})

export type CreateUserInput = z.TypeOf<typeof createUserSchema>;
export type LoginUserInput = z.TypeOf<typeof loginUserSchema>;
```

**¿Cómo funciona?**

- Cada `z.object({...})` describe la forma exacta que debe tener el input, con sus propias reglas y mensajes de error personalizados.
- `.refine(...)` en `createUserSchema` agrega una regla que compara dos campos entre sí (que `password` y `passwordConfirm` coincidan) — algo que una validación de un solo campo no puede expresar.
- `z.TypeOf<typeof createUserSchema>` "extrae" automáticamente el tipo de TypeScript a partir del esquema de Zod, así que no tenemos que escribir la interfaz `CreateUserInput` a mano y mantenerla sincronizada: el tipo y la validación en tiempo de ejecución vienen del mismo lugar.

**¿Para qué nos sirve?** tRPC va a usar estos esquemas directamente como `.input(...)` en sus procedimientos (lo veremos en el paso 12): si el cliente manda datos que no cumplen el esquema, tRPC rechaza la petición automáticamente antes de que nuestro código de negocio se ejecute, con un error 400 detallado.

**Siguiente paso:** construir el "corazón" del servidor tRPC — el contexto y la instancia de tRPC con sus procedimientos públicos y protegidos.

---

## 10. El contexto de tRPC (`utils/trpc-context.ts`)

```ts
import { deserializeUser } from "@/lib/server/auth-middleware";

export const createContext = async () => deserializeUser();

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**¿Cómo funciona?** `createContext` se ejecuta en **cada petición** que llega a tRPC, antes de correr cualquier procedimiento. Aquí llamamos a `deserializeUser()` (que revisa la cookie `token`, la valida contra el JWT y busca al usuario en la base de datos — lo vemos en el siguiente paso) para saber quién está haciendo la petición. El resultado (`{ user: ... } | { user: null }`) queda disponible como `ctx` dentro de todos los procedimientos.

El tipo `Context` se infiere directamente del valor que retorna `createContext`, usando el helper nativo de TypeScript `Awaited<ReturnType<...>>` (en vez del helper `inferAsyncReturnType` de tRPC, que está marcado como `@deprecated` desde la v11 a favor de este patrón estándar).

**¿Para qué nos sirve?** Es el mecanismo que conecta la autenticación (cookies/JWT) con la capa de tRPC: gracias al contexto, cualquier procedimiento puede preguntar "¿hay un usuario logueado?" sin tener que leer cookies manualmente en cada uno.

**Siguiente paso:** implementar `deserializeUser`, que es quien realmente decodifica el token y busca al usuario.

---

## 11. Middleware de autenticación (`lib/server/auth-middleware.ts`)

```ts
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const deserializeUser = async () => {
    const cookieStore = cookies();

    try {
        let token;
        if ((await cookieStore).get('token')) {
            token = (await cookieStore).get('token')?.value;
        }

        const notAuthenticated = {
            user: null,
        }

        if (!token) {
            return notAuthenticated;
        }

        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as { sub: string };

        if (!decoded?.sub) {
            return notAuthenticated;
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.sub,
            },
        })

        if (!user) {
            return notAuthenticated;
        }

        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
        };

    } catch (err: unknown) {
        let message = 'Error Desconocido';
        if (err instanceof Error) {
            message = err.message;
        } else if (typeof err === 'string') {
            message = err;
        } else {
            try {
                message = JSON.stringify(err);
            } catch {
                /* keep fallback message */
            }
        }

        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message,
        });
    }
}
```

**¿Cómo funciona?** Lee la cookie `token` (async porque en Next.js 15+/16 `cookies()` es una función asíncrona). Si no hay token, devuelve `{ user: null }` — no truena, simplemente indica "nadie ha iniciado sesión". Si hay token, lo verifica con `jwt.verify` usando `JWT_SECRET`; si la firma es válida, extrae el `sub` (el id del usuario que guardamos al firmar el token en el login) y busca ese usuario en la base de datos con Prisma. Antes de devolverlo, le quita el campo `password` con destructuring (`const { password, ...userWithoutPassword } = user`), para nunca exponer el hash de la contraseña, ni por accidente, en el contexto de tRPC.

**¿Para qué nos sirve?** Es la pieza que traduce "una cookie en la petición HTTP" a "un objeto de usuario tipado, sin datos sensibles, disponible en `ctx.user`".

**Siguiente paso:** con el contexto ya resuelto, crear la instancia de tRPC y los tipos de procedimiento (público vs. protegido).

---

## 12. Instancia de tRPC y procedimientos (`utils/trpc-server.ts`)

```ts
import { TRPCError, initTRPC } from '@trpc/server';
import SuperJSON from 'superjson';
import { Context } from './trpc-context'

export const t = initTRPC.context<Context>().create({
    transformer: SuperJSON,
});

const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para acceder a este recurso',
        });
    }
    return next();
})

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```

**¿Cómo funciona?**

- `initTRPC.context<Context>().create(...)` inicializa tRPC "amarrado" al tipo `Context` que definimos en el paso 10 — así, en cualquier procedimiento, `ctx.user` viene ya tipado, sin necesidad de castear nada. `transformer: SuperJSON` habilita que los datos que viajan entre cliente y servidor puedan incluir tipos como `Date` sin perder su forma.
- `isAuthed` es un *middleware*: una función que se ejecuta antes que el resolver del procedimiento. Si `ctx.user` es `null` (nadie logueado), corta la ejecución lanzando un `TRPCError` con código `UNAUTHORIZED` (HTTP 401). Si sí hay usuario, llama a `next()` para continuar normalmente.
- `publicProcedure` es la base sin restricciones — cualquiera puede llamarlo (por ejemplo, login o registro).
- `protectedProcedure` es exactamente lo mismo pero con el middleware `isAuthed` enganchado (`.use(isAuthed)`) — cualquier procedimiento construido sobre este tipo exige sesión válida automáticamente.

**¿Para qué nos sirve?** Nos da dos "moldes" reutilizables para declarar endpoints: uno abierto y uno que se protege solo, sin tener que repetir la lógica de "revisa si hay usuario" en cada controlador.

**Siguiente paso:** escribir la lógica de negocio real (registrar, iniciar sesión, cerrar sesión, obtener el usuario actual).

---

## 13. Lógica de negocio de autenticación (`lib/server/auth-controller.ts`)

```ts
import { CreateUserInput, LoginUserInput } from '@/lib/user-schema'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { Prisma } from '@/app/generated/prisma'

export const registerHandler = async ({ input }: { input: CreateUserInput }) => {
    try {
        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user = await prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: hashedPassword,
            },
        });

        const { password, ...userWithoutPassword } = user;

        return {
            status: 'success',
            data: { user: userWithoutPassword },
        }

    } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Email already exists',
            });
        }
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
}

export const loginHandler = async ({ input }: { input: LoginUserInput }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (!user || !(await bcrypt.compare(input.password, user.password))) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid email or password',
            });
        }

        const secret = process.env.JWT_SECRET!;
        const token = jwt.sign({ sub: user.id }, secret, {
            expiresIn: '1h',
        })

        const cookieOptions = {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60,
        };

        (await cookies()).set('token', token, cookieOptions);

        return {
            status: 'success',
            token,
        }
    } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
}

export const logoutHandler = async () => {
    try {
        (await cookies()).set('token', '', {
            maxAge: -1,
        });
        return {
            status: 'success',
            message: 'Logged out successfully',
        }
    } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
};
```

**¿Cómo funciona?**

- `registerHandler`: hashea la contraseña con `bcrypt.hash` (nunca se guarda en texto plano), crea el usuario con Prisma, y le quita el `password` antes de devolverlo. Si Prisma lanza el error específico `P2002` (violación de restricción única — en este caso, el `email` ya existe), lo traducimos a un `TRPCError` con código `CONFLICT` (HTTP 409) y un mensaje claro, en vez de dejar que se escape un error genérico de base de datos.
- `loginHandler`: busca al usuario por email, compara la contraseña enviada contra el hash guardado con `bcrypt.compare`, y si coincide, firma un JWT (`jwt.sign`) que expira en 1 hora, usando el `id` del usuario como `sub` (subject). Ese token se guarda como cookie `httpOnly` (no accesible desde JavaScript del navegador, para mitigar ataques XSS) con `secure: true` en producción (solo viaja por HTTPS).
- `logoutHandler`: "borra" la cookie fijando `maxAge: -1`, lo que le indica al navegador que la expire de inmediato.
- Los tres usan `catch (err: unknown)` en vez de `any`: nos obliga a angostar el tipo del error (con `instanceof`) antes de usarlo, evitando bugs por asumir una forma de error que no es real.

**¿Para qué nos sirve?** Es la capa que concentra toda la lógica de negocio de autenticación, separada de cómo se expone (eso lo hace el router, en el siguiente paso) — así el mismo código se podría reutilizar desde otro tipo de endpoint sin duplicar lógica.

**Siguiente paso:** el controlador para leer al usuario ya autenticado.

---

## 14. Controlador del usuario actual (`lib/server/user-controller.ts`)

```ts
import type { Context } from '@/utils/trpc-context';
import { TRPCError } from '@trpc/server';

export const getUserHandler = ({ ctx }: { ctx: Context }) => {
    try {
        const user = ctx.user;

        return {
            status: 'success',
            data: { user },
        }
    } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
}
```

**¿Cómo funciona?** No consulta la base de datos de nuevo: simplemente devuelve `ctx.user`, el usuario que ya resolvió `deserializeUser()` en el contexto (paso 10-11). Esto solo tiene sentido si este handler se cuelga de un `protectedProcedure`, porque de lo contrario `ctx.user` podría ser `null`.

**¿Para qué nos sirve?** Es el típico endpoint "¿quién soy?" (`/me` o `getUser`) que usa cualquier frontend para saber si hay sesión activa y con qué datos de usuario pintar la interfaz.

**Siguiente paso:** exponer todos estos handlers como procedimientos de tRPC, organizados en routers.

---

## 15. Routers de tRPC

Primero, el router de autenticación (`lib/server/auth-route.ts`):

```ts
import { createUserSchema, loginUserSchema, CreateUserInput, LoginUserInput } from '@/lib/user-schema';
import { protectedProcedure, publicProcedure, t } from '@/utils/trpc-server';
import { loginHandler, registerHandler, logoutHandler } from '@/lib/server/auth-controller';

const authRouter = t.router({
    registerUser: publicProcedure
        .input(createUserSchema)
        .mutation(({ input }: { input: CreateUserInput }) => registerHandler({ input })),

    loginUser: publicProcedure
        .input(loginUserSchema)
        .mutation(({ input }: { input: LoginUserInput }) => loginHandler({ input })),

    logoutUser: protectedProcedure.mutation(() => logoutHandler()),
});

export default authRouter;
```

Y el router principal, donde se juntan todos (`app/api/trpc/trpc-router.ts`):

```ts
import authRouter from "@/lib/server/auth-route";
import { getUserHandler } from "@/lib/server/user-controller";
import { createContext } from "@/utils/trpc-context";
import { protectedProcedure, t } from "@/utils/trpc-server";

const statusCheckRouter = t.router({
    statuschecker: t.procedure.query(() => {
        return {
            status: 'success',
            message: 'Bienvenido al servidor TRPC de Ligado Lorense de Tocho',
        }
    })
})

const userRouter = t.router({
    getUser: protectedProcedure.query(({ ctx }) => getUserHandler({ ctx })),
});

export const appRouter = t.mergeRouters(
    statusCheckRouter,
    authRouter,
    userRouter
)

export const createCaller = t.createCallerFactory(appRouter)

export const createAsyncCaller = async () => {
    const context = await createContext();
    return createCaller(context);
}

export type AppRouter = typeof appRouter;
```

**¿Cómo funciona?**

- `.input(schema)` engancha el esquema de Zod del paso 9 — tRPC valida automáticamente el payload contra ese esquema antes de ejecutar el resolver.
- `.mutation(...)` se usa para operaciones que **cambian** estado (crear usuario, iniciar/cerrar sesión); `.query(...)` para operaciones de **solo lectura** (consultar el status del servidor, consultar el usuario actual). Esta distinción es solo semántica en tRPC (ambas llaman HTTP), pero es importante para el cliente y para invalidación de caché en librerías como React Query.
- `t.mergeRouters(...)` combina varios routers pequeños en uno solo (`appRouter`), lo que nos deja organizar el código por dominio (auth, usuario, status) en vez de tener un archivo gigante.
- `createCaller` / `createAsyncCaller` permiten invocar el `appRouter` directamente desde el servidor (por ejemplo, desde un Server Component de Next.js) sin pasar por HTTP — útil para renderizado en servidor.
- `export type AppRouter = typeof appRouter` exporta el **tipo** del router completo — es la pieza que le permite a un cliente tRPC (si en el futuro construimos un frontend) tener autocompletado y chequeo de tipos end-to-end sin generar código ni documentación aparte.

**¿Para qué nos sirve?** Es el mapa completo de todo lo que expone nuestra API: `statuschecker`, `registerUser`, `loginUser`, `logoutUser`, `getUser`.

**Siguiente paso:** conectar este router a una ruta real de Next.js, para que sea alcanzable por HTTP.

---

## 16. La ruta de la API (`app/api/trpc/[trpc]/route.ts`)

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../trpc-router';
import { createContext } from '@/utils/trpc-context';

const handler = (request: Request) => {
    console.log(`incoming request ${request.url}`);
    return fetchRequestHandler({
        endpoint: 'api/trpc',
        req: request,
        router: appRouter,
        createContext: createContext,
    })
}

export { handler as GET, handler as POST };
```

**¿Cómo funciona?**

- El nombre de la carpeta `[trpc]` es una *ruta dinámica catch-all* de Next.js: cualquier subruta bajo `/api/trpc/` (por ejemplo `/api/trpc/getUser` o `/api/trpc/loginUser`) llega a este único archivo.
- `fetchRequestHandler` viene específicamente de `@trpc/server/adapters/fetch` (no del paquete raíz `@trpc/server`) porque tRPC separa sus adaptadores por entorno (Express, Fastify, Lambda, Next.js, Fetch API estándar) en distintos *entry points*, para no cargar código innecesario de adaptadores que no usamos.
- Recibe el `Request` nativo de la Fetch API, el `router` (nuestro `appRouter`), y la función `createContext` (la del paso 10) que se ejecuta en cada petición para resolver `ctx.user`.
- Exportamos el mismo `handler` tanto para `GET` como para `POST`, porque tRPC usa `GET` para las queries y `POST` para las mutations sobre esta misma ruta.

**¿Para qué nos sirve?** Es el punto de entrada real por HTTP: sin este archivo, todo lo que construimos en los pasos anteriores (routers, controladores, contexto) no sería alcanzable desde fuera del servidor.

**Siguiente paso:** levantar el servidor de desarrollo y probar que todo el flujo funciona de punta a punta.

---

## 17. Levantar el servidor y probar la ruta

```bash
npm run dev
```

Esto arranca Next.js (con Turbopack) en `http://localhost:3000`. Con el servidor corriendo, probamos en este orden:

1. **Endpoint público, sin autenticación** — confirma que el servidor y el router están vivos:

   ```
   GET http://localhost:3000/api/trpc/statuschecker
   ```

   Debería responder algo como `{"result":{"data":{"status":"success","message":"Bienvenido al servidor TRPC de Ligado Lorense de Tocho"}}}`.

2. **Registrar un usuario** (mutation → `POST`, con body JSON):

   ```
   POST http://localhost:3000/api/trpc/registerUser
   Content-Type: application/json

   { "name": "Abel", "email": "abel@example.com", "password": "12345678", "passwordConfirm": "12345678" }
   ```

3. **Iniciar sesión** (mutation → `POST`) — esta llamada es la que setea la cookie `token`:

   ```
   POST http://localhost:3000/api/trpc/loginUser
   Content-Type: application/json

   { "email": "abel@example.com", "password": "12345678" }
   ```

   Si pruebas esto con `curl`, usa `-c cookies.txt` para guardar la cookie que regresa el servidor; con Postman/Insomnia, ambos manejan cookies automáticamente dentro de la misma sesión de la app.

4. **Consultar el usuario autenticado** (query → `GET`), reenviando la cookie obtenida en el paso anterior:

   ```
   GET http://localhost:3000/api/trpc/getUser
   ```

   Si la cookie viaja correctamente, responde con los datos del usuario (sin el password). Si entras a esta URL directo desde el navegador **sin haber iniciado sesión antes en esa misma pestaña**, vas a recibir `401 UNAUTHORIZED` con el mensaje "Debes iniciar sesión para acceder a este recurso" — y eso es exactamente lo que debe pasar, porque `getUser` está protegido por el middleware `isAuthed` del paso 12.

**¿Para qué nos sirve este último paso?** Verifica de punta a punta que las siete piezas anteriores (Docker/Postgres, Prisma, Zod, contexto, middleware de auth, routers y la ruta de Next.js) están correctamente conectadas entre sí.

**Siguiente paso natural (para cuando quieras seguir el curso):** construir un cliente de tRPC en el frontend (`@trpc/client` + React Query) para consumir estos endpoints desde componentes de React, con el mismo nivel de tipado end-to-end que ya tenemos en el backend.

---

## Resumen del flujo completo

```
create-next-app  →  instalar deps  →  docker-compose (Postgres + pgAdmin)
        →  .env  →  schema.prisma  →  prisma migrate dev  →  verificar en pgAdmin
        →  lib/prisma.ts (singleton + adapter)  →  lib/user-schema.ts (Zod)
        →  trpc-context.ts + auth-middleware.ts (¿quién eres?)
        →  trpc-server.ts (publicProcedure / protectedProcedure)
        →  auth-controller.ts + user-controller.ts (lógica de negocio)
        →  auth-route.ts + trpc-router.ts (exponer como procedimientos)
        →  app/api/trpc/[trpc]/route.ts (conectar a HTTP)
        →  npm run dev  →  probar statuschecker / registerUser / loginUser / getUser
```
