(function (global) {
  "use strict";

  let elements = null;
  let activeResolve = null;
  let previousFocus = null;

  function build() {
    if (elements) return elements;

    const overlay = document.createElement("div");
    overlay.className = "app-dialog-overlay hidden";
    overlay.setAttribute("aria-hidden", "true");

    const dialog = document.createElement("section");
    dialog.className = "app-dialog";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "appDialogTitle");
    dialog.setAttribute("aria-describedby", "appDialogMessage");

    const icon = document.createElement("div");
    icon.className = "app-dialog-icon";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("h2");
    title.id = "appDialogTitle";

    const message = document.createElement("p");
    message.id = "appDialogMessage";

    const actions = document.createElement("div");
    actions.className = "app-dialog-actions";
    const cancelButton = document.createElement("button");
    cancelButton.className = "secondary-btn";
    cancelButton.type = "button";
    const confirmButton = document.createElement("button");
    confirmButton.className = "primary-btn";
    confirmButton.type = "button";
    actions.append(cancelButton, confirmButton);
    dialog.append(icon, title, message, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    elements = { overlay, dialog, icon, title, message, cancelButton, confirmButton };
    cancelButton.addEventListener("click", () => close(false));
    confirmButton.addEventListener("click", () => close(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay && !cancelButton.classList.contains("hidden")) close(false);
    });
    document.addEventListener("keydown", event => {
      if (overlay.classList.contains("hidden")) return;
      if (event.key === "Escape" && !cancelButton.classList.contains("hidden")) close(false);
      if (event.key === "Tab") {
        const focusable = [cancelButton, confirmButton].filter(button => !button.classList.contains("hidden"));
        const currentIndex = focusable.indexOf(document.activeElement);
        const nextIndex = event.shiftKey
          ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
          : (currentIndex + 1) % focusable.length;
        event.preventDefault();
        focusable[nextIndex].focus();
      }
    });
    return elements;
  }

  function close(result) {
    if (!elements || !activeResolve) return;
    elements.overlay.classList.add("is-closing");
    const resolve = activeResolve;
    activeResolve = null;
    setTimeout(() => {
      elements.overlay.classList.add("hidden");
      elements.overlay.classList.remove("is-closing", "is-visible");
      elements.overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("dialog-open");
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      resolve(result);
    }, 160);
  }

  function open(options) {
    const ui = build();
    if (activeResolve) close(false);
    previousFocus = document.activeElement;
    ui.title.textContent = options.title;
    ui.message.textContent = options.message;
    ui.icon.textContent = options.variant === "danger" ? "!" : options.variant === "success" ? "✓" : "i";
    ui.overlay.dataset.variant = options.variant || "info";
    ui.confirmButton.textContent = options.confirmText || "Entendi";
    ui.cancelButton.textContent = options.cancelText || "Cancelar";
    ui.cancelButton.classList.toggle("hidden", !options.showCancel);
    ui.confirmButton.classList.toggle("danger-btn", options.variant === "danger");
    ui.overlay.classList.remove("hidden", "is-closing");
    ui.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("dialog-open");
    requestAnimationFrame(() => ui.overlay.classList.add("is-visible"));
    setTimeout(() => ui.confirmButton.focus(), 20);
    return new Promise(resolve => { activeResolve = resolve; });
  }

  function confirm(options) {
    return open({ ...options, showCancel: true, confirmText: options.confirmText || "Confirmar" });
  }

  function notify(options) {
    return open({ ...options, showCancel: false, confirmText: options.confirmText || "Entendi" });
  }

  global.AppDialog = { confirm, notify };
})(typeof window !== "undefined" ? window : globalThis);
