export type Filho = Node | string | null | undefined | false;

export interface Props {
  class?: string;
  texto?: string;
  attrs?: Record<string, string>;
  data?: Record<string, string>;
  on?: Record<string, EventListener>;
}

/** Cria um elemento por DOM (BP-004). Texto sempre entra como textContent, nunca como HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...filhos: Filho[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.texto !== undefined) node.textContent = props.texto;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const [k, v] of Object.entries(props.data ?? {})) node.dataset[k] = v;
  for (const [k, fn] of Object.entries(props.on ?? {})) node.addEventListener(k, fn);
  anexar(node, filhos);
  return node;
}

export function anexar(pai: Node, filhos: Filho[]): void {
  for (const f of filhos) {
    if (f === null || f === undefined || f === false) continue;
    pai.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
  }
}
