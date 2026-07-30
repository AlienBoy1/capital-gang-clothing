"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LANDING_IMAGES } from "@/modules/catalog/presentation/data/landing-images";
import { Button } from "@/shared/ui/components/Button";
import {
  credentialsSchema,
  accessCodeSchema,
  type CredentialsInput,
  type AccessCodeInput,
} from "@/modules/identity/presentation/login.schema";

type Step = "credentials" | "access-code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [credentials, setCredentials] = useState<CredentialsInput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const credentialsForm = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
  });

  const accessCodeForm = useForm<AccessCodeInput>({
    resolver: zodResolver(accessCodeSchema),
  });

  async function submitLogin(payload: CredentialsInput & Partial<AccessCodeInput>) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 428 && data.code === "ACCESS_CODE_REQUIRED") {
        setCredentials(payload);
        setStep("access-code");
        return;
      }
      if (!res.ok) {
        setServerError(data.message ?? "No se pudo iniciar sesión");
        return;
      }

      setTransitioning(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      window.location.href = "/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      {transitioning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas animate-fade-in">
          <div className="relative mb-6 h-14 w-14">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
            <span className="absolute inset-2 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
          <p className="font-brand text-lg font-bold uppercase tracking-[0.04em]">Entrando a Capital Gang</p>
          <p className="mt-2 text-sm text-muted">Preparando tu panel…</p>
        </div>
      )}

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Visual panel — mirrors landing hero language */}
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <Image
            src={LANDING_IMAGES.hero.src}
            alt={LANDING_IMAGES.hero.alt}
            fill
            priority
            sizes="50vw"
            className={`object-cover object-[center_30%] transition duration-[1.2s] ease-out ${
              entered ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/45 to-canvas" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,var(--glow),transparent_45%)]" />

          <div
            className={`absolute inset-x-0 bottom-0 p-10 xl:p-14 transition duration-700 delay-150 ${
              entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <p className="section-label">Capital Gang</p>
            <h1 className="mt-4 max-w-md font-brand text-4xl font-bold uppercase leading-[0.95] tracking-[0.02em] text-white xl:text-5xl">
              Calle.
              <span className="mt-1 block text-brand">Tinta. Actitud.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Acceso al panel donde se gestiona la ropa, el tattoo shop y la galería.
            </p>
          </div>
        </aside>

        {/* Form panel */}
        <section className="relative flex min-h-screen flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow),transparent_45%)] lg:bg-none" />

          {/* Mobile background strip */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden lg:hidden">
            <Image
              src={LANDING_IMAGES.hero.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_25%] opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-canvas/80 to-canvas" />
          </div>

          <div
            className={`absolute right-5 top-5 z-10 flex items-center gap-2 sm:right-8 sm:top-8 transition duration-700 ${
              entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
            }`}
          >
            <Link
              href="/"
              className="rounded-full border border-line bg-surface/80 px-3 py-2 text-sm text-muted backdrop-blur transition hover:text-fg"
            >
              Sitio
            </Link>
            <ThemeToggle />
          </div>

          <div
            className={`relative z-10 mx-auto w-full max-w-md transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <div className="mb-10 flex flex-col items-center text-center">
              <BrandMark
                variant="seal"
                size="xl"
                className="mb-5 drop-shadow-[0_0_28px_rgba(214,255,47,0.28)]"
              />
              <BrandMark variant="horizontal" size="lg" align="center" />
            </div>

            <p className="section-label">Acceso</p>
            <h2 className="mt-3 font-brand text-3xl font-bold uppercase tracking-[0.02em] sm:text-4xl">
              {step === "credentials" ? "Inicia sesión" : "Valida tu cuenta"}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {step === "credentials"
                ? "Si es tu primer acceso, escribe tu correo y continúa (puedes dejar la contraseña vacía). Te pediremos el código que te dio el admin."
                : "Introduce el código de acceso de 6 dígitos (solo esta vez). Después configurarás tu contraseña."}
            </p>

            <div className="mt-8 rounded-2xl border border-line bg-surface/90 p-6 shadow-soft backdrop-blur sm:p-8">
              {step === "credentials" ? (
                <form
                  key="credentials"
                  onSubmit={credentialsForm.handleSubmit(submitLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                      Correo
                    </label>
                    <input
                      {...credentialsForm.register("email")}
                      type="email"
                      placeholder="tu@correo.com"
                      className="input-field"
                      autoComplete="email"
                    />
                    {credentialsForm.formState.errors.email && (
                      <p className="text-xs text-danger">
                        {credentialsForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                      Contraseña
                    </label>
                    <input
                      {...credentialsForm.register("password")}
                      type="password"
                      placeholder="Vacía si es tu primer acceso"
                      className="input-field"
                      autoComplete="current-password"
                    />
                    {credentialsForm.formState.errors.password && (
                      <p className="text-xs text-danger">
                        {credentialsForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {serverError && <p className="text-xs text-danger">{serverError}</p>}

                  <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting || transitioning}>
                    {transitioning ? "Cargando…" : "Entrar al panel"}
                  </Button>
                </form>
              ) : (
                <form
                  key="access-code"
                  onSubmit={accessCodeForm.handleSubmit((data) =>
                    credentials && submitLogin({ ...credentials, ...data })
                  )}
                  className="animate-fade-up space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                      Código de acceso
                    </label>
                    <input
                      {...accessCodeForm.register("accessCode")}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      className="input-field text-center text-lg tracking-[0.4em]"
                    />
                    {accessCodeForm.formState.errors.accessCode && (
                      <p className="text-xs text-danger">
                        {accessCodeForm.formState.errors.accessCode.message}
                      </p>
                    )}
                  </div>

                  {serverError && <p className="text-xs text-danger">{serverError}</p>}

                  <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting || transitioning}>
                    {transitioning ? "Cargando…" : "Validar y continuar"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setServerError(null);
                    }}
                    className="w-full text-center text-sm text-muted transition hover:text-fg"
                  >
                    Volver al login
                  </button>
                </form>
              )}
            </div>

            <p className="mt-8 text-center text-xs text-subtle">
              Una identidad. Dos mundos. Ropa urbana y tinta.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
