import { NextResponse } from "next/server";
import {
  AuthenticateUserUseCase,
  AccessCodeRequiredError,
  InvalidAccessCodeError,
  InvalidCredentialsError,
  InactiveAccountError,
} from "@/modules/identity/application/authenticate-user.usecase";
import { PrismaUserRepository } from "@/modules/identity/infrastructure/user.repository";
import {
  buildSessionCookieOptions,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/shared/lib/session";
import { credentialsSchema, accessCodeSchema } from "@/modules/identity/presentation/login.schema";

const useCase = new AuthenticateUserUseCase(new PrismaUserRepository());

export async function POST(request: Request) {
  const body = await request.json();

  const credentials = credentialsSchema.safeParse(body);
  if (!credentials.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const accessCode = body.accessCode
    ? accessCodeSchema.safeParse(body).data?.accessCode
    : undefined;
  const rememberMe = Boolean(body.rememberMe);

  try {
    const user = await useCase.execute({
      email: credentials.data.email,
      password: credentials.data.password || undefined,
      accessCode,
    });

    const token = await createSessionToken(
      {
        userId: user.id,
        role: user.role,
        isValidated: user.isValidated,
        mustSetPassword: user.mustSetPassword,
        rememberMe,
      },
      { rememberMe }
    );

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(rememberMe));
    return response;
  } catch (error) {
    if (error instanceof AccessCodeRequiredError) {
      return NextResponse.json({ code: "ACCESS_CODE_REQUIRED" }, { status: 428 });
    }
    if (error instanceof InvalidAccessCodeError) {
      return NextResponse.json({ message: "Código de acceso incorrecto" }, { status: 401 });
    }
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ message: "Correo o contraseña incorrectos" }, { status: 401 });
    }
    if (error instanceof InactiveAccountError) {
      return NextResponse.json({ message: "Cuenta desactivada" }, { status: 403 });
    }
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
