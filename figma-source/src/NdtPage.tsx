import { ReactNode, useState } from "react";
import { Footer, Header, useReveal } from "./shared";
import laserInspection from "./assets/laser-inspection.png";
import refineryDusk from "./assets/refinery-dusk.png";
import pipeMetal from "./assets/pipe-metal.png";
import methodMetal from "./assets/method-metal.png";
import heroMetal from "./assets/hero-metal.png";
import probe from "./assets/probe.png";

const Diagram = ({ children }: { children: ReactNode }) => (
  <svg className="tech-diagram" viewBox="0 0 240 130" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const diagrams: Record<string, ReactNode> = {
  radio: (
    <Diagram>
      <circle cx="120" cy="14" r="4" className="accent" />
      <path d="M120 18 74 62M120 18v44M120 18l46 44M120 18 62 62M120 18l58 44" opacity=".5" />
      <rect x="40" y="62" width="160" height="26" />
      <circle cx="132" cy="75" r="4" className="accent" />
      <path d="M40 112h160M40 108v8M200 108v8" opacity=".6" />
      <path d="M132 88v20" strokeDasharray="2 3" className="accent" />
    </Diagram>
  ),
  ultra: (
    <Diagram>
      <rect x="92" y="22" width="36" height="16" />
      <path d="M110 38v-8" opacity=".5" />
      <rect x="40" y="38" width="160" height="70" />
      <path d="M96 50a14 14 0 0 0 28 0M90 62a20 20 0 0 0 40 0" opacity=".5" />
      <path d="M150 88 128 62" className="accent" />
      <circle cx="152" cy="90" r="4" className="accent" />
      <path d="M136 76a10 10 0 0 1-12-6" opacity=".5" />
    </Diagram>
  ),
  penetrant: (
    <Diagram>
      <rect x="30" y="56" width="180" height="50" />
      <path d="M100 56l8 28 8-28" className="accent" />
      <path d="M94 56a4 4 0 0 1 8-8M118 56a4 4 0 0 0-8-8" opacity=".5" />
      <path d="M92 40c6-8 24-8 30 0" opacity=".5" />
      <path d="M30 56h56M130 56h80" strokeWidth="2" opacity=".35" />
    </Diagram>
  ),
  magnetic: (
    <Diagram>
      <rect x="30" y="56" width="180" height="40" />
      <path d="M100 56l6 20 6-20" className="accent" />
      <path d="M50 76h40M130 76h60" opacity=".6" />
      <path d="M44 56c20-40 52-40 62 0M114 56c10-40 42-40 62 0" opacity=".4" />
      <circle cx="109" cy="48" r="1.5" className="accent" />
      <circle cx="104" cy="45" r="1.5" className="accent" />
      <circle cx="114" cy="45" r="1.5" className="accent" />
    </Diagram>
  ),
  visual: (
    <Diagram>
      <path d="M20 96h200" opacity=".6" />
      <path d="M50 96c20-34 120-34 140 0" />
      <circle cx="130" cy="58" r="30" className="accent" />
      <path d="M152 80l26 26" className="accent" />
      <path d="M96 96c10-14 52-14 62 0" opacity=".5" />
    </Diagram>
  ),
};

type Technique = {
  id: string;
  title: string;
  diagram: keyof typeof diagrams;
  what: string;
  detects: string[];
  uses: string[];
  photo: string;
};

const volumetric: Technique[] = [
  {
    id: "radiografia",
    title: "Radiografía y gammagrafía",
    diagram: "radio",
    what: "Se atraviesa la pieza con radiación (rayos X o rayos gamma de una fuente sellada) y se registra la imagen en una película o detector digital. Las diferencias de espesor y densidad del material quedan reflejadas en la imagen.",
    detects: ["Porosidades e inclusiones de escoria", "Falta de fusión o de penetración", "Fisuras internas", "Variaciones de espesor por corrosión"],
    uses: ["Soldaduras de cañerías y recipientes a presión", "Fundiciones", "Tanques y calderas", "Estructuras metálicas"],
    photo: pipeMetal,
  },
  {
    id: "ultrasonido",
    title: "Ultrasonido",
    diagram: "ultra",
    what: "Un palpador emite ondas sonoras de alta frecuencia que viajan por el material y se reflejan ante cualquier discontinuidad. El equipo interpreta el eco para ubicar y dimensionar la indicación.",
    detects: ["Fisuras y laminaciones", "Falta de fusión e inclusiones", "Pérdida de espesor", "Medición de espesores remanentes"],
    uses: ["Soldaduras en planta y en campo", "Chapas, forjados y ejes", "Recipientes y cañerías en servicio", "Control de corrosión"],
    photo: laserInspection,
  },
];

const superficial: Technique[] = [
  {
    id: "liquidos",
    title: "Líquidos penetrantes",
    diagram: "penetrant",
    what: "Se aplica un líquido de gran capacidad de penetración que ingresa en las aberturas de la superficie. Tras eliminar el excedente, un revelador lo hace visible y marca la discontinuidad.",
    detects: ["Fisuras abiertas a la superficie", "Poros y pliegues", "Discontinuidades en soldaduras"],
    uses: ["Aceros inoxidables y metales no ferrosos", "Soldaduras y fundiciones", "Piezas mecanizadas"],
    photo: methodMetal,
  },
  {
    id: "particulas",
    title: "Partículas magnetizables",
    diagram: "magnetic",
    what: "Se magnetiza la pieza y se aplican partículas ferromagnéticas. Ante una discontinuidad se produce una fuga de flujo que atrae y concentra las partículas, dibujando su contorno.",
    detects: ["Fisuras superficiales", "Discontinuidades subsuperficiales cercanas a la superficie", "Defectos de soldadura"],
    uses: ["Acero ferromagnético", "Ejes, engranajes y forjados", "Componentes de izaje"],
    photo: heroMetal,
  },
  {
    id: "visual",
    title: "Inspección visual",
    diagram: "visual",
    what: "Examen directo de la superficie, o asistido con lupas, boroscopios y calibres, según criterios de aceptación de las normas aplicables. Suele ser el primer paso de cualquier inspección.",
    detects: ["Socavaduras y desalineaciones", "Grietas y salpicaduras visibles", "Corrosión y deformaciones"],
    uses: ["Antes, durante y después de soldar", "Tanques, estructuras y equipos", "Verificación previa a otros ensayos"],
    photo: probe,
  },
];

const TechIcon = () => (
  <svg className="acc-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" />
  </svg>
);

function TechAccordion({ items }: { items: Technique[] }) {
  const [open, setOpen] = useState<string | null>(items[0].id);
  return (
    <div className="acc-list">
      {items.map((tech) => {
        const isOpen = open === tech.id;
        return (
          <article className={isOpen ? "acc-item is-open" : "acc-item"} id={tech.id} key={tech.id}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${tech.id}-panel`}
                onClick={() => setOpen(isOpen ? null : tech.id)}
              >
                <TechIcon />
                <span>{tech.title}</span>
                <i aria-hidden="true" />
              </button>
            </h3>
            <div className="acc-panel" id={`${tech.id}-panel`} role="region">
              <div className="acc-panel-inner">
                <div className="acc-media">
                  <div className="acc-diagram">{diagrams[tech.diagram]}</div>
                  <div className="acc-photo">
                    <img src={tech.photo} alt="" loading="lazy" />
                  </div>
                </div>
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
      ".ndt-hero-image",
      ".ndt-intro .copy > *",
      ".ndt-facts li",
      ".ndt-block-head > *",
      ".acc-item",
      ".ndt-cta .copy > *",
    ],
    ".ndt-parallax",
  );

  return (
    <main className="ndt-page">
      <section className="ndt-hero dark-section">
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
            <p className="eyebrow ruled">Nuestras soluciones</p>
            <h1>
              Ensayos no <em>destructivos</em>
            </h1>
            <p className="lead">
              Evaluamos materiales, piezas y soldaduras para detectar discontinuidades sin alterar su integridad.
            </p>
            <a className="btn btn-light" href="#volumetricos">
              Ver los ensayos
            </a>
          </div>
          <div className="ndt-hero-image">
            <img className="ndt-parallax" src={laserInspection} alt="" />
          </div>
        </div>
      </section>

      <section className="light-section ndt-intro">
        <div className="page-width split">
          <div className="copy">
            <p className="eyebrow red">Introducción</p>
            <h2>
              Mirar adentro,
              <br />
              sin <em>dañar.</em>
            </h2>
            <p className="lead">
              Los ensayos no destructivos (END) permiten evaluar el estado de un material o componente sin alterar su
              uso futuro. Según dónde pueda estar la discontinuidad, se aplican técnicas volumétricas, que revisan el
              interior de la pieza, o superficiales, que revisan su superficie.
            </p>
            <div className="ndt-jump">
              <a className="btn btn-dark" href="#volumetricos">
                Ensayos volumétricos
              </a>
              <a className="btn btn-dark" href="#superficiales">
                Ensayos superficiales
              </a>
            </div>
          </div>
          <ul className="ndt-facts">
            <li>
              <strong>Sin alterar la pieza</strong>
              <span>La inspección no modifica sus propiedades ni su servicio posterior.</span>
            </li>
            <li>
              <strong>Dentro y fuera</strong>
              <span>Técnicas para el interior del material y para su superficie.</span>
            </li>
            <li>
              <strong>Personal calificado</strong>
              <span>Nivel 3 certificado según IRAM NM-ISO 9712.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="dark-section ndt-block ndt-volumetric" id="volumetricos">
        <img className="ndt-block-bg ndt-parallax" src={refineryDusk} alt="" aria-hidden="true" />
        <div className="page-width">
          <div className="acc-layout">
          <div className="ndt-block-head">
            <p className="eyebrow red">01 — Ensayos volumétricos</p>
            <h2>
              Lo que ocurre <em>dentro</em> del material.
            </h2>
            <p className="lead">Técnicas que atraviesan la pieza para revelar discontinuidades internas.</p>
          </div>
            <TechAccordion items={volumetric} />
          </div>
        </div>
      </section>

      <section className="light-section ndt-block ndt-surface" id="superficiales">
        <div className="page-width">
          <div className="acc-layout">
          <div className="ndt-block-head">
            <p className="eyebrow red">02 — Ensayos superficiales</p>
            <h2>
              Lo que se esconde en la <em>superficie.</em>
            </h2>
            <p className="lead">Técnicas que detectan discontinuidades abiertas o cercanas a la superficie.</p>
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
