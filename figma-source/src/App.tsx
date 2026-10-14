import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Footer, Header, FloatingActions, useRoute } from "./shared";
import NdtPage from "./NdtPage";
import ComplementaryPage from "./ComplementaryPage";
import InspectionsPage from "./InspectionsPage";
import heroMetal from "./assets/hero-metal.png";
import methodMetal from "./assets/method-metal.png";
import pipeMetal from "./assets/pipe-metal.png";
import solutionsBg from "./assets/solutions-bg.png";
import industriesBg from "./assets/industries-bg.png";

function ImageCrop({
  className,
  src,
}: {
  className: string;
  src: string;
}) {
  return (
    <div className={`image-crop ${className}`} aria-hidden="true">
      <img src={src} alt="" />
    </div>
  );
}

const industries = [
  { name: "Petroquímica", icon: "factory" },
  { name: "Naval", icon: "ship" },
  { name: "Metalúrgica", icon: "gear" },
  { name: "Civil", icon: "building" },
  { name: "Alimenticia", icon: "food" },
  { name: "Nuclear", icon: "nuclear" },
] as const;

type IndustryIconName = (typeof industries)[number]["icon"];

function IndustryIcon({ name }: { name: IndustryIconName }) {
  const paths: Record<IndustryIconName, ReactNode> = {
    factory: (
      <>
        <path d="M3 27h26M5 27V14l6 4v-4l6 4v-4l6 4V6h4v21" />
        <path d="M9 22h3M15 22h3M21 22h3" />
      </>
    ),
    ship: (
      <>
        <path d="M4 20h24l-3 6H7l-3-6Z" />
        <path d="M8 20v-6h16v6M12 14V9h8v5M16 9V5" />
        <path d="M3 29c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1 2 1 4 1" />
      </>
    ),
    gear: (
      <>
        <circle cx="16" cy="16" r="4" />
        <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" />
        <circle cx="16" cy="16" r="9" />
      </>
    ),
    building: (
      <>
        <path d="M4 28h24M7 28V6h11v22M18 12h7v16" />
        <path d="M10 10h2M13 10h2M10 14h2M13 14h2M10 18h2M13 18h2M10 22h2M13 22h2M21 16h1M21 20h1M21 24h1" />
      </>
    ),
    food: (
      <>
        <path d="M12 4h8M13 4v4l-3 4v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V12l-3-4V4" />
        <path d="M10 16h12M10 23h12" />
      </>
    ),
    nuclear: (
      <>
        <circle cx="16" cy="16" r="2.2" />
        <path d="M14.5 13.6 10 5.8A12 12 0 0 0 4 16h9" />
        <path d="M17.5 13.6 22 5.8A12 12 0 0 1 28 16h-9" />
        <path d="M14.5 18.4 10 26.2a12 12 0 0 0 12 0l-4.5-7.8" />
      </>
    ),
  };
  return (
    <svg className="industry-icon" viewBox="0 0 32 32" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const solutions = [
  {
    title: "Ensayos no destructivos",
    page: "#/ensayos-no-destructivos",
    text: "Evaluación de materiales, piezas y soldaduras sin dañarlos.",
    detail: "Ultrasonido, radiografía, partículas magnetizables y líquidos penetrantes aplicados en planta o en campo, con informes certificados.",
  },
  {
    title: "Servicios complementarios NDT",
    page: "#/servicios-complementarios-ndt",
    text: "Desarrollo de procedimientos y asesoramiento técnico especializado.",
    detail: "Elaboración de procedimientos de ensayo, calificación de personal y asistencia técnica para cumplir normas y requisitos de cliente.",
  },
  {
    title: "Inspecciones",
    page: "#/inspecciones",
    text: "Servicios de medición, control e inspección especializada.",
    detail: "Inspección visual, mediciones dimensionales y control de calidad de componentes y equipos durante fabricación o servicio.",
  },
];

const methods = [
  {
    title: "Ultrasonido",
    detail: "Detección precisa de discontinuidades internas.",
  },
  {
    title: "Radiografía y gammagrafía",
    detail: "Inspección volumétrica sin alterar el componente.",
  },
  {
    title: "Ensayos superficiales",
    detail: "Control de fisuras y defectos en la superficie.",
  },
];

export function Home({ topic, setTopic, embedded = false }: { topic: string; setTopic: (value: string) => void; embedded?: boolean }) {
  const solutionsCopy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const copy = solutionsCopy.current;
    if (!copy) return;
    const heading = copy.querySelector("h2")!;
    const indicator = copy.querySelector<SVGElement>(".solution-indicator")!;
    let disposed = false;
    const rightEdge = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Math.max(...Array.from(range.getClientRects(), rect => rect.right));
    };
    const align = () => {
      if (disposed) return;
      const rect = indicator.getBoundingClientRect();
      const currentOffset = parseFloat(getComputedStyle(indicator).left) || 0;
      const originalCenter = rect.left + rect.width / 2 - currentOffset;
      const textRight = Math.max(...Array.from(copy.querySelectorAll(".solution-item b,.solution-item small"), rightEdge));
      const target = Math.min(originalCenter, Math.max(rightEdge(heading), textRight + 18));
      copy.style.setProperty("--solution-indicator-shift", `${target - originalCenter}px`);
    };
    const observer = new ResizeObserver(align);
    observer.observe(copy);
    observer.observe(heading);
    document.fonts.ready.then(align);
    document.fonts.addEventListener("loadingdone", align);
    align();
    return () => { disposed = true; observer.disconnect(); document.fonts.removeEventListener("loadingdone", align); };
  }, []);
  const [openMethod, setOpenMethod] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (embedded) return;
    const stack = Array.from(document.querySelectorAll<HTMLElement>(".methods, .solutions, .industries, .experience, .contact"));
    const pin = () =>
      stack.forEach((el, i) => {
        el.classList.add("stacked");
        el.style.zIndex = String(i + 1);
        el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
      });
    pin();
    window.addEventListener("resize", pin);
    const ro = new ResizeObserver(pin);
    stack.forEach((el) => ro.observe(el));
    return () => {
      window.removeEventListener("resize", pin);
      ro.disconnect();
    };
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = document.querySelectorAll<HTMLElement>(
      [
        ".hero .copy > *",
        ".hero-image",
        ".interior .copy > *",
        ".pipe-image",
        ".methods .copy > *:not(.method-list)",
        ".method-list button",
        ".method-visual > *",
        ".solutions .copy > *",
        ".solution-item",
        ".industries .copy > *:not(ul)",
        ".industry-grid li",
        ".experience-grid > *",
        ".experience .copy > *",
        ".contact-copy > *:not(ul)",
        ".contact-details li",
        ".contact form > *",
        "footer .footer-inner > *",
        "footer .footer-legal",
      ].join(","),
    );
    const seen = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const index = Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);
      el.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 80}ms`);
      el.classList.add("reveal");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main>
      {!embedded && <>
      <section className="hero dark-section" id="inicio">
        <Header />

        <div className="page-width split hero-layout">
          <div className="copy hero-copy">
            <p className="eyebrow ruled">Ensayos no destructivos</p>
            <h1>
              Lo que no ves.
              <br />
              También <em>importa.</em>
            </h1>
            <p className="lead">
              Evaluamos materiales, soldaduras y componentes para conocer su estado, sin dañarlos.
            </p>
            <a className="btn btn-light" href="#interior">
              Descubrí cómo
            </a>
          </div>
          <ImageCrop className="hero-image" src={heroMetal} />
        </div>
      </section>

      <section className="light-section interior" id="interior">
        <div className="page-width split reverse-mobile">
          <ImageCrop className="pipe-image" src={pipeMetal} />
          <div className="copy interior-copy">
            <p className="eyebrow red">Mirar más adentro</p>
            <h2>
              La superficie
              <br />
              no cuenta <em>todo.</em>
            </h2>
            <p className="lead">
              Detectamos discontinuidades y evaluamos el estado de materiales y componentes sin
              alterar las piezas inspeccionadas.
            </p>
            <a className="btn btn-dark" href="#metodos">
              Explorá el interior
            </a>
          </div>
        </div>
      </section>

      <section className="red-section methods" id="metodos">
        <div className="page-width split">
          <div className="method-visual">
            <ImageCrop className="method-image" src={methodMetal} />
            <a className="btn btn-light" href="#servicios">
              Descubrí nuestras soluciones
            </a>
          </div>
          <div className="copy method-copy">
            <p className="eyebrow">El método adecuado</p>
            <h2>
              Distintos métodos.
              <br />
              Un mismo objetivo.
            </h2>
            <p className="lead">
              Cada inspección requiere una técnica adecuada según el material, el componente y lo
              que se necesita evaluar.
            </p>
            <div className="method-list">
              {methods.map((method, index) => (
                <button
                  key={method.title}
                  onClick={() => setOpenMethod(openMethod === index ? null : index)}
                  aria-expanded={openMethod === index}
                >
                  <span className="list-number">0{index + 1}</span>
                  <span>
                    <b>{method.title}</b>
                    {openMethod === index && <small>{method.detail}</small>}
                  </span>
                  <i>{openMethod === index ? "−" : "+"}</i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      </>}

      <section className="light-section solutions" id="servicios">
        <div className="solutions-bg" aria-hidden="true">
          <img src={solutionsBg} alt="" />
        </div>
        <div className="page-width solutions-inner">
          <div className="copy solutions-copy" ref={solutionsCopy}>
            <p className="eyebrow red">Nuestras soluciones</p>
            <h2>
              <em>Soluciones</em> para cada
              <br />
              necesidad de inspección.
            </h2>
            <div className="solutions-list">
              {solutions.map((solution) => (
                <a
                  className="solution-item"
                  key={solution.title}
                  href={"page" in solution ? solution.page : "#contacto"}
                  onClick={() => {
                    if (!("page" in solution)) setTopic(solution.title);
                  }}
                >
                  <span>
                    <b>{solution.title}</b>
                    <small>{solution.text}</small>
                  </span>
                  <svg className="solution-indicator" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 3 5 5-5 5" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dark-section industries" id="industrias">
        <div className="industries-bg" aria-hidden="true">
          <img src={industriesBg} alt="" />
        </div>
        <span className="industries-arc" aria-hidden="true" />
        <div className="page-width industries-inner">
          <div className="copy industry-copy">
            <p className="eyebrow red">Industrias</p>
            <h2>
              Experiencia en
              <br />
              distintos sectores
              <br />
              <em>industriales.</em>
            </h2>
            <p className="lead">
              Brindamos soluciones de inspección y control
              <br />a empresas de diversas industrias.
            </p>
            <ul className="industry-grid">
              {industries.map(({ name, icon }) => (
                <li key={name}>
                  <IndustryIcon name={icon} />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="red-section experience" id="jca">
        <div className="page-width experience-grid">
          <div className="copy">
            <p className="eyebrow">JCA &amp; Asociados</p>
            <h2>
              Experiencia que
              <br />
              respalda cada inspección.
            </h2>
            <p className="lead">
              Desde hace más de cinco décadas, JCA acompaña a distintos sectores industriales con
              soluciones de inspección y ensayos no destructivos, combinando experiencia técnica,
              personal calificado y trabajo bajo normas reconocidas.
            </p>
            <a className="btn btn-light" href="#contacto">
              Conocé más sobre JCA
            </a>
          </div>
          <div className="stat">
            <strong>+50</strong>
            <span>Años de trayectoria</span>
          </div>
          <div className="stat" id="calidad">
            <strong>Nivel 3</strong>
            <span>Personal certificado según IRAM NM-ISO 9712</span>
          </div>
          <div className="stat">
            <strong>IRAM IAS<br />U 500-169</strong>
            <span>Inspectores de soldadura certificados</span>
          </div>
          <div className="stat">
            <strong>ASME</strong>
            <span>Asesoramiento especializado</span>
          </div>
        </div>
      </section>

      <section className="light-section contact" id="contacto">
        <div className="page-width split contact-layout">
          <div className="copy contact-copy">
            <p className="eyebrow red">Contacto</p>
            <h2>
              Hablemos de tu
              <br />
              próxima <em>inspección.</em>
            </h2>
            <p className="lead">
              Contanos qué necesitás evaluar y nuestro equipo puede orientarte sobre la solución más
              adecuada.
            </p>
            <ul className="contact-details">
              <li><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg></span> info@ndtcontrol.com.ar</li>
              <li><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg></span> +54 11 4718 1234</li>
              <li><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span> Buenos Aires, Argentina</li>
              <li><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 10v7M8 7v.01M12 17v-7m0 3a3 3 0 0 1 6 0v4"/></svg></span> <a href="https://www.linkedin.com/company/jca-asociados" target="_blank" rel="noreferrer">LinkedIn</a></li>
            </ul>
          </div>
          <form onSubmit={submitForm}>
            <div className="form-row">
              <label>
                Nombre y apellido <b>*</b>
                <input required name="name" />
              </label>
              <label>
                Empresa
                <input name="company" />
              </label>
            </div>
            <div className="form-row">
              <label>
                Email <b>*</b>
                <input required type="email" name="email" />
              </label>
              <label>
                Teléfono
                <input type="tel" name="phone" />
              </label>
            </div>
            <label>
              ¿Sobre qué necesitás asesoramiento? <b>*</b>
              <select required value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="" disabled>Seleccioná una opción</option>
                <option>Ensayos no destructivos</option>
                <option>Servicios complementarios NDT</option>
                <option>Inspecciones</option>
              </select>
            </label>
            <label>
              Consulta <b>*</b>
              <textarea required placeholder="Contanos tu consulta..." />
            </label>
            <button className="btn btn-red submit-button" type="submit">
              {sent ? "Consulta enviada" : "Enviar consulta"}
            </button>
            {sent && <p className="success-message">Gracias. Nos pondremos en contacto a la brevedad.</p>}
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function App() {
  const route = useRoute();
  const [topic, setTopic] = useState(() => sessionStorage.getItem("jca-consult-topic") ?? "");
  const embedded = new URLSearchParams(location.search).has("embedded");
  useEffect(() => {
    if (!embedded) return;
    const reportHeight = () => window.parent.postMessage({
      type: "jca-figma-height",
      height: document.documentElement.scrollHeight,
      sections: Object.fromEntries(["servicios", "jca", "calidad", "contacto"].map((id) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? 0])),
    }, location.origin);
    const observer = new ResizeObserver(reportHeight);
    observer.observe(document.body);
    reportHeight();
    const navigate = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a[href^='#/']") as HTMLAnchorElement | null;
      if (anchor) {
        event.preventDefault();
        window.top!.location.href = `/design/index.html${anchor.getAttribute("href")}`;
        return;
      }
      const sectionLink = target.closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!sectionLink) return;
      const id = sectionLink.getAttribute("href")?.slice(1);
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      window.parent.postMessage({ type: "jca-figma-scroll", section: id }, location.origin);
    };
    document.addEventListener("click", navigate);
    return () => { observer.disconnect(); document.removeEventListener("click", navigate); };
  }, [embedded]);
  return (
    <>
      {route === "/ensayos-no-destructivos" ? (
        <NdtPage onConsult={() => sessionStorage.setItem("jca-consult-topic", "Ensayos no destructivos")} />
      ) : route === "/servicios-complementarios-ndt" ? (
        <ComplementaryPage onConsult={() => sessionStorage.setItem("jca-consult-topic", "Servicios complementarios NDT")} />
      ) : route === "/inspecciones" ? (
        <InspectionsPage onConsult={() => sessionStorage.setItem("jca-consult-topic", "Inspecciones")} />
      ) : (
        <Home topic={topic} setTopic={setTopic} embedded={embedded} />
      )}
      {!embedded && <FloatingActions />}
    </>
  );
}
