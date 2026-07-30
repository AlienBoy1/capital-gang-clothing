import { z } from "zod";
import { PASSWORD_POLICY_MESSAGE, isValidPasswordPolicy } from "../domain/entities";

export const credentialsSchema = z.object({
  email: z.string().email("Correo inválido"),
  /** Empty allowed on first login (access-code step follows). */
  password: z.string().optional().default(""),
});

export const accessCodeSchema = z.object({
  accessCode: z
    .string()
    .length(6, "El código de acceso tiene 6 dígitos")
    .regex(/^\d+$/, "Solo números"),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (!isValidPasswordPolicy(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PASSWORD_POLICY_MESSAGE,
        path: ["password"],
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
      });
    }
  });

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
