"use client";

/**
 * The last line of defence. Without this a database that isn't ready shows
 * the host's blank "a server error occurred", which says nothing about what
 * to check — and that page cost real hours during setup.
 *
 * Prisma's error text is matched loosely on purpose: the useful signal is
 * which of three things went wrong, and the fix for each is one sentence.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const text = `${error.message} ${error.digest ?? ""}`;

  const diagnosis = (() => {
    if (/does not exist in the current database|relation .* does not exist|P2021|P2022/i.test(text)) {
      return {
        title: "La base de datos todavía no tiene las tablas",
        what: "La base de datos está conectada pero vacía.",
        fix: "En Vercel, entra a Deployments y vuelve a desplegar (Redeploy). Las tablas se crean durante ese despliegue.",
      };
    }
    if (/Can't reach database server|P1001|P1002|ECONNREFUSED|timed out/i.test(text)) {
      return {
        title: "No podemos conectar con la base de datos",
        what: "El servidor está bien, pero la base de datos no responde.",
        fix: "Revisa DATABASE_URL y DIRECT_URL en las variables de entorno de Vercel, y que el proyecto de Neon esté activo. Después de cambiarlas hay que volver a desplegar.",
      };
    }
    if (/Authentication failed|P1000|password authentication/i.test(text)) {
      return {
        title: "La base de datos rechazó la contraseña",
        what: "La cadena de conexión no es válida.",
        fix: "Copia otra vez DATABASE_URL y DIRECT_URL desde Neon (Connect) y pégalas en Vercel. Luego vuelve a desplegar.",
      };
    }
    if (/SESSION_SECRET/i.test(text)) {
      return {
        title: "Falta configurar SESSION_SECRET",
        what: "Sin esa variable no se pueden firmar las sesiones.",
        fix: "Agrega SESSION_SECRET en Vercel con un texto largo y aleatorio, y vuelve a desplegar.",
      };
    }
    return {
      title: "Algo se rompió en el servidor",
      what: "No pudimos identificar la causa exacta.",
      fix: "Mira los Runtime Logs del despliegue en Vercel: el error aparece ahí con detalle.",
    };
  })();

  return (
    <html lang="es-CO">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0f1115",
          color: "#e8e6e3",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: 520, width: "100%" }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#8b8681",
            }}
          >
            Error del servidor
          </p>
          <h1 style={{ margin: "8px 0 12px", fontSize: 26, lineHeight: 1.2 }}>{diagnosis.title}</h1>
          <p style={{ margin: "0 0 16px", color: "#a9a5a0" }}>{diagnosis.what}</p>

          <div
            style={{
              border: "1px solid #2a2e37",
              borderLeft: "3px solid #6366f1",
              background: "#161a21",
              padding: "14px 16px",
              borderRadius: 6,
            }}
          >
            <p style={{ margin: 0, fontSize: 15 }}>
              <b>Qué hacer:</b> {diagnosis.fix}
            </p>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            {/* A full page load on purpose: global-error replaces the root
                layout, so client-side navigation would re-enter the broken
                tree instead of leaving it. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/admin/login"
              style={{
                border: "1px solid #2a2e37",
                color: "#e8e6e3",
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Ir al panel
            </a>
          </div>

          {error.digest ? (
            <p style={{ marginTop: 22, fontSize: 12, color: "#6b6862", fontFamily: "ui-monospace, monospace" }}>
              Referencia: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
