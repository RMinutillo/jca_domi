import { useState, type MouseEvent } from "react";
import { Footer, Header, useReveal } from "./shared";
import ServiceIcon, { type ServiceIconName } from "./ServiceIcon";
import ndtHero from "./assets/ndt-weld-hero.png";
import refineryDusk from "./assets/refinery-dusk.png";

type Technique = {
  id: string;
  title: string;
  what: string;
  detects: string[];
  uses: string[];
  icon: ServiceIconName;
  secondary?: { title: string; items?: string[]; text?: string }[];
};

const volumetric: Technique[] = [
  {
    id: "radiografia",
    icon: "radiography",
    title: "Radiografía y gammagrafía",
    what: "Mediante rayos X o gamma se obtienen imágenes del interior de una pieza. Las diferencias en la absorción de radiación permiten identificar variaciones de densidad, espesor y posibles discontinuidades internas.",
    detects: ["Porosidades e inclusiones.", "Discontinuidades en soldaduras, como faltas de penetración o fusión, según su orientación.", "Fisuras detectables según su tamaño y orientación.", "Variaciones de espesor o densidad."],
    uses: ["Soldaduras de distintos materiales y espesores.", "Componentes fundidos.", "Componentes aeronáuticos.", "Recipientes sometidos a presión.", "Estructuras y puentes."],
  },
  {
    id: "ultrasonido",
    icon: "ultrasound",
    title: "Ultrasonido",
    what: "Utiliza ondas sonoras de alta frecuencia que se propagan por el material y generan ecos al encontrar discontinuidades o cambios en sus características internas. Estos ecos permiten localizar y evaluar las indicaciones detectadas.",
    detects: ["Fisuras y laminaciones.", "Discontinuidades internas en soldaduras.", "Falta de fusión e inclusiones.", "Otras discontinuidades internas, según el material y la técnica aplicada."],
    uses: ["Componentes mecánicos, como engranajes y ejes.", "Soldaduras de distintas geometrías.", "Componentes laminados.", "Componentes forjados."],
  },
];

const superficial: Technique[] = [
  {
    id: "liquidos",
    icon: "penetrant",
    title: "Líquidos penetrantes",
    what: "Consiste en aplicar un líquido que ingresa en discontinuidades abiertas a la superficie. Luego de retirar el excedente, un revelador permite visualizar las indicaciones para su evaluación.",
    detects: ["Fisuras abiertas a la superficie.", "Porosidades abiertas a la superficie.", "Otras discontinuidades superficiales en soldaduras y componentes."],
    uses: ["Componentes mecánicos.", "Soldaduras de distintas geometrías.", "Materiales no porosos, como acero al carbono, acero inoxidable y aluminio."],
    secondary: [{ title: "Técnicas disponibles", items: ["Fluorescente (Tipo I): métodos A, B, C y D.", "Visible (Tipo II): métodos A y C."] }],
  },
  {
    id: "particulas",
    icon: "magnetic",
    title: "Partículas magnetizables",
    what: "Se induce un campo magnético en una pieza de material ferromagnético. Las partículas aplicadas sobre su superficie se acumulan en los campos de fuga producidos por las discontinuidades, permitiendo visualizar su presencia.",
    detects: ["Fisuras superficiales.", "Discontinuidades subsuperficiales cercanas a la superficie.", "Discontinuidades en soldaduras de materiales ferromagnéticos."],
    uses: ["Componentes mecánicos, como ejes, engranajes, cigüeñales y bielas.", "Soldaduras de materiales ferromagnéticos.", "Elementos de izaje, como ganchos, grilletes y pernos."],
    secondary: [{ title: "Técnicas disponibles", items: ["Métodos de inspección: partículas visibles y fluorescentes.", "Técnicas de magnetización: yugo, pasaje de corriente, bobina y conductor central."] }],
  },
  {
    id: "visual",
    icon: "visual",
    title: "Inspección visual",
    what: "Permite evaluar la condición visible de superficies y soldaduras mediante observación directa o indirecta, incluyendo técnicas de boroscopía. Las indicaciones se comparan con los criterios de aceptación de las normas y especificaciones aplicables.",
    detects: ["Fisuras y discontinuidades visibles.", "Socavaduras, desalineaciones e irregularidades en soldaduras.", "Corrosión, deformaciones y otras alteraciones superficiales visibles."],
    uses: ["Soldaduras sanitarias en la industria alimenticia.", "Soldaduras en las industrias petroquímica y naval."],
    secondary: [
      { title: "Modalidades", items: ["Inspección visual directa.", "Inspección visual indirecta mediante boroscopía."] },
      { title: "Certificación", text: "Inspecciones de soldadura realizadas por inspectores certificados según IRAM IAS U500-169." },
    ],
  },
];

function TechAccordion({ items }: { items: Technique[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="acc-list">
      {items.map((tech) => {
        const isOpen = open === tech.id;
        return (
          <article className={isOpen ? "acc-item is-open" : "acc-item"} id={tech.id} key={tech.id}>
            <h3>
              <button
                type="button"
                id={`${tech.id}-trigger`}
                aria-expanded={isOpen}
                aria-controls={`${tech.id}-panel`}
                onClick={() => setOpen(isOpen ? null : tech.id)}
              >
                <ServiceIcon name={tech.icon} className="acc-icon" />
                <span>{tech.title}</span>
                <i aria-hidden="true" />
              </button>
            </h3>
            <div className="acc-panel" id={`${tech.id}-panel`} role="region" aria-labelledby={`${tech.id}-trigger`} aria-hidden={!isOpen} inert={!isOpen}>
              <div className="acc-panel-inner">
                <div className="acc-text">
                  <div className="tech-cell">
                    <h4>Qué es</h4>
                    <p>{tech.what}</p>
                  </div>
                  <div className="acc-cols">
                    <div className="tech-cell">
                      <h4>Qué permite detectar</h4>
                      <ul>
                        {tech.detects.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="tech-cell">
                      <h4>Aplicaciones</h4>
                      <ul>
                        {tech.uses.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {tech.secondary && <div className="acc-secondary">
                    {tech.secondary.map(block => (
                      <div className="tech-cell" key={block.title}>
                        <h4>{block.title}</h4>
                        {block.items ? <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul> : <p>{block.text}</p>}
                      </div>
                    ))}
                  </div>}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function NdtPage({ onConsult }: { onConsult: () => void }) {
  useReveal(
    [
      ".ndt-hero .ndt-copy > *",
      ".ndt-intro .copy > *",
      ".ndt-facts li",
      ".ndt-block-head > *",
      ".acc-item",
      ".ndt-cta .copy > *",
    ],
    ".ndt-parallax",
  );

  // Local section links must not replace the hash used by the service router.
  const navigateSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(event.currentTarget.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };

  return (
    <main className="ndt-page ndt-detail-page">
      <section className="ndt-hero dark-section">
        <img className="ndt-hero-backdrop" src={ndtHero} alt="" aria-hidden="true" fetchPriority="high" />
        <Header />
        <div className="page-width">
          <nav className="breadcrumb" aria-label="Ruta">
            <a href="/#nuestras-soluciones">Servicios</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Ensayos no destructivos</span>
          </nav>
        </div>
        <div className="page-width ndt-hero-grid">
          <div className="copy ndt-copy">
            <h1>
              Ensayos no <em>destructivos</em>
            </h1>
            <p className="lead">
              Evaluamos materiales, piezas y soldaduras para detectar discontinuidades sin alterar su integridad.
            </p>
            <a className="btn btn-light" href="#introduccion" onClick={navigateSection}>
              Explorar métodos ↓
            </a>
          </div>
        </div>
      </section>

      <section className="light-section ndt-intro" id="introduccion">
        <div className="page-width split">
          <div className="copy">
            <p className="eyebrow red">INTRODUCCIÓN</p>
            <h2>
              Por dentro y por fuera.
            </h2>
            <p className="lead">
              Los ensayos no destructivos (END) permiten evaluar materiales y componentes sin comprometer su integridad. Según la ubicación de las discontinuidades, se utilizan métodos volumétricos para examinar el interior o métodos superficiales para evaluar la superficie y las zonas próximas a ella.
            </p>
            <div className="ndt-jump">
              <a className="btn btn-dark" href="#volumetricos" onClick={navigateSection}>
                Ensayos volumétricos
              </a>
              <a className="btn btn-dark" href="#superficiales" onClick={navigateSection}>
                Ensayos superficiales
              </a>
            </div>
          </div>
          <ul className="ndt-facts">
            <li>
              <strong>SIN ALTERAR LA PIEZA</strong>
              <span>La inspección permite evaluar el componente sin dañar sus propiedades ni comprometer su uso posterior.</span>
            </li>
            <li>
              <strong>DETECCIÓN TEMPRANA</strong>
              <span>Permite identificar discontinuidades durante la fabricación o en servicio, contribuyendo a prevenir fallas.</span>
            </li>
            <li>
              <strong>PERSONAL CALIFICADO</strong>
              <span>Personal certificado Nivel 3 según IRAM NM-ISO 9712.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="dark-section ndt-block ndt-volumetric" id="volumetricos">
        <img className="ndt-block-bg ndt-parallax" src={refineryDusk} alt="" aria-hidden="true" />
        <div className="page-width">
          <div className="acc-layout">
          <div className="ndt-block-head">
            <p className="eyebrow red">01 — ENSAYOS VOLUMÉTRICOS</p>
            <h2>
              Lo que ocurre <em>dentro</em> del material.
            </h2>
            <p className="lead">Técnicas que permiten examinar el interior de materiales y componentes para identificar discontinuidades sin dañarlos.</p>
          </div>
            <TechAccordion items={volumetric} />
          </div>
        </div>
      </section>

      <section className="light-section ndt-block ndt-surface" id="superficiales">
        <div className="page-width">
          <div className="acc-layout">
          <div className="ndt-block-head">
            <p className="eyebrow red">02 — ENSAYOS SUPERFICIALES</p>
            <h2>
              Lo que se esconde en la <em>superficie.</em>
            </h2>
            <p className="lead">Técnicas que permiten identificar discontinuidades en la superficie de los materiales y, según el método, también en zonas próximas a ella.</p>
          </div>
            <TechAccordion items={superficial} />
          </div>
        </div>
      </section>

      <section className="red-section ndt-cta">
        <div className="page-width ndt-cta-inner">
          <div className="copy">
            <p className="eyebrow">Consulta</p>
            <h2>¿Necesitás realizar un ensayo?</h2>
            <p className="lead">Contanos qué necesitás evaluar y te orientamos sobre la técnica más adecuada.</p>
            <a className="btn btn-light" href="/#contacto" onClick={onConsult}>
              Consultar
            </a>
          </div>
          <nav className="ndt-related-services" aria-label="Explorá otros servicios">
            <p className="eyebrow">Conocé también nuestros otros servicios</p>
            <a href="#/servicios-complementarios-ndt">
              <span>
                <strong>Servicios complementarios NDT</strong>
                <small>Desarrollo de procedimientos y asesoramiento técnico especializado.</small>
              </span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
            </a>
            <a href="#/inspecciones">
              <span>
                <strong>Inspecciones</strong>
                <small>Servicios de medición, control e inspección especializada.</small>
              </span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
            </a>
          </nav>
        </div>
      </section>

      <Footer />
    </main>
  );
}
