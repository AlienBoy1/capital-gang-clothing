import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Contacto",
};

export default function ContactoPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <FadeInSection>
        <p className="section-label">Contacto</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Hablemos de tu próximo proyecto
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Pedidos, sesiones o colecciones — responde rápido por WhatsApp y correo.
        </p>
      </FadeInSection>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <FadeInSection className="panel">
          <h2 className="font-display text-2xl font-semibold">Capital Gang</h2>
          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="text-subtle">Ubicación</dt>
              <dd className="mt-1 text-fg">Ciudad de México</dd>
            </div>
            <div>
              <dt className="text-subtle">WhatsApp</dt>
              <dd className="mt-1">
                <a href="https://wa.me/525500000000" className="text-brand transition hover:opacity-80">
                  +52 55 0000 0000
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-subtle">Correo</dt>
              <dd className="mt-1">
                <a href="mailto:contacto@capitalgang.com" className="text-fg transition hover:text-brand">
                  contacto@capitalgang.com
                </a>
              </dd>
            </div>
          </dl>
        </FadeInSection>

        <FadeInSection delay={80} className="relative overflow-hidden rounded-2xl border border-line bg-elevated p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
          <p className="section-label">Respuesta</p>
          <h2 className="mt-4 font-display text-2xl font-semibold">Horario de atención</h2>
          <p className="mt-3 text-muted">Lunes a sábado · 11:00 – 20:00</p>
          <a
            href="https://wa.me/525500000000"
            className="mt-8 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg"
          >
            Escribir por WhatsApp
          </a>
        </FadeInSection>
      </div>
    </main>
  );
}
