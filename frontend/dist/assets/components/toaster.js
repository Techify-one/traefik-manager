import { html } from '../lib/html.js';
import { useToast } from '../hooks/toast.js';

function Toaster() {
  const { toasts, removeToast } = useToast();

  return html`
    <div class="fixed inset-0 z-50 flex flex-col items-end justify-end gap-3 p-6 pointer-events-none">
      ${toasts.map((toast) => html`
        <div key=${toast.id} class="pointer-events-auto max-w-sm rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-start justify-between gap-3 p-4">
            <div>
              ${toast.title ? html`<p class="font-semibold text-slate-900 dark:text-slate-100">${toast.title}</p>` : null}
              ${toast.description ? html`<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">${toast.description}</p>` : null}
            </div>
            <button class="text-slate-500 transition hover:text-slate-900" onClick=${() => removeToast(toast.id)}>×</button>
          </div>
        </div>
      `)}
    </div>
  `;
}

export default Toaster;
