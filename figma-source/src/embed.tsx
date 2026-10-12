import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Home } from "./App";

const host = document.getElementById("figma-home");

if (host) {
  const shadow = host.attachShadow({ mode: "open" });
  const rootStyle = document.createElement("style");
  rootStyle.textContent = ":host{display:block;font-family:Inter,Arial,sans-serif;color:#0d151b;background:#f7f8f8;--red:#ef1825;--deep-red:#b40c14;--ink:#0d151b;--muted:#687078;--line:rgba(15,22,27,.16)}";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/design/assets/site.css";
  shadow.append(rootStyle, stylesheet);

  const root = document.createElement("div");
  shadow.append(root);

  function EmbeddedHome() {
    const [topic, setTopic] = useState(() => sessionStorage.getItem("jca-consult-topic") ?? "");
    return <Home topic={topic} setTopic={setTopic} embedded />;
  }

  createRoot(root).render(<EmbeddedHome />);

  function scrollToSection(id: string) {
    const section = shadow.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth" });
  }

  shadow.addEventListener("click", (event) => {
    const anchor = (event.target as Element).closest("a[href^='#']") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("#/")) {
      event.preventDefault();
      window.location.href = `/design/index.html${href}`;
      return;
    }
    if (!shadow.getElementById(href.slice(1))) return;
    event.preventDefault();
    scrollToSection(href.slice(1));
  });

  const followHash = () => {
    const id = window.location.hash.slice(1);
    if (id && id !== "nuestras-soluciones") scrollToSection(id);
  };
  window.addEventListener("hashchange", followHash);
  requestAnimationFrame(() => requestAnimationFrame(followHash));
  window.addEventListener("load", followHash, { once: true });
}
