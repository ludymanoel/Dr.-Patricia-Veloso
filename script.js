const WHATSAPP_URL =
  "https://wa.me/553884213318?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20Workshop%20Long%20Hair%20FUE%20da%20Dra.%20Patricia%20Veloso%20em%2013%20de%20novembro%20de%202026%20no%20Rio%20de%20Janeiro.%20Gostaria%20de%20receber%20informa%C3%A7%C3%B5es%20sobre%20inscri%C3%A7%C3%A3o.";

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.setAttribute("href", WHATSAPP_URL);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
});

document.querySelectorAll("details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;

    document.querySelectorAll("details[open]").forEach((openDetail) => {
      if (openDetail !== detail) openDetail.removeAttribute("open");
    });
  });
});
