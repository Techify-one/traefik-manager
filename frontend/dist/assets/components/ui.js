import { React, html } from '../lib/html.js';

export function Button({ children, variant = 'default', className = '', asChild = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'border-transparent bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400',
    outline: 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100 focus:ring-slate-300',
    destructive: 'border-transparent bg-red-600 text-white hover:bg-red-500 focus:ring-red-400',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
  };
  const classes = `${base} ${variants[variant] || variants.default} ${className}`;
  if (asChild && React.isValidElement(children)) {
    const childProps = {
      ...props,
      className: [children.props.className, classes].filter(Boolean).join(' '),
    };
    return React.cloneElement(children, childProps);
  }
  return html`<button class=${classes} ...${props}>${children}</button>`;
}

export function Input(props) {
  return html`<input class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" ...${props} />`;
}

export function Textarea(props) {
  return html`<textarea class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" ...${props}></textarea>`;
}

export function Switch({ checked, onChange }) {
  return html`<button role="switch" aria-checked=${checked} onClick=${() => onChange?.(!checked)} class=${`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}>
    <span class=${`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}></span>
  </button>`;
}

export function Label({ children, className = '', ...props }) {
  return html`<label class=${`text-sm font-medium text-slate-700 ${className}`} ...${props}>${children}</label>`;
}

export function Card({ children, className = '' }) {
  return html`<div class=${`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>${children}</div>`;
}

export function CardHeader({ children, className = '' }) {
  return html`<div class=${`border-b border-slate-200 px-6 py-4 ${className}`}>${children}</div>`;
}

export function CardContent({ children, className = '' }) {
  return html`<div class=${`px-6 py-4 ${className}`}>${children}</div>`;
}

export function Badge({ children, variant = 'secondary' }) {
  const variants = {
    secondary: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-700',
    destructive: 'bg-red-100 text-red-700',
    outline: 'border border-slate-200 text-slate-700',
  };
  return html`<span class=${`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] || variants.secondary}`}>${children}</span>`;
}

export function Table({ children }) {
  return html`<div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-200">${children}</table>
  </div>`;
}

export function TableHeader({ children }) {
  return html`<thead class="bg-slate-50">${children}</thead>`;
}

export function TableRow({ children }) {
  return html`<tr class="hover:bg-slate-50">${children}</tr>`;
}

export function TableHead({ children, className = '' }) {
  return html`<th class=${`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 ${className}`}>${children}</th>`;
}

export function TableBody({ children }) {
  return html`<tbody class="divide-y divide-slate-200 bg-white">${children}</tbody>`;
}

export function TableCell({ children, className = '' }) {
  return html`<td class=${`px-4 py-3 text-sm text-slate-700 ${className}`}>${children}</td>`;
}

export function Tabs({ value, onValueChange, tabs }) {
  return html`<div>
    <div class="mb-4 inline-flex rounded-md border border-slate-200 bg-slate-100 p-1">
      ${tabs.map((tab) => html`<button
        key=${tab.value}
        class=${`rounded-md px-3 py-1.5 text-sm font-medium transition ${value === tab.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        onClick=${() => onValueChange(tab.value)}
      >${tab.label}</button>`)}
    </div>
    <div>
      ${tabs.map((tab) => value === tab.value ? html`<div key=${tab.value}>${tab.content}</div>` : null)}
    </div>
  </div>`;
}

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return html`
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick=${(event) => {
      if (event.target === event.currentTarget) {
        onOpenChange?.(false);
      }
    }}>
      <div class="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl" onClick=${(event) => event.stopPropagation()}>
        ${children}
      </div>
    </div>
  `;
}

export function DialogHeader({ children, className = '' }) {
  return html`<div class=${`border-b border-slate-200 px-6 py-4 ${className}`}>${children}</div>`;
}

export function DialogTitle({ children, className = '' }) {
  return html`<h2 class=${`text-lg font-semibold text-slate-900 ${className}`}>${children}</h2>`;
}

export function DialogDescription({ children, className = '' }) {
  return html`<p class=${`mt-1 text-sm text-slate-600 ${className}`}>${children}</p>`;
}

export function DialogContent({ children, className = '' }) {
  return html`<div class=${`px-6 py-4 ${className}`}>${children}</div>`;
}

export function DialogFooter({ children, className = '' }) {
  return html`<div class=${`flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end ${className}`}>${children}</div>`;
}
