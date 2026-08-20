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
   .string({ error: "Por favor confirma tu contraseña" }).min(1, { error: "Por favor confirma tu contraseña" }),

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