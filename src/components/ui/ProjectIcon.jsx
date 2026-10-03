import { createElement, useEffect, useRef, useState } from "react";
import { getProjectIcon, hasStaticIcon } from "../../utils/projectIcons";
import { getIconSvg } from "../../utils/lucideCdn";

/**
 * ProjectIcon - Renderizza l'icona assegnata a un progetto.
 *
 * - Se la chiave è tra le icone "preferite" incluse nel bundle → render istantaneo.
 * - Altrimenti → scarica l'SVG dal CDN **solo quando l'icona entra nel viewport**
 *   (IntersectionObserver) e lo inlina; placeholder durante l'attesa e fallback
 *   all'icona di default se il download fallisce.
 *
 * @param {string} name      - Chiave icona (kebab-case, es. "rocket")
 * @param {string} className - classi per dimensione/colore
 */
const ProjectIcon = ({ name, className = "w-6 h-6", ...props }) => {
  const isStatic = hasStaticIcon(name);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  // Stato per l'icona caricata dal CDN: { name, svg, failed }
  const [loaded, setLoaded] = useState({
    name: null,
    svg: null,
    failed: false,
  });

  // Attiva il caricamento solo quando l'icona è (vicina al) viewport
  useEffect(() => {
    if (isStatic || !name) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isStatic, name]);

  // Scarica l'SVG quando l'icona è visibile
  useEffect(() => {
    if (isStatic || !name || !isVisible) return;
    let alive = true;
    getIconSvg(name).then((text) => {
      if (!alive) return;
      setLoaded({ name, svg: text || null, failed: !text });
    });
    return () => {
      alive = false;
    };
  }, [isStatic, name, isVisible]);

  // Icona statica (bundle) → render istantaneo
  if (isStatic || !name) {
    const Icon = getProjectIcon(name);
    return createElement(Icon, { className, strokeWidth: 2, ...props });
  }

  const isCurrent = loaded.name === name;

  // Fallback se il download è fallito
  if (isCurrent && loaded.failed) {
    const Icon = getProjectIcon(name);
    return createElement(Icon, { className, strokeWidth: 2, ...props });
  }

  // Placeholder (è anche l'elemento osservato) mentre l'SVG non è pronto:
  // mostra una rotellina di caricamento.
  if (!isCurrent || !loaded.svg) {
    return (
      <span
        ref={ref}
        className={`${className} inline-flex items-center justify-center`}
        aria-hidden="true"
        {...props}
      >
        <span
          className="inline-block w-1/2 h-1/2 rounded-full border-2 animate-spin"
          style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
        />
      </span>
    );
  }

  // SVG dal CDN (stroke="currentColor" → eredita colore; scala via CSS)
  return (
    <span
      ref={ref}
      className={`${className} inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`}
      dangerouslySetInnerHTML={{ __html: loaded.svg }}
      {...props}
    />
  );
};

export default ProjectIcon;


