document.addEventListener("DOMContentLoaded", () => {

    const tbody = document.getElementById("tbody");
  
    // Delegamos eventos dentro de la tabla
    tbody.addEventListener("click", async (e) => {
      const btn = e.target;
  
      /* -------------------- EDITAR -------------------- */
      if (btn.classList.contains("editBtn")) {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
  
        const tdNombre = tr.querySelector(".td-nombre");
        const tdCorreo = tr.querySelector(".td-correo");
        const tdActions = tr.querySelector(".td-actions");
  
        // Leemos valores actuales (antes de reemplazar)
        const nombreActual = tdNombre.innerText.trim();
        const correoActual = tdCorreo.innerText.trim();
  
        // Guardamos los originales en dataset para poder restaurarlos al cancelar
        tdNombre.dataset.original = nombreActual;
        tdCorreo.dataset.original = correoActual;
  
        // Convertimos a inputs
        tdNombre.innerHTML = `<input type="text" class="browser-default" id="editName" value="${escapeHtml(nombreActual)}">`;
        tdCorreo.innerHTML = `<input type="email" class="browser-default" id="editEmail" value="${escapeHtml(correoActual)}">`;
  
        // Reemplazar botones
        tdActions.innerHTML = `
          <button class="btn-small green saveBtn">Guardar</button>
          <button class="btn-small grey cancelBtn">Cancelar</button>
        `;
  
        // focus en el input nombre
        const nameInput = tr.querySelector('#editName');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }
  
      /* -------------------- CANCELAR -------------------- */
      if (btn.classList.contains("cancelBtn")) {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
  
        const tdNombre = tr.querySelector(".td-nombre");
        const tdCorreo = tr.querySelector(".td-correo");
        const tdActions = tr.querySelector(".td-actions");
  
        // Restaurar valores originales desde dataset (si existe), si no, usar texto actual
        const originalName = tdNombre.dataset.original ?? tdNombre.innerText.trim();
        const originalEmail = tdCorreo.dataset.original ?? tdCorreo.innerText.trim();
  
        tdNombre.innerHTML = `<span class="text">${escapeHtml(originalName)}</span>`;
        tdCorreo.innerHTML = `<span class="text">${escapeHtml(originalEmail)}</span>`;
  
        // Restaurar también dataset para futuras ediciones
        tdNombre.dataset.original = originalName;
        tdCorreo.dataset.original = originalEmail;
  
        tdActions.innerHTML = `
          <button class="btn-small editBtn">Editar</button>
          <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
        `;
      }
  
      /* -------------------- GUARDAR -------------------- */
      if (btn.classList.contains("saveBtn")) {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
  
        const nameInputEl = tr.querySelector("#editName");
        const emailInputEl = tr.querySelector("#editEmail");
        const newName = (nameInputEl?.value ?? "").trim();
        const newEmail = (emailInputEl?.value ?? "").trim();
  
        if (!newName || !newEmail) {
          M && M.toast ? M.toast({ html: "Nombre y correo requeridos" }) : alert("Nombre y correo requeridos");
          return;
        }
  
        // Disable button to prevent doble envío
        btn.disabled = true;
        btn.textContent = "Guardando...";
  
        try {
          const res = await fetch(`/update/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ name: newName, email: newEmail })
          });
  
          const data = await safeJson(res);
  
          if (res.ok && data && data.ok !== false) {
            // Actualizar vista sin recargar
            const tdNombre = tr.querySelector(".td-nombre");
            const tdCorreo = tr.querySelector(".td-correo");
            const tdActions = tr.querySelector(".td-actions");
  
            tdNombre.innerHTML = `<span class="text">${escapeHtml(newName)}</span>`;
            tdCorreo.innerHTML = `<span class="text">${escapeHtml(newEmail)}</span>`;
  
            // Actualizamos dataset original a los nuevos valores (para próximas cancelaciones)
            tdNombre.dataset.original = newName;
            tdCorreo.dataset.original = newEmail;
  
            tdActions.innerHTML = `
              <button class="btn-small editBtn">Editar</button>
              <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
            `;
  
            M && M.toast ? M.toast({ html: "Usuario actualizado", classes: "green" }) : null;
          } else {
            const msg = (data && data.message) ? data.message : `Error ${res.status}`;
            M && M.toast ? M.toast({ html: "Error al guardar: " + msg, classes: "red" }) : alert("Error al guardar: " + msg);
          }
        } catch (err) {
          console.error("Error al guardar:", err);
          M && M.toast ? M.toast({ html: "Error al guardar: " + err.message, classes: "red" }) : alert("Error al guardar: " + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "Guardar";
        }
      }
  
    });
  
    // util: escape HTML para evitar inyección
    function escapeHtml(s) {
      if (s === null || s === undefined) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  
    // util: parse json seguro
    async function safeJson(resp) {
      try { return await resp.json(); } catch (e) { return null; }
    }
  
  });
  