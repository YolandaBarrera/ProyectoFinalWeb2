// Espera a que todo el DOM esté cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {

  // Obtenemos el tbody de la tabla donde están los usuarios
  const tbody = document.getElementById("tbody");

  // Delegamos eventos de click dentro del tbody
  // Esto permite manejar clicks en botones que se generan dinámicamente
  tbody.addEventListener("click", async (e) => {
      const btn = e.target;

      /* EDITAR  */
      if (btn.classList.contains("editBtn")) {
          // Obtenemos la fila completa del botón clickeado
          const tr = btn.closest("tr");
          const id = tr.dataset.id; // ID del usuario 

          const tdNombre = tr.querySelector(".td-nombre");
          const tdCorreo = tr.querySelector(".td-correo");
          const tdActions = tr.querySelector(".td-actions");

          // Leemos valores actuales de la fila
          const nombreActual = tdNombre.innerText.trim();
          const correoActual = tdCorreo.innerText.trim();

          // Guardamos los valores originales en el dataset para poder restaurarlos
          tdNombre.dataset.original = nombreActual;
          tdCorreo.dataset.original = correoActual;

          // Convertimos los <td> en inputs para poder editar
          tdNombre.innerHTML = `<input type="text" class="browser-default" id="editName" value="${escapeHtml(nombreActual)}">`;
          tdCorreo.innerHTML = `<input type="email" class="browser-default" id="editEmail" value="${escapeHtml(correoActual)}">`;

          // Reemplazamos los botones por Guardar y Cancelar
          tdActions.innerHTML = `
            <button class="btn-small green saveBtn">Guardar</button>
            <button class="btn-small grey cancelBtn">Cancelar</button>
          `;

          // Colocamos el foco en el input del nombre
          const nameInput = tr.querySelector('#editName');
          if (nameInput) {
              nameInput.focus();
              nameInput.select();
          }
      }

      /* CANCELAR */
      if (btn.classList.contains("cancelBtn")) {
          const tr = btn.closest("tr");
          const id = tr.dataset.id;

          const tdNombre = tr.querySelector(".td-nombre");
          const tdCorreo = tr.querySelector(".td-correo");
          const tdActions = tr.querySelector(".td-actions");

          // Restauramos los valores originales usando dataset, si no existen usamos el texto actual
          const originalName = tdNombre.dataset.original ?? tdNombre.innerText.trim();
          const originalEmail = tdCorreo.dataset.original ?? tdCorreo.innerText.trim();

          tdNombre.innerHTML = `<span class="text">${escapeHtml(originalName)}</span>`;
          tdCorreo.innerHTML = `<span class="text">${escapeHtml(originalEmail)}</span>`;

          // Restauramos también los datasets
          tdNombre.dataset.original = originalName;
          tdCorreo.dataset.original = originalEmail;

          // Restauramos los botones de Editar y Eliminar
          tdActions.innerHTML = `
            <button class="btn-small editBtn">Editar</button>
            <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
          `;
      }

      /* GUARDAR */
      if (btn.classList.contains("saveBtn")) {
          const tr = btn.closest("tr");
          const id = tr.dataset.id;

          // Obtenemos los nuevos valores de los inputs
          const nameInputEl = tr.querySelector("#editName");
          const emailInputEl = tr.querySelector("#editEmail");
          const newName = (nameInputEl?.value ?? "").trim();
          const newEmail = (emailInputEl?.value ?? "").trim();

          // Validamos que los campos no estén vacíos
          if (!newName || !newEmail) {
              M && M.toast ? M.toast({ html: "Nombre y correo requeridos" }) : alert("Nombre y correo requeridos");
              return;
          }

          // Deshabilitamos el botón para evitar doble envío
          btn.disabled = true;
          btn.textContent = "Guardando...";

          try {
              // Enviamos los datos al backend usando fetch
              const res = await fetch(`/update/${encodeURIComponent(id)}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Accept": "application/json" },
                  body: JSON.stringify({ name: newName, email: newEmail })
              });

              // Convertimos la respuesta a JSON de forma segura
              const data = await safeJson(res);

              if (res.ok && data && data.ok !== false) {
                  // Si todo salió bien, actualizamos la vista sin recargar
                  const tdNombre = tr.querySelector(".td-nombre");
                  const tdCorreo = tr.querySelector(".td-correo");
                  const tdActions = tr.querySelector(".td-actions");

                  tdNombre.innerHTML = `<span class="text">${escapeHtml(newName)}</span>`;
                  tdCorreo.innerHTML = `<span class="text">${escapeHtml(newEmail)}</span>`;

                  // Actualizamos dataset para futuras cancelaciones
                  tdNombre.dataset.original = newName;
                  tdCorreo.dataset.original = newEmail;

                  // Restauramos los botones de Editar y Eliminar
                  tdActions.innerHTML = `
                    <button class="btn-small editBtn">Editar</button>
                    <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
                  `;

                  // Mostramos toast de éxito (Materialize) 
                  M && M.toast ? M.toast({ html: "Usuario actualizado", classes: "green" }) : null;
              } else {
                  const msg = (data && data.message) ? data.message : `Error ${res.status}`;
                  M && M.toast ? M.toast({ html: "Error al guardar: " + msg, classes: "red" }) : alert("Error al guardar: " + msg);
              }
          } catch (err) {
              console.error("Error al guardar:", err);
              M && M.toast ? M.toast({ html: "Error al guardar: " + err.message, classes: "red" }) : alert("Error al guardar: " + err.message);
          } finally {
              // Restauramos el botón
              btn.disabled = false;
              btn.textContent = "Guardar";
          }
      }

  });

  //  FUNCIONES AUXILIARES 

  // Escapa caracteres HTML para prevenir inyección de código
  function escapeHtml(s) {
      if (s === null || s === undefined) return "";
      return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
  }

  // Convierte la respuesta de fetch a JSON de manera segura
  async function safeJson(resp) {
      try { return await resp.json(); } catch (e) { return null; }
  }

});
