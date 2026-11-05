// Ventana para crear la cuenta, unirse a la pareja y ver cómo va la sincronización.
import {
  createCouple, currentAccount, joinCouple, signIn, signOut, signUp, syncConfigured, syncError, syncInfo, syncNow,
} from './sync.js';
import { esc, icon, modal, toast } from './ui.js';

const STATUS_TEXT = {
  off: 'Sin conectar', syncing: 'Sincronizando…', synced: 'Al día', offline: 'Sin internet: se guardará al volver', error: 'Pendiente de sincronizar',
};
const head = (title) => `<div class="manage-head"><h2>${title}</h2><button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button></div>`;

const accountForm = (mode, notice = '') => `
  ${head(mode === 'login' ? 'Entrar a su cuenta' : 'Crear tu cuenta')}
  <p class="sync-note">Con una cuenta para cada quien, sus libretas, fotos, citas y vaquitas se comparten y quedan respaldadas.</p>
  ${notice ? `<p class="sync-error" role="alert">${esc(notice)}</p>` : ''}
  <form class="sync-form" data-form="${mode}">
    <label class="field"><span class="field-label">Correo</span>
      <input class="text-field" name="email" type="email" autocomplete="email" required></label>
    <label class="field"><span class="field-label">Contraseña</span>
      <input class="text-field" name="password" type="password" minlength="6" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required></label>
    <button class="btn primary">${mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
  </form>
  <button type="button" class="link-btn" data-switch="${mode === 'login' ? 'signup' : 'login'}">${mode === 'login' ? 'Aún no tengo cuenta' : 'Ya tengo cuenta'}</button>`;

const coupleForm = (notice = '') => `
  ${head('Conectar con tu pareja')}
  ${notice ? `<p class="sync-error" role="alert">${esc(notice)}</p>` : ''}
  <p class="sync-note">Solo una de las dos personas crea el código. La otra lo escribe aquí.</p>
  <button class="btn primary sync-wide" data-create>Crear nuestro código</button>
  <form class="sync-form" data-form="join">
    <label class="field"><span class="field-label">¿Ya te dieron un código?</span>
      <input class="text-field sync-code" name="code" autocomplete="off" autocapitalize="characters" maxlength="8" required placeholder="A1B2C3D4"></label>
    <button class="btn ghost">Unirme</button>
  </form>
  <button type="button" class="link-btn" data-signout>Salir de esta cuenta</button>`;

const connected = (account) => {
  const info = syncInfo();
  const waiting = account.membership.member_count < 2;
  const when = info.lastSync ? new Date(info.lastSync).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }) : '';
  return `${head('Sincronización')}
    <p class="sync-state is-${info.status}"><i></i>${esc(STATUS_TEXT[info.status] ?? '')}${when && info.status === 'synced' ? ` · ${esc(when)}` : ''}</p>
    <p class="sync-note">Conectado como <strong>${esc(account.user.email)}</strong>.</p>
    ${waiting ? `<div class="sync-invite"><span class="field-label">Comparte este código con tu pareja</span>
      <strong class="sync-invite-code">${esc(account.membership.invite_code)}</strong>
      <button type="button" class="btn ghost" data-copy="${esc(account.membership.invite_code)}">Copiar código</button></div>`
    : '<p class="sync-note">Su pareja está conectada: todo lo que hagan se comparte. 💕</p>'}
    <p class="sync-note">Si los dos editan la misma libreta a la vez, se conservan ambas versiones: una aparecerá como "(copia)".</p>
    <div class="dialog-actions">
      <button type="button" class="btn ghost" data-signout>Salir</button>
      <button type="button" class="btn primary" data-now>Sincronizar ahora</button>
    </div>`;
};

export async function openSyncDialog() {
  if (!syncConfigured()) {
    return modal(`${head('Sincronización')}<p class="sync-note">Todavía falta conectar el proyecto de Supabase.</p>`, (d, close) => {
      d.querySelector('[data-close]').onclick = () => close();
    });
  }
  return modal('<p class="sync-note">Cargando…</p>', (d, close) => {
    const paint = (html) => { d.innerHTML = html; };
    const showAccount = async (notice = '') => {
      try {
        const account = await currentAccount();
        if (!account.user) paint(accountForm('login', notice));
        else if (!account.membership) paint(coupleForm(notice));
        else paint(connected(account));
      } catch (error) {
        paint(`${head('Sincronización')}<p class="sync-error" role="alert">${esc(syncError(error))}</p>`);
      }
    };
    const guarded = async (button, action) => {
      if (button) button.disabled = true;
      try {
        await action();
      } catch (error) {
        const form = d.querySelector('[data-form]')?.dataset.form;
        if (form === 'login' || form === 'signup') paint(accountForm(form, syncError(error)));
        else await showAccount(syncError(error));
      }
    };
    d.addEventListener('click', async (e) => {
      const t = e.target;
      if (t.closest('[data-close]')) close();
      else if (t.closest('[data-switch]')) paint(accountForm(t.closest('[data-switch]').dataset.switch));
      else if (t.closest('[data-create]')) guarded(t.closest('button'), async () => { await createCouple(); await showAccount(); });
      else if (t.closest('[data-signout]')) guarded(t.closest('button'), async () => { await signOut(); await showAccount(); });
      else if (t.closest('[data-now]')) guarded(t.closest('button'), async () => { await syncNow(); await showAccount(); });
      else if (t.closest('[data-copy]')) {
        await navigator.clipboard?.writeText(t.closest('[data-copy]').dataset.copy).catch(() => {});
        toast('Código copiado');
      }
    });
    d.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const values = Object.fromEntries(new FormData(form));
      const button = form.querySelector('button');
      if (form.dataset.form === 'login') guarded(button, async () => { await signIn(values.email, values.password); await showAccount(); });
      if (form.dataset.form === 'signup') {
        guarded(button, async () => {
          const { needsConfirmation } = await signUp(values.email, values.password);
          if (needsConfirmation) paint(accountForm('login', 'Te enviamos un correo. Confírmalo y luego entra aquí.'));
          else await showAccount();
        });
      }
      if (form.dataset.form === 'join') guarded(button, async () => { await joinCouple(values.code); await showAccount(); });
    });
    showAccount();
  }, 'dialog-sync');
}
