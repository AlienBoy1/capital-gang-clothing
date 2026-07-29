import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const accessCodeSchema = z.object({
  accessCode: z
    .string()
    .length(6, "El código de acceso tiene 6 dígitos")
    .regex(/^\d+$/, "Solo números"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
