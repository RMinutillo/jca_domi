import { Footer, Header, useReveal } from "./shared";
import refineryDusk from "./assets/refinery-dusk.png";
import laserInspection from "./assets/laser-inspection.png";

const steps = [
  { title: "Relevamiento", text: "Análisis del componente, del código aplicable y de los requisitos del cliente." },
  { title: "Redacción", text: "Procedimiento de ensayo escrito, con técnica, alcance y criterios de aceptación." },
  { title: "Validación", text: "Revisión técnica y verificación de que el procedimiento cumple lo exigido." },
  { title: "Aplicación", text: "Uso en obra o planta, con registros e informes trazables." },
];

const codes = [
  { code: "IRAM NM-ISO 9712", label: "Calificación y certificación del personal de END" },
  { code: "ASME V", label: "Métodos de examen no destructivo" },
  { code: "ASME VIII", label: "Recipientes a presión" },
  { code: "ASME IX", label: "Calificación de soldadura" },
  { code: "ASME B31", label: "Cañerías a presión" },
  { code: "IRAM IAS U 500-169", label: "Inspectores de soldadura" },
];

const stamping = [
  { title: "Alcance del equipo", text: "Qué código y qué clase de equipo corresponden al proyecto." },
  { title: "Proceso y estampa aplicables", text: "Qué requisitos de fabricación, inspección y estampa alcanzan al caso." },
  { title: "Documentación", text: "Qué procedimientos, registros e informes se necesitan para cerrar el expediente." },
];

export default function ComplementaryPage({ onConsult }: { onConsult: () => void }) {
  useReveal(
    [
      ".svc-hero .ndt-copy > *",
      ".ndt-hero-image",
      ".svc-level > *",
      ".svc-head > *",
      ".svc-step",
      ".svc-code",
      ".svc-stamp li",
      ".ndt-cta .copy > *",
    ],
    ".ndt-parallax",
  );

  return (
    <main className="ndt-page">
      <section className="ndt-hero svc-hero dark-section">
        <Header />
        <div className="page-width">
          <nav className="breadcrumb" aria-label="Ruta">
            <a href="/#nuestras-soluciones">Servicios</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Servicios complementarios NDT</span>
          </nav>
        </div>
        <div className="page-width ndt-hero-grid">
          <div className="copy ndt-copy">
            <p className="eyebrow ruled">Nuestras soluciones</p>
            <h1>
              Servicios <em>complementarios</em> NDT
            </h1>
            <p className="lead">
              Soporte técnico especializado para el desarrollo de procedimientos y el cumplimiento de requerimientos
              aplicables.
            </p>
            <a className="btn btn-light" href="#procedimientos">
              Ver servicios
            </a>
          </div>
          <div className="ndt-hero-image">
            <img className="ndt-parallax" src={refineryDusk} alt="" />
          </div>
        </div>
      </section>

      <section className="light-section svc-levelsec">
        <div className="page-width svc-level">
          <div className="svc-level-badge">
            <strong>Nivel 3</strong>
            <span>IRAM NM-ISO 9712</span>
          </div>
          <div className="copy">
            <p className="eyebrow red">Respaldo técnico</p>
            <h2>
              Personal <em>Nivel 3</em> certificado.
            </h2>
            <p className="lead">
              Nuestros servicios están a cargo de personal Nivel 3 certificado según IRAM NM-ISO 9712, el máximo nivel
              de calificación en ensayos no destructivos.
            </p>
          </div>
        </div>
      </section>

      <section className="dark-section svc-block" id="procedimientos">
        <img className="ndt-block-bg ndt-parallax" src={laserInspection} alt="" aria-hidden="true" />
        <div className="page-width">
          <div className="svc-head">
            <p className="eyebrow red">Procedimientos de END</p>
            <h2>
              Cada ensayo, <em>por escrito.</em>
            </h2>
            <p className="lead">
              Desarrollamos procedimientos de ensayos no destructivos que ordenan cómo se inspecciona y cuándo una
              indicación es aceptable.
            </p>
          </div>
          <ol className="svc-steps">
            {steps.map((step, index) => (
              <li className="svc-step" key={step.title}>
                <span className="svc-step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="light-section svc-block svc-asme" id="asme">
        <div className="page-width">
          <div className="svc-head">
            <p className="eyebrow red">Asesoramiento ASME</p>
            <h2>
              Normas y códigos <em>aplicables.</em>
            </h2>
            <p className="lead">Te orientamos sobre qué códigos alcanzan a tu equipo y qué se debe cumplir en cada caso.</p>
          </div>
          <div className="svc-codes">
            {codes.map((item) => (
              <div className="svc-code" key={item.code}>
                <strong>{item.code}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="svc-stamp">
            <div className="svc-head">
              <p className="eyebrow red">Procesos y estampas</p>
              <h3>
                Asesoramiento vinculado a los procesos y estampas aplicables, definido según la información definitiva
                del cliente.
              </h3>
            </div>
            <ul>
              {stamping.map((item) => (
                <li key={item.title}>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="red-section ndt-cta">
        <div className="page-width ndt-cta-inner">
          <div className="copy">
            <p className="eyebrow">Consulta</p>
            <h2>¿Necesitás asesoramiento técnico?</h2>
            <p className="lead">Contanos sobre tu proyecto y te orientamos sobre los procedimientos y requisitos que corresponden.</p>
            <a className="btn btn-light" href="/#contacto" onClick={onConsult}>
              Hablemos de tu proyecto
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
