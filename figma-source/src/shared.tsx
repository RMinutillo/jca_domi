import { useEffect, useRef, useState } from "react";

const parseRoute = () => (location.hash.startsWith("#/") ? location.hash.slice(1).split("?")[0] : null);

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute() ?? "/");
  const pending = useRef<string | null>(null);
  const routeRef = useRef(route);
  routeRef.current = route;

  useEffect(() => {
    const onHash = () => {
      const next = parseRoute();
      if (next !== null) {
        setRoute(next);
        window.scrollTo(0, 0);
        return;
      }
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && !document.getElementById(id) && routeRef.current !== "/") {
        pending.current = id;
        setRoute("/");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (route === "/" && pending.current) {
      const id = pending.current;
      pending.current = null;
      requestAnimationFrame(() => setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60));
    }
  }, [route]);

  return route;
}

export function useReveal(selectors: string[], parallaxSelector?: string) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const seen = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>(selectors.join(",")).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const index = Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);
      el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
      el.classList.add("reveal");
      observer.observe(el);
    });

    const layers = parallaxSelector ? Array.from(document.querySelectorAll<HTMLElement>(parallaxSelector)) : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      layers.forEach((el) => {
        const rect = el.parentElement!.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.06;
        el.style.setProperty("--parallax", `${offset.toFixed(1)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (layers.length) {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const internal = parseRoute() !== null && parseRoute() !== "/";
  const close = () => setMenuOpen(false);
  return (
    <header className="site-header page-width">
      <a className="brand" href={internal ? "/#inicio" : "#/"} aria-label="JCA y Asociados, inicio" onClick={close}>
        <span className="brand-mark">A</span>
        <span>
          <b>JCA</b> &amp; Asociados
        </span>
      </a>
      <button
        className="menu-button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
      >
        <i />
        <i />
      </button>
      <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Navegación principal">
        <a className={internal ? "" : "active"} href={internal ? "/#inicio" : "#inicio"} onClick={close}>
          Inicio
        </a>
        <a className={internal ? "active" : ""} href={internal ? "/#nuestras-soluciones" : "#servicios"} onClick={close}>
          Servicios
        </a>
        <a href={internal ? "/#jca" : "#jca"} onClick={close}>
          JCA
        </a>
        <a href={internal ? "/#calidad" : "#calidad"} onClick={close}>
          Calidad
        </a>
      </nav>
      <a className="btn btn-red desktop-contact" href={internal ? "/#contacto" : "#contacto"}>
        Contactanos
      </a>
    </header>
  );
}

const linkedin = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M8 10v7M8 7v.01M12 17v-7m0 3a3 3 0 0 1 6 0v4" />
  </svg>
);

export function Footer() {
  return (
    <footer>
      <div className="page-width footer-inner">
        <a className="brand" href="/#inicio">
          <span className="brand-mark">A</span>
          <span>
            <b>JCA</b> &amp; Asociados
          </span>
        </a>
        <div className="footer-contact">
          <a href="mailto:info@ndtcontrol.com.ar">info@ndtcontrol.com.ar</a>
          <a href="https://www.linkedin.com/company/jca-asociados" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            {linkedin}
          </a>
        </div>
      </div>
      <div className="page-width footer-legal">
        <small>
          Desarrollado por <b>Growth</b>
        </small>
        <small>© 2024 JCA &amp; Asociados. Todos los derechos reservados.</small>
      </div>
    </footer>
  );
}

export function FloatingActions() {
  return (
    <>
      <a className="whatsapp" href="https://wa.me/541147181234" target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .78.8-2.92-.2-.31A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.33.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.06s.88 2.4 1 2.56c.12.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29z" />
        </svg>
      </a>
      <a className="back-top" href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Volver arriba">
        ↑
      </a>
    </>
  );
}
