import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Nosotros",
};

export default function NosotrosPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <FadeInSection>
        <p className="section-label">Nosotros</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          La identidad detrás del proyecto
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Capital Gang mezcla moda urbana, cultura callejera y tatuaje como una sola expresión.
        </p>
      </FadeInSection>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <FadeInSection className="panel">
          <h2 className="font-display text-2xl font-semibold">De la calle al estudio</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Empezamos con piezas que se sienten en movimiento: ropa que aguanta el ritmo diario y un
            shop de tatuajes donde cada trazo cuenta. No separamos marca y oficio — son el mismo impulso.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Hoy construimos una plataforma para vestir, abastecer y mostrar el trabajo con el mismo
            estándar visual: limpio, directo y sin artificios.
          </p>
        </FadeInSection>

        <FadeInSection delay={80} className="panel bg-elevated">
          <p className="section-label">Valores</p>
          <ul className="mt-6 space-y-5">
            {[
              ["Autenticidad", "Sin pose. Cada drop y cada sesión habla por sí sola."],
              ["Oficio", "Calidad de material y de ejecución, siempre."],
              ["Comunidad", "Calle, estudio y clientes en la misma conversación."],
            ].map(([title, copy]) => (
              <li key={title}>
                <p className="font-display text-lg font-semibold text-fg">{title}</p>
                <p className="mt-1 text-sm text-muted">{copy}</p>
              </li>
            ))}
          </ul>
        </FadeInSection>
      </div>
    </main>
  );
}
