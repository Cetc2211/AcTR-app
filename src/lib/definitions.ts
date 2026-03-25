import { z } from 'zod';

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
    .trim(),
  email: z.string().email({ message: 'Por favor, ingresa un email válido.' }).trim(),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
    .trim(),
});
