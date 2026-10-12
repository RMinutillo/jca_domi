import { ReactNode } from "react";
import { Footer, Header, useReveal } from "./shared";
import laserInspection from "./assets/laser-inspection.png";
import pipeMetal from "./assets/pipe-metal.png";
import refineryDusk from "./assets/refinery-dusk.png";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className="insp-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const measures = [
  {
    title: "Espesores por ultrasonido",
    unit: "mm",
    text: "Medición del espesor remanente de chapas, cañerías y recipientes desde una sola cara, sin cortar ni parar el equipo.",
    use: "Control de corrosión y desgaste",
    icon: (
      <Icon>
        <rect x="24" y="6" width="16" height="10" />
        <path d="M32 16v6" />
        <rect x="10" y="22" width="44" height="22" />
        <path d="M18 28a14 14 0 0 0 28 0" opacity=".5" />
        <path d="M58 22v22M55 22h6M55 44h6" className="accent" />
        <path d="M10 54h44" opacity=".5" />
      </Icon>
    ),
  },
  {
    title: "Capa de pintura",
    unit: "µm",
    text: "Medición del espesor de recubrimientos sobre acero y otros sustratos, para verificar lo especificado.",
    use: "Sistemas de pintura y protección",
    icon: (
      <Icon>
        <rect x="8" y="40" width="48" height="14" />
        <path d="M8 34h48M8 28h48" />
        <path d="M8 28h48v6H8z" className="accent" />
        <path d="M32 6v16M26 16l6 6 6-6" />
      </Icon>
    ),
  },
  {
    title: "Rugosidad",
    unit: "Ra / Rz",
    text: "Medición del perfil superficial para confirmar que la preparación cumple el valor requerido.",
    use: "Preparación de superficie",
    icon: (
      <Icon>
        <path d="M6 36l6-8 5 10 5-14 5 16 5-10 5 8 5-12 5 10 5-6" />
        <path d="M6 36h52" className="accent" strokeDasharray="3 3" />
        <path d="M6 54h52" opacity=".5" />
      </Icon>
    ),
  },
  {
    title: "Dureza in-situ",
    unit: "HB · HV · HRC",
    text: "Determinación de la dureza del material directamente sobre el componente instalado, sin extraer probetas.",
    use: "Verificación de material y soldaduras",
    icon: (
      <Icon>
        <path d="M32 6v18" />
        <path d="M26 24h12l-6 14z" className="accent" />
        <rect x="8" y="38" width="48" height="16" />
        <path d="M28 38l4 6 4-6" opacity=".6" />
      </Icon>
    ),
  },
];

const stages = [
  { title: "Antes de soldar", items: ["Materiales y preparación de juntas", "Procedimientos y calificaciones", "Equipos y consumibles"] },
  { title: "Durante", items: ["Parámetros y secuencia de pasadas", "Temperatura de precalentamiento", "Limpieza entre pasadas"] },
  { title: "Después", items: ["Inspección visual y dimensional", "Control de ensayos asociados", "Registros e informe final"] },
];

export default function InspectionsPage({ onConsult }: { onConsult: () => void }) {
  useReveal(
    [
      ".insp-hero .ndt-copy > *",
      ".ndt-hero-image",
      ".svc-head > *",
      ".insp-card",
      ".insp-weld-copy > *",
      ".insp-stage",
      ".ndt-cta .copy > *",
    ],
    ".ndt-parallax",
  );

  return (
    <main className="ndt-page">
      <section className="ndt-hero insp-hero dark-section">
        <Header />
        <div className="page-width">
          <nav className="breadcrumb" aria-label="Ruta">
            <a href="/#nuestras-soluciones">Servicios</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Inspecciones</span>
          </nav>
        </div>
        <div className="page-width ndt-hero-grid">
          <div className="copy ndt-copy">
            <p className="eyebrow ruled">Nuestras soluciones</p>
            <h1>
              <em>Inspecciones</em>
            </h1>
            <p className="lead">Medición, control y evaluación especializada de componentes y soldaduras.</p>
            <a className="btn btn-light" href="#medicion">
              Ver inspecciones
            </a>
          </div>
          <div className="ndt-hero-image">
            <img className="ndt-parallax" src={laserInspection} alt="" />
          </div>
        </div>
      </section>

      <section className="light-section svc-block insp-measure" id="medicion">
        <div className="page-width">
          <div className="svc-head">
            <p className="eyebrow red">Medición y control</p>
            <h2>
              Medir en el lugar, <em>con precisión.</em>
            </h2>
            <p className="lead">Controles realizados in-situ, sobre el componente y sin interrumpir su uso.</p>
          </div>
          <div className="insp-grid">
            {measures.map((item) => (
              <article className="insp-card" key={item.title}>
                {item.icon}
                <span className="insp-unit">{item.unit}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <small>{item.use}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-section svc-block insp-weld" id="soldadura">
        <img className="ndt-block-bg ndt-parallax" src={refineryDusk} alt="" aria-hidden="true" />
        <div className="page-width">
          <div className="insp-weld-top">
            <div className="insp-weld-copy">
              <p className="eyebrow red">Inspecciones de soldadura</p>
              <h2>
                Inspectores <em>certificados.</em>
              </h2>
              <p className="lead">
                Inspeccionamos soldaduras en cada etapa del trabajo, con inspectores certificados que verifican que se
                cumpla lo especificado.
              </p>
              <div className="insp-cert">
                <strong>IRAM IAS U 500-169</strong>
                <span>Inspectores de soldadura certificados</span>
              </div>
            </div>
            <div className="insp-weld-image">
              <img className="ndt-parallax" src={pipeMetal} alt="" />
            </div>
          </div>
          <div className="insp-stages">
            {stages.map((stage, index) => (
              <div className="insp-stage" key={stage.title}>
                <span className="svc-step-index">0{index + 1}</span>
                <h3>{stage.title}</h3>
                <ul>
                  {stage.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="red-section ndt-cta">
        <div className="page-width ndt-cta-inner">
          <div className="copy">
            <p className="eyebrow">Consulta</p>
            <h2>¿Necesitás realizar una inspección?</h2>
            <p className="lead">Contanos qué necesitás medir o controlar y coordinamos la inspección.</p>
            <a className="btn btn-light" href="/#contacto" onClick={onConsult}>
              Hacé tu consulta
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
