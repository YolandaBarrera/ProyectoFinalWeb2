// Para editar los campos de un usuario

// Ejecuta el código solo cuando todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {

  // Selecciona el tbody de la tabla de usuarios
  const tbody = document.getElementById("tbody");

  // Listener: escucha clicks dentro del tbody
  tbody.addEventListener("click", async (e) => {
    const btn = e.target; // el elemento exacto que fue clickeado

    /* BOTÓN EDITAR  */
    if (btn.classList.contains("editBtn")) {
      const tr = btn.closest("tr"); // obtiene la fila completa
      const id = tr.dataset.id;     // obtiene el id del usuario desde el atributo data-id

      // Seleccionar las celdas de nombre, correo y acciones
      const tdNombre = tr.querySelector(".td-nombre");
      const tdCorreo = tr.querySelector(".td-correo");
      const tdActions = tr.querySelector(".td-actions");

      // Guardar los valores actuales para poder restaurarlos si se cancela
      const nombreActual = tdNombre.innerText.trim();
      const correoActual = tdCorreo.innerText.trim();
      tdNombre.dataset.original = nombreActual;
      tdCorreo.dataset.original = correoActual;

      // Reemplaza el contenido de las celdas por inputs editables
      tdNombre.innerHTML = `<input type="text" class="browser-default" id="editName" value="${escapeHtml(nombreActual)}">`;
      tdCorreo.innerHTML = `<input type="email" class="browser-default" id="editEmail" value="${escapeHtml(correoActual)}">`;

      // Cambiar los botones a "Guardar" y "Cancelar"
      tdActions.innerHTML = `
        <button class="btn-small green saveBtn">Guardar</button>
        <button class="btn-small grey cancelBtn">Cancelar</button>
      `;

      // En el input del nombre, para seleccionar su texto
      const nameInput = tr.querySelector('#editName');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }

// BOTÓN CANCELAR
// Esta sección se activa cuando se hace clic en el botón "Cancelar" durante la edición de un usuario
if (btn.classList.contains("cancelBtn")) {
  const tr = btn.closest("tr"); // Obtiene la fila (tr) correspondiente al botón
  const id = tr.dataset.id;     // Recupera el id del usuario desde el atributo data-id

  // Selecciona las celdas de nombre, correo y acciones dentro de la fila
  const tdNombre = tr.querySelector(".td-nombre");
  const tdCorreo = tr.querySelector(".td-correo");
  const tdActions = tr.querySelector(".td-actions");

  // Recupera los valores originales guardados antes de editar
  // Si por alguna razón no están en el dataset, se toma el texto actual
  const originalName = tdNombre.dataset.original ?? tdNombre.innerText.trim();
  const originalEmail = tdCorreo.dataset.original ?? tdCorreo.innerText.trim();

  // Restaura la información original en la tabla
  tdNombre.innerHTML = `<span class="text">${escapeHtml(originalName)}</span>`;
  tdCorreo.innerHTML = `<span class="text">${escapeHtml(originalEmail)}</span>`;

  // Guarda los valores originales en dataset nuevamente
  tdNombre.dataset.original = originalName;
  tdCorreo.dataset.original = originalEmail;

  // Vuelve a mostrar los botones originales: Editar y Eliminar
  tdActions.innerHTML = `
    <button class="btn-small editBtn">Editar</button>
    <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
  `;
}


// BOTÓN GUARDAR 
// Esta sección se activa cuando se hace clic en "Guardar" para enviar los cambios al servidor
if (btn.classList.contains("saveBtn")) {
  const tr = btn.closest("tr"); // Obtiene la fila correspondiente
  const id = tr.dataset.id;     // Obtiene el id del usuario

  // Obtiene los valores ingresados en los inputs de nombre y correo
  const nameInputEl = tr.querySelector("#editName");
  const emailInputEl = tr.querySelector("#editEmail");
  const newName = (nameInputEl?.value ?? "").trim(); // El operador ?. evita errores si no existe el elemento
  const newEmail = (emailInputEl?.value ?? "").trim();

  // Validación: ambos campos son obligatorios
  if (!newName || !newEmail) {
    // Usamos Materialize toast para el alert
    M && M.toast ? M.toast({ html: "Nombre y correo requeridos" }) : alert("Nombre y correo requeridos");
    return; // Salir de la función si hay campos vacíos
  }

  // Deshabilita el botón para evitar que el usuario haga clic varias veces
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    // Envía los datos al servidor usando fetch con método POST
    const res = await fetch(`/update/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail }) // Convierte los datos a JSON
    });

    // Parsear la respuesta JSON de manera segura
    const data = await safeJson(res);

    // Si la actualización fue exitosa
    if (res.ok && data && data.ok !== false) {
      const tdNombre = tr.querySelector(".td-nombre");
      const tdCorreo = tr.querySelector(".td-correo");
      const tdActions = tr.querySelector(".td-actions");

      // Actualiza la tabla con los nuevos valores
      tdNombre.innerHTML = `<span class="text">${escapeHtml(newName)}</span>`;
      tdCorreo.innerHTML = `<span class="text">${escapeHtml(newEmail)}</span>`;

      // Guarda los nuevos valores en dataset para futuras ediciones
      tdNombre.dataset.original = newName;
      tdCorreo.dataset.original = newEmail;

      // Restaurar los botones Editar y Eliminar
      tdActions.innerHTML = `
        <button class="btn-small editBtn">Editar</button>
        <a href="/delete/${encodeURIComponent(id)}" class="btn-small red deleteBtn" onclick="return confirm('¿Eliminar este usuario?');">Eliminar</a>
      `;

      // Mostrar notificación de éxito en Materialize 
      M && M.toast ? M.toast({ html: "Usuario actualizado", classes: "green" }) : null;
    } else {
      // Si hubo un error en la actualización, mostrar mensaje
      const msg = (data && data.message) ? data.message : `Error ${res.status}`;
      M && M.toast ? M.toast({ html: "Error al guardar: " + msg, classes: "red" }) : alert("Error al guardar: " + msg);
    }
  } catch (err) {
    // Captura errores de conexión o de fetch
    console.error("Error al guardar:", err);
    M && M.toast ? M.toast({ html: "Error al guardar: " + err.message, classes: "red" }) : alert("Error al guardar: " + err.message);
  } finally {
    // Reactiva el botón sin importar si hubo éxito o error
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
}

  });

  // FUNCIONES AUXILIARES 

  // Para caracteres especiales en HTML, para prevenir inyección o errores en la tabla
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Leer JSON de la respuesta de manera segura
  async function safeJson(resp) {
    try { return await resp.json(); } catch (e) { return null; }
  }

});
